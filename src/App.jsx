import { useState } from 'react';
import AuthScreen from './components/AuthScreen';
import ChatInterface from './components/ChatInterface';
import GeneralOfficeBanner from './components/GeneralOfficeBanner';
import AdminPortal from './components/AdminPortal';

function App() {
  const [studentId, setStudentId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  if (isAdmin) {
    return <AdminPortal onClose={() => setIsAdmin(false)} />;
  }

  return (
    <div className="font-sans antialiased text-warmgrey-900 bg-sage-50 min-h-screen">
      <GeneralOfficeBanner message="Welcome back. Parent-teacher conferences begin next week." />
      
      {!studentId ? (
        <AuthScreen 
          onLogin={setStudentId} 
          onAdminLogin={() => setIsAdmin(true)} 
        />
      ) : (
        <ChatInterface studentId={studentId} onLogout={() => setStudentId(null)} />
      )}
    </div>
  );
}

export default App;
