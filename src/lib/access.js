// Entry passes for the studio's own domains.
//
// A pass is issued by the server, never by the page. The browser only holds what
// came back: who it was issued to, when it dies, and the token the server signed.
// The expiry is re-checked on every load, so a code that lapsed overnight stops
// working on the next refresh without anyone doing anything.

const STORAGE_KEY = 'xfh_entry_pass_v1';

export function readPass() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const pass = JSON.parse(raw);
    if (!pass?.token || !pass?.expires) return null;
    if (new Date(pass.expires).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return pass;
  } catch {
    return null;
  }
}

export function savePass(pass) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pass));
  } catch {
    // Storage blocked (private browsing): the pass simply won't survive a refresh.
  }
  return pass;
}

export function clearPass() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}

// Typed by a person, so case, spaces and dashes are forgiven before it is sent.
// The server applies the same rule, so the two can never disagree.
export function tidyCode(value) {
  return String(value || '').replace(/[\s-]+/g, '').toUpperCase();
}
