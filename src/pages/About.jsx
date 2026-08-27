export default function About() {
  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-yellow-400 mb-6">About Rapid Fire Texas Hold'em</h1>
      <p className="text-gray-300 text-lg leading-relaxed mb-4">
        Rapid Fire Texas Hold'em is a fast-paced, multi-bet poker-style gaming platform built for
        entertainment venues, gaming studios, and licensed gaming operators. Designed to deliver
        high-energy gameplay in a sleek digital format, the platform combines classic Texas Hold'em
        poker mechanics with a rich suite of side bets — including Card Board, Rank Board, Color
        Board, and River bets — giving players more ways to win on every round.
      </p>
      <p className="text-gray-300 text-lg leading-relaxed mb-4">
        The game features up to 10 fixed hands dealt simultaneously on a shared community board,
        allowing players to bet on individual hands, predict card ranks, and wager on color outcomes
        — all within a single, seamless round. The platform supports multi-player sessions, real-time
        balance tracking, and a full audit trail to meet gaming compliance standards including GLI-19.
      </p>
      <p className="text-gray-300 text-lg leading-relaxed mb-4">
        Rapid Fire Texas Hold'em is built and maintained by <strong className="text-yellow-300">XFH Game Studio Ltd.</strong>,
        a Canadian gaming technology company dedicated to creating innovative, compliant, and engaging
        gaming experiences. Our tools are engineered for operators who demand reliability, transparency,
        and performance — with built-in analytics, payout calibration, and regulatory reporting baked
        into every release.
      </p>
      <p className="text-gray-300 text-lg leading-relaxed">
        Whether you are a gaming operator looking to deploy a certified table game system, or a
        regulator reviewing compliance documentation, Rapid Fire Texas Hold'em is built with
        integrity at its core. We are committed to responsible gaming practices and ongoing
        improvements to our platform.
      </p>
      <div className="mt-10 border-t border-yellow-900/40 pt-6">
        <p className="text-yellow-500 font-semibold">XFH Game Studio Ltd.</p>
        <p className="text-gray-500 text-sm">Powered by Rapid Fire Texas Hold'em Platform &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}