import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Student } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Check, X, HelpCircle, FileText, Users, FileCheck, Sliders,
  Trash2, Edit, Plus, Search, Upload, Download, CheckSquare, Scan, CheckCircle, UserCheck
} from 'lucide-react';

export const predefinedLocations = [
  'Near IT Block',
  'IT Block Ground Floor',
  'IT Block First Floor',
  'Near AIML Block',
  'AIML Block Corridor',
  'CSE Block Corridor',
  'Front of Seminar Hall',
  'Behind Seminar Hall',
  'Main Auditorium Entrance',
  'Library Entrance',
  'Library Reading Hall',
  'Cafeteria',
  'College Bus Stop',
  'Parking Area',
  'Mechanical Block Corridor',
  'ECE Block First Floor',
  'EEE Block Ground Floor',
  'Administrative Office',
  'Examination Cell',
  'Placement Cell',
  'Main Gate',
  'Sports Ground',
  'Basketball Court',
  'Hostel Entrance',
  'Near Water Cooler',
  'Near Lift',
  'Staircase - CSE Block',
  'Open Courtyard'
];

export const AdminDashboardPage: React.FC = () => {
  const {
    claims,
    auditLogs,
    analytics,
    currentUser,
    setPage,
    setSelectedItemId,
    fetchClaims,
    fetchAnalytics,
    fetchAuditLogs,
    registerStudent,
    editStudent,
    deleteStudent,
    toggleStudentStatus,
    importStudents,
    fetchStudentByRoll,
    registerItem,
    approveClaim,
    rejectClaim
  } = useApp();

  const [activeView, setActiveView] = useState<'dashboard' | 'students' | 'receive' | 'claims' | 'reports' | 'logs' | 'settings'>('dashboard');

  // Student CRUD states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDept, setStudentDept] = useState('');
  const [studentYear, setStudentYear] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [studentsTotal, setStudentsTotal] = useState(0);

  // Modals
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [showImportCsv, setShowImportCsv] = useState(false);
  const [csvText, setCsvText] = useState('');
  
  // Student Form
  const [formRoll, setFormRoll] = useState('');
  const [formReg, setFormReg] = useState('');
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('Computer Science');
  const [formYear, setFormYear] = useState('I Year');
  const [formSec, setFormSec] = useState('A');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Receive Lost Item Form states
  const [receiveRoll, setReceiveRoll] = useState('');
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [lookupMessage, setLookupMessage] = useState('');
  
  const [itemCategory, setItemCategory] = useState('Electronics');
  const [itemName, setItemName] = useState('');
  const [itemBrand, setItemBrand] = useState('');
  const [itemColor, setItemColor] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemVal, setItemVal] = useState('');
  const [itemLoc, setItemLoc] = useState('');
  const [itemBldg, setItemBldg] = useState('');
  const [selectedLocOption, setSelectedLocOption] = useState('');
  const [customLoc, setCustomLoc] = useState('');
  const [itemFloor, setItemFloor] = useState('1');
  const [itemRoom, setItemRoom] = useState('');
  const [itemDate, setItemDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemTime, setItemTime] = useState('12:00');
  const [itemNotes, setItemNotes] = useState('');
  const [itemSuccessMsg, setItemSuccessMsg] = useState('');
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  // Claims process notes
  const [verificationNotes, setVerificationNotes] = useState<Record<string, string>>({});

  // Refresh students list on filters change
  useEffect(() => {
    if (activeView === 'students') {
      loadStudents();
    }
  }, [activeView, studentSearch, studentDept, studentYear, studentPage]);

  // Load analytics and claims on view mount
  useEffect(() => {
    fetchClaims();
    fetchAnalytics();
    if (currentUser?.role === 'super_admin') {
      fetchAuditLogs();
    }
  }, [activeView]);

  const loadStudents = async () => {
    try {
      const url = `/api/students?search=${encodeURIComponent(studentSearch)}&department=${studentDept}&year=${studentYear}&page=${studentPage}&limit=10`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('cr_token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudentsList(data.data);
        setStudentsTotal(data.total);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Roll Number Lookup
  const handleRollLookup = async () => {
    if (!receiveRoll.trim()) return;
    setLookupMessage('Searching database...');
    const student = await fetchStudentByRoll(receiveRoll.trim());
    if (student) {
      setFoundStudent(student);
      setLookupMessage('');
    } else {
      setFoundStudent(null);
      setLookupMessage('Student Roll Number not found. You can enter manually or scan barcode again.');
    }
  };

  // Barcode simulate scan shortcut
  const handleBarcodeSimulate = async (code: string) => {
    setReceiveRoll(code);
    setShowBarcodeModal(false);
    setLookupMessage('Scanning barcode...');
    const student = await fetchStudentByRoll(code);
    if (student) {
      setFoundStudent(student);
      setLookupMessage('');
    } else {
      setFoundStudent(null);
      setLookupMessage('Student Roll Number not found.');
    }
  };

  // Receive item submit
  const handleRegisterItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemDesc || !itemLoc) {
      alert('Please fill item name, description and location.');
      return;
    }

    const payload = {
      found_by_roll_number: foundStudent ? foundStudent.roll_number : undefined,
      category: itemCategory,
      item_name: itemName,
      brand: itemBrand,
      color: itemColor,
      description: itemDesc,
      estimated_value: parseFloat(itemVal) || 0,
      found_location: itemLoc,
      building: itemBldg,
      floor: parseInt(itemFloor) || undefined,
      room: itemRoom,
      found_date: itemDate,
      found_time: itemTime,
      notes: itemNotes
    };

    const success = await registerItem(payload, []);
    if (success) {
      setItemSuccessMsg('Item logged successfully and published to student dashboards!');
      // Reset fields
      setReceiveRoll('');
      setFoundStudent(null);
      setItemName('');
      setItemBrand('');
      setItemColor('');
      setItemDesc('');
      setItemVal('');
      setItemLoc('');
      setItemBldg('');
      setItemRoom('');
      setItemNotes('');
      setSelectedLocOption('');
      setCustomLoc('');
      setTimeout(() => setItemSuccessMsg(''), 4000);
    }
  };

  // Student Form Add Submit
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await registerStudent({
      roll_number: formRoll,
      register_number: formReg,
      full_name: formName,
      department: formDept,
      year: formYear,
      section: formSec,
      college_email: formEmail,
      phone_number: formPhone,
      profile_photo: ''
    });

    if (success) {
      setShowAddStudent(false);
      loadStudents();
      setFormRoll('');
      setFormReg('');
      setFormName('');
      setFormEmail('');
      setFormPhone('');
    }
  };

  // Edit Student modal triggers
  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setFormReg(student.register_number);
    setFormName(student.full_name);
    setFormDept(student.department);
    setFormYear(student.year);
    setFormSec(student.section);
    setFormEmail(student.college_email);
    setFormPhone(student.phone_number);
    setShowEditStudent(true);
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const success = await editStudent(editingStudent.roll_number, {
      register_number: formReg,
      full_name: formName,
      department: formDept,
      year: formYear,
      section: formSec,
      college_email: formEmail,
      phone_number: formPhone
    });

    if (success) {
      setShowEditStudent(false);
      loadStudents();
      setEditingStudent(null);
    }
  };

  // Import CSV
  const handleImportCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const msg = await importStudents(csvText);
      alert(msg);
      setShowImportCsv(false);
      setCsvText('');
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Import failed.');
    }
  };

  const pendingClaims = claims.filter(c => c.approval_status === 'pending');

  const menuList = [
    { id: 'dashboard', label: 'Dashboard', icon: Sliders },
    { id: 'students', label: 'Student Database', icon: Users },
    { id: 'receive', label: 'Receive Lost Item', icon: Plus },
    { id: 'claims', label: 'Claims Queue', icon: FileCheck, badge: pendingClaims.length },
    { id: 'reports', label: 'Analytics Reports', icon: FileText },
  ] as const;

  const superAdminMenuList = [
    ...menuList,
    { id: 'logs', label: 'System Audit Logs', icon: Shield }
  ] as const;

  const activeMenus = currentUser?.role === 'super_admin' ? superAdminMenuList : menuList;

  return (
    <div className="min-h-screen flex pt-16 bg-[#FFF8F9]">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-borderMain/60 py-6 px-4 shrink-0 justify-between select-none">
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-2 bg-bgMain rounded-xl border border-borderMain/50">
            <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold">
              <Shield size={18} />
            </div>
            <div className="text-left overflow-hidden">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-light text-primary leading-tight inline-block">
                {currentUser?.role.replace('_', ' ')}
              </span>
              <p className="font-sans font-bold text-xs text-textMain truncate leading-tight mt-1">
                {currentUser?.name}
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {activeMenus.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-light text-primary font-bold'
                      : 'text-textMuted hover:text-textMain hover:bg-bgMain'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-primary' : 'text-textMuted'} />
                    <span>{item.label}</span>
                  </div>
                  {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-primary text-white' : 'bg-borderMain text-textMuted'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-borderMain/50 pt-4 text-[10px] text-textMuted text-left font-medium">
          <span>Clearance Code: <strong>{currentUser?.role === 'super_admin' ? 'LVL-03' : 'LVL-02'}</strong></span>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-textMain tracking-tight">
              Safety Office Management
            </h2>
            <p className="text-xs text-textMuted mt-1">
              Currently processing: {activeView.toUpperCase()} Portal clearances.
            </p>
          </div>

          <button
            onClick={() => setPage('dashboard')}
            className="px-4 py-2 bg-white border border-borderMain hover:bg-bgMain text-textMain text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            Go to Student View
          </button>
        </div>

        {/* VIEW ROUTING */}
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && analytics && (
            <motion.div key="db-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Students', val: analytics.metrics.totalStudents, desc: 'Registered in database' },
                  { label: 'Items in Office', val: analytics.metrics.waitingForOwner, desc: 'Waiting for owners' },
                  { label: 'Pending Claims', val: analytics.metrics.claimRequested, desc: 'Under validation review' },
                  { label: 'Today Collections', val: analytics.metrics.todayCollections, desc: 'Collected items today' }
                ].map(stat => (
                  <div key={stat.label} className="bg-white p-5 border border-borderMain/60 rounded-2xl shadow-soft text-left">
                    <p className="text-[10px] text-textMuted uppercase font-bold tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-extrabold text-textMain mt-1.5">{stat.val}</p>
                    <p className="text-[10px] text-textMuted mt-1">{stat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Grid charts/lists */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
                {/* Category statistics */}
                <div className="md:col-span-6 bg-white border border-borderMain rounded-2xl p-6 shadow-soft space-y-4">
                  <h4 className="font-sans font-bold text-sm text-textMain">Catalog Categories Distribution</h4>
                  <div className="space-y-3.5">
                    {analytics.itemsByCategory.map((cat: any) => (
                      <div key={cat.category} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>{cat.category}</span>
                          <span>{cat.count} items</span>
                        </div>
                        <div className="w-full h-1.5 bg-bgMain border border-borderMain rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (cat.count / 20) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                    {analytics.itemsByCategory.length === 0 && (
                      <div className="text-center text-xs text-textMuted py-8">No category stats.</div>
                    )}
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="md:col-span-6 bg-white border border-borderMain rounded-2xl p-6 shadow-soft space-y-4">
                  <h4 className="font-sans font-bold text-sm text-textMain">Recent Audit Log & Activities Feed</h4>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {analytics.activityFeed.map((act: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start text-xs border-b border-borderMain/50 pb-3 last:border-0">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.type === 'item' ? 'bg-primary' : 'bg-amber-400'}`} />
                        <div className="space-y-0.5">
                          <p className="text-textMain font-semibold leading-snug">{act.action}</p>
                          <p className="text-[10px] text-textMuted flex gap-3">
                            <span>{act.location}</span>
                            <span>•</span>
                            <span>{new Date(act.time).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                    {analytics.activityFeed.length === 0 && (
                      <div className="text-center text-xs text-textMuted py-8">No recent activity logged.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'students' && (
            <motion.div key="students-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="font-sans font-bold text-base text-textMain">Student Records manager</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Student
                  </button>
                  <button
                    onClick={() => setShowImportCsv(true)}
                    className="px-4 py-2 bg-white border border-borderMain hover:border-primary text-textMain hover:text-primary text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
                  >
                    <Upload size={14} /> CSV Import
                  </button>
                  <a
                    href="/api/students/export"
                    download
                    className="px-4 py-2 bg-white border border-borderMain hover:border-primary text-textMain hover:text-primary text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
                  >
                    <Download size={14} /> CSV Export
                  </a>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={12} />
                  <input
                    type="text"
                    placeholder="Search by Name/Roll/Reg..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-borderMain rounded-xl"
                  />
                </div>
                <select
                  value={studentDept}
                  onChange={(e) => setStudentDept(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-borderMain rounded-xl"
                >
                  <option value="">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electrical & Electronics">Electrical & Electronics</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Biotechnology">Biotechnology</option>
                  <option value="Physics">Physics</option>
                </select>
                <select
                  value={studentYear}
                  onChange={(e) => setStudentYear(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-borderMain rounded-xl"
                >
                  <option value="">All Years</option>
                  <option value="I Year">I Year</option>
                  <option value="II Year">II Year</option>
                  <option value="III Year">III Year</option>
                  <option value="IV Year">IV Year</option>
                </select>
                <div className="text-xs text-textMuted flex items-center justify-end font-semibold">
                  Total: {studentsTotal} records
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-borderMain rounded-2xl overflow-hidden shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-bgMain border-b border-borderMain text-textMuted font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Roll Number</th>
                        <th className="p-4">Full Name</th>
                        <th className="p-4">Department / Year</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderMain/50">
                      {studentsList.map(student => (
                        <tr key={student.roll_number} className="hover:bg-bgMain/30 transition-colors">
                          <td className="p-4 font-mono font-bold">{student.roll_number}</td>
                          <td className="p-4">
                            <div className="font-bold text-textMain">{student.full_name}</div>
                            <div className="text-[10px] text-textMuted">Reg: {student.register_number}</div>
                          </td>
                          <td className="p-4">
                            <div>{student.department}</div>
                            <div className="text-[10px] text-textMuted">{student.year} (Sec {student.section})</div>
                          </td>
                          <td className="p-4 text-textMuted">{student.college_email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              student.active_status ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                            }`}>
                              {student.active_status ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5">
                            <button
                              onClick={() => handleEditClick(student)}
                              className="p-1 text-primary hover:bg-primary-light rounded transition-colors"
                              title="Edit Details"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                await toggleStudentStatus(student.roll_number, !student.active_status);
                                loadStudents();
                              }}
                              className={`p-1 rounded transition-colors ${
                                student.active_status ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'
                              }`}
                              title={student.active_status ? 'Disable Account' : 'Enable Account'}
                            >
                              <CheckSquare size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this student permanently?')) {
                                  await deleteStudent(student.roll_number);
                                  loadStudents();
                                }
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {studentsList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-textMuted">
                            No student records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-borderMain bg-bgMain/30 flex justify-between items-center text-xs">
                  <span className="text-textMuted font-medium">
                    Showing Page {studentPage} of {Math.ceil(studentsTotal / 10) || 1}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={studentPage === 1}
                      onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-white border border-borderMain rounded-lg font-bold text-textMain disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      disabled={studentPage * 10 >= studentsTotal}
                      onClick={() => setStudentPage(p => p + 1)}
                      className="px-3 py-1.5 bg-white border border-borderMain rounded-lg font-bold text-textMain disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'receive' && (
            <motion.div key="receive-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left max-w-3xl">
              <h3 className="font-sans font-bold text-base text-textMain">Register Newly Found Item</h3>

              {itemSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span>{itemSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterItemSubmit} className="space-y-6 bg-white border border-borderMain rounded-3xl p-6 md:p-8 shadow-soft">
                {/* STEP 1: ROLL NUMBER ENTRY & LOOKUP */}
                <div className="space-y-3.5 pb-6 border-b border-borderMain/50">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-textMain uppercase tracking-wider">
                      Step 1: Found By Student (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowBarcodeModal(true)}
                      className="text-[10px] px-2.5 py-1 bg-primary-light hover:bg-primary text-primary hover:text-white rounded-lg transition-colors flex items-center gap-1 font-bold shadow-sm"
                    >
                      <Scan size={10} /> Scan Barcode ID
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 6-digit Student Roll Number (e.g. 984512)..."
                      value={receiveRoll}
                      onChange={(e) => setReceiveRoll(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleRollLookup}
                      className="px-4 py-2.5 bg-white border border-borderMain hover:border-primary text-textMain hover:text-primary text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      Lookup
                    </button>
                  </div>

                  {lookupMessage && <p className="text-[10px] text-amber-600 font-medium">{lookupMessage}</p>}

                  {foundStudent && (
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-3">
                      <UserCheck size={16} className="text-emerald-600 shrink-0" />
                      <div className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
                        Found By: <strong className="text-textMain">{foundStudent.full_name}</strong> | Dept: {foundStudent.department} | Year: {foundStudent.year}
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 2: ITEM LOG PARAMETERS */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-textMuted uppercase tracking-wider block">
                    Step 2: Enter Item Parameters
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Item Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Item Name *</label>
                      <input
                        type="text"
                        placeholder='e.g. Space Gray MacBook Pro 14"'
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Category *</label>
                      <select
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Personal Items">Personal Items</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Keys">Keys</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Brand */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Brand</label>
                      <input
                        type="text"
                        placeholder="e.g. Apple, Hydro Flask"
                        value={itemBrand}
                        onChange={(e) => setItemBrand(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Color */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Color</label>
                      <input
                        type="text"
                        placeholder="e.g. Space Gray, Oat"
                        value={itemColor}
                        onChange={(e) => setItemColor(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Found Location Dropdown / Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Found Location *</label>
                      <select
                        value={selectedLocOption}
                        onChange={(e) => {
                          setSelectedLocOption(e.target.value);
                          if (e.target.value !== 'Other') {
                            setItemLoc(e.target.value);
                          } else {
                            setItemLoc('');
                          }
                        }}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      >
                        <option value="" disabled>Select predefined location...</option>
                        {predefinedLocations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                        <option value="Other">Other (Specify Custom Location)</option>
                      </select>
                      
                      {selectedLocOption === 'Other' && (
                        <div className="mt-2 space-y-1">
                          <label className="text-[9px] font-bold text-textMuted uppercase tracking-wider">Specify Custom Location *</label>
                          <input
                            type="text"
                            placeholder="e.g. Near chemistry lab entrance"
                            value={customLoc}
                            onChange={(e) => {
                              setCustomLoc(e.target.value);
                              setItemLoc(e.target.value);
                            }}
                            className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Building */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Building</label>
                      <input
                        type="text"
                        placeholder="e.g. Science Block, Gym"
                        value={itemBldg}
                        onChange={(e) => setItemBldg(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Floor / Room */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Floor</label>
                        <input
                          type="number"
                          placeholder="e.g. 3"
                          value={itemFloor}
                          onChange={(e) => setItemFloor(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Room</label>
                        <input
                          type="text"
                          placeholder="e.g. Study Area B"
                          value={itemRoom}
                          onChange={(e) => setItemRoom(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Date / Time */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Date *</label>
                        <input
                          type="date"
                          value={itemDate}
                          onChange={(e) => setItemDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Time</label>
                        <input
                          type="time"
                          value={itemTime}
                          onChange={(e) => setItemTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Estimated Value */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Estimated Value ($)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={itemVal}
                        onChange={(e) => setItemVal(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Description *</label>
                    <textarea
                      rows={3}
                      placeholder="Describe unique identifiers, stickers, cases, dents, serial numbers, etc."
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      required
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-textMain uppercase tracking-wider">Office Notes (Internal)</label>
                    <input
                      type="text"
                      placeholder="e.g. Turned in to Library front desk."
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-md"
                  >
                    Save & Publish Item
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeView === 'claims' && (
            <motion.div key="claims-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
              <h3 className="font-sans font-bold text-base text-textMain">Pending Claims approvals queue</h3>

              <div className="space-y-6">
                {pendingClaims.map(claim => {
                  const item = claim.lost_items;
                  if (!item) return null;

                  return (
                    <div
                      key={claim.id}
                      className="bg-white border border-borderMain rounded-3xl p-6 shadow-soft space-y-6 flex flex-col justify-between"
                    >
                      {/* Claimant and Item Headers */}
                      <div className="flex justify-between items-start border-b border-borderMain/50 pb-4 flex-wrap gap-4">
                        <div className="text-left space-y-1">
                          <span className="text-[9px] font-bold text-accent uppercase bg-accent-light px-2.5 py-1 rounded-full">
                            Claim ID: {claim.id}
                          </span>
                          <h4 className="font-sans font-bold text-base text-textMain mt-2">
                            Claim for:{' '}
                            <span
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setPage('item-details');
                              }}
                              className="text-primary hover:underline cursor-pointer font-extrabold"
                            >
                              {item.item_name}
                            </span>
                          </h4>
                          <p className="text-xs text-textMuted">Location: {item.found_location} | Category: {item.category}</p>
                          <p className="text-[10px] text-textMuted">
                            Submitted Date: {new Date(claim.claim_request_date).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-red-500 font-semibold">
                            Collection Deadline: {new Date(claim.expected_collection_deadline).toLocaleString()} (2 working days limit)
                          </p>
                        </div>

                        <div className="text-left text-xs bg-bgMain p-4 border border-borderMain rounded-xl space-y-1 shadow-sm">
                          <span className="text-textMuted block font-bold uppercase tracking-wider text-[9px]">Claimant student</span>
                          <span className="font-bold text-textMain block">{claim.claimant_roll_number}</span>
                          <span className="text-[10px] text-textMuted block">Fetched automatically from student database.</span>
                        </div>
                      </div>

                      {/* Verification responses */}
                      <div className="space-y-3.5 text-xs">
                        <h5 className="font-bold text-textMain flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-primary">
                          <HelpCircle size={14} />
                          <span>Submitted Verification Answers</span>
                        </h5>

                        <div className="bg-[#FFF8F9] p-4 rounded-xl border border-borderMain/60 italic text-textMuted leading-relaxed">
                          "{claim.remarks}"
                        </div>
                      </div>

                      {/* Verification notes input */}
                      <div className="space-y-2 text-xs">
                        <label className="font-bold text-textMain uppercase tracking-wider text-[10px]">Office Verification Notes *</label>
                        <input
                          type="text"
                          placeholder="e.g. Student presented physical ID, verified descriptions of markings."
                          value={verificationNotes[claim.id] || ''}
                          onChange={(e) => setVerificationNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                          className="w-full px-4 py-2.5 text-xs bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={async () => {
                            const notes = verificationNotes[claim.id] || 'Manually verified in office.';
                            await approveClaim(claim.id, notes);
                          }}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                        >
                          <Check size={14} strokeWidth={3} />
                          Approve & Issue Release Code
                        </button>
                        <button
                          onClick={async () => {
                            const reason = prompt('Please enter rejection reason:');
                            if (reason !== null) {
                              await rejectClaim(claim.id, reason);
                            }
                          }}
                          className="px-5 py-2.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <X size={14} strokeWidth={3} />
                          Reject Claim
                        </button>
                      </div>
                    </div>
                  );
                })}
                {pendingClaims.length === 0 && (
                  <div className="py-20 bg-white border border-borderMain/60 rounded-2xl text-center text-xs text-textMuted font-bold">
                    All claim queues cleared! Good job.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'reports' && (
            <motion.div key="reports-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
              <h3 className="font-sans font-bold text-base text-textMain">Safety Office Analytics Reports</h3>
              
              <div className="bg-white border border-borderMain rounded-3xl p-6 shadow-soft space-y-6 max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-sans font-extrabold text-sm text-textMain">Compile Retrieval Reports</h4>
                    <p className="text-[11px] text-textMuted">Generate daily, weekly, or monthly CSV reports containing logs of all actions.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['Daily Report', 'Weekly Report', 'Monthly Report'].map(rep => (
                    <button
                      key={rep}
                      onClick={() => {
                        // Generate mock triggers, redirect to export
                        alert(`Generating ${rep}... downloading will start shortly.`);
                        window.open('/api/students/export', '_blank');
                      }}
                      className="py-3 px-4 bg-bgMain hover:bg-primary-light border border-borderMain hover:border-primary/40 rounded-xl text-xs font-bold text-textMain hover:text-primary transition-all text-center flex flex-col items-center justify-center gap-1"
                    >
                      <Download size={16} />
                      <span>{rep}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'logs' && currentUser?.role === 'super_admin' && (
            <motion.div key="logs-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
              <h3 className="font-sans font-bold text-base text-textMain">Super-Admin System Audit Logs</h3>

              <div className="bg-white border border-borderMain rounded-2xl overflow-hidden shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-bgMain border-b border-borderMain text-textMuted font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Performed By</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">Record Table (ID)</th>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderMain/50">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-bgMain/30 transition-colors">
                          <td className="p-4 font-bold text-textMain">
                            {log.profiles ? log.profiles.email : 'SYSTEM'}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[10px]">
                            {log.affected_record_table} ({log.affected_record_id.slice(0, 8)}...)
                          </td>
                          <td className="p-4 text-textMuted">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="p-4 text-textMuted max-w-xs truncate" title={JSON.stringify(log.details)}>
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-textMuted">No audit logs recorded in database.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'settings' && (
            <motion.div key="settings-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
              <h3 className="font-sans font-bold text-lg text-textMain font-bold">Portal Settings</h3>
              <div className="bg-white border border-borderMain rounded-2xl p-6 shadow-soft">
                <p className="text-xs text-textMuted">Standard settings controls inside safety offices portal.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* BARCODE MODAL SIMULATOR */}
      <AnimatePresence>
        {showBarcodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBarcodeModal(false)}
              className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white border border-borderMain rounded-3xl p-6 shadow-premium z-10 space-y-4 text-left"
            >
              <div>
                <h4 className="font-sans font-extrabold text-sm text-textMain uppercase tracking-wider flex items-center gap-1.5">
                  <Scan size={14} className="text-primary" />
                  <span>Barcode ID Card Scanner Simulator</span>
                </h4>
                <p className="text-[11px] text-textMuted mt-1">
                  Click a student below to simulate swiping their barcode card through the scanner.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {[
                  { name: 'Sajit Kumar', code: '984512', dept: 'CS' },
                  { name: 'Sarah Chen', code: '887213', dept: 'IT' },
                  { name: 'Marcus Miller', code: '445123', dept: 'Mech' }
                ].map(sim => (
                  <button
                    key={sim.code}
                    onClick={() => handleBarcodeSimulate(sim.code)}
                    className="p-3 bg-bgMain border border-borderMain hover:border-primary/50 hover:bg-primary-light/10 rounded-xl text-xs text-textMain font-bold transition-all text-left flex justify-between items-center"
                  >
                    <div>
                      <div>{sim.name}</div>
                      <div className="text-[10px] text-textMuted font-medium">Dept: {sim.dept}</div>
                    </div>
                    <span className="font-mono text-primary text-[10px]">Code: {sim.code}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD STUDENT MODAL */}
      <AnimatePresence>
        {showAddStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddStudent(false)}
              className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white border border-borderMain rounded-3xl p-6 shadow-premium z-10 text-left space-y-6"
            >
              <h3 className="font-sans font-extrabold text-lg text-textMain">Add Student Record</h3>

              <form onSubmit={handleAddStudentSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-textMain">Roll Number *</label>
                    <input
                      type="text"
                      value={formRoll}
                      onChange={(e) => setFormRoll(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-textMain">Register Number *</label>
                    <input
                      type="text"
                      value={formReg}
                      onChange={(e) => setFormReg(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="font-bold text-textMain">Full Name *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-textMain">Department *</label>
                    <select
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electrical & Electronics">Electrical & Electronics</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Business Administration">Business Administration</option>
                      <option value="Biotechnology">Biotechnology</option>
                      <option value="Physics">Physics</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-textMain">Year</label>
                      <select
                        value={formYear}
                        onChange={(e) => setFormYear(e.target.value)}
                        className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      >
                        <option value="I Year">I Year</option>
                        <option value="II Year">II Year</option>
                        <option value="III Year">III Year</option>
                        <option value="IV Year">IV Year</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-textMain">Sec</label>
                      <input
                        type="text"
                        value={formSec}
                        onChange={(e) => setFormSec(e.target.value)}
                        className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-textMain">Email *</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-textMain">Phone *</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl"
                  >
                    Add student
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddStudent(false)}
                    className="px-5 py-2.5 bg-white border border-borderMain rounded-xl text-textMain"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT STUDENT MODAL */}
      <AnimatePresence>
        {showEditStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditStudent(false)}
              className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white border border-borderMain rounded-3xl p-6 shadow-premium z-10 text-left space-y-6"
            >
              <h3 className="font-sans font-extrabold text-lg text-textMain">Edit Student details</h3>

              <form onSubmit={handleEditStudentSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-textMuted">Roll Number (Permanent)</label>
                    <input
                      type="text"
                      value={editingStudent?.roll_number || ''}
                      className="w-full px-3 py-2 bg-neutral-100 border border-borderMain rounded-xl cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-textMain">Register Number *</label>
                    <input
                      type="text"
                      value={formReg}
                      onChange={(e) => setFormReg(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="font-bold text-textMain">Full Name *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-textMain">Department *</label>
                    <select
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electrical & Electronics">Electrical & Electronics</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Business Administration">Business Administration</option>
                      <option value="Biotechnology">Biotechnology</option>
                      <option value="Physics">Physics</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-textMain">Year</label>
                      <select
                        value={formYear}
                        onChange={(e) => setFormYear(e.target.value)}
                        className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      >
                        <option value="I Year">I Year</option>
                        <option value="II Year">II Year</option>
                        <option value="III Year">III Year</option>
                        <option value="IV Year">IV Year</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-textMain">Sec</label>
                      <input
                        type="text"
                        value={formSec}
                        onChange={(e) => setFormSec(e.target.value)}
                        className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-textMain">Email *</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-textMain">Phone *</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditStudent(false)}
                    className="px-5 py-2.5 bg-white border border-borderMain rounded-xl text-textMain"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV IMPORT MODAL */}
      <AnimatePresence>
        {showImportCsv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImportCsv(false)}
              className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white border border-borderMain rounded-3xl p-6 shadow-premium z-10 text-left space-y-4"
            >
              <h3 className="font-sans font-extrabold text-lg text-textMain">CSV Import Student Records</h3>

              <div className="p-3 bg-bgMain border border-borderMain rounded-xl text-[10px] text-textMuted leading-relaxed space-y-1">
                <span className="font-bold text-textMain block uppercase tracking-wider">CSV Data Format</span>
                <code>Roll Number, Register Number, Name, Department, Year, Section, Email, Phone</code>
                <span className="block mt-1 font-medium">Password for all imported records will default to <code>Password123</code>.</span>
              </div>

              <form onSubmit={handleImportCsvSubmit} className="space-y-4 text-xs">
                <textarea
                  rows={8}
                  placeholder='e.g.&#10;505050, 20260505050, Alex Rivers, Computer Science, III Year, A, arivers@campus.edu, 9876543232'
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full px-3 py-2 bg-bgMain border border-borderMain rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[10px] resize-none"
                  required
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl"
                  >
                    Start Import
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportCsv(false)}
                    className="px-5 py-2.5 bg-white border border-borderMain rounded-xl text-textMain"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AdminDashboardPage;
