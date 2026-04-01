import React, { useState, useEffect, useRef } from 'react';
import { User, Language } from '../types';
import { dbService } from '../services/dbService';
import { Users, MessageSquare, FileText, Send, Plus, Trash2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface SharedNote {
  id: string;
  title: string;
  content: string;
  lastModifiedBy: string;
  lastModifiedAt: number;
}

interface StudyHallProps {
  currentUser: User;
  lang: Language;
}

export const StudyHall: React.FC<StudyHallProps> = ({ currentUser, lang }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [inputText, setInputText] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editingNote, setEditingNote] = useState<SharedNote | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeChat = dbService.subscribeToChat('global-study-hall', (msgs) => {
      setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
    });

    const unsubscribeNotes = dbService.subscribeToNotes('global-study-hall', (sharedNotes) => {
      setNotes(sharedNotes);
    });

    return () => {
      unsubscribeChat();
      unsubscribeNotes();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const msg: Omit<ChatMessage, 'id'> = {
      userId: currentUser.id,
      userName: currentUser.name,
      text: inputText,
      timestamp: Date.now(),
    };
    await dbService.sendChatMessage('global-study-hall', msg);
    setInputText('');
  };

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;
    const note: Omit<SharedNote, 'id'> = {
      title: newNoteTitle,
      content: '',
      lastModifiedBy: currentUser.name,
      lastModifiedAt: Date.now(),
    };
    await dbService.createNote('global-study-hall', note);
    setNewNoteTitle('');
  };

  const handleUpdateNote = async (id: string, content: string) => {
    await dbService.updateNote('global-study-hall', id, {
      content,
      lastModifiedBy: currentUser.name,
      lastModifiedAt: Date.now(),
    });
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await dbService.deleteNote('global-study-hall', id);
      if (editingNote?.id === id) setEditingNote(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[800px] flex flex-col bg-white rounded-[4rem] border-8 border-black shadow-[24px_24px_0px_0px_rgba(34,197,94,1)] overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="p-8 bg-green-600 text-white border-b-8 border-black flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl border-4 border-black flex items-center justify-center text-2xl">🤝</div>
          <div>
            <h3 className="text-2xl font-black uppercase italic">Sovereign Study Hall</h3>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Collaborative Learning Space</p>
          </div>
        </div>
        <div className="flex bg-black/20 p-2 rounded-2xl border-4 border-black">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-2 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'chat' ? 'bg-white text-green-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'text-white hover:bg-white/10'}`}
          >
            <MessageSquare className="inline-block mr-2" size={16} />
            Chat
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-2 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'notes' ? 'bg-white text-green-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'text-white hover:bg-white/10'}`}
          >
            <FileText className="inline-block mr-2" size={16} />
            Shared Notes
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.userId === currentUser.id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-black uppercase text-gray-400 mb-1 px-4">{m.userName}</span>
                  <div className={`max-w-[70%] p-4 rounded-2xl border-4 border-black shadow-md font-black ${m.userId === currentUser.id ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white text-black rounded-tl-none'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-8 bg-white border-t-8 border-black flex gap-4">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Share knowledge with peers..."
                className="flex-1 bg-gray-50 border-4 border-black rounded-2xl px-6 py-4 font-black outline-none focus:bg-white transition-all shadow-inner"
              />
              <button 
                onClick={handleSendMessage}
                className="bg-green-600 text-white w-16 h-16 rounded-2xl border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex bg-gray-50">
            {/* Notes List */}
            <div className="w-80 border-r-8 border-black bg-white p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex gap-2">
                <input 
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="New note title..."
                  className="flex-1 bg-gray-50 border-4 border-black rounded-xl px-4 py-2 text-xs font-black outline-none"
                />
                <button 
                  onClick={handleCreateNote}
                  className="bg-green-600 text-white p-2 rounded-xl border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-2">
                {notes.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => setEditingNote(n)}
                    className={`p-4 rounded-xl border-4 border-black cursor-pointer transition-all flex justify-between items-center ${editingNote?.id === n.id ? 'bg-green-50 border-green-600' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="font-black text-sm truncate">{n.title}</p>
                      <p className="text-[8px] font-black uppercase text-gray-400">By {n.lastModifiedBy}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(n.id); }}
                      className="text-rose-500 hover:scale-110 transition-transform"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Note Editor */}
            <div className="flex-1 p-8 bg-white flex flex-col gap-4">
              {editingNote ? (
                <>
                  <div className="flex justify-between items-center border-b-4 border-black pb-4">
                    <h4 className="text-2xl font-black uppercase italic">{editingNote.title}</h4>
                    <span className="text-[10px] font-black uppercase text-gray-400 italic">Last modified by {editingNote.lastModifiedBy}</span>
                  </div>
                  <textarea 
                    value={editingNote.content}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      setEditingNote({ ...editingNote, content: newContent });
                      handleUpdateNote(editingNote.id, newContent);
                    }}
                    placeholder="Start collaborating on this note..."
                    className="flex-1 bg-gray-50 border-4 border-black rounded-3xl p-8 font-black text-lg outline-none focus:bg-white transition-all shadow-inner resize-none"
                  />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                  <FileText size={80} strokeWidth={1} />
                  <p className="font-black uppercase tracking-widest mt-4">Select or create a note to begin</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
