import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FlaskConical, Dices, Shuffle } from 'lucide-react';
import IndividualBetAuditOpposite from '@/components/calibration/IndividualBetAuditOpposite';
import CertificationAuditOpposite from '@/components/calibration/CertificationAuditOpposite';
import HandSimulationOpposite from '@/components/calibration/HandSimulationOpposite';

export default function GamingLicenseCalibration2() {
  const [activeTab, setActiveTab] = useState('certification');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4 pb-16">
      <div className="max-w-5xl mx-auto">

        <div className="mb-6">
          <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm mb-3 inline-block">← Back to Game</Link>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">Gaming License Calibration 2</h1>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-cyan-900/40 text-cyan-300 border border-cyan-700/40">
              <Shuffle className="w-3 h-3" /> Opposite Deck
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Multi-run Monte Carlo certification audit for the Opposite Deck hand set — Awaiting Strategy Definition. Covers all bet types, reproducibility check, and statistical compliance against GLI-11 / BMM / eCOGRA standards.
          </p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('certification')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px
              ${activeTab === 'certification' ? 'border-yellow-400 text-yellow-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <Shield className="w-4 h-4" /> Certification Audit
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px
              ${activeTab === 'individual' ? 'border-yellow-400 text-yellow-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <FlaskConical className="w-4 h-4" /> Individual Bet Audit
          </button>
          <button
            onClick={() => setActiveTab('handSimulation')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px
              ${activeTab === 'handSimulation' ? 'border-yellow-400 text-yellow-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <Dices className="w-4 h-4" /> Hand Simulations
          </button>
        </div>

        {activeTab === 'individual' && <IndividualBetAuditOpposite />}

        {activeTab === 'certification' && <CertificationAuditOpposite />}

        {activeTab === 'handSimulation' && <HandSimulationOpposite />}
      </div>
    </div>
  );
}