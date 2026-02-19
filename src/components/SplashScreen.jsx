import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        onFinish();
      }, 1000); // 1s smooth fade out
    }, 3000); // 3s cinematic duration

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative flex flex-col items-center">
        
        {/* CINEMATIC GLOW BACKGROUND */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        
        {/* PREMIUM ONE-WAVE RIPPLE */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-blue-500/30 rounded-full animate-premium-ripple"></div>

        {/* LOGO CONTAINER WITH 3D POP & SHINE */}
        <div className="relative group animate-cinematic-pop">
          <div className="absolute inset-0 bg-blue-600 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
          <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
            {/* Glossy Reflection */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-glossy-slide"></div>
            
            <img 
              src="/img/logo.png" 
              alt="APEC Logo" 
              className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(37,99,235,0.5)]"
            />
          </div>
        </div>

        {/* ELEGANT TYPOGRAPHY REVEAL */}
        <div className="mt-12 text-center space-y-4 px-6 overflow-hidden">
          <div className="animate-text-reveal-up opacity-0 fill-mode-forwards">
             <h2 className="text-[10px] font-black tracking-[0.6em] text-blue-500 uppercase mb-2">Welcome to</h2>
             <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none mb-1 uppercase">
               ADHIPARASAKTHI
             </h1>
             <p className="text-lg sm:text-xl font-bold text-gray-400 tracking-[0.2em] uppercase">
               Engineering College
             </p>
          </div>
          
          <div className="h-[2px] w-20 bg-blue-600 mx-auto animate-line-stretch opacity-0 fill-mode-forwards"></div>
          
          <div className="animate-text-reveal-up-delayed opacity-0 fill-mode-forwards">
            <p className="text-sm font-black text-blue-400 tracking-[0.4em] uppercase opacity-80">
              AIML Department
            </p>
          </div>
        </div>
      </div>

      {/* MINIMALIST LOADER */}
      <div className="absolute bottom-16 w-64 h-[2px] bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 animate-progress-fast"></div>
      </div>

      <style>{`
        @keyframes premium-ripple {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        .animate-premium-ripple {
          animation: premium-ripple 3s cubic-bezier(0.2, 0, 0.2, 1) forwards;
        }
        @keyframes cinematic-pop {
          0% { transform: scale(0.9) translateY(20px); opacity: 0; filter: blur(10px); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0px); }
        }
        .animate-cinematic-pop {
          animation: cinematic-pop 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes glossy-slide {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
        .animate-glossy-slide {
          animation: glossy-slide 3s infinite;
        }
        @keyframes text-reveal-up {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-text-reveal-up {
          animation: text-reveal-up 1.2s cubic-bezier(0.2, 0, 0.2, 1) 0.5s forwards;
        }
        .animate-text-reveal-up-delayed {
          animation: text-reveal-up 1.2s cubic-bezier(0.2, 0, 0.2, 1) 1s forwards;
        }
        @keyframes line-stretch {
          from { width: 0; opacity: 0; }
          to { width: 80px; opacity: 1; }
        }
        .animate-line-stretch {
          animation: line-stretch 1s ease-out 0.8s forwards;
        }
        @keyframes progress-fast {
          0% { width: 0%; transform: translateX(-100%); }
          100% { width: 100%; transform: translateX(0%); }
        }
        .animate-progress-fast {
          animation: progress-fast 3s linear forwards;
        }
        .fill-mode-forwards {
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
