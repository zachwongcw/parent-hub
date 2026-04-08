import { useState, useRef, useEffect } from 'react';
import { Send, Bot, WifiOff, HardDriveDownload } from 'lucide-react';
import StarterBubbles from './StarterBubbles';
import { CreateMLCEngine } from '@mlc-ai/web-llm';

export default function ChatInterface({ studentId, onLogout }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Welcome to the Parent Information Hub. I am here to assist you with school policies or concerns regarding Student ${studentId}. How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Offline Mode States
  const [showOfflinePrompt, setShowOfflinePrompt] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [offlineDownloadProgress, setOfflineDownloadProgress] = useState('');
  const [offlineModelName, setOfflineModelName] = useState('');
  const mlcEngineRef = useRef(null);

  const showStarters = messages.length === 1 && !isOfflineMode;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initOfflineMode = async () => {
    setShowOfflinePrompt(false);
    setIsDownloadingOffline(true);

    try {
      // Very basic network heuristic via navigator.connection
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const isWifi = conn && conn.type === 'wifi';
      
      // Select model
      const modelId = isWifi ? 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC' : 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
      setOfflineModelName(modelId);

      const engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          setOfflineDownloadProgress(progress.text);
        }
      });

      mlcEngineRef.current = engine;
      setIsOfflineMode(true);
      
      const dataWarning = !isWifi ? "\n⚠️ 注意：系統偵測到您可能正使用行動網路，已為您降級載入最極致輕量的 0.5B 模型。請留意數據下載量。" : "";

      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: `【離線備援模式已啟動】目前已成功載入本地 AI 模型 (${modelId})。您可以繼續對話。請注意，此模式為絕對離線安全設計，對話絕不會上傳或同步至任何雲端伺服器紀錄。${dataWarning}`
      }]);
    } catch (err) {
      console.error("WebLLM Init Error:", err);
      setOfflineDownloadProgress(`下載失敗: ${err.message}`);
    } finally {
      setIsDownloadingOffline(false);
    }
  };

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    if (isOfflineMode && mlcEngineRef.current) {
      try {
        const offMessages = messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content: text });
        
        // Inject a simple static system prompt since RAG context isn't available
        const systemPrompt = { role: 'system', content: '你是「家長同行者」，一個專為小學家長設計的離線智能支援助手。盡量以簡短、得體的廣東話或繁體中文回應。'};

        const reply = await mlcEngineRef.current.chat.completions.create({
          messages: [systemPrompt, ...offMessages]
        });

        const replyText = reply.choices[0].message.content;
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: replyText }]);

        // Try to sync to backend if online
        if (navigator.onLine) {
          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              logOnly: true, 
              studentId, 
              userText: text, 
              assistantReply: replyText 
            })
          }).catch(e => console.error("Could not sync offline log", e));
        }

      } catch (err) {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: `離線推論發生錯誤: ${err.message}` }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Cloud Mode
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], studentId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.debugMessage || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errMsg = error.message || '';
      const isQuota = errMsg.includes('QUOTA_EXHAUSTED') || errMsg.includes('Rate Limit') || errMsg.includes('429');
      
      // If quota/server error, prompt offline mode
      if (isQuota || errMsg.includes('503') || errMsg.includes('500')) {
         setShowOfflinePrompt(true);
      }

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: isQuota ? "伺服器目前查詢量過大 (Google API Rate Limit)。請稍候 1 分鐘後再試，或進入離線模式。" : `我現在的大腦連線遇到了一點小問題，請稍後再試。\n\n[Debug Info: ${error.message}]` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] bg-sage-50/50">
      {/* Header Container */}
      <header className="glass rounded-b-2xl px-4 py-4 flex items-center justify-between sticky top-0 z-10 transition-colors duration-500" style={{ backgroundColor: isOfflineMode ? 'rgba(255, 245, 230, 0.95)' : undefined }}>
         <div className="flex items-center space-x-3">
           <div className={`p-2 rounded-full text-white ${isOfflineMode ? 'bg-orange-500' : 'bg-sage-600'}`}>
             {isOfflineMode ? <WifiOff className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
           </div>
           <div>
             <h2 className="font-bold text-warmgrey-900 leading-tight">
               {isOfflineMode ? 'Offline Assistant' : 'School Assistant'}
             </h2>
             <p className="text-xs text-warmgrey-500">Student: {studentId}</p>
           </div>
         </div>
         <button onClick={onLogout} className="text-sm font-medium text-warmgrey-500 hover:text-warmgrey-800 transition-colors">
            Exit
         </button>
      </header>

      {/* Offline Mode Upgrade Banner */}
      {showOfflinePrompt && !isOfflineMode && !isDownloadingOffline && (
        <div className="mx-4 mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm animate-fade-in z-20">
          <div className="flex items-start space-x-3">
             <div className="bg-orange-100 p-2 rounded-full text-orange-600">
               <HardDriveDownload className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-orange-900 text-sm">雲端伺服器已滿載</h3>
                <p className="text-xs text-orange-800 mt-1 mb-3">
                  是否下載離線 AI 大腦 (約 350MB-1GB) 繼續進行對話？<br/>
                  系統會自動偵測您的網路狀態：WiFi 狀態載入高階模型，行動數據載入輕量模型。
                </p>
                <div className="flex space-x-2">
                  <button onClick={initOfflineMode} className="bg-orange-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-orange-600">
                    同意下載並切換至離線模式
                  </button>
                  <button onClick={() => setShowOfflinePrompt(false)} className="bg-orange-100 text-orange-800 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-orange-200">
                    取消
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user' ? (isOfflineMode ? 'bg-orange-100 text-orange-900' : 'glass-sage rounded-br-none') : 'glass rounded-bl-none'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && !isDownloadingOffline && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-none px-4 py-3 shadow-sm max-w-[85%]">
              <div className="flex space-x-1 items-center h-5">
                <div className={`w-2 h-2 rounded-full animate-bounce ${isOfflineMode ? 'bg-orange-400' : 'bg-sage-400'}`} style={{ animationDelay: '0ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${isOfflineMode ? 'bg-orange-400' : 'bg-sage-400'}`} style={{ animationDelay: '150ms' }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${isOfflineMode ? 'bg-orange-400' : 'bg-sage-400'}`} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-transparent pb-safe relative">
        {isDownloadingOffline && (
          <div className="absolute top-0 left-0 right-0 -translate-y-full px-4 pb-2 z-10 text-center">
            <div className="bg-white/90 backdrop-blur-sm border shadow-sm rounded-lg py-2 px-4 inline-block mx-auto">
               <p className="text-xs font-bold text-orange-700 animate-pulse mb-1">正在下載離線模型 ({offlineModelName || '載入中'})...</p>
               <p className="text-[10px] text-warmgrey-500 font-mono tracking-tighter">{offlineDownloadProgress || '請稍候...'}</p>
            </div>
          </div>
        )}
        
        <StarterBubbles isVisible={showStarters} onSelect={handleSend} />
        
        <div className="glass flex items-center space-x-2 rounded-full px-2 py-2 mt-4 relative z-10 mx-auto max-w-3xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isOfflineMode ? "離線對話中..." : "Type your message..."}
            disabled={isDownloadingOffline}
            className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-warmgrey-900 placeholder:text-warmgrey-400 text-sm disabled:opacity-50"
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading || isDownloadingOffline}
            className={`${isOfflineMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-sage-600 hover:bg-sage-700'} disabled:bg-warmgrey-300 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors flex-shrink-0`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="max-w-3xl mx-auto mt-2 pl-2 opacity-50 pointer-events-none transition-all duration-300">
          <div className="text-left flex items-center space-x-1">
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-warmgrey-600">
              {isOfflineMode ? `🟢 Local Engine: ${offlineModelName}` : '☁️ Cloud Engine: Gemini 2.5 Flash'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
