export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-yellow-400 mb-6">Contact Us</h1>
      <p className="text-gray-300 text-lg leading-relaxed mb-8">
        Have questions about Rapid Fire Texas Hold'em, licensing, or partnership opportunities?
        We'd love to hear from you. Reach out using any of the methods below.
      </p>

      <div className="space-y-6">
        <div className="bg-gray-900 border border-yellow-800/40 rounded-xl p-6">
          <h2 className="text-yellow-300 font-semibold text-lg mb-1">Email</h2>
          <a
            href="mailto:info@xfhgamestudioltd.ca"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            info@xfhgamestudioltd.ca
          </a>
        </div>

        <div className="bg-gray-900 border border-yellow-800/40 rounded-xl p-6">
          <h2 className="text-yellow-300 font-semibold text-lg mb-1">Website</h2>
          <a
            href="https://xfhgamestudioltd.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            xfhgamestudioltd.ca
          </a>
        </div>

        <div className="bg-gray-900 border border-yellow-800/40 rounded-xl p-6">
          <h2 className="text-yellow-300 font-semibold text-lg mb-1">Location</h2>
          <p className="text-gray-400">Canada</p>
        </div>
      </div>

      <div className="mt-10 border-t border-yellow-900/40 pt-6">
        <p className="text-gray-500 text-sm">XFH Game Studio Ltd. &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}