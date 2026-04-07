import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AuthScreen({ onLogin }) {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setError('Please enter a valid Student ID.');
      return;
    }
    // simple mock validation
    if (studentId.length < 4) {
      setError('Student ID must be at least 4 characters long.');
      return;
    }
    
    setError('');
    onLogin(studentId.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass max-w-md w-full rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto bg-sage-100 text-sage-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-warmgrey-900">家長資訊站</h1>
          <p className="text-warmgrey-500 text-sm">Parent Information Hub</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-warmgrey-700 mb-1">
              Student ID / 學生編號
            </label>
            <input
              type="text"
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-warmgrey-200 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-all"
              placeholder="e.g. STU001"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-sage-600 hover:bg-sage-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
          >
            Enter Securely / 安全進入
          </button>
        </form>

        <p className="text-center text-xs text-warmgrey-400 mt-6">
          Your conversation is secure. No passwords are required.
        </p>
      </div>
    </div>
  );
}
