// client/components/CallOverlay.jsx (v2)
import React from "react";

export default function CallOverlay({ visible, status = "Ligando...", photoSrc = "/client/assets/clarice.png", onClose }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[360px] p-5 text-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src={photoSrc}
            alt="Dra. Clarice"
            className="w-28 h-28 rounded-full border-4 border-emerald-500 object-cover bg-emerald-50"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <div className="text-sm text-gray-500">MédicoHelp</div>
            <div className="text-xl font-semibold">Dra. Clarice</div>
          </div>
          <div className="flex items-center gap-2 text-emerald-700">
            <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 12h2a8 8 0 018-8V2a10 10 0 00-10 10zm4 0h2a4 4 0 014-4V6a6 6 0 00-6 6zm6-6v2a4 4 0 014 4h2a6 6 0 00-6-6zm0 4v2a2 2 0 012 2h2a4 4 0 00-4-4z"/>
            </svg>
            <span className="text-lg">{status}</span>
          </div>
          <button
            onClick={onClose}
            className="mt-2 px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Minimizar
          </button>
        </div>
      </div>
    </div>
  );
}