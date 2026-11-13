// Entry codes for the studio's own domains.
//
// The code is checked here, on the server, and never in the page. The browser
// gets back a signed pass and nothing else: not the list, not the other codes,
// not a hint about how close a wrong guess was.
//
// To give someone access, add a line to CODES with their name and the last day
// the code should work, then redeploy. To withdraw it, set the date to a day
// already past. Dates are read in UTC, so 2026-11-30 works until 23:59 UTC.

const CODES = [
  { code: 'XFH-OWNER-2026', name: 'Michael Kellar (owner)', expires: '2027-12-31' },

  // Evaluation passes, one per person so the log says who played.
  // { code: 'BGAM-1A2B-3C4D', name: 'Marina A. (BGaming)', expires: '2026-12-15' },
];

// Change this and every pass already issued stops working: the fastest way to
// clear the building.
const PASS_SECRET = 'xfh-rapid-fire-2026-4f9c1a7e2b6d';

const PASS_HOURS = 12;
const MAX_FAILURES = 8;
const FAILURE_WINDOW_MS = 10 * 60 * 1000;

const failures = new Map();

function tidy(value: unknown): string {
  // Spaces and dashes are forgiven: people paste codes, retype them from an
  // email, and add a dash where there wasn't one.
  return String(value || '').replace(/[\s-]+/g, '').toUpperCase();
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(PASS_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64url(new Uint8Array(mac));
}

function tooManyFailures(ip: string): boolean {
  const record = failures.get(ip);
  if (!record) return false;
  if (Date.now() - record.first > FAILURE_WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return record.count >= MAX_FAILURES;
}

function noteFailure(ip: string): void {
  const record = failures.get(ip);
  if (!record || Date.now() - record.first > FAILURE_WINDOW_MS) {
    failures.set(ip, { count: 1, first: Date.now() });
    return;
  }
  record.count += 1;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ ok: false }, { status: 405 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';

  if (tooManyFailures(ip)) {
    return Response.json(
      { ok: false, error: 'Too many attempts. Try again in ten minutes.' },
      { status: 429 }
    );
  }

  let attempted = '';
  try {
    const body = await req.json();
    attempted = tidy(body?.code);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (!attempted) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const match = CODES.find((entry) => tidy(entry.code) === attempted);
  const expiry = match ? new Date(`${match.expires}T23:59:59Z`) : null;

  if (!match || !expiry || Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
    noteFailure(ip);
    // One answer for wrong, expired and never-existed.
    return Response.json({ ok: false }, { status: 200 });
  }

  const passExpiry = new Date(
    Math.min(expiry.getTime(), Date.now() + PASS_HOURS * 60 * 60 * 1000)
  );
  const payload = `${match.name}|${passExpiry.toISOString()}`;
  const token = `${base64url(new TextEncoder().encode(payload))}.${await sign(payload)}`;

  return Response.json({
    ok: true,
    name: match.name,
    expires: passExpiry.toISOString(),
    token
  });
});
