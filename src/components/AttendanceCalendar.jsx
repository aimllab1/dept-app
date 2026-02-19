import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const AttendanceCalendar = ({ studentId }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Robust year-month string generation
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
      case 'present': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'absent': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'leave':
      case 'od': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={goToPreviousMonth} 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Previous Month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h3 className="text-lg font-bold text-gray-800 tracking-wide">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button 
          onClick={goToNextMonth} 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Next Month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10 sm:h-12"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          return (
            <div
              key={day}
              className={`h-10 sm:h-12 flex items-center justify-center border rounded-lg text-sm font-medium transition-colors cursor-default ${getDayStatusClass(day)}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-emerald-400 mr-2"></div>
          <span>Present</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-rose-400 mr-2"></div>
          <span>Absent</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-400 mr-2"></div>
          <span>Leave/OD</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
