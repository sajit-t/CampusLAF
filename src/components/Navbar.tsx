import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ShieldCheck, LogOut, Lock, Mail, Hash, Key } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentPage,
    setPage,
    currentUser,
    activeStudent,
    login,
    register,
    logout,
    errorMsg,
    clearError
  } = useApp();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Registration Form states
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerRole, setRegisterRole] = useState<'student' | 'admin' | 'super_admin'>('student');
  const [rollNumber, setRollNumber] = useState('');
  const [adminCode, setAdminCode] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setRollNumber('');
    setAdminCode('');
    setIsRegisterMode(false);
    setSuccessMsg('');
    setRegisterRole('student');
    setAuthError('');
    clearError();
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (errorMsg) {
      setAuthError(errorMsg);
    } else {
      setAuthError('');
    }
  }, [errorMsg]);

  const handleNavClick = (page: string) => {
    // Check auth guards
    if (!currentUser && page !== 'landing') {
      setShowLoginModal(true);
      return;
    }
    setPage(page);
    setShowProfileMenu(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMsg('');

    if (isRegisterMode) {
      if (registerRole === 'student') {
        if (!rollNumber || !password) {
          setAuthError('Please enter both roll number and password.');
          return;
        }
        const success = await register({ role: 'student', rollNumber, password });
        if (success) {
          setSuccessMsg('Account registered successfully! You can now sign in.');
          setIsRegisterMode(false);
          setRollNumber('');
          setPassword('');
        }
      } else {
        if (!email || !password || !adminCode) {
          setAuthError('Please fill in email, password, and admin registration code.');
          return;
        }
        const success = await register({ role: registerRole, email, password, adminCode });
        if (success) {
          setSuccessMsg('Admin account created successfully! You can now sign in.');
          setIsRegisterMode(false);
          setEmail('');
          setPassword('');
          setAdminCode('');
        }
      }
    } else {
      if (!email || !password) {
        setAuthError('Please enter both email and password.');
        return;
      }

      const success = await login(email, password);
      if (success) {
        setShowLoginModal(false);
        resetForm();
      }
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  if (currentUser && ['admin', 'super_admin'].includes(currentUser.role)) {
    navItems.push({ id: 'admin', label: 'Admin Portal', icon: ShieldCheck });
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'py-3 px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-borderMain/50 shadow-soft' 
            : 'py-5 px-4 md:px-8 bg-transparent'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md shadow-primary/10 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <span className="text-white font-extrabold text-sm tracking-tight">CR</span>
            </div>
            <span className="font-sans font-bold text-lg tracking-tight text-textMain group-hover:text-primary transition-colors">
              Campus<span className="text-primary font-medium">Return</span>
            </span>
          </div>

          {/* Center Nav Links */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 bg-white border border-borderMain/60 px-2 py-1.5 rounded-full shadow-soft">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative px-4 py-2 rounded-full font-sans text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 ${
                      isActive ? 'text-primary' : 'text-textMuted hover:text-textMain'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav"
                        className="absolute inset-0 bg-primary-light rounded-full -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Action Controls / Profile */}
          <div className="flex items-center gap-3">
            {/* User Account / Login trigger */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pr-3 bg-white border border-borderMain rounded-full shadow-soft hover:border-primary/50 transition-colors hover:scale-102 active:scale-98"
                >
                  {activeStudent && activeStudent.profile_photo ? (
                    <img
                      src={activeStudent.profile_photo}
                      alt={activeStudent.full_name}
                      className="w-7 h-7 rounded-full object-cover border border-primary/20"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs uppercase">
                      {currentUser.role === 'super_admin' ? 'SA' : 'A'}
                    </div>
                  )}
                  <span className="text-xs font-sans font-semibold text-textMain max-w-[100px] truncate">
                    {currentUser.role === 'student' ? currentUser.name : (currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin')}
                  </span>
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-white border border-borderMain rounded-2xl shadow-premium p-3 z-50 text-left"
                    >
                      <div className="px-2 py-1.5 mb-2 border-b border-borderMain/50">
                        <div className="font-bold text-xs text-textMain">{currentUser.name}</div>
                        <div className="text-[10px] text-textMuted">{currentUser.email}</div>
                        <div className="text-[9px] mt-0.5 inline-block px-2 py-0.5 font-bold uppercase rounded-full bg-primary-light text-primary">
                          {currentUser.role.replace('_', ' ')}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium mt-1"
                      >
                        <LogOut size={14} />
                        Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => {
                  clearError();
                  setShowLoginModal(true);
                }}
                className="px-5 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold font-sans shadow-md hover:shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                Log In / Authenticate
              </button>
            )}

            {/* Mobile Nav Button */}
            {currentUser && (
              <button 
                onClick={() => handleNavClick('dashboard')}
                className="md:hidden w-9 h-9 rounded-full bg-white border border-borderMain flex items-center justify-center text-textMuted hover:text-primary hover:scale-105 transition-all"
              >
                <LayoutDashboard size={18} />
              </button>
            )}
          </div>
        </div>
      </motion.header>

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowLoginModal(false);
                resetForm();
              }}
              className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white border border-borderMain rounded-3xl p-6 md:p-8 shadow-premium text-center z-10 space-y-6"
            >
              <div className="text-left space-y-1.5">
                <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-primary-light text-primary">
                  {isRegisterMode ? 'Account Creation' : 'Identity Gateway'}
                </span>
                <h3 className="font-sans font-extrabold text-2xl text-textMain tracking-tight">
                  {isRegisterMode ? 'Register Account' : 'University Authentication'}
                </h3>
                <p className="text-xs text-textMuted">
                  {isRegisterMode
                    ? 'Register your profile to claim lost items or manage campus return reports.'
                    : 'Log in to access claim requests, student dashboards, and reporting interfaces.'}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-left text-[11px] text-red-600 font-medium">
                  {authError}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-left text-[11px] text-emerald-600 font-medium">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {isRegisterMode ? (
                  <>
                    {/* Role tabs */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-bgMain rounded-xl border border-borderMain/50">
                      <button
                        type="button"
                        onClick={() => setRegisterRole('student')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          registerRole === 'student'
                            ? 'bg-white shadow text-primary'
                            : 'text-textMuted hover:text-textMain'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterRole('admin')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          registerRole !== 'student'
                            ? 'bg-white shadow text-accent'
                            : 'text-textMuted hover:text-textMain'
                        }`}
                      >
                        Staff/Admin
                      </button>
                    </div>

                    {registerRole === 'student' ? (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-textMain uppercase tracking-wider">Student Roll Number</label>
                        <div className="relative">
                          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
                          <input
                            type="text"
                            placeholder="e.g. 984512"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-borderMain rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-textMain uppercase tracking-wider">Role</label>
                          <select
                            value={registerRole}
                            onChange={(e) => setRegisterRole(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs bg-white border border-borderMain rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="admin">Security Officer (Admin)</option>
                            <option value="super_admin">Super Administrator</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-textMain uppercase tracking-wider">College Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
                            <input
                              type="email"
                              placeholder="e.g. officer@campus.edu"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-borderMain rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textMain uppercase tracking-wider">Choose Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-borderMain rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {registerRole !== 'student' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-textMain uppercase tracking-wider">Admin Authorization Code</label>
                        <div className="relative">
                          <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
                          <input
                            type="text"
                            placeholder="Enter Code (e.g. Admin2026)"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-borderMain rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textMain uppercase tracking-wider">College Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
                        <input
                          type="email"
                          placeholder="e.g. student.name@campus.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-borderMain rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-textMain uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-borderMain rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-102 mt-2"
                >
                  {isRegisterMode ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setAuthError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {isRegisterMode
                    ? 'Already have an account? Sign in instead.'
                    : "Don't have an account? Create one now."}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
export default Navbar;
