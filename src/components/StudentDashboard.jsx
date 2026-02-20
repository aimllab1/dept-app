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
  const enrollmentData = useQuery(api.users.getStudents)?.find(s => s._id === user?._id);
  const currentSemesterSubjects = useQuery(api.subjects.getSubjectsBySemester, enrollmentData?.currentSemester ? { semester: enrollmentData.currentSemester } : "skip") || [];
  const officialNews = useQuery(api.announcements.getAnnouncements) || [];
  const [visibleDescriptions, setVisibleDescriptions] = useState({});
  const [showSubjects, setShowSubjects] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('aec_user');
    window.location.href = '/login';
  };

  const getYearRoman = (sem) => {
    if (!sem) return "";
    if (sem <= 2) return "I YEAR";
    if (sem <= 4) return "II YEAR";
    if (sem <= 6) return "III YEAR";
    return "IV YEAR";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* 🚀 MINIMALIST PROFILE HEADER */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 h-24 sm:h-28">
        <div className="max-w-5xl mx-auto px-6 h-full flex justify-between items-center relative">
          {/* Profile Pic - Left */}
          <div className="flex items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-blue-50">
              <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=f9fafb&color=2563eb&bold=true&size=128`} alt={user.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Name & Year - Center */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center w-full max-w-[50%]">
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none truncate">{user.name}</h2>
            <p className="text-[10px] sm:text-xs font-black text-blue-600 tracking-[0.3em] mt-2 uppercase">
              {getYearRoman(enrollmentData?.currentSemester)} • {user.registrationNo}
            </p>
          </div>

          {/* Sign Out - Right */}
          <button onClick={handleLogout} className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Out</button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-10 px-6 space-y-10">
        
        {/* 📢 MARQUEE UPDATES */}
        {officialNews.length > 0 && (
          <div className="overflow-hidden bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 p-1 flex items-center">
             <div className="bg-white text-blue-600 px-5 py-2.5 rounded-[1.25rem] font-black text-[9px] uppercase tracking-widest z-10 shadow-md shrink-0">Alerts</div>
             <div className="flex-1 overflow-hidden whitespace-nowrap px-6">
                <div className="inline-block animate-marquee text-white font-bold text-xs uppercase tracking-wide">
                   {officialNews.map(n => (
                     <span key={n._id} className="mr-12">
                       • [{n.type}] {n.title} 
                       {n.eventUrl && <a href={n.eventUrl} target="_blank" rel="noreferrer" className="ml-2 underline text-blue-200 text-[10px]">[Link]</a>}
                     </span>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* 📅 ATTENDANCE - THE MAIN FOCUS */}
        <div className="bg-white shadow-2xl rounded-[3rem] p-8 sm:p-12 border border-gray-100 overflow-hidden">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center">
                 <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-4"></span>
                 Attendance
              </h3>
              <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full font-black text-[10px] uppercase border border-emerald-100">Live Status</div>
           </div>
           <AttendanceCalendar studentId={user._id} />
        </div>

        {/* 📝 PERFORMANCE & NEWS FEED */}
        <div className="space-y-8">
           <div className="flex justify-between items-end px-4">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Activity Feed</h3>
              <button onClick={() => setShowSubjects(!showSubjects)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 pb-1">{showSubjects ? 'Close Subjects' : 'My Subjects'}</button>
           </div>

           {/* Hidden Curriculum Section */}
           {showSubjects && (
             <div className="bg-blue-600 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-blue-200 animate-fade-in text-white">
                <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em] mb-8">Current Semester Courses</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {currentSemesterSubjects.map(sub => (
                     <div key={sub._id} className="p-5 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-md">
                        <p className="font-black text-sm uppercase leading-tight">{sub.name}</p>
                        <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mt-2">{sub.code}</p>
                     </div>
                   ))}
                </div>
             </div>
           )}

           <div className="grid grid-cols-1 gap-8">
              {/* Combine Marks and News into one vertical list if needed, or keep cards */}
              <div className="bg-white shadow-2xl rounded-[3rem] p-8 sm:p-10 border border-gray-100">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 ml-4">Marks & Grades</h4>
                 <div className="space-y-6">
                    {marks.length === 0 ? (
                      <p className="text-center p-10 text-[10px] font-black text-gray-300 uppercase">No internal marks recorded yet</p>
                    ) : (
                      Object.values(marks.reduce((acc, m) => {
                        if (!acc[m.subjectId]) acc[m.subjectId] = { name: m.subjectName, code: m.subjectCode, testMarks: [] };
                        acc[m.subjectId].testMarks.push(m);
                        return acc;
                      }, {})).map((sub, idx) => (
                        <div key={idx} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                           <div className="flex justify-between items-start mb-6">
                              <h5 className="font-black text-gray-900 uppercase text-xs leading-tight max-w-[70%]">{sub.name}</h5>
                              <span className="text-[9px] font-black text-blue-600 uppercase">{sub.code}</span>
                           </div>
                           <div className="space-y-3">
                              {sub.testMarks.map((m, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] font-bold py-1 border-b border-gray-200/50">
                                   <span className="text-gray-400 uppercase tracking-widest">{m.testType}</span>
                                   <span className={`font-black ${parseInt(m.score) < 50 ? 'text-rose-600' : 'text-blue-700'}`}>{m.score}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>

              {/* Announcements as part of feed */}
              <div className="bg-white shadow-2xl rounded-[3rem] p-8 sm:p-10 border border-gray-100">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 ml-4">Campus News</h4>
                 <div className="space-y-10">
                    {officialNews.slice(0, 5).map(event => (
                      <div key={event._id} className="relative group px-4">
                                                  <div className="flex items-center justify-between mb-3">
                                                     <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{event.type}</span>
                                                     <div className="flex gap-4">
                                                       {event.eventUrl && <a href={event.eventUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-[9px] font-black uppercase">Link</a>}
                                                       <button onClick={() => setVisibleDescriptions(prev => ({...prev, [event._id]: !prev[event._id]}))} className="text-gray-400 text-[9px] font-black uppercase">{visibleDescriptions[event._id] ? 'Hide' : 'Read'}</button>
                                                     </div>
                                                  </div>
                                                  {event.imageUrl && (
                                                    <img src={event.imageUrl} alt="" className="w-full aspect-[4/3] object-cover rounded-[2rem] mb-4 border border-gray-50 shadow-sm" />
                                                  )}
                                                  <h4 className="font-black text-gray-900 uppercase tracking-tight leading-tight mb-2 pr-10">{event.title}</h4>                                                     {visibleDescriptions[event._id] && <p className="text-xs font-bold text-gray-500 leading-relaxed animate-fade-in">{event.description}</p>}                         <p className="text-[8px] font-black text-gray-300 uppercase mt-2">{new Date(event.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </main>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 30s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default StudentDashboard;
