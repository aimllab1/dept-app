import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RevealSection = ({ id, title, children, color, hoveredSection, setHoveredSection }) => (
    <div 
      className={`relative p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] transition-all duration-500 cursor-default border border-gray-100 ${
        hoveredSection === id ? `${color} shadow-2xl scale-100 lg:scale-105` : 'bg-white shadow-lg'
      }`}
      onMouseEnter={() => setHoveredSection(id)}
      onMouseLeave={() => setHoveredSection(null)}
      onClick={() => setHoveredSection(hoveredSection === id ? null : id)} // Toggle for touch devices
    >
      <div className={`flex items-center mb-4 transition-colors ${hoveredSection === id ? 'text-white' : 'text-gray-900'}`}>
        <span className="text-lg sm:text-xl font-black uppercase tracking-widest">{title}</span>
      </div>
      <div className={`transition-all duration-500 overflow-hidden ${
        hoveredSection === id ? 'opacity-100 translate-y-0 max-h-[1000px]' : 'opacity-0 lg:opacity-20 translate-y-4 max-h-0'
      }`}>
        <div className={`text-sm leading-relaxed font-medium ${hoveredSection === id ? 'text-blue-50' : 'text-gray-400'}`}>
          {children}
        </div>
      </div>
    </div>
);

function HomePage() {
  const [hoveredSection, setHoveredSection] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col items-center">
      {/* Official College Header */}
      <header className="w-full bg-white text-gray-900 border-b border-gray-100 shadow-sm sticky top-0 z-40 backdrop-blur-lg bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="bg-white p-1.5 sm:p-2 rounded-xl shadow-md border border-gray-50">
              <img src="/img/logo.png" alt="APEC Logo" className="h-10 sm:h-16 w-auto object-contain" />
            </div>
            <div className="text-left">
              <h1 className="text-sm sm:text-base lg:text-xl font-black tracking-tight text-gray-900 leading-none">
                ADHIPARASAKTHI <span className="hidden xs:inline">ENGINEERING COLLEGE</span> (APEC)
              </h1>
              <p className="text-[8px] sm:text-[10px] lg:text-xs font-bold text-blue-600 tracking-[0.1em] sm:tracking-[0.2em] mt-1 uppercase">
                Melmaruvathur, Tamil Nadu
              </p>
            </div>
          </div>
          <div className="flex items-center">
             <Link to="/login" state={{ userType: 'student' }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full font-black text-[10px] sm:text-xs tracking-widest transition-all shadow-xl hover:shadow-blue-200 active:scale-95">
               LOGIN
             </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-white to-gray-50 pt-10 sm:pt-16 pb-16 sm:pb-20 overflow-hidden text-center px-4">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-6 sm:mb-8 border border-blue-100">
             <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-600 rounded-full animate-pulse"></span>
             <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">AIML Department Portal</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6 px-2">
            Computer Science and <span className="sm:block">Engineering</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 block sm:inline mt-2 sm:mt-0">
              {' '}(AIML)
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-lg text-gray-500 leading-relaxed mb-10 sm:mb-12 px-2">
            Pioneering digital excellence at APEC through advanced AI research and professional engineering education.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 max-w-4xl mx-auto mb-12 sm:mb-20 px-2">
             <Link to="/login" state={{ userType: 'student' }} className="flex-1 bg-white text-gray-900 border border-gray-100 p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 group">
                <span className="block text-3xl sm:text-4xl mb-4 group-hover:scale-110 transition-transform">🎓</span>
                <span className="block text-lg sm:text-xl font-black uppercase tracking-widest mb-2">Student</span>
                <span className="text-xs sm:text-sm text-gray-400 font-bold">Access Attendance & Results</span>
             </Link>
             <Link to="/login" state={{ userType: 'staff' }} className="flex-1 bg-blue-700 text-white p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-200 hover:shadow-blue-300 transition-all transform hover:-translate-y-2 group">
                <span className="block text-3xl sm:text-4xl mb-4 group-hover:scale-110 transition-transform">👨‍🏫</span>
                <span className="block text-lg sm:text-xl font-black uppercase tracking-widest mb-2">Faculty</span>
                <span className="text-xs sm:text-sm text-blue-200 font-bold">Manage Students & Academics</span>
             </Link>
          </div>
        </div>
      </section>

      {/* Vision, Mission, PEO, PSO, PO Section */}
      <section className="w-full py-16 sm:py-24 bg-white border-t border-gray-100 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-[10px] sm:text-sm font-black text-blue-600 uppercase tracking-[0.3em] mb-4 text-center">Department Charter</h3>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight text-center">Vision, Mission & Outcomes</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
            <RevealSection id="vision" title="Vision" color="bg-blue-600" hoveredSection={hoveredSection} setHoveredSection={setHoveredSection}>
              <p>To achieve excellence in Artificial Intelligence and Machine learning education, cutting-edge research discoveries, and innovation in AI and ML for the betterment of society.</p>
            </RevealSection>
            
            <RevealSection id="mission" title="Mission" color="bg-indigo-600" hoveredSection={hoveredSection} setHoveredSection={setHoveredSection}>
              <ul className="space-y-4 list-disc pl-4">
                <li>To impart competencies and expertise's in the field of artificial intelligence and machine learning.</li>
                <li>To nurture a dynamic and collaborative research environment to push the boundaries of AI and ML</li>
                <li>To foster entrepreneurship and innovation by intellectual advancements to address the real-world challenges and create economic prospects</li>
              </ul>
            </RevealSection>

            <RevealSection id="peos" title="PEOs" color="bg-purple-600" hoveredSection={hoveredSection} setHoveredSection={setHoveredSection}>
              <div className="space-y-4">
                <p><strong>PEO 1:</strong> Graduates can apply their technical competence in computer science to solve real world problems, with technical and people leadership.</p>
                <p><strong>PEO 2:</strong> Conduct cutting edge research and develop solutions on problems of social relevance.</p>
                <p><strong>PEO 3:</strong> Work in a business environment, exhibiting team skills, work ethics, adaptability and lifelong learning.</p>
              </div>
            </RevealSection>

            <RevealSection id="psos" title="PSOs" color="bg-emerald-600" hoveredSection={hoveredSection} setHoveredSection={setHoveredSection}>
              <div className="space-y-4">
                <p><strong>PSO 1:</strong> Exhibit design and programming skills to build and automate business solutions using cutting edge technologies.</p>
                <p><strong>PSO 2:</strong> Strong theoretical foundation leading to excellence and excitement towards research, to provide elegant solutions to complex problems.</p>
              </div>
            </RevealSection>

            <RevealSection id="pos1" title="POs (I-VI)" color="bg-rose-600" hoveredSection={hoveredSection} setHoveredSection={setHoveredSection}>
               <ul className="space-y-2 text-[13px]">
                  <li><strong>I. Engineering knowledge:</strong> Apply mathematics, science, and engineering fundamentals.</li>
                  <li><strong>II. Problem analysis:</strong> Identify and analyze complex engineering problems.</li>
                  <li><strong>III. Design/development:</strong> Design system components that meet specified needs.</li>
                  <li><strong>IV. Conduct investigations:</strong> Use research-based methods for valid conclusions.</li>
                  <li><strong>V. Modern tool usage:</strong> Apply appropriate IT tools with understanding.</li>
                  <li><strong>VI. The engineer and society:</strong> Assess societal, health, and safety issues.</li>
               </ul>
            </RevealSection>

            <RevealSection id="pos2" title="POs (VII-XII)" color="bg-amber-600" hoveredSection={hoveredSection} setHoveredSection={setHoveredSection}>
               <ul className="space-y-2 text-[13px]">
                  <li><strong>VII. Environment:</strong> Understand impact in societal and environmental contexts.</li>
                  <li><strong>VIII. Ethics:</strong> Apply ethical principles and commit to professional ethics.</li>
                  <li><strong>IX. Individual/Team:</strong> Function effectively in diverse and multidisciplinary teams.</li>
                  <li><strong>X. Communication:</strong> Communicate effectively on complex activities.</li>
                  <li><strong>XI. Project Mgmt:</strong> Demonstrate knowledge of management principles.</li>
                  <li><strong>XII. Life-long Learning:</strong> Preparation to engage in independent learning.</li>
               </ul>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-50 py-12 sm:py-16 px-6 sm:px-8 border-t border-gray-100 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <img src="/img/logo.png" alt="APEC" className="h-8 sm:h-10 mb-6 grayscale opacity-50" />
          <h2 className="text-[10px] sm:text-xs font-black text-gray-900 mb-2 tracking-tight uppercase">ADHIPARASAKTHI ENGINEERING COLLEGE (APEC)</h2>
          <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold max-w-sm mb-8 sm:mb-10 tracking-widest uppercase px-4">
            Melmaruvathur - 603319. CSE (AIML) Department
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest border-t border-gray-200 pt-8 sm:pt-10 w-full">
            <span>Integrity</span>
            <span>Excellence</span>
            <span>Innovation</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        @media (max-width: 400px) {
          .xs\\:inline { display: none; }
        }
      `}</style>
    </div>
  );
}

export default HomePage;
