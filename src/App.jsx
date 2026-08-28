import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Lock, CheckCircle, XCircle, RefreshCw, LogOut } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [students, setStudents] = useState([]);
  const [isRegOpen, setIsRegOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // የአድሚን መግቢያ ቁልፍ (ከፈለግክ ቁጥሩን መለወጥ ትችላለህ)
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
      setLoginError('የተሳሳተ የይለፍ ቃል ነው!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
  };

  async function fetchData() {
    setLoading(true);
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (studentData) setStudents(studentData);

    const { data: config } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'is_registration_open')
      .single();
      
    if (config) setIsRegOpen(config.value === 'true');
    setLoading(false);
  }

  async function toggleRegistration() {
    const nextState = !isRegOpen;
    const { error } = await supabase
      .from('settings')
      .update({ value: String(nextState) })
      .eq('key', 'is_registration_open');

    if (!error) setIsRegOpen(nextState);
  }

  async function updateStudentStatus(id, newStatus) {
    const { error } = await supabase
      .from('students')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setStudents(students.map(s => s.id === id ? { ...s, status: newStatus } : s));
    }
  }

  // 1. የመግቢያ ገጽ (Login Page)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full inline-block mb-2">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">የአድሚን መግቢያ</h1>
            <p className="text-sm text-gray-500 mt-1">ዳሽቦርዱን ለመክፈት የይለፍ ቃል ያስገቡ</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="የይለፍ ቃል (Password)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>
            {loginError && <p className="text-red-500 text-sm font-semibold">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
            >
              ይግቡ (Log In)
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. ዋናው ዳሽቦርድ ገጽ
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏫 የትምህርት ቤት አድሚን ዳሽቦርድ</h1>
          <p className="text-xs text-gray-500">የተማሪዎች ምዝገባ እና ማረጋገጫ ቁጥጥር</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleRegistration}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition text-sm ${
              isRegOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isRegOpen ? '❌ ምዝገባ ዝጋ' : '✅ ምዝገባ ክፈት'}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition"
            title="ውጣ"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">📋 የተመዘገቡ ተማሪዎች ዝርዝር</h2>
          <button onClick={fetchData} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 py-8 text-center">መረጃው እየተጫነ ነው...</p>
        ) : students.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">እስካሁን የተመዘገበ ተማሪ የለም።</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600 text-sm">
                  <th className="p-3">ተማሪ ስም</th>
                  <th className="p-3">የፋይዳ ቁጥር</th>
                  <th className="p-3">ክፍል</th>
                  <th className="p-3">የእናት ስልክ</th>
                  <th className="p-3">ሁኔታ (Status)</th>
                  <th className="p-3 text-center">እርምጃ (Action)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="p-3 font-medium text-gray-800">{st.full_name} {st.father_name}</td>
                    <td className="p-3 font-mono text-gray-600">{st.faida_number}</td>
                    <td className="p-3 text-gray-600">{st.grade_level}ኛ ክፍል</td>
                    <td className="p-3 text-gray-600">{st.mother_phone}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        st.status === 'approved' ? 'bg-green-100 text-green-700' :
                        st.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {st.status === 'approved' ? 'የጸደቀ' : st.status === 'rejected' ? 'የተሰረዘ' : 'በምርመራ ላይ'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => updateStudentStatus(st.id, 'approved')}
                          className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> አጽድቅ
                        </button>
                        <button
                          onClick={() => updateStudentStatus(st.id, 'rejected')}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" /> ሰርዝ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
