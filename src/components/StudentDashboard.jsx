import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AttendanceCalendar from './AttendanceCalendar';

function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Get initial ID from location or localStorage
  const [initialUser] = useState(() => {
    return location.state?.user || JSON.parse(localStorage.getItem('aec_user'));
  });

  // 2. Fetch REAL-TIME student data using the ID
  const user = useQuery(api.users.getStudentById, initialUser?._id ? { id: initialUser._id } : "skip") || initialUser;

  // 3. Check if staff is viewing student
  const [loggedInUser] = useState(() => JSON.parse(localStorage.getItem('aec_user')));
  const isViewingAsStaff = loggedInUser && loggedInUser.role !== 'student' && loggedInUser._id !== user?._id;

  useEffect(() => {
    if (!initialUser) {
      navigate('/login', { replace: true });
    }
  }, [initialUser, navigate]);

  const marks = useQuery(api.marks.getMarksForStudent, user?._id ? { studentId: user._id } : "skip") || [];
  const recentMarksNews = useQuery(api.marks.getRecentUpdates) || [];
  const officialNews = useQuery(api.announcements.getAnnouncements) || [];

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('aec_user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50 h-20 sm:h-24 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center text-left">
          <div className="flex items-center space-x-4 text-left">
            <img src="/img/logo.png" alt="APEC" className="h-10 sm:h-14" />
            <div className="text-left">
              <h2 className="text-sm sm:text-xl font-black text-gray-900 leading-none tracking-tighter uppercase text-left">APEC PORTAL</h2>
              <p className="text-[8px] sm:text-[10px] font-black text-blue-600 tracking-widest mt-1 uppercase text-left text-left">AIML Department</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-left">
            <button onClick={handleLogout} className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl transition-all text-left">Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-left">
        {/* TOP SECTION: OFFICIAL NEWS BAR */}
        {officialNews.length > 0 && (
          <div className="mb-10 overflow-hidden bg-blue-600 rounded-[2rem] shadow-2xl shadow-blue-200 p-1 flex items-center text-left">
             <div className="bg-white text-blue-600 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest z-10 shadow-lg shrink-0 text-left">Official Updates</div>
             <div className="flex-1 overflow-hidden whitespace-nowrap relative px-6 text-left">
                <div className="inline-block animate-marquee text-white font-bold text-sm uppercase tracking-wide text-left">
                   {officialNews.map(n => `• [${n.type}] ${n.title}: ${n.description} `).join(' ')}
                </div>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* Column 1: Profile & News */}
          <div className="lg:col-span-4 space-y-8 text-left">
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100 text-left">
               <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] mb-6 text-left">Upcoming Events</h3>
               <div className="space-y-6 text-left">
                  {officialNews.length === 0 ? (
                    <p className="text-[10px] font-bold text-gray-400 uppercase italic text-left">No events posted</p>
                  ) : (
                    officialNews.slice(0, 3).map(event => (
                      <div key={event._id} className="group cursor-default text-left">
                         {event.imageUrl && (
                           <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover rounded-3xl mb-4 shadow-lg grayscale group-hover:grayscale-0 transition-all duration-500 text-left" />
                         )}
                         <div className="flex items-center space-x-2 mb-2 text-left">
                            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-left">{event.type}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase text-left">{new Date(event.createdAt).toLocaleDateString()}</span>
                         </div>
                         <h4 className="font-black text-gray-900 uppercase tracking-tight leading-tight mb-1 text-left">{event.title}</h4>
                         <p className="text-xs font-bold text-gray-500 line-clamp-2 text-left">{event.description}</p>
                      </div>
                    ))
                  )}
               </div>
            </div>

            <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-50 text-left text-left">
              <div className="bg-blue-700 h-20 text-left"></div>
              <div className="px-10 pb-10 text-left">
                <div className="-mt-10 mb-6 flex justify-center text-left text-left">
                  <div className="h-24 w-24 rounded-2xl bg-white p-2 shadow-2xl border border-gray-100 text-left text-left">
                    <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=f9fafb&color=2563eb&bold=true&size=128`} alt={user.name} className="rounded-xl w-full h-full object-cover text-left" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase text-center leading-none text-left">{user.name}</h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest text-center mt-2 text-left">{user.registrationNo}</p>
                <div className="mt-8 space-y-4 text-left text-left">
                  <div className="flex justify-between py-2 border-b border-gray-50 text-[10px] font-bold text-left text-left">
                    <span className="text-gray-400 uppercase tracking-widest text-left">Birth Date</span>
                    <span className="text-gray-900 uppercase text-left">{user.dob}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50 text-[10px] font-bold text-left text-left text-left">
                    <span className="text-gray-400 uppercase tracking-widest text-left text-left">Mobile</span>
                    <span className="text-gray-900 text-left text-left">{user.mobileNo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Performance & Attendance */}
          <div className="lg:col-span-8 space-y-8 text-left text-left">
            <div className="bg-white shadow-2xl rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 text-left text-left text-left">
               <h3 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight flex items-center leading-none text-left text-left text-left">
                  <span className="w-1.5 h-8 bg-blue-600 rounded-full mr-5 text-left text-left"></span>
                  Academic Records
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-left">
                  {marks.length === 0 ? (
                    <div className="md:col-span-2 p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-left text-left">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left text-left">No records available</p>
                    </div>
                  ) : (
                    Object.values(marks.reduce((acc, m) => {
                      if (!acc[m.subjectId]) acc[m.subjectId] = { name: m.subjectName, code: m.subjectCode, testMarks: [] };
                      acc[m.subjectId].testMarks.push(m);
                      return acc;
                    }, {})).map((sub, idx) => (
                      <div key={idx} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all border-transparent hover:border-blue-100 text-left text-left">
                         <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 text-left text-left">{sub.name} <span className="text-[9px] text-blue-600 block mt-1 text-left text-left">{sub.code}</span></h4>
                         <div className="space-y-2 text-left text-left text-left">
                            {sub.testMarks.map((m, i) => (
                              <div key={i} className="flex justify-between text-[10px] font-black uppercase py-1.5 border-b border-gray-200/50 text-left text-left text-left">
                                 <span className="text-gray-400 tracking-widest text-left text-left">{m.testType}</span>
                                 <span className="text-blue-700 text-left text-left">{m.score}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>

            <div className="bg-white shadow-2xl rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 text-left overflow-x-hidden text-left text-left">
              <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center uppercase tracking-tight leading-none text-left text-left">
                <span className="w-1.5 h-8 bg-emerald-500 rounded-full mr-5 text-left text-left"></span>
                Attendance
              </h3>
              <AttendanceCalendar studentId={user._id} />
            </div>
          </div>

        </div>
      </main>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export default StudentDashboard;
