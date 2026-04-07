import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import StarterBubbles from './StarterBubbles';

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

  const showStarters = messages.length === 1;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], studentId })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: "I'm having trouble connecting to the system right now. Please try again later or contact the general office." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] bg-sage-50/50">
      {/* Header Container */}
      <header className="glass rounded-b-2xl px-4 py-4 flex items-center justify-between sticky top-0 z-10">
         <div className="flex items-center space-x-3">
           <div className="bg-sage-600 p-2 rounded-full text-white">
             <Bot className="w-5 h-5" />
           </div>
           <div>
             <h2 className="font-bold text-warmgrey-900 leading-tight">School Assistant</h2>
             <p className="text-xs text-warmgrey-500">Student: {studentId}</p>
           </div>
         </div>
         <button onClick={onLogout} className="text-sm font-medium text-warmgrey-500 hover:text-warmgrey-800 transition-colors">
            Exit
         </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user' ? 'glass-sage rounded-br-none' : 'glass rounded-bl-none'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-none px-4 py-3 shadow-sm max-w-[85%]">
              <div className="flex space-x-1 items-center h-5">
                <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-transparent pb-safe">
        <StarterBubbles isVisible={showStarters} onSelect={handleSend} />
        
        <div className="glass flex items-center space-x-2 rounded-full px-2 py-2 mt-4 relative z-10 mx-auto max-w-3xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-warmgrey-900 placeholder:text-warmgrey-400 text-sm"
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="bg-sage-600 hover:bg-sage-700 disabled:bg-warmgrey-300 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
