import React, { useState, useId, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConvex, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

function LoginPage() {
  const location = useLocation();
  const [userType, setUserType] = useState(location.state?.userType || 'student');
  const [threeDigitCode, setThreeDigitCode] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [password, setPassword] = useState('');
  const [staffName, setStaffName] = useState('');
  
  const navigate = useNavigate();
  const convex = useConvex();
  const passwordId = useId();

  const batches = useQuery(api.batches.getBatches) || [];

  // Update userType if it changes in location state
  useEffect(() => {
    if (location.state?.userType) {
      setUserType(location.state.userType);
    }
  }, [location.state?.userType]);

  // Construct the full registration number for students
  const constructedRegNo = useMemo(() => {
    if (userType !== 'student') return '';
    const selectedBatch = batches.find(b => b._id === selectedBatchId);
    if (!selectedBatch) return '';
    
    const collegeCode = '4204';
    const yearCode = String(selectedBatch.startYear).slice(-2);
    const deptCode = '148';
    const rollNo = threeDigitCode.padStart(3, '0');
    
    return `${collegeCode}${yearCode}${deptCode}${rollNo}`;
  }, [userType, selectedBatchId, threeDigitCode, batches]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const userId = userType === 'student' ? constructedRegNo : staffName;
    
    const user = await convex.query(api.users.logIn, {
      userType,
      userId,
      password: userType === 'staff' ? password : undefined,
    });

    if (user) {
      setThreeDigitCode('');
      setPassword('');
      setStaffName('');
      localStorage.setItem('aec_user', JSON.stringify(user));

      if (user.role === 'student') {
        navigate('/student-dashboard', { state: { user }, replace: true });
      } else {
        navigate('/staff-dashboard', { state: { user }, replace: true });
      }
    } else {
      alert('Invalid credentials. Please check your roll number and batch.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Logo and Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <img src="/img/logo.png" alt="APEC" className="h-20 sm:h-24 w-auto mb-4 sm:mb-6 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-2">
            ADHIPARASAKTHI
          </h1>
          <p className="text-[10px] sm:text-xs font-black text-blue-600 tracking-[0.2em] sm:tracking-[0.4em] uppercase">Engineering College (APEC)</p>
        </div>

        {/* Login Form */}
        <div className="w-full bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-8 sm:p-12 border border-gray-100 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
           
           <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                {userType === 'student' ? 'Student Login' : 'Faculty Login'}
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest italic serif-text">AIML Department Portal</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6 sm:space-y-8" autoComplete="off">
              {userType === 'student' ? (
                <>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                       Select Batch Year
                    </label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full px-6 py-4 sm:px-8 sm:py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-gray-900 text-base appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Choose your batch...</option>
                      {batches.map(batch => (
                        <option key={batch._id} value={batch._id}>{batch.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                       Roll Number (Last 3 Digits)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength="3"
                        value={threeDigitCode}
                        onChange={(e) => setThreeDigitCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-6 py-4 sm:px-8 sm:py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-black text-gray-900 text-xl tracking-[0.5em] text-center"
                        placeholder="000"
                        required
                      />
                    </div>
                    {constructedRegNo && (
                      <p className="mt-4 text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] text-center bg-blue-50 py-2 rounded-full border border-blue-100">
                        Reg No: {constructedRegNo}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                       Faculty Full Name
                    </label>
                    <input
                       type="text"
                       value={staffName}
                       onChange={(e) => setStaffName(e.target.value)}
                       className="w-full px-6 py-4 sm:px-8 sm:py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-gray-900 text-base"
                       placeholder="Enter Name"
                       required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                       Access Password
                    </label>
                    <input
                       type="password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       autoComplete="new-password"
                       id={passwordId}
                       className="w-full px-6 py-4 sm:px-8 sm:py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-gray-900 text-base"
                       placeholder="••••••••"
                       required
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className={`w-full py-5 sm:py-6 rounded-2xl text-white font-black text-xs sm:text-sm uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-3 ${
                  userType === 'student' ? 'bg-blue-600 hover:shadow-blue-200' : 'bg-indigo-700 hover:shadow-indigo-200'
                }`}
              >
                <span>Access Portal</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
           </form>
           
           <div className="mt-10 sm:mt-12 text-center flex flex-col space-y-4">
              <button 
                type="button"
                onClick={() => setUserType(userType === 'student' ? 'staff' : 'student')}
                className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-colors"
              >
                Switch to {userType === 'student' ? 'Faculty' : 'Student'} Login
              </button>
              <button onClick={() => navigate('/')} className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
                Back to Campus Home
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
