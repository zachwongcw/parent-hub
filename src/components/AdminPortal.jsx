import { useState } from 'react';
import { Database, RefreshCw, Eye, History, AlertTriangle } from 'lucide-react';

export default function AdminPortal({ onClose }) {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncedData, setSyncedData] = useState(null);

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceClearCache: true })
      });
      const result = await response.json();
      if (result.success) {
        setSyncedData(result.data);
        setSyncStatus('success');
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-warmgrey-50">
      <header className="bg-sage-700 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5" />
          <h1 className="font-bold text-lg">System Admin Portal</h1>
        </div>
        <button onClick={onClose} className="text-sage-100 hover:text-white transition-colors text-sm font-medium">
          Exit to App
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 lg:px-20">
        <div className="bg-white rounded-xl shadow-sm border border-warmgrey-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-warmgrey-900 flex items-center space-x-2 mb-4">
            <RefreshCw className="w-5 h-5 text-sage-600" />
            <span>Knowledge Base Sync (Google Drive CMS)</span>
          </h2>
          
          <p className="text-sm text-warmgrey-600 mb-6 leading-relaxed">
            Configure prompt logic organically via Google Documents. 
            Create a Google Doc named <span className="font-mono bg-warmgrey-100 px-1 rounded text-sage-700 font-bold">SYSTEM_PROMPT</span> in your shared Google Drive folder to override the chatbot's core logic. The chatbot will automatically append its 150-word and anti-hallucination guardrails.
            Other documents and PDFs in the folder will be ingested as background policy context.
          </p>

          <button 
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            className="flex items-center space-x-2 bg-sage-600 hover:bg-sage-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>Force Sync with Google Drive</span>
          </button>

          {syncStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg text-sm flex items-start space-x-2 border border-green-200">
              <Eye className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Synchronization Successful</p>
                <p>The global system cache has been refreshed. The chatbot is now using the newest instructions and documents from your Google Drive.</p>
                {syncedData?.customPrompt && (
                  <p className="mt-2 text-xs font-mono bg-white p-2 rounded block">✅ Custom SYSTEM_PROMPT document found and applied!</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-warmgrey-200 p-6">
          <h2 className="text-lg font-bold text-warmgrey-900 flex items-center space-x-2 mb-4">
            <History className="w-5 h-5 text-sage-600" />
            <span>Google Sheets Auditing</span>
          </h2>
           <p className="text-sm text-warmgrey-600 mb-6 leading-relaxed">
            The chatbot is currently integrated with Google Sheets to log live parent inquiries. Every conversation extracts the <span className="font-bold text-warmgrey-800">Main Enquiry</span>, <span className="font-bold text-warmgrey-800">Hidden Concerns</span>, and <span className="font-bold text-warmgrey-800">Emotions</span> automatically.
          </p>
           <div className="flex items-start space-x-2 bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-900">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>Ensure your service account <code className="bg-amber-100 px-1 rounded mx-1">parent-hub-drive@parent-hub-rag-system.iam.gserviceaccount.com</code> has Editor permissions to the target spreadsheet.</p>
          </div>
        </div>

      </main>
    </div>
  );
}
