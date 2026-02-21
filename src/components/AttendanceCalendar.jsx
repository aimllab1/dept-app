import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const AttendanceCalendar = ({ studentId }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const yearMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  const attendanceRecords = useQuery(api.attendance.getAttendanceForStudent, {
    studentId: studentId,
    month: yearMonth,
  });

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const attendanceMap = new Map();
  if (attendanceRecords) {
    attendanceRecords.forEach(record => {
      attendanceMap.set(record.date, record.status);
    });
  }

  const getDayStatusClass = (day) => {
    const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
    const status = attendanceMap.get(dateStr);
    switch (status) {
      case 'present': return 'bg-emerald-500 text-white border-emerald-600 shadow-sm';
      case 'absent': return 'bg-rose-500 text-white border-rose-600 shadow-sm';
      case 'leave': return 'bg-orange-500 text-white border-orange-600 shadow-sm';
      case 'od': return 'bg-blue-500 text-white border-blue-600 shadow-sm';
      case 'holiday': return 'bg-gray-200 text-gray-500 border-gray-300 opacity-50';
      default: return 'bg-white text-gray-400 border-gray-100';
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-3xl p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <button onClick={goToPreviousMonth} className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all active:scale-90">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={goToNextMonth} className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all active:scale-90">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-4">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center border-2 rounded-2xl text-xs font-black transition-all cursor-default ${getDayStatusClass(day)}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap gap-6 justify-center text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-200"></div><span className="text-gray-400">Present</span></div>
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2 shadow-sm shadow-rose-200"></div><span className="text-gray-400">Absent</span></div>
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2 shadow-sm shadow-orange-200"></div><span className="text-gray-400">Leave</span></div>
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 shadow-sm shadow-blue-200"></div><span className="text-gray-400">OD</span></div>
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-gray-200 mr-2"></div><span className="text-gray-300">Holiday</span></div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
