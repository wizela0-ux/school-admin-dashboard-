import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { 
  Search, ShieldAlert, CheckCircle, XCircle, RefreshCw, LogOut, 
  FileSpreadsheet, Eye, Lock, ToggleLeft, ToggleRight, LayoutDashboard, 
  Users, Settings, Filter, X
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [students, setStudents] = useState([]);
  const [isRegOpen, setIsRegOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGrade, setActiveGrade] = useState(9);
  const [activeStream, setActiveStream] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null); // Modal detail
  const [rejectingStudent, setRejectingStudent] = useState(null); // Reject modal
  const [rejectionReason, setRejectionReason] = useState('');

  const ADMIN_PASSWORD = '1234'; // Change your password here

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

  async function toggleRegistration() {
    const nextState = !isRegOpen;
    const { error } = await supabase
      .from('settings')
      .update({ value: String(nextState) })
      .eq('key', 'is_registration_open');

    if (!error) setIsRegOpen(nextState);
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

  // Export to CSV Function
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
    link.setAttribute("download", `Students_Grade_${activeGrade}.csv`);
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
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            {loginError && <p className="text-red-400 text-xs font-semibold">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition duration-200 shadow-lg shadow-blue-600/20"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between hidden md:flex">
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
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 font-medium text-sm">
              <Users className="w-4 h-4" /> Applications
            </button>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, Faida ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleRegistration}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isRegOpen 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {isRegOpen ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              Registration: {isRegOpen ? 'OPEN' : 'CLOSED'}
            </button>

            <button 
              onClick={fetchData} 
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Header Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Student Applications</h1>
              <p className="text-xs text-slate-400">Review and verify student registrations and documents</p>
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-medium transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export CSV
            </button>
          </div>

          {/* Grade Selector Tabs */}
          <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            {[9, 10, 11, 12].map((grade) => {
              const pendingCount = getPendingCount(grade);
              return (
                <button
                  key={grade}
                  onClick={() => { setActiveGrade(grade); setActiveStream('ALL'); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    activeGrade === grade 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
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

          {/* Stream Filter for Grade 11 and 12 */}
          {activeGrade >= 11 && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl w-fit">
              <Filter className="w-4 h-4 text-slate-400 ml-2" />
              <span className="text-xs text-slate-400 mr-2">Stream:</span>
              {['ALL', 'Natural Science', 'Social Science'].map((stream) => (
                <button
                  key={stream}
                  onClick={() => setActiveStream(stream)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
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

          {/* Applications Data Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading applications...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No applications found for this selection.</div>
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
                        <td className="p-4">
                          Grade {st.grade_level} {st.stream ? `(${st.stream})` : ''}
                        </td>
                        <td className="p-4 font-mono text-slate-400">{st.mother_phone}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
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
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1 transition"
                            >
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectingStudent(st)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-1 transition"
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
        </main>
      </div>

      {/* Student Details & Documents Modal */}
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

            {/* Document Images Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Faida Photo */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center space-y-2">
                <p className="text-xs font-semibold text-slate-400">Faida ID Card</p>
                {selectedStudent.faida_photo_url ? (
                  <img src={selectedStudent.faida_photo_url} alt="Faida Card" className="w-full h-48 object-cover rounded-lg border border-slate-800" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-600">No Image</div>
                )}
              </div>

              {/* School Report Card */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center space-y-2">
                <p className="text-xs font-semibold text-slate-400">Report Card</p>
                {selectedStudent.card_photo_url ? (
                  <img src={selectedStudent.card_photo_url} alt="Report Card" className="w-full h-48 object-cover rounded-lg border border-slate-800" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-600">No Image</div>
                )}
              </div>

              {/* Payment Receipt */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center space-y-2">
                <p className="text-xs font-semibold text-slate-400">Payment Receipt</p>
                {selectedStudent.receipt_photo_url ? (
                  <img src={selectedStudent.receipt_photo_url} alt="Receipt" className="w-full h-48 object-cover rounded-lg border border-slate-800" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-600">No Receipt Uploaded</div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
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
