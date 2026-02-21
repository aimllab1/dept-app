import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AttendanceCalendar from './AttendanceCalendar';
import { Bell, BellDot, TrendingUp, X, LogOut, ChevronRight, Activity } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [initialUser] = useState(() => {
    return location.state?.user || JSON.parse(localStorage.getItem('apec_user'));
  });

  const user = useQuery(api.users.getStudentById, initialUser?._id ? { id: initialUser._id } : "skip") || initialUser;
  
  // Semester selection state
  const [viewSemester, setViewSem] = useState(null);

  // Initialize viewSemester once user data is loaded
  useEffect(() => {
    if (user?.currentSemester && viewSemester === null) {
      setViewSem(user.currentSemester);
    }
  }, [user, viewSemester]);

  const marks = useQuery(api.marks.getMarksForStudent, user?._id ? { studentId: user._id } : "skip") || [];
  
  // Use selected semester for subjects
  const currentSemesterSubjects = useQuery(api.subjects.getSubjectsBySemester, viewSemester ? { semester: viewSemester } : "skip") || [];
  
  const officialNews = useQuery(api.announcements.getAnnouncements) || [];
  const notifications = useQuery(api.notifications.getNotifications, user?._id ? { userId: user._id } : "skip") || [];
  const markAsRead = useMutation(api.notifications.markAsRead);

  const allAttendance = useQuery(api.attendance.getAttendanceForStudent, user?._id ? { studentId: user._id } : "skip") || [];

  const [showSubjects, setShowSubjects] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedSubjectForChart, setSelectedSubjectForChart] = useState(null);
  const [showChartOptions, setShowChartOptions] = useState(false);

  const activeNotifications = notifications.filter(n => !n.isRead);

  // Clear selected subject if it's not in the new semester
  useEffect(() => {
    setSelectedSubjectForChart(null);
    setShowChartOptions(false);
  }, [viewSemester]);

  useEffect(() => {
    if (!initialUser) {
      navigate('/login', { replace: true });
    }
  }, [initialUser, navigate]);

  // Overall Attendance Calculation
  const attendanceStats = useMemo(() => {
    let relevantAttendance = allAttendance;
    
    if (user?.startDate) {
      relevantAttendance = allAttendance.filter(a => a.date >= user.startDate);
    }

    const counts = { present: 0, absent: 0, leave: 0, od: 0, holiday: 0 };
    relevantAttendance.forEach(a => {
      if (counts[a.status] !== undefined) counts[a.status]++;
    });

    const totalWorkingDays = counts.present + counts.absent + counts.leave + counts.od;
    const presence = counts.present + counts.od;
    const percentage = totalWorkingDays > 0 ? (presence / totalWorkingDays) * 100 : 0;

    return { ...counts, totalWorkingDays, percentage: percentage.toFixed(2) };
  }, [allAttendance, user?.startDate]);

  const chartData = useMemo(() => {
    if (!marks.length || !selectedSubjectForChart) return [];
    const subjectMarks = marks.filter(m => m.subjectId === selectedSubjectForChart._id);
    const sorted = [...subjectMarks].sort((a, b) => a.updatedAt - b.updatedAt);
    return sorted.map(m => ({
      name: m.testType,
      score: parseInt(m.score),
    }));
  }, [marks, selectedSubjectForChart]);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('apec_user');
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
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-left">
      {/* 🚀 APEC PROFILE HEADER */}
      <nav className="bg-white/90 backdrop-blur-2xl border-b border-gray-100 sticky top-0 z-50 h-24 sm:h-28">
        <div className="max-w-5xl mx-auto px-6 h-full flex justify-between items-center relative">
          <div className="flex items-center space-x-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-blue-50">
              <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=f9fafb&color=2563eb&bold=true&size=128`} alt={user.name} className="w-full h-full object-cover" />
            </div>
            
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group">
               {activeNotifications.length > 0 ? (
                 <>
                   <BellDot className="w-6 h-6 text-rose-500 animate-bounce" />
                   <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">{activeNotifications.length}</span>
                 </>
               ) : (
                 <Bell className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
               )}
            </button>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 text-center w-full max-w-[45%]">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none truncate">{user.name}</h2>
            <div className="flex items-center justify-center space-x-2 mt-2">
               <p className="text-[9px] sm:text-[11px] font-black text-blue-600 tracking-[0.3em] uppercase">
                 {getYearRoman(user?.currentSemester)} • APEC • {user.registrationNo}
               </p>
            </div>
          </div>

          <button onClick={handleLogout} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center space-x-2">
            <span>Logout</span>
            <LogOut className="w-3 h-3" />
          </button>
        </div>

        {/* Notifications */}
        {showNotifications && (
          <div className="absolute top-full right-6 mt-4 w-85 bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-fade-in z-[60]">
             <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Recent Alerts</h4>
                <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-gray-400" /></button>
             </div>
             <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-50">
                {activeNotifications.length === 0 ? (
                  <div className="p-16 text-center"><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Inbox is empty</p></div>
                ) : (
                  activeNotifications.map(n => (
                    <div key={n._id} onClick={() => markAsRead({ id: n._id })} className="p-6 hover:bg-blue-50/30 transition-all cursor-pointer relative group">
                       <p className="text-[10px] font-black text-blue-600 uppercase mb-1 flex items-center">
                         <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                         {n.title}
                       </p>
                       <p className="text-xs font-bold text-gray-600 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}
      </nav>

      <main className="max-w-3xl mx-auto py-12 px-6 space-y-12">
        
        {/* 🎓 SEMESTER SELECTOR */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl">
           <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest ml-4">Viewing Records for:</h3>
           <div className="flex flex-wrap justify-center gap-2">
              {[1,2,3,4,5,6,7,8].map(s => (
                <button 
                  key={s} 
                  onClick={() => setViewSem(s)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${viewSemester === s ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  SEM {s}
                </button>
              ))}
           </div>
        </div>

        {/* 📊 ATTENDANCE ANALYTICS CARD */}
        <div className="bg-white shadow-2xl rounded-[3rem] p-10 border border-gray-100 relative overflow-hidden text-left">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
           <div className="flex justify-between items-start mb-10 relative z-10 text-left">
              <div className="text-left">
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center text-left">
                   <Activity className="w-6 h-6 text-emerald-500 mr-4" />
                   Attendance Portal
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 ml-10 text-left">
                  {user.startDate ? `Calculating from: ${new Date(user.startDate).toLocaleDateString()}` : "Comprehensive History"}
                </p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Percentage</p>
                 <p className={`text-4xl font-black ${parseFloat(attendanceStats.percentage) < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>{attendanceStats.percentage}%</p>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 flex items-center justify-between mb-10 relative z-10 shadow-sm">
              <div className="text-left">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Presence Ratio</p>
                 <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-gray-900">{attendanceStats.present + attendanceStats.od}</span>
                    <span className="text-lg font-bold text-gray-300">/ {attendanceStats.totalWorkingDays}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Days Present</span>
                 </div>
              </div>
              <div className="h-12 w-[1px] bg-gray-100"></div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-right">Academic Standing</p>
                 <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full ${parseFloat(attendanceStats.percentage) < 75 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {parseFloat(attendanceStats.percentage) < 75 ? 'Low Attendance' : 'Satisfactory'}
                 </span>
              </div>
           </div>

           <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
              <AttendanceCalendar studentId={user._id} />
           </div>
        </div>

        {/* 📊 PERFORMANCE ANALYTICS */}
        <div className="space-y-6 text-left">
           {!showChartOptions && !selectedSubjectForChart ? (
             <button onClick={() => setShowChartOptions(true)} className="w-full py-12 bg-white shadow-2xl rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center space-y-4 group hover:bg-blue-600 transition-all duration-700">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <TrendingUp className="w-8 h-8 text-blue-600 group-hover:text-white" />
                </div>
                <span className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] group-hover:text-white">Semester {viewSemester} Marks</span>
             </button>
           ) : (
             <div className="bg-white shadow-2xl rounded-[3rem] p-10 border border-gray-100 overflow-hidden animate-fade-in text-left">
                <div className="flex justify-between items-center mb-10 text-left">
                   <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center text-left">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-5">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      {selectedSubjectForChart ? selectedSubjectForChart.name : `Select Sem ${viewSemester} Subject`}
                   </h3>
                   <button onClick={() => { setSelectedSubjectForChart(null); setShowChartOptions(true); }} className="px-5 py-2 bg-gray-50 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-colors">Change</button>
                </div>

                {showChartOptions && (
                  <div className="grid grid-cols-1 gap-4 mb-10 text-left">
                     {currentSemesterSubjects.length === 0 ? (
                       <div className="p-10 text-center text-gray-300 font-black uppercase text-[10px]">No subjects found for Semester {viewSemester}</div>
                     ) : (
                       currentSemesterSubjects.map(sub => (
                         <button key={sub._id} onClick={() => { setSelectedSubjectForChart(sub); setShowChartOptions(false); }} className="p-6 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-blue-600 hover:bg-white transition-all flex justify-between items-center group text-left">
                            <div className="text-left">
                              <p className="font-black text-gray-900 text-sm uppercase tracking-tight text-left">{sub.name}</p>
                              <p className="text-[10px] font-black text-blue-600 uppercase mt-1 opacity-60 text-left">{sub.code}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                         </button>
                       ))
                     )}
                  </div>
                )}

                {selectedSubjectForChart && (
                  <div className="space-y-12 text-left">
                    {chartData.length > 0 ? (
                      <>
                        <div className="h-72 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData}>
                                 <defs>
                                    <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                 <XAxis dataKey="name" hide />
                                 <YAxis domain={[0, 100]} hide />
                                 <Tooltip 
                                   contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', padding: '12px 20px' }}
                                   cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                                 />
                                 <Area 
                                   type="monotone" 
                                   dataKey="score" 
                                   stroke="url(#lineGradient)" 
                                   strokeWidth={6} 
                                   fillOpacity={1} 
                                   fill="url(#colorCurve)" 
                                   animationDuration={2000}
                                 />
                                 <defs>
                                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      {chartData.map((d, i) => (
                                        <stop 
                                          key={i} 
                                          offset={`${(i / (chartData.length - 1)) * 100}%`} 
                                          stopColor={d.score >= 50 ? "#10b981" : "#f43f5e"} 
                                        />
                                      ))}
                                    </linearGradient>
                                 </defs>
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                        <div className="space-y-4 pt-10 border-t border-gray-50 text-left">
                           {marks.filter(m => m.subjectId === selectedSubjectForChart._id).map((m, i) => (
                               <div key={i} className="flex justify-between items-center bg-gray-50 p-6 rounded-3xl border border-gray-100 text-left">
                                  <div className="text-left"><p className="text-xs font-black text-gray-900 uppercase text-left">{m.testType}</p></div>
                                  <div className={`text-xl font-black ${parseInt(m.score) < 50 ? 'text-rose-600' : 'text-emerald-600'}`}>{m.score}</div>
                               </div>
                           ))}
                        </div>
                      </>
                    ) : (
                      <div className="py-20 text-center text-left"><p className="text-[11px] font-black text-gray-300 uppercase tracking-widest text-center">No subject marks recorded</p></div>
                    )}
                  </div>
                )}
             </div>
           )}
        </div>

        {/* 📢 NEWS FEED */}
        <div className="bg-white shadow-2xl rounded-[3rem] p-10 border border-gray-100 text-left">
           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-10 ml-2 text-left">Campus Bulletin</h4>
           <div className="space-y-12 text-left">
              {officialNews.slice(0, 5).map(event => (
                <div key={event._id} className="group text-left">
                   <div className="flex items-center justify-between mb-5 text-left">
                      <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 text-left">{event.type}</span>
                      <p className="text-[9px] font-black text-gray-300 uppercase text-left">{new Date(event.createdAt).toLocaleDateString()}</p>
                   </div>
                   {event.imageUrl && (
                     <div className="relative aspect-video mb-6 overflow-hidden rounded-[2rem] shadow-lg border border-gray-100 text-left">
                       <img src={event.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 text-left" />
                     </div>
                   )}
                   <h4 className="font-black text-xl text-gray-900 uppercase tracking-tight leading-tight mb-4 group-hover:text-blue-600 transition-colors text-left">{event.title}</h4>
                   <p className="text-sm font-bold text-gray-500 leading-relaxed mb-6 text-left">{event.description}</p>
                </div>
              ))}
           </div>
        </div>
      </main>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 35s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default StudentDashboard;
