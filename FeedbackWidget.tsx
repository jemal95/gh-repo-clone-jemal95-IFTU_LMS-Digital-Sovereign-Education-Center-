import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { dbService } from '../services/dbService';

const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setIsSubmitting(true);
    const feedback = {
      email,
      message,
      page: window.location.pathname + window.location.hash,
      timestamp: new Date().toISOString()
    };

    await dbService.submitFeedback(feedback);
    
    setIsSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      setIsOpen(false);
      setSuccess(false);
      setEmail('');
      setMessage('');
    }, 3000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-4 w-80 md:w-96 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black uppercase italic text-xl">Feedback</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-gray-100 p-1 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto border-4 border-black">
                <Send size={24} />
              </div>
              <p className="font-bold text-lg">Thank you for your feedback!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-black rounded-xl font-bold outline-none focus:bg-white transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Message</label>
                <textarea 
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-black rounded-xl font-bold outline-none focus:bg-white transition-colors resize-none h-24"
                  placeholder="What's on your mind?"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting || !email || !message}
                className="w-full py-3 bg-black text-white rounded-xl border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 active:shadow-none transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmitting ? 'Sending...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 text-white rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
        title="Send Feedback"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default FeedbackWidget;
