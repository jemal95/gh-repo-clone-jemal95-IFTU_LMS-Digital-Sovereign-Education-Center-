
import React, { useState, useRef, useEffect } from 'react';
import { askTutor } from '../services/geminiService';
import { Language } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import { Paperclip, X, FileText, Mic, MicOff, Send, Brain, Volume2 } from 'lucide-react';

const AITutor: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; attachmentName?: string }[]>([
    { role: 'ai', text: 'Salam! I am IFTU AI. How can I assist with your Ethiopian National Curriculum (EAES) studies today? You can also upload documents or images for me to analyze.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string, data: string, mimeType: string } | null>(null);
  const [parsedContent, setParsedContent] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = lang === 'am' ? 'am-ET' : lang === 'om' ? 'om-ET' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition is not supported in your browser.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }

    if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|csv|json)$/i)) {
      const textReader = new FileReader();
      textReader.onload = (event) => {
        setParsedContent(event.target?.result as string);
      };
      textReader.readAsText(file);
    } else {
      setParsedContent('');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (file.name.endsWith('.doc')) mimeType = 'application/msword';
      }
      setAttachment({
        name: file.name,
        data: base64String,
        mimeType: mimeType
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    const userMsg = input;
    const currentAttachment = attachment;
    const currentParsedContent = parsedContent;
    
    setInput('');
    setAttachment(null);
    setParsedContent('');
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userMsg, 
      attachmentName: currentAttachment?.name 
    }]);
    
    setIsLoading(true);
    try {
      const response = await askTutor(userMsg, lang, currentParsedContent || undefined, currentAttachment || undefined);
      setMessages(prev => [...prev, { role: 'ai', text: response || 'Failed to connect.' }]);
    } catch (error) {
      console.error("Tutor Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly in a professional educational tone: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const frameCount = dataInt16.length;
        const buffer = audioCtx.createBuffer(1, frameCount, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768.0;

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[800px] flex flex-col bg-white rounded-[4rem] border-8 border-black shadow-[24px_24px_0px_0px_rgba(59,130,246,1)] overflow-hidden animate-fadeIn">
      <div className="p-8 md:p-12 bg-blue-600 text-white border-b-8 border-black flex justify-between items-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 ethiopian-gradient"></div>
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl border-4 border-black flex items-center justify-center text-4xl shadow-lg">
              <Brain size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">National AI Lab</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Sovereign Knowledge Engine v4.0</p>
            </div>
         </div>
         <div className="flex gap-4">
            {(['en', 'am', 'om'] as Language[]).map(l => (
              <button 
                key={l}
                onClick={() => setLang(l)}
                className={`w-12 h-12 rounded-xl border-4 border-black font-black uppercase text-xs transition-all ${lang === l ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-gray-400'}`}
              >
                {l}
              </button>
            ))}
         </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative group max-w-[85%] p-8 rounded-[3rem] border-4 border-black shadow-xl font-black text-xl leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-900 rounded-bl-none'}`}>
              {m.attachmentName && (
                <div className="flex items-center gap-2 mb-4 bg-black/20 p-3 rounded-2xl w-fit">
                  <FileText size={20} />
                  <span className="text-sm truncate max-w-[200px]">{m.attachmentName}</span>
                </div>
              )}
              {m.text}
              {m.role === 'ai' && (
                <button 
                  onClick={() => speakResponse(m.text)}
                  disabled={isSpeaking}
                  className="absolute -bottom-4 -right-4 w-12 h-12 bg-yellow-400 border-4 border-black rounded-full flex items-center justify-center text-xl shadow-lg hover:scale-110 active:scale-95 transition-all disabled:grayscale"
                  title="Listen to response"
                >
                  {isSpeaking ? '⏳' : <Volume2 size={20} />}
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white p-6 rounded-3xl border-4 border-black flex gap-2 shadow-lg animate-pulse">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
      </div>

      <div className="p-8 md:p-12 bg-white border-t-8 border-black flex flex-col gap-4">
        {attachment && (
          <div className="flex items-center justify-between bg-blue-50 border-4 border-black p-4 rounded-2xl w-fit max-w-full">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="shrink-0 text-blue-600" />
              <span className="font-black text-sm truncate">{attachment.name}</span>
            </div>
            <button onClick={() => { setAttachment(null); setParsedContent(''); }} className="ml-4 p-1 hover:bg-black/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="flex gap-4 md:gap-6 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,.pdf,.docx,.txt"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-100 text-black w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all shrink-0 hover:bg-gray-200"
            title="Attach Document or Image"
          >
            <Paperclip size={24} strokeWidth={3} />
          </button>
          
          <button 
            onClick={toggleListening}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Interrogate the National Registry..."
            className="flex-1 bg-gray-50 border-4 border-black rounded-[2.5rem] px-6 md:px-10 py-6 md:py-8 font-black text-xl md:text-2xl outline-none focus:bg-white transition-all shadow-inner min-w-0"
          />
          
          <button 
            onClick={handleSend} 
            disabled={isLoading || (!input.trim() && !attachment)} 
            className="bg-blue-600 text-white w-16 h-16 md:w-24 md:h-20 rounded-[2rem] border-4 border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 shrink-0"
            title="Send Message"
          >
            <Send size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
