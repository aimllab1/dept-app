import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

function StaffDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loggedInUser] = useState(() => {
    return location.state?.user || JSON.parse(localStorage.getItem('aec_user'));
  });
  const isAdmin = loggedInUser?.role === 'hod' || loggedInUser?.role === 'ahod';

  useEffect(() => {
    if (!loggedInUser) navigate('/login', { replace: true });
  }, [loggedInUser, navigate]);

  // View & UI States
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // Filter States
  const [selectedYear, setSelectedYear] = useState(3);
  const [dashboardYear, setDashboardYear] = useState(3);
  const [selectedSemTab, setSelectedSemTab] = useState(6);
  const [directoryBatchId, setDirectoryBatchId] = useState('');
  
  // Results Specific States
  const [resultsBatchId, setResultsBatchId] = useState('');
  const [resultsStudentId, setResultsStudentId] = useState('');
  const [resultsSem, setResultsSem] = useState(1);
  const [manualGPA, setManualGPA] = useState('');
  const [subjectGrades, setSubjectGrades] = useState({}); 

  // Form States
  const todayDate = new Date().toISOString().slice(0, 10);
  const [attendanceDate, setAttendanceDate] = useState(todayDate);
  const [localAttendance, setLocalAttendance] = useState({});
  const [marksBatchId, setMarksBatchId] = useState('');
  const [bulkMarkSubjectId, setBulkMarkSubjectId] = useState('');
  const [bulkTestType, setBulkTestType] = useState('Slip Test 1');
  const [studentMarks, setStudentMarks] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [eventForm, setEventForm] = useState({ title: '', description: '', type: 'Symposium', imageUrl: '', eventUrl: '' });
  const [visibleDescriptions, setVisibleDescriptions] = useState({});
  const [batchForm, setBatchForm] = useState({ name: '', startYear: 2024, endYear: 2028 });
  const [staffForm, setStaffForm] = useState({ name: '', password: '', role: '', profileImage: '' });
  const [studentForm, setStudentForm] = useState({ name: '', registrationNo: '', dob: '', email: '', mobileNo: '', parentMobileNo: '', batchId: '', profileImage: '', address: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', semester: 6, staffId: '' });

  // Queries
  const students = useQuery(api.users.getStudents) || [];
  const batches = useQuery(api.batches.getBatches) || [];
  const subjects = useQuery(api.subjects.getSubjects) || [];
  const allStaff = useQuery(api.users.getStaff) || [];
  const announcements = useQuery(api.announcements.getAnnouncements) || [];
  const attendanceData = useQuery(api.attendance.getAttendanceByDate, { date: attendanceDate });
  const todayAttendance = useQuery(api.attendance.getAttendanceByDate, { date: todayDate }) || [];
  const universityResults = useQuery(api.results.getResultsForStudent, resultsStudentId ? { studentId: resultsStudentId } : "skip") || [];
  const marksData = useQuery(api.marks.getMarksBySubjectAndTest, bulkMarkSubjectId ? { subjectId: bulkMarkSubjectId, testType: bulkTestType } : "skip");

  // Logic Helpers
  const getAcademicStatus = useCallback((startYear) => {
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    let year = now.getFullYear() - startYear + (curMonth >= 6 ? 1 : 0);
    const isEvenSem = curMonth >= 1 && curMonth <= 5;
    let semester = year * 2 - (isEvenSem ? 0 : 1);
    return { year, semester: Math.min(semester, 8) };
  }, []);

  // Dashboard Calculations
  const dashboardData = useMemo(() => {
    const yearStudents = students.filter(s => {
      const b = batches.find(batch => batch.name === s.currentBatch);
      return b && getAcademicStatus(b.startYear).year === dashboardYear;
    });
    const yearAttendance = todayAttendance.filter(a => yearStudents.some(s => s._id === a.studentId));
    const stats = { present: 0, absent: 0, leave: 0, od: 0, total: yearStudents.length };
    const absentDetails = [];
    yearAttendance.forEach(a => {
      if(stats[a.status] !== undefined) stats[a.status]++;
      if(a.status !== 'present') {
        const s = yearStudents.find(stu => stu._id === a.studentId);
        if(s) absentDetails.push({ name: s.name, status: a.status, registrationNo: s.registrationNo });
      }
    });
    absentDetails.sort((a, b) => (a.registrationNo || "").localeCompare(b.registrationNo || ""));
    return { stats, absentDetails };
  }, [students, batches, todayAttendance, dashboardYear, getAcademicStatus]);

  const filteredAttendanceStudents = useMemo(() => {
    return students
      .filter(s => {
        const b = batches.find(batch => batch.name === s.currentBatch);
        return b && getAcademicStatus(b.startYear).year === selectedYear;
      })
      .sort((a, b) => (a.registrationNo || "").localeCompare(b.registrationNo || ""));
  }, [students, batches, selectedYear, getAcademicStatus]);

  const staffSubjects = useMemo(() => {
    return subjects.filter(s => s.staffId === loggedInUser?._id);
  }, [subjects, loggedInUser?._id]);

  // STABLE STATE SYNCS
  useEffect(() => {
    if (attendanceData) {
      const map = {};
      attendanceData.forEach(a => { map[a.studentId] = a.status; });
      setLocalAttendance(prev => JSON.stringify(prev) === JSON.stringify(map) ? prev : map);
    }
  }, [attendanceData]);

  useEffect(() => {
    if (marksData) {
      const map = {};
      marksData.forEach(m => { map[m.studentId] = m.score; });
      setStudentMarks(prev => JSON.stringify(prev) === JSON.stringify(map) ? prev : map);
    }
  }, [marksData]);

  useEffect(() => {
    const currentRes = universityResults.find(r => r.semester === resultsSem);
    if (currentRes) {
      if (manualGPA !== currentRes.gpa) setManualGPA(currentRes.gpa);
      const gMap = {};
      currentRes.grades.forEach(g => { gMap[g.subjectId] = g.grade; });
      setSubjectGrades(prev => JSON.stringify(prev) === JSON.stringify(gMap) ? prev : gMap);
    } else {
      if (manualGPA !== '') setManualGPA('');
      setSubjectGrades(prev => Object.keys(prev).length === 0 ? prev : {});
    }
  }, [universityResults, resultsSem, manualGPA]);

  // Mutations
  const markAttendanceMutation = useMutation(api.attendance.markAttendance);
  const postBulkMarksMutation = useMutation(api.marks.postBulkMarks);
  const updateStudentMutation = useMutation(api.users.updateStudent);
  const updateStaffMutation = useMutation(api.users.updateStaff);
  const addUniversityResultMutation = useMutation(api.results.addUniversityResult);
  const addSubjectMutation = useMutation(api.subjects.addSubject);
  const updateSubjectMutation = useMutation(api.subjects.updateSubject);
  const removeSubjectMutation = useMutation(api.subjects.removeSubject);
  const addStaffMutation = useMutation(api.users.addStaff);
  const removeUserMutation = useMutation(api.users.removeUser);
  const addStudentMutation = useMutation(api.users.addStudent);
  const createBatchMutation = useMutation(api.batches.createBatch);
  const changePasswordMutation = useMutation(api.users.changePassword);
  const postEventMutation = useMutation(api.announcements.postAnnouncement);
  const removeEventMutation = useMutation(api.announcements.removeAnnouncement);

  // Handlers
  const handleLogout = () => { localStorage.removeItem('aec_user'); window.location.href = '/login'; };
  const handleMarkAllPresent = () => { const newMap = { ...localAttendance }; filteredAttendanceStudents.forEach(s => { newMap[s._id] = 'present'; }); setLocalAttendance(newMap); };
  const handleSubmitAttendance = async () => { if (!window.confirm('Submit attendance?')) return; for (const [sid, status] of Object.entries(localAttendance)) { await markAttendanceMutation({ studentId: sid, date: attendanceDate, status }); } alert('Submitted!'); };
  const handlePostEvent = async (e) => { e.preventDefault(); await postEventMutation({ ...eventForm, requesterId: loggedInUser._id.toString(), postedBy: loggedInUser.name }); setEventForm({ title: '', description: '', type: 'Symposium', imageUrl: '', eventUrl: '' }); alert('Published!'); };
  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const targetWidth = 800;
          const targetHeight = 600; // 4:3 Ratio
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          // Calculate source dimensions to crop from center
          let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
          const imgAspect = img.width / img.height;
          const targetAspect = 4 / 3;

          if (imgAspect > targetAspect) {
            srcWidth = img.height * targetAspect;
            srcX = (img.width - srcWidth) / 2;
          } else {
            srcHeight = img.width / targetAspect;
            srcY = (img.height - srcHeight) / 2;
          }

          ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, targetWidth, targetHeight);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          callback(dataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSaveUniversityResults = async () => { if (!resultsStudentId || !manualGPA) return alert('Fill fields'); const gradesData = Object.entries(subjectGrades).map(([subId, grd]) => ({ subjectId: subId, grade: grd })); await addUniversityResultMutation({ studentId: resultsStudentId, semester: resultsSem, gpa: manualGPA, grades: gradesData }); alert('Result Saved!'); };

  const SidebarItem = ({ id, label, icon, hidden }) => (
    !hidden && (
      <button onClick={() => { setActiveView(id); setIsMobileMenuOpen(false); window.scrollTo(0,0); }}
        className={`w-full flex items-center px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeView === id ? 'bg-blue-600 text-white rounded-2xl shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
        <span className="mr-4 text-xl">{icon}</span> {label}
      </button>
    )
  );

  const GRADE_OPTIONS = ['O', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'Arrear'];

  if (!loggedInUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-left">
      <aside className={`fixed inset-0 z-40 bg-white transform transition-transform md:relative md:translate-x-0 md:w-80 md:flex flex-col h-screen p-8 border-r border-gray-100 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
               <img src="/img/logo.png" alt="APEC" className="h-10 w-auto" />
               <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">APEC STAFF</h2>
            </div>
            <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 truncate leading-none">{loggedInUser?.role.toUpperCase()}</p>
               <p className="text-sm font-black text-gray-900 truncate uppercase mt-1">{loggedInUser?.name}</p>
            </div>
         </div>
         <nav className="flex-1 space-y-2 overflow-y-auto">
            <SidebarItem id="dashboard" label="Overview" icon="📊" />
            <SidebarItem id="attendance" label="Mark Attendance" icon="📅" />
            <SidebarItem id="marks" label="Bulk Marks" icon="📝" />
            <SidebarItem id="results" label="Results Hub" icon="🎓" />
            <SidebarItem id="events" label="Post News" icon="📢" hidden={!isAdmin} />
            <SidebarItem id="directory" label="Students" icon="👥" />
            <SidebarItem id="subjects" label="Curriculum" icon="📚" hidden={!isAdmin} />
            <SidebarItem id="staff" label="Faculty" icon="👨‍🏫" hidden={!isAdmin} />
            <SidebarItem id="security" label="Account" icon="🔒" />
         </nav>
         <button onClick={handleLogout} className="mt-auto w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Sign Out</button>
      </aside>

      <main className="flex-1 p-4 sm:p-10 lg:p-12 overflow-y-auto w-full">
         <div className="md:hidden flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <img src="/img/logo.png" alt="APEC" className="h-8" />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-2xl text-blue-600 font-bold">☰</button>
         </div>

         <div className="max-w-6xl mx-auto w-full">
            {/* 📊 OVERVIEW */}
            {activeView === 'dashboard' && (
               <div className="space-y-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">Real-Time Stats</h2>
                    <div className="flex space-x-2 bg-gray-200/50 p-1.5 rounded-2xl w-fit">
                       {[2, 3, 4].map(y => (
                          <button key={y} onClick={() => setDashboardYear(y)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${dashboardYear === y ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500'}`}>{y}{y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</button>
                       ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 border-l-8 border-l-emerald-500 text-left"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Present</p><p className="text-5xl font-black text-gray-900">{dashboardData.stats.present}</p></div>
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 border-l-8 border-l-rose-500 text-left"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Absent</p><p className="text-5xl font-black text-gray-900">{dashboardData.stats.absent}</p></div>
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 border-l-8 border-l-amber-500 text-left"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Leave / OD</p><p className="text-5xl font-black text-gray-900">{dashboardData.stats.leave + dashboardData.stats.od}</p></div>
                  </div>
                  <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden text-left">
                     <div className="p-8 border-b bg-gray-50 flex justify-between items-center text-left">
                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest leading-none">Absent / Leave List</h3>
                        <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-3 py-1 rounded-full uppercase">{dashboardData.absentDetails.length} Students</span>
                     </div>
                     <div className="divide-y divide-gray-50 text-left">
                        {dashboardData.absentDetails.length === 0 ? <div className="p-16 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">All Students Present</div> : 
                           dashboardData.absentDetails.map((a, i) => <div key={i} className="p-6 flex items-center justify-between px-10 text-left"><div className="text-left"><p className="font-black text-gray-900 uppercase tracking-tight text-left">{a.name}</p><p className="text-[8px] font-bold text-gray-400 uppercase text-left">{a.registrationNo}</p></div><span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full ${a.status === 'absent' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{a.status}</span></div>)
                        }
                     </div>
                  </div>
               </div>
            )}

            {activeView === 'attendance' && (
               <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-left">
                     <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">Attendance</h2>
                     <div className="flex items-center gap-4 w-full sm:w-auto text-left">
                        <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="bg-white border border-gray-100 rounded-full px-6 py-2.5 font-bold text-xs outline-none shadow-sm flex-1 sm:flex-none text-left" />
                        <button onClick={handleMarkAllPresent} className="bg-emerald-50 text-emerald-600 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all text-left">Select All</button>
                     </div>
                  </div>
                  <div className="flex space-x-2 bg-gray-200/50 p-1.5 rounded-2xl w-fit">
                     {[2, 3, 4].map(y => (
                        <button key={y} onClick={() => setSelectedYear(y)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedYear === y ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500'}`}>{y}{y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</button>
                     ))}
                  </div>
                  <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden text-left">
                     <div className="divide-y divide-gray-50">
                        {filteredAttendanceStudents.map(s => (
                           <div key={s._id} onClick={() => {
                              const sequence = ['present', 'absent', 'leave', 'od'];
                              const current = localAttendance[s._id];
                              let next = !current ? 'present' : sequence[(sequence.indexOf(current) + 1) % sequence.length];
                              setLocalAttendance(prev => ({ ...prev, [s._id]: next }));
                           }} className="p-6 sm:px-10 sm:py-8 flex items-center justify-between hover:bg-gray-50 transition-all cursor-pointer group">
                              <div className="flex items-center space-x-6 text-left">
                                 <div className={`w-12 h-12 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gray-100 text-left`}>
                                    <img src={s.profileImage || `https://ui-avatars.com/api/?name=${s.name}`} className="w-full h-full object-cover" alt="" />
                                 </div>
                                 <div className="text-left"><p className="font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 text-left">{s.name}</p><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 text-left">{s.registrationNo} • <span className={`font-bold ${localAttendance[s._id] ? 'text-blue-600' : 'text-gray-300'} text-left`}>{localAttendance[s._id] || 'Mark Now'}</span></p></div>
                              </div>
                              <div className={`w-4 h-4 rounded-full transition-all duration-500 ${localAttendance[s._id] === 'present' ? 'bg-emerald-500' : localAttendance[s._id] === 'absent' ? 'bg-rose-500' : localAttendance[s._id] === 'leave' ? 'bg-amber-500' : localAttendance[s._id] === 'od' ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                           </div>
                        ))}
                     </div>
                     <div className="p-8 bg-gray-50 flex justify-end text-left"><button onClick={handleSubmitAttendance} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all text-left text-left">Sync to Cloud</button></div>
                  </div>
               </div>
            )}

            {/* 🎓 UNIVERSITY RESULTS HUB */}
            {activeView === 'results' && (
               <div className="space-y-8 text-left">
                  <h2 className="text-3xl font-black text-gray-900 uppercase">Results Hub</h2>
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                     <select className="input-field" value={resultsBatchId} onChange={e => { setResultsBatchId(e.target.value); setResultsStudentId(''); }}>
                        <option value="">Select Batch</option>
                        {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                     </select>
                     <select className="input-field" value={resultsStudentId} onChange={e => setResultsStudentId(e.target.value)} disabled={!resultsBatchId}>
                        <option value="">Select Student</option>
                        {students
                           .filter(s => s.currentBatch === batches.find(b => b._id === resultsBatchId)?.name)
                           .sort((a, b) => (a.registrationNo || "").localeCompare(b.registrationNo || ""))
                           .map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                     </select>
                     <select className="input-field" value={resultsSem} onChange={e => setResultsSem(parseInt(e.target.value))}>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                     </select>
                  </div>

                  {resultsStudentId && (
                     <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-fade-in text-left">
                        <div className="p-10 border-b bg-gray-50 flex justify-between items-center text-left">
                           <div>
                              <h3 className="text-xl font-black text-gray-900 uppercase text-left">Grades - Sem {resultsSem}</h3>
                              <p className="text-xs font-bold text-gray-400 mt-1 uppercase text-left">Enter curriculum grades</p>
                           </div>
                           <div className="text-right text-left text-left text-left">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 text-left">Manual GPA</label>
                              <input className="w-32 p-4 bg-white border border-gray-200 rounded-2xl text-center font-black text-blue-600 text-xl outline-none" placeholder="0.00" value={manualGPA} onChange={e => setManualGPA(e.target.value)} disabled={!isAdmin} />
                           </div>
                        </div>
                        <div className="p-8 space-y-4 text-left">
                           {subjects.filter(s => s.semester === resultsSem).map(sub => (
                              <div key={sub._id} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl text-left text-left">
                                 <div><p className="font-bold text-gray-900 uppercase leading-none">{sub.name}</p><p className="text-[10px] font-black text-blue-600 uppercase mt-2">{sub.code}</p></div>
                                 {isAdmin ? (
                                    <select className="input-field max-w-[150px]" value={subjectGrades[sub._id] || ''} onChange={e => setSubjectGrades(prev => ({...prev, [sub._id]: e.target.value}))}>
                                       <option value="">Grade</option>
                                       {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                 ) : (<span className="font-black text-blue-600 text-xl">{subjectGrades[sub._id] || 'N/A'}</span>)}
                              </div>
                           ))}
                           {isAdmin && <button onClick={handleSaveUniversityResults} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl mt-6 text-left">Confirm and Publish</button>}
                        </div>
                     </div>
                  )}
               </div>
            )}

            {/* 📝 BULK MARKS ENTRY */}
            {activeView === 'marks' && (
               <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-left text-left">
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight text-left">Bulk Marks</h2>
                    <select className="input-field max-w-[200px]" value={marksBatchId} onChange={e => { setMarksBatchId(e.target.value); setBulkMarkSubjectId(''); setStudentMarks({}); }}>
                       <option value="">Choose Batch</option>
                       {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>

                  {marksBatchId && (
                     <div className="space-y-6 animate-fade-in text-left">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 ml-4">Select Subject (Sem {batches.find(b => b._id === marksBatchId) ? getAcademicStatus(batches.find(b => b._id === marksBatchId).startYear).semester : ''})</h3>
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {(isAdmin ? subjects : staffSubjects)
                                 .filter(s => {
                                    const b = batches.find(batch => batch._id === marksBatchId);
                                    if (!b) return true;
                                    return s.semester === getAcademicStatus(b.startYear).semester;
                                 })
                                 .map(s => (
                                 <button key={s._id} onClick={() => { setBulkMarkSubjectId(s._id); setStudentMarks({}); }}
                                   className={`p-6 rounded-3xl text-left transition-all border-2 flex flex-col justify-between h-32 ${bulkMarkSubjectId === s._id ? 'bg-blue-600 text-white border-transparent shadow-xl scale-[0.98]' : 'bg-gray-50 text-gray-900 border-gray-100 hover:bg-white hover:shadow-md'}`}>
                                    <p className="font-black uppercase text-sm leading-tight">{s.name}</p>
                                    <p className={`text-[10px] font-black ${bulkMarkSubjectId === s._id ? 'text-blue-100' : 'text-blue-600'} uppercase tracking-[0.2em]`}>{s.code}</p>
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row gap-6 text-left">
                           <div className="flex-1 text-left">
                              <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 ml-4 text-left">Test Category</label>
                              <select className="input-field text-left" value={bulkTestType} onChange={e => setBulkTestType(e.target.value)}>
                                 {[...Array(10)].map((_, i) => <option key={i} value={`Slip Test ${i+1}`}>Slip Test {i+1}</option>)}
                                 {[...Array(3)].map((_, i) => <option key={i} value={`Internal ${i+1}`}>Internal {i+1}</option>)}
                                 <option value="Model Exam">Model Exam</option>
                              </select>
                           </div>
                        </div>
                     </div>
                  )}

                  {marksBatchId && bulkMarkSubjectId && (
                     <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden text-left animate-fade-in">
                        <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry: {bulkTestType}</span>
                           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{subjects.find(s => s._id === bulkMarkSubjectId)?.name}</span>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto text-left text-left">
                           {students
                              .filter(s => (batches.find(b => b._id === marksBatchId)?.name === s.currentBatch))
                              .sort((a, b) => (a.registrationNo || "").localeCompare(b.registrationNo || ""))
                              .map(s => (
                              <div key={s._id} className="p-6 flex items-center justify-between hover:bg-blue-50/30 text-left text-left"><div className="text-left text-left text-left"><p className="font-bold text-gray-900 uppercase leading-none">{s.name}</p><p className="text-[10px] font-bold text-gray-400 mt-1">{s.registrationNo}</p></div><input className={`w-24 text-center p-3 bg-gray-50 border border-gray-100 rounded-xl font-black outline-none text-left ${parseInt(studentMarks[s._id]) < 50 ? 'text-rose-600' : 'text-blue-600'}`} placeholder="0" value={studentMarks[s._id] || ''} onChange={e => setStudentMarks(prev => ({...prev, [s._id]: e.target.value}))} /></div>
                           ))}
                        </div>
                        <div className="p-8 bg-gray-50 flex justify-end text-left text-left"><button onClick={async () => { const marksData = Object.entries(studentMarks).map(([sid, sc]) => ({ studentId: sid, score: sc })); await postBulkMarksMutation({ subjectId: bulkMarkSubjectId, testType: bulkTestType, marks: marksData }); alert('Applied!'); }} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-left text-left text-left shadow-lg shadow-blue-100 active:scale-95 transition-all">Apply Scores</button></div>
                     </div>
                  )}

                  {!marksBatchId && (
                     <div className="bg-white rounded-[3rem] p-20 shadow-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-3xl mb-6">📝</div>
                        <h3 className="text-lg font-black text-gray-900 uppercase">Select a batch to begin</h3>
                        <p className="text-xs font-bold text-gray-400 mt-2 uppercase">Marks entry workflow starts with batch selection</p>
                     </div>
                  )}
               </div>
            )}

            {/* 📢 POST NEWS */}
            {activeView === 'events' && isAdmin && (
               <div className="space-y-8 text-left text-left">
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight text-left">Announcements</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                     <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-left">
                        <h3 className="text-xl font-black mb-8 uppercase text-left text-left">Publish</h3>
                        <form onSubmit={handlePostEvent} className="space-y-6 text-left text-left text-left">
                           <input className="input-field text-left" placeholder="Title" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
                           <textarea className="input-field h-32 text-left" placeholder="Details" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} required />
                           <input className="input-field text-left" placeholder="Event Link (Optional)" value={eventForm.eventUrl || ''} onChange={e => setEventForm({...eventForm, eventUrl: e.target.value})} />
                           <div className="grid grid-cols-2 gap-4 text-left">
                              <select className="input-field text-left text-left" value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})}>
                                 <option value="Symposium">Symposium</option>
                                 <option value="Tech Event">Tech Event</option>
                                 <option value="Sudden">Sudden Update</option>
                              </select>
                              <div className="relative group cursor-pointer text-left text-left">
                                 <input type="file" accept="image/*" className="hidden" id="staff-img-ev" onChange={e => handleImageUpload(e, (res) => setEventForm({...eventForm, imageUrl: res}))} />
                                 <label htmlFor="staff-img-ev" className="w-full aspect-[4/3] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black text-gray-400 uppercase overflow-hidden">
                                    {eventForm.imageUrl ? <img src={eventForm.imageUrl} className="w-full h-full object-cover" alt="" /> : '+ Add Photo'}
                                 </label>
                              </div>
                           </div>
                           <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl text-left">Publish</button>
                        </form>
                     </div>
                     <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden text-left"><div className="p-8 border-b bg-gray-50 font-black uppercase text-xs text-left">History</div><div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto text-left">{announcements.map(a => (
                        <div key={a._id} className="p-6 text-left text-left">
                          <div className="flex justify-between items-start mb-2">
                            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase text-left">{a.type}</span>
                            <div className="flex gap-2">
                              {a.eventUrl && <a href={a.eventUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-[10px] font-black uppercase">Visit</a>}
                              <button onClick={() => setVisibleDescriptions(prev => ({...prev, [a._id]: !prev[a._id]}))} className="text-gray-500 text-[10px] font-black uppercase">{visibleDescriptions[a._id] ? 'Hide' : 'View'}</button>
                              <button onClick={() => removeEventMutation({requesterId: loggedInUser._id.toString(), id: a._id})} className="text-rose-500 text-[10px] font-black uppercase text-left">Del</button>
                            </div>
                          </div>
                          {a.imageUrl && (
                            <img src={a.imageUrl} alt="" className="w-full aspect-[4/3] object-cover rounded-2xl mb-4 border border-gray-100" />
                          )}
                          <p className="font-black text-gray-900 uppercase leading-none text-left">{a.title}</p>
                          {visibleDescriptions[a._id] && <p className="mt-2 text-xs text-gray-500 font-bold">{a.description}</p>}
                        </div>))}</div></div>
                  </div>
               </div>
            )}

            {/* 👥 STUDENTS DIRECTORY */}
            {activeView === 'directory' && (
               <div className="space-y-10 text-left text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-left text-left">
                     <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight text-left">Students</h2>
                     {isAdmin && <button onClick={() => setActiveView('add-student')} className="bg-blue-600 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase shadow-lg transition-all active:scale-95 text-left text-left">Enroll New</button>}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left text-left">
                     <div className="lg:col-span-4 space-y-8 text-left text-left">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 text-left text-left">
                           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-left text-left">Active Batches</h3>
                           <div className="space-y-3 text-left text-left">
                              {batches.map(b => (
                                 <button key={b._id} onClick={() => setDirectoryBatchId(b._id)} className={`w-full p-4 rounded-2xl text-left transition-all border ${directoryBatchId === b._id ? 'bg-blue-600 text-white border-transparent shadow-lg' : 'bg-gray-50 text-gray-900 border-gray-100 hover:bg-white hover:shadow-md'}`}><p className="font-black uppercase text-sm leading-none text-left">{b.name}</p></button>
                              ))}
                           </div>
                           {isAdmin && <button onClick={() => setIsAddingBatch(!isAddingBatch)} className="w-full mt-6 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all text-left text-left">{isAddingBatch ? 'Cancel' : '+ New Batch'}</button>}
                        </div>
                        {isAdmin && isAddingBatch && (
                           <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 text-left animate-fade-in text-left text-left">
                              <form onSubmit={async (e) => { e.preventDefault(); await createBatchMutation({...batchForm, requesterId: loggedInUser._id.toString()}); alert('Done!'); setIsAddingBatch(false); }} className="space-y-4 text-left text-left text-left text-left"><input className="input-field text-left text-left" placeholder="Name" value={batchForm.name} onChange={e => setBatchForm({...batchForm, name: e.target.value})} required /><div className="grid grid-cols-2 gap-4 text-left text-left text-left"><input type="number" className="input-field text-left text-left text-left" placeholder="Start" value={batchForm.startYear} onChange={e => setBatchForm({...batchForm, startYear: parseInt(e.target.value)})} required /><input type="number" className="input-field text-left text-left text-left text-left" placeholder="End" value={batchForm.endYear} onChange={e => setBatchForm({...batchForm, endYear: parseInt(e.target.value)})} required /></div><button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl text-left text-left text-left">Confirm</button></form>
                           </div>
                        )}
                     </div>
                     <div className="lg:col-span-8 text-left text-left text-left">
                        {!directoryBatchId ? (
                           <div className="bg-white rounded-[3rem] p-20 shadow-xl border border-gray-100 flex flex-col items-center justify-center text-center text-left text-left text-left"><div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-3xl mb-6 text-left text-left text-left text-left text-left">🎓</div><h3 className="text-lg font-black text-gray-900 uppercase text-left text-left text-left">Choose a batch</h3></div>
                        ) : (
                           <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-fade-in text-left text-left text-left">
                              <div className="p-8 border-b bg-gray-50 flex justify-between items-center text-left text-left text-left text-left text-left text-left text-left"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left text-left text-left text-left">List: {batches.find(b => b._id === directoryBatchId)?.name}</span></div>
                              <div className="divide-y divide-gray-50 text-left text-left text-left text-left text-left text-left text-left text-left">
                                 {students
                                    .filter(s => s.currentBatch === batches.find(b => b._id === directoryBatchId)?.name)
                                    .sort((a, b) => (a.registrationNo || "").localeCompare(b.registrationNo || ""))
                                    .map(s => (
                                    <div key={s._id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all text-left text-left text-left text-left text-left text-left text-left text-left">
                                       <div className="flex items-center space-x-4 text-left text-left text-left text-left text-left text-left">
                                          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 text-left text-left text-left text-left text-left text-left"><img src={s.profileImage || `https://ui-avatars.com/api/?name=${s.name}`} className="w-full h-full object-cover text-left text-left text-left text-left text-left text-left" alt="" /></div>
                                          <div className="text-left text-left text-left text-left text-left text-left text-left text-left text-left"><p className="font-bold text-gray-900 uppercase tracking-tight text-left text-left text-left text-left text-left text-left">{s.name}</p><p className="text-[10px] font-black text-gray-400 uppercase mt-1 text-left text-left text-left text-left text-left text-left text-left">{s.registrationNo}</p></div>
                                       </div>
                                       {isAdmin ? (
                                         <div className="flex gap-2">
                                           <button onClick={() => setEditingStudent(s)} className="text-[10px] font-black text-blue-600 border border-blue-100 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all text-left text-left text-left text-left text-left">Edit</button>
                                           <button onClick={async () => { if(window.confirm(`Permanently remove ${s.name}?`)) { await removeUserMutation({requesterId: loggedInUser._id.toString(), id: s._id}); alert('Student Removed'); }}} className="text-[10px] font-black text-rose-600 border border-rose-100 px-4 py-2 rounded-full hover:bg-rose-600 hover:text-white transition-all text-left text-left text-left text-left text-left">Del</button>
                                         </div>
                                       ) : <button onClick={() => navigate('/student-dashboard', { state: { user: s } })} className="text-[10px] font-black text-indigo-600 border border-indigo-100 px-4 py-2 rounded-full text-left text-left text-left text-left text-left text-left text-left">View</button>}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {/* 📚 CURRICULUM */}
            {activeView === 'subjects' && isAdmin && (
               <div className="space-y-8 text-left text-left text-left text-left text-left text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-left text-left text-left text-left text-left">
                    <h2 className="text-3xl font-black text-gray-900 uppercase text-left text-left text-left text-left">Curriculum</h2>
                    <button onClick={() => setActiveView('add-subject')} className="bg-blue-600 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase shadow-lg text-left text-left text-left">New Subject</button>
                  </div>
                  <div className="flex flex-wrap gap-2 bg-gray-200/50 p-1.5 rounded-2xl text-left text-left text-left text-left">
                     {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (<button key={sem} onClick={() => setSelectedSemTab(sem)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${setSelectedSemTab === sem ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500'}`}>Sem {sem}</button>))}
                  </div>
                  <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden text-left text-left text-left text-left text-left text-left">
                     <div className="divide-y divide-gray-100 text-left text-left text-left text-left text-left text-left text-left">
                        {subjects.filter(s => s.semester === selectedSemTab).map(sub => (
                           <div key={sub._id} className="p-8 flex items-center justify-between hover:bg-gray-50 transition-all text-left text-left text-left text-left">
                              <div className="text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><p className="font-black text-gray-900 uppercase text-lg leading-none">{sub.name}</p><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{sub.code} • {sub.staffName}</p></div>
                              <div className="flex space-x-4">
                                 <button onClick={() => setEditingSubject(sub)} className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest text-left text-left text-left">Reassign</button>
                                 <button onClick={async () => { if(window.confirm(`Delete ${sub.name}?`)) { await removeSubjectMutation({requesterId: loggedInUser._id.toString(), id: sub._id}); alert('Deleted'); }}} className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest">Delete</button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {/* ➕ ADD SUBJECT */}
            {activeView === 'add-subject' && isAdmin && (
               <div className="space-y-8 text-left">
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">New Course</h2>
                  <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 max-w-2xl mx-auto">
                     <form onSubmit={async (e) => { e.preventDefault(); await addSubjectMutation({...subjectForm, requesterId: loggedInUser._id.toString()}); alert('Subject Added!'); setActiveView('subjects'); setSubjectForm({ name: '', code: '', semester: 6, staffId: '' }); }} className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Subject Name</label>
                           <input className="input-field" placeholder="E.g. Machine Learning" value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Subject Code</label>
                              <input className="input-field" placeholder="E.g. CS8601" value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} required />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Semester</label>
                              <select className="input-field" value={subjectForm.semester} onChange={e => setSubjectForm({...subjectForm, semester: parseInt(e.target.value)})} required>
                                 {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                              </select>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Assign Staff (Optional)</label>
                           <select className="input-field" value={subjectForm.staffId} onChange={e => setSubjectForm({...subjectForm, staffId: e.target.value})}>
                              <option value="">Choose Faculty</option>
                              {allStaff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                           </select>
                        </div>
                        <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl hover:bg-blue-700 transition-all mt-4">Create Subject</button>
                     </form>
                  </div>
               </div>
            )}

            {/* 👨‍🏫 FACULTY */}
            {activeView === 'staff' && isAdmin && (
               <div className="space-y-8 text-left text-left text-left text-left text-left text-left">
                  <h2 className="text-3xl font-black text-gray-900 uppercase text-left text-left text-left text-left text-left text-left">Faculty Registry</h2>
                  <div className="grid grid-cols-1 gap-8 text-left">
                     <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden text-left text-left text-left text-left text-left text-left text-left">
                        <div className="divide-y divide-gray-100 text-left text-left text-left text-left text-left text-left">
                           {allStaff.map(s => (
                              <div key={s._id} className="p-6 flex items-center justify-between text-left text-left text-left text-left text-left text-left">
                                 <div className="flex items-center space-x-4 text-left text-left text-left text-left text-left text-left">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden text-left text-left text-left text-left text-left text-left text-left"><img src={s.profileImage || `https://ui-avatars.com/api/?name=${s.name}`} className="w-full h-full object-cover text-left text-left text-left text-left text-left text-left text-left" alt="" /></div>
                                    <div className="text-left text-left text-left text-left text-left text-left text-left"><p className="font-bold text-gray-900 uppercase text-left text-left text-left">{s.name}</p><p className="text-[10px] font-black text-blue-600 uppercase text-left text-left text-left">{s.role.toUpperCase()}</p></div>
                                 </div>
                                 <div className="flex space-x-2 text-left text-left text-left text-left text-left text-left">
                                    <button onClick={() => setEditingStaff(s)} className="text-blue-600 text-[10px] font-black uppercase border border-blue-100 px-4 py-2 rounded-full hover:bg-blue-50 transition-all text-left text-left">Edit</button>
                                    {s.role === 'staff' && <button onClick={async () => { if(window.confirm('Remove?')) { await removeUserMutation({id: s._id}); alert('Removed'); }}} className="text-rose-600 text-[10px] font-black uppercase border border-rose-100 px-4 py-2 rounded-full hover:bg-rose-50 transition-all text-left text-left">Del</button>}
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-center">
                           <button onClick={() => setIsAddingStaff(!isAddingStaff)} className="bg-blue-600 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase shadow-lg transition-all active:scale-95">
                              {isAddingStaff ? 'Cancel Enrollment' : '+ Add New Faculty'}
                           </button>
                        </div>
                     </div>

                     {isAddingStaff && (
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-left animate-fade-in max-w-2xl mx-auto w-full">
                           <h3 className="text-xl font-black mb-8 uppercase text-center">New Faculty Enrollment</h3>
                           <div className="flex justify-center mb-8 text-left text-left text-left text-left text-left text-left">
                              <div className="relative group cursor-pointer text-left text-left text-left text-left text-left text-left text-left">
                                 <input type="file" accept="image/*" className="hidden" id="staff-img-sc" onChange={e => handleImageUpload(e, (res) => setStaffForm({...staffForm, profileImage: res}))} />
                                 <label htmlFor="staff-img-sc" className="block w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-gray-50 text-left text-left text-left text-left text-left text-left text-left text-left">
                                    {staffForm.profileImage ? <img src={staffForm.profileImage} className="w-full h-full object-cover text-left" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-left text-left text-left text-left text-left text-left text-left text-left">Photo</div>}
                                 </label>
                              </div>
                           </div>
                           <form onSubmit={async (e) => { 
                              e.preventDefault(); 
                              try {
                                 await addStaffMutation(staffForm); 
                                 alert('Done!'); 
                                 setStaffForm({name:'', password:'', role:'', profileImage:''}); 
                                 setIsAddingStaff(false);
                              } catch (err) {
                                 console.error(err);
                                 alert("Failed to add staff: " + err.message);
                              }
                           }} className="space-y-4">
                              <input className="input-field" placeholder="Full Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} required autoComplete="off" />
                              <input type="password" placeholder="Access Password" name="f_p_sc" className="input-field" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} required autoComplete="new-password" />
                              <select className="input-field" value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} required>
                                 <option value="">Select Role</option>
                                 <option value="staff">Teaching Staff</option>
                                 <option value="ahod">Assistant HOD</option>
                                 <option value="hod">HOD</option>
                              </select>
                              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl hover:bg-blue-700 transition-all">Confirm Registration</button>
                           </form>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* ➕ ENROLL STUDENT */}
            {activeView === 'add-student' && isAdmin && (
               <div className="space-y-8 text-left text-left text-left text-left text-left">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setActiveView('directory')} className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 shadow-sm transition-all">←</button>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight text-left text-left text-left">New Student</h2>
                  </div>
                  <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 max-w-3xl mx-auto text-left text-left text-left text-left">
                     <form onSubmit={async (e) => { 
                        e.preventDefault(); 
                        try {
                           await addStudentMutation(studentForm); 
                           alert('Enrolled!'); 
                           setActiveView('directory'); 
                           setStudentForm({ name: '', registrationNo: '', dob: '', email: '', mobileNo: '', parentMobileNo: '', batchId: '', profileImage: '', address: '' });
                        } catch (err) {
                           console.error(err);
                           alert("Failed to enroll student: " + err.message);
                        }
                     }} className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left text-left text-left text-left text-left text-left text-left">
                        <div className="sm:col-span-2 flex justify-center mb-4 text-left text-left text-left text-left text-left text-left"><div className="relative group cursor-pointer text-left text-left text-left text-left text-left text-left text-left text-left"><input type="file" accept="image/*" className="hidden" id="enroll-img-sc" onChange={e => handleImageUpload(e, (res) => setStudentForm({...studentForm, profileImage: res}))} /><label htmlFor="enroll-img-sc" className="block w-24 h-24 rounded-3xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 text-left text-left text-left text-left text-left text-left text-left text-left text-left">{studentForm.profileImage ? <img src={studentForm.profileImage} className="w-full h-full object-cover text-left" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-left text-left text-left text-left text-left text-left text-left">Photo</div>}</label></div></div>
                        <input className="input-field sm:col-span-2 text-left" placeholder="Name" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required /><input className="input-field text-left" placeholder="Reg No" value={studentForm.registrationNo} onChange={e => setStudentForm({...studentForm, registrationNo: e.target.value})} required /><input type="date" className="input-field text-left text-left" value={studentForm.dob} onChange={e => setStudentForm({...studentForm, dob: e.target.value})} required /><input type="email" className="input-field text-left" placeholder="Email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} required /><input className="input-field text-left" placeholder="Mobile" value={studentForm.mobileNo} onChange={e => setStudentForm({...studentForm, mobileNo: e.target.value})} required /><input className="input-field" placeholder="Parent" value={studentForm.parentMobileNo} onChange={e => setStudentForm({...studentForm, parentMobileNo: e.target.value})} required /><select className="input-field sm:col-span-2 text-left" value={studentForm.batchId} onChange={e => setStudentForm({...studentForm, batchId: e.target.value})} required><option value="">Batch</option>{batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select>
                        <textarea className="input-field sm:col-span-2 text-left" placeholder="Residential Address" value={studentForm.address || ''} onChange={e => setStudentForm({...studentForm, address: e.target.value})} />
                        <button type="submit" className="sm:col-span-2 w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl text-left text-left text-left text-left text-left">Confirm</button>
                     </form>
                  </div>
               </div>
            )}

            {activeView === 'security' && (
               <div className="space-y-8 text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                  <h2 className="text-3xl font-black text-gray-900 uppercase text-left text-left text-left text-left text-left text-left">Account</h2>
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 max-w-md mx-auto text-left text-left text-left text-left text-left text-left text-left"><h3 className="text-xl font-black mb-8 uppercase text-center text-left text-left text-left">Update Credentials</h3><form onSubmit={async (e) => { e.preventDefault(); if (loggedInUser._id === "hidden_admin") return alert("Locked."); await changePasswordMutation({ id: loggedInUser._id, newPassword }); alert("Updated!"); setNewPassword(''); }} className="space-y-6 text-left text-left text-left text-left text-left text-left text-left"><input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field text-center text-left text-left text-left" required /><button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-left text-left text-left text-left text-left text-left">Apply</button></form></div>
               </div>
            )}
         </div>
      </main>

      {/* MODALS (Verified Stable) */}
      {editingStudent && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-10 text-left">
           <div className="bg-white rounded-[3rem] shadow-2xl p-8 sm:p-12 w-full max-w-5xl h-full overflow-y-auto text-left text-left">
              <div className="flex justify-between items-center mb-10 text-left text-left"><h3 className="text-2xl font-black text-gray-900 uppercase text-left text-left">Profile Records</h3><button onClick={() => setEditingStudent(null)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200 text-left text-left text-left text-left">✕</button></div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left text-left text-left">
                 <div className="lg:col-span-5 space-y-8 text-left text-left text-left text-left">
                    <div className="flex justify-center text-left text-left text-left text-left"><div className="relative group cursor-pointer text-left text-left text-left text-left text-left text-left text-left"><input type="file" accept="image/*" className="hidden" id="edit-stu-sc" onChange={e => handleImageUpload(e, (res) => setEditingStudent({...editingStudent, profileImage: res}))} /><label htmlFor="edit-stu-sc" className="block w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-gray-50 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><img src={editingStudent.profileImage || `https://ui-avatars.com/api/?name=${editingStudent.name}`} className="w-full h-full object-cover text-left text-left text-left text-left text-left text-left" alt="" /></label></div></div>
                    <form onSubmit={async (e) => { 
                       e.preventDefault(); 
                       try {
                          const { _id, _creationTime, currentBatch, currentSemester, enrollmentId, role, ...data } = editingStudent; 
                          await updateStudentMutation({ id: _id, ...data }); 
                          alert('Updated!'); 
                          setEditingStudent(null); 
                       } catch (err) {
                          console.error(err);
                          alert("Failed to update student: " + err.message);
                       }
                    }} className="grid grid-cols-1 gap-4 text-left text-left text-left text-left text-left"><input className="input-field text-left" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} /><input className="input-field text-left" value={editingStudent.registrationNo} onChange={e => setEditingStudent({...editingStudent, registrationNo: e.target.value})} /><input type="date" className="input-field text-left" value={editingStudent.dob || ''} onChange={e => setEditingStudent({...editingStudent, dob: e.target.value})} /><input className="input-field text-left" value={editingStudent.email || ''} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} /><input className="input-field text-left" value={editingStudent.mobileNo || ''} onChange={e => setEditingStudent({...editingStudent, mobileNo: e.target.value})} /><input className="input-field text-left" value={editingStudent.parentMobileNo || ''} onChange={e => setEditingStudent({...editingStudent, parentMobileNo: e.target.value})} placeholder="Parent Mobile" /><textarea className="input-field text-left" placeholder="Residential Address" value={editingStudent.address || ''} onChange={e => setEditingStudent({...editingStudent, address: e.target.value})} /><button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-left text-left text-left">Save Changes</button>{isAdmin && (<button type="button" onClick={async () => { if(window.confirm('PERMANENTLY DELETE STUDENT? This cannot be undone.')) { await removeUserMutation({id: editingStudent._id}); alert('Removed'); setEditingStudent(null); }}} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all">Permanently Delete Student</button>)}</form>
                 </div>
                 <div className="lg:col-span-7 space-y-8 text-left text-left text-left text-left text-left text-left text-left"><h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] text-left text-left text-left text-left text-left">Attendance Timeline</h4><div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><StudentAttendanceHistoryEditor studentId={editingStudent._id} onMark={markAttendanceMutation} /></div></div>
              </div>
           </div>
        </div>
      )}

      {editingStaff && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 text-left text-left text-left text-left text-left">
           <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-xl w-full text-left text-left text-left text-left text-left text-left">
              <h3 className="text-2xl font-black text-gray-900 mb-8 uppercase text-left text-left text-left text-left text-left text-left text-left text-left">Faculty Profile</h3>
              <div className="flex justify-center mb-8 text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                 <div className="relative group cursor-pointer text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                    <input type="file" accept="image/*" className="hidden" id="edit-stf-sc" onChange={e => handleImageUpload(e, (res) => setEditingStaff({...editingStaff, profileImage: res}))} />
                    <label htmlFor="edit-stf-sc" className="block w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-gray-50 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                       <img src={editingStaff.profileImage || `https://ui-avatars.com/api/?name=${editingStaff.name}`} className="w-full h-full object-cover text-left text-left text-left text-left text-left text-left text-left" alt="" />
                    </label>
                 </div>
              </div>
              <form onSubmit={async (e) => { e.preventDefault(); const { _id, _creationTime, role, ...data } = editingStaff; await updateStaffMutation({ id: _id, ...data }); alert('Staff Updated!'); setEditingStaff(null); }} className="space-y-6 text-left text-left text-left text-left text-left text-left text-left">
                 <input className="input-field text-left text-left text-left text-left" value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} /><input type="password" name="new_f_p_sc" className="input-field text-left text-left text-left text-left" placeholder="New Password" value={editingStaff.password || ''} onChange={e => setEditingStaff({...editingStaff, password: e.target.value})} /><div className="flex gap-4 text-left text-left text-left text-left text-left text-left text-left text-left"><button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-left text-left text-left text-left text-left">Save Changes</button><button type="button" onClick={() => setEditingStaff(null)} className="flex-1 py-5 bg-gray-100 text-gray-900 rounded-2xl font-black uppercase text-left text-left text-left text-left text-left">Cancel</button></div>
              </form>
           </div>
        </div>
      )}

      {editingSubject && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 text-left text-left text-left text-left text-left text-left text-left">
           <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-xl w-full text-left text-left text-left text-left text-left text-left text-left text-left">
              <h3 className="text-2xl font-black text-gray-900 mb-8 uppercase text-left text-left text-left text-left text-left text-left text-left text-left">Update Course</h3>
              <form onSubmit={async (e) => { e.preventDefault(); await updateSubjectMutation({id: editingSubject._id, name: editingSubject.name, code: editingSubject.code, semester: editingSubject.semester, staffId: editingSubject.staffId}); setEditingSubject(null); alert('Updated!'); }} className="space-y-6 text-left text-left text-left text-left text-left text-left text-left text-left"><div className="text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><label className="text-[10px] font-black text-gray-400 uppercase text-left text-left text-left text-left text-left text-left text-left text-left text-left">Staff Handler</label><select className="input-field text-left text-left text-left text-left text-left text-left text-left text-left text-left" value={editingSubject.staffId || ''} onChange={e => setEditingSubject({...editingSubject, staffId: e.target.value})}><option value="">Unassigned</option>{allStaff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div><button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl text-left text-left text-left text-left text-left text-left text-left text-left">Sync Staff</button></form>
           </div>
        </div>
      )}

      <style>{`
        .input-field { width: 100%; padding: 1.125rem 1.5rem; background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 1.25rem; font-weight: 700; outline: none; transition: all 0.2s; font-size: 0.9rem; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em; }
        .input-field:focus { background-color: white; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const StudentAttendanceHistoryEditor = ({ studentId, onMark }) => {
  const [viewMonth, setViewMonth] = useState(new Date());
  const yearMonth = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}`;
  const history = useQuery(api.attendance.getAttendanceForStudent, { studentId, month: yearMonth });
  const historyMap = useMemo(() => { const map = {}; if(history) history.forEach(h => { map[h.date] = h.status; }); return map; }, [history]);
  const cycle = (day) => {
    const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const sequence = ['present', 'absent', 'leave', 'od'];
    const current = historyMap[dateStr];
    let next = !current ? 'present' : sequence[(sequence.indexOf(current) + 1) % sequence.length];
    onMark({ studentId, date: dateStr, status: next });
  };
  return (<div className="w-full text-left text-left text-left text-left text-left text-left"><div className="flex justify-between items-center mb-6 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
    <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth()-1))} className="p-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">←</button>
    <span className="font-black uppercase tracking-widest text-gray-900 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">{viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
    <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth()+1))} className="p-2 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">→</button>
  </div><div className="grid grid-cols-7 gap-2 text-center text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
    {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-[10px] font-black text-gray-300 uppercase text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">{d}</div>)}
    {Array.from({length: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()}).map((_,i) => <div key={`e-${i}`} />)}
    {Array.from({length: new Date(viewMonth.getFullYear(), viewMonth.getMonth()+1, 0).getDate()}).map((_,i) => { const day = i+1; const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth()+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const st = historyMap[dateStr]; return (<button key={day} onClick={() => cycle(day)} className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${st === 'present' ? 'bg-emerald-500 text-white shadow-lg text-left text-left text-left text-left text-left text-left' : st === 'absent' ? 'bg-rose-500 text-white shadow-lg text-left text-left text-left text-left text-left text-left' : st === 'leave' ? 'bg-amber-500 text-white shadow-lg text-left text-left text-left text-left text-left text-left' : st === 'od' ? 'bg-blue-500 text-white shadow-lg text-left text-left text-left text-left text-left text-left text-left' : 'bg-white text-gray-400 text-left text-left text-left text-left text-left text-left'}`}>{day}</button>); })}
  </div></div>);
};

export default StaffDashboard;
