
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const currentUrl = window.location.href;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Left Side: Info */}
        <div className="p-10 text-center md:text-left flex flex-col justify-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Grammar Master</h1>
          <p className="text-slate-600 mb-10 leading-relaxed text-lg">
            Master English adjectives through 30 interactive exercises. Perfect for classroom practice.
          </p>

          <button 
            onClick={onStart}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 px-8 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-200 text-xl"
          >
            Start Quiz
          </button>
        </div>

        {/* Right Side: QR Code for classroom */}
        <div className="bg-slate-50 p-10 flex flex-col items-center justify-center border-l border-slate-100">
          <div className="bg-white p-6 rounded-3xl shadow-md mb-6 border border-slate-200">
            <img 
              src={qrUrl} 
              alt="Scan to join" 
              className="w-48 h-48"
            />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-slate-800 text-xl">Scan to Join</h3>
            <p className="text-sm text-slate-500 mt-2 uppercase tracking-widest font-bold">Classroom Session</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
