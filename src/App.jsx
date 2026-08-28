import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { 
  Search, ShieldAlert, CheckCircle, XCircle, RefreshCw, LogOut, 
  FileSpreadsheet, Eye, Lock, ToggleLeft, ToggleRight, LayoutDashboard, 
  Users, CreditCard, GraduationCap, Settings, Filter, X, Menu, BarChart3, Clock
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [students, setStudents] = useState([]);
  const [isRegOpen, setIsRegOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Active Tab Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'applications' | 'payments' | 'results' | 'settings'

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGrade, setActiveGrade] = useState(9);
  const [activeStream, setActiveStream] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rejectingStudent, setRejectingStudent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const ADMIN_PASSWORD = '1234';

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
      setLoginError('');
      fetchData();
    } else {
      setLoginError('Invalid password!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
  };

  async function fetchData() {
    setLoading(true);
    try {
      const { data: studentData, error: stError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (stError) console.error('Student Fetch Error:', stError);
      if (studentData) setStudents(studentData);

      const { data: config, error: cfgError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'is_registration_open')
        .maybeSingle();
        
      if (cfgError) console.error('Settings Fetch Error:', cfgError);
      if (config) setIsRegOpen(config.value === 'true');
    } catch (err) {
      console.error('Catch Error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Fully Functional Supabase Registration Toggle
  async function toggleRegistration() {
    const nextState = !isRegOpen;
    setIsRegOpen(nextState); // Immediate UI update
    
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'is_registration_open', value: String(nextState) });

    if (error) {
      console.error('Failed to update registration status:', error);
      setIsRegOpen(!nextState); // Rollback on failure
    }
  }

  async function updateStatus(id, newStatus, reason = '') {
    const updateData = { status: newStatus };
    if (reason) updateData.rejection_reason = reason;

    const { error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      setStudents(students.map(s => s.id === id ? { ...s, status: newStatus, rejection_reason: reason } : s));
      setRejectingStudent(null);
      setSelectedStudent(null);
      setRejectionReason('');
    }
  }

  async function updatePaymentStatus(id, payStatus) {
    const { error } = await supabase
      .from('students')
      .update({ payment_status: payStatus })
      .eq('id', id);

    if (!error) {
      setStudents(students.map(s => s.id === id ? { ...s, payment_status: payStatus } : s));
    }
  }

  const exportToCSV = () => {
    const headers = ["Full Name", "Faida ID", "Grade", "Stream", "Mother Phone", "Status", "Created At"];
    const rows = filteredStudents.map(s => [
      `"${s.full_name}"`,
      `"${s.faida_number}"`,
      s.grade_level,
      `"${s.stream || 'N/A'}"`,
      `"${s.mother_phone}"`,
      s.status,
      `"${new Date(s.created_at).toLocaleDateString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Students_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredStudents = students.filter(student => {
    const matchesGrade = Number(student.grade_level) === Number(activeGrade);
    const matchesStream = (activeGrade < 11 || activeStream === 'ALL') 
      ? true 
      : student.stream === activeStream;
    const matchesSearch = 
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.faida_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.mother_phone?.includes(searchQuery);

    return matchesGrade && matchesStream && matchesSearch;
  });

  // KPI Calculations
  const totalApps = students.length;
  const pendingApps = students.filter(s => s.status === 'pending').length;
  const approvedApps = students.filter(s => s.status === 'approved').length;
  const rejectedApps = students.filter(s => s.status === 'rejected').length;

  const getPendingCount = (grade) => {
    return students.filter(s => Number(s.grade_level) === grade && s.status === 'pending').length;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-slate-100">
          <div className="text-center mb-6">
            <div className="bg-blue-600/20 p-4 rounded-full inline-block mb-3 border border-blue-500/30">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Authentication</h1>
            <p className="text-sm text-slate-400 mt-1">Enter password to access dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Access Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            {loginError && <p className="text-red-400 text-xs font-semibold">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard & Analytics', icon: BarChart3 },
    { id: 'applications', label: 'Applications', icon: Users, badge: pendingApps },
    { id: 'payments', label: 'Payment Verifications', icon: CreditCard },
    { id: 'results', label: 'Academic Results', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between hidden md:flex min-h-screen">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">School Admin</h2>
              <span className="text-xs text-slate-400">Portal v2.0</span>
            </div>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden flex">
          <div className="w-72 bg-slate-900 h-full p-5 flex flex-col justify-between border-r border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base leading-tight">School Admin</h2>
                    <span className="text-xs text-slate-400">Portal v2.0</span>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition text-sm font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-10 gap-2">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, Faida ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Working Functional Registration Toggle Button */}
            <button
              onClick={toggleRegistration}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-semibold border transition shadow-sm ${
                isRegOpen 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              {isRegOpen ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-rose-400" />}
              <span className="hidden sm:inline">Registration:</span> {isRegOpen ? 'OPEN' : 'CLOSED'}
            </button>

            <button 
              onClick={fetchData} 
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* TAB 1: DASHBOARD & ANALYTICS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Dashboard & Analytics</h1>
                <p className="text-xs text-slate-400">Overview of registration metrics and application counts</p>
              </div>

              {/* KPI Analytics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Total Applications</p>
                    <h3 className="text-2xl font-bold text-slate-100 mt-1">{totalApps}</h3>
                  </div>
                  <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Pending Approvals</p>
                    <h3 className="text-2xl font-bold text-amber-400 mt-1">{pendingApps}</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Approved Students</p>
                    <h3 className="text-2xl font-bold text-emerald-400 mt-1">{approvedApps}</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Rejected Applications</p>
                    <h3 className="text-2xl font-bold text-rose-400 mt-1">{rejectedApps}</h3>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Student Applications</h1>
                  <p className="text-xs text-slate-400">Filter, review, approve or reject student registrations</p>
                </div>

                <button
                  onClick={exportToCSV}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-medium transition w-full md:w-auto"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export CSV
                </button>
              </div>

              {/* Grade Tabs */}
              <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                {[9, 10, 11, 12].map((grade) => {
                  const pendingCount = getPendingCount(grade);
                  return (
                    <button
                      key={grade}
                      onClick={() => { setActiveGrade(grade); setActiveStream('ALL'); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition ${
                        activeGrade === grade 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Grade {grade}
                      {pendingCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stream Filter */}
              {activeGrade >= 11 && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl w-full sm:w-fit overflow-x-auto">
                  <Filter className="w-4 h-4 text-slate-400 ml-2" />
                  <span className="text-xs text-slate-400 mr-2">Stream:</span>
                  {['ALL', 'Natural Science', 'Social Science'].map((stream) => (
                    <button
                      key={stream}
                      onClick={() => setActiveStream(stream)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                        activeStream === stream
                          ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {stream}
                    </button>
                  ))}
                </div>
              )}

              {/* Applications Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                  <div className="p-12 text-center text-slate-500 text-sm">Loading applications...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-sm">No applications found for Grade {activeGrade}.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                          <th className="p-4">Student Name</th>
                          <th className="p-4">Faida ID</th>
                          <th className="p-4">Grade & Stream</th>
                          <th className="p-4">Mother Phone</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {filteredStudents.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-800/30 transition">
                            <td className="p-4 font-semibold text-slate-100">{st.full_name}</td>
                            <td className="p-4 font-mono text-slate-400">{st.faida_number}</td>
                            <td className="p-4">Grade {st.grade_level} {st.stream ? `(${st.stream})` : ''}</td>
                            <td className="p-4 font-mono text-slate-400">{st.mother_phone}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                st.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                st.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                                'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              }`}>
                                {st.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center items-center gap-2">
                                <button
                                  onClick={() => setSelectedStudent(st)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 rounded-lg transition"
                                  title="View Documents"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateStatus(st.id, 'approved')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1 transition text-[11px]"
                                >
                                  <CheckCircle className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectingStudent(st)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-1 transition text-[11px]"
                                >
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT VERIFICATIONS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Payment Verifications</h1>
                <p className="text-xs text-slate-400">Review submitted bank payment receipts and status</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Faida ID</th>
                        <th className="p-4">Receipt Image</th>
                        <th className="p-4">Payment Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {students.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-4 font-semibold text-slate-100">{st.full_name}</td>
                          <td className="p-4 font-mono text-slate-400">{st.faida_number}</td>
                          <td className="p-4">
                            {st.receipt_photo_url ? (
                              <a href={st.receipt_photo_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                <Eye className="w-3 h-3" /> View Receipt
                              </a>
                            ) : (
                              <span className="text-slate-500">Not Uploaded</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              st.payment_status === 'verified' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                              st.payment_status === 'expired' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                              'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}>
                              {st.payment_status || 'pending'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => updatePaymentStatus(st.id, 'verified')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold"
                              >
                                Mark Verified
                              </button>
                              <button
                                onClick={() => updatePaymentStatus(st.id, 'expired')}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-semibold"
                              >
                                Mark Expired
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACADEMIC RESULTS */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Academic Results & Report Cards</h1>
                <p className="text-xs text-slate-400">Verify report card images provided by applicants</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((st) => (
                  <div key={st.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-slate-100 text-sm">{st.full_name}</h4>
                        <p className="text-xs text-slate-400">Grade {st.grade_level} {st.stream ? `(${st.stream})` : ''}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{st.faida_number}</span>
                    </div>

                    <div className="h-40 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                      {st.card_photo_url ? (
                        <img src={st.card_photo_url} alt="Report Card" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-600">No Image</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-xl font-bold tracking-tight">System Settings</h1>
                <p className="text-xs text-slate-400">Manage school portal configurations and open/close controls</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100">Portal Registration Toggle</h3>
                    <p className="text-xs text-slate-400">Control whether students can submit applications via Telegram Bot</p>
                  </div>

                  <button
                    onClick={toggleRegistration}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      isRegOpen 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {isRegOpen ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    {isRegOpen ? 'Registration is OPEN' : 'Registration is CLOSED'}
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-slate-100 mb-1">Database Connection Status</h3>
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Supabase Database Connected
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Document View Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{selectedStudent.full_name}</h3>
                <p className="text-xs text-slate-400">Faida ID: {selectedStudent.faida_number} | Phone: {selectedStudent.mother_phone}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-1 text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center space-y-2">
                <p className="text-xs font-semibold text-slate-400">Faida ID Card</p>
                {selectedStudent.faida_photo_url ? (
                  <img src={selectedStudent.faida_photo_url} alt="Faida Card" className="w-full h-48 object-cover rounded-lg border border-slate-800" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-600">No Image</div>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center space-y-2">
                <p className="text-xs font-semibold text-slate-400">Report Card</p>
                {selectedStudent.card_photo_url ? (
                  <img src={selectedStudent.card_photo_url} alt="Report Card" className="w-full h-48 object-cover rounded-lg border border-slate-800" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-600">No Image</div>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center space-y-2">
                <p className="text-xs font-semibold text-slate-400">Payment Receipt</p>
                {selectedStudent.receipt_photo_url ? (
                  <img src={selectedStudent.receipt_photo_url} alt="Receipt" className="w-full h-48 object-cover rounded-lg border border-slate-800" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-600">No Receipt Uploaded</div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => updateStatus(selectedStudent.id, 'rejected')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                Reject Application
              </button>
              <button
                onClick={() => updateStatus(selectedStudent.id, 'approved')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
              >
                Approve Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-md font-bold text-slate-100">Reject Application</h3>
            <p className="text-xs text-slate-400">Specify reason for rejecting {rejectingStudent.full_name}:</p>

            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-3 text-xs focus:outline-none"
            >
              <option value="">-- Select Reason --</option>
              <option value="Blurred/Unreadable Report Card">Blurred/Unreadable Report Card</option>
              <option value="Invalid Faida ID Document">Invalid Faida ID Document</option>
              <option value="Payment Receipt Missing or Incorrect">Payment Receipt Missing or Incorrect</option>
              <option value="Selected Grade/Stream Does Not Match Document">Selected Grade/Stream Does Not Match Document</option>
            </select>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingStudent(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus(rejectingStudent.id, 'rejected', rejectionReason || 'Requirements not met')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
