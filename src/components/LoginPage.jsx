import React, { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';

const LoginCard = ({ type, title, subtitle, icon, color, userType, setUserType }) => (
    <button
      onClick={() => setUserType(type)}
      className={`flex-1 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-left transition-all duration-500 border-2 ${
        userType === type 
          ? `${color} border-transparent shadow-2xl scale-100 sm:scale-105 text-white` 
          : 'bg-white border-gray-100 shadow-xl hover:shadow-2xl sm:hover:-translate-y-2 text-gray-900'
      }`}
    >
      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-4 sm:mb-6 transition-colors ${
        userType === type ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
      }`}>
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2">{title}</h3>
      <p className={`text-xs sm:text-sm font-bold ${userType === type ? 'text-blue-100' : 'text-gray-400'}`}>
        {subtitle}
      </p>
    </button>
);

function LoginPage() {
  const [userType, setUserType] = useState('student');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const convex = useConvex();
  const usernameId = useId();
  const passwordId = useId();

  // Clear userId when switching between student/staff to prevent confusion
  const handleUserTypeChange = (newType) => {
    setUserType(newType);
    setUserId('');
    setPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const user = await convex.query(api.users.logIn, {
      userType,
      userId,
      password: userType === 'staff' ? password : undefined,
    });

    if (user) {
      setUserId('');
      setPassword('');
      localStorage.setItem('aec_user', JSON.stringify(user));

      if (user.role === 'student') {
        navigate('/student-dashboard', { state: { user }, replace: true });
      } else {
        navigate('/staff-dashboard', { state: { user }, replace: true });
      }
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 font-sans">
      <div className="w-full max-w-5xl flex flex-col items-center">
        {/* Logo and Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <img src="/img/logo.png" alt="AEC" className="h-16 sm:h-20 w-auto mb-4 sm:mb-6 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-2">
            ADHIPARASAKTHI
          </h1>
          <p className="text-[8px] sm:text-[10px] font-black text-blue-600 tracking-[0.2em] sm:tracking-[0.4em] uppercase">Engineering College</p>
        </div>

        {/* Two Login Cards Selection */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full mb-8 sm:mb-12 px-2">
          <LoginCard 
            type="student" 
            title="Student Portal" 
            subtitle="View attendance and academic results" 
            icon="🎓"
            color="bg-blue-600"
            userType={userType}
            setUserType={handleUserTypeChange}
          />
          <LoginCard 
            type="staff" 
            title="Faculty Portal" 
            subtitle="Manage students and mark attendance" 
            icon="👨‍🏫"
            color="bg-indigo-700"
            userType={userType}
            setUserType={handleUserTypeChange}
          />
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 border border-gray-100">
           <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                {userType === 'student' ? 'Student Sign-In' : 'Faculty Sign-In'}
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Enter credentials below</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6" autoComplete="off">
              <div>
                 <label className="block text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">
                    {userType === 'student' ? 'Registration Number' : 'Full Name'}
                 </label>
                 <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    autoComplete="off"
                    id={usernameId}
                    className="w-full px-5 py-3 sm:px-6 sm:py-4 bg-gray-50 border border-transparent rounded-xl sm:rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-gray-900 text-sm sm:text-base"
                    placeholder={userType === 'student' ? 'Registration Number' : 'Full Name'}
                    required
                 />
              </div>

              {userType === 'staff' && (
                <div>
                   <label className="block text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">
                      Security Password
                   </label>
                   <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      id={passwordId}
                      className="w-full px-5 py-3 sm:px-6 sm:py-4 bg-gray-50 border border-transparent rounded-xl sm:rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-gray-900 text-sm sm:text-base"
                      placeholder="Enter Password"
                      required
                   />
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl text-white font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${
                  userType === 'student' ? 'bg-blue-600 hover:shadow-blue-200' : 'bg-indigo-700 hover:shadow-indigo-200'
                }`}
              >
                Access Portal
              </button>
           </form>
           
           <div className="mt-8 sm:mt-10 text-center">
              <button onClick={() => navigate('/')} className="text-[8px] sm:text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
                Back to Home Page
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
