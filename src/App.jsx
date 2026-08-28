import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [students, setStudents] = useState([]);
  const [isRegOpen, setIsRegOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: studentData } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    if (studentData) setStudents(studentData);

    const { data: config } = await supabase.from('settings').select('value').eq('key', 'is_registration_open').single();
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏫 የትምህርት ቤት አድሚን ዳሽቦርድ</h1>
        <button
          onClick={toggleRegistration}
          className={`px-4 py-2 rounded-lg text-white font-semibold ${
            isRegOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRegOpen ? '❌ ምዝገባ ዝጋ' : '✅ ምዝገባ ክፈት'}
        </button>
      </header>

      <main className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">📋 የተመዘገቡ ተማሪዎች ዝርዝር</h2>

        {loading ? (
          <p className="text-gray-500">መረጃው እየተጫነ ነው...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3">ተማሪ ስም</th>
                  <th className="p-3">የፋይዳ ቁጥር</th>
                  <th className="p-3">ክፍል</th>
                  <th className="p-3">የእናት ስልክ</th>
                  <th className="p-3">አማካይ</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{st.full_name} {st.father_name}</td>
                    <td className="p-3 font-mono">{st.faida_number}</td>
                    <td className="p-3">{st.grade_level}ኛ ክፍል</td>
                    <td className="p-3">{st.mother_phone}</td>
                    <td className="p-3">{st.average_score}%</td>
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
