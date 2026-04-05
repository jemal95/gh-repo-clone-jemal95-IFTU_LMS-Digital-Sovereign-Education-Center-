
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, LayoutList, Square, CheckCircle2, AlertCircle } from 'lucide-react';
import { Exam, Question, ExamResult } from '../types';

interface ExamEngineProps {
  exam: Exam;
  onComplete: (result: ExamResult) => void;
  onCancel: () => void;
}

const ExamEngine: React.FC<ExamEngineProps> = ({ exam, onComplete, onCancel }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [timeSpent, setTimeSpent] = useState(0);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'list'>('single');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [showWarning, setShowWarning] = useState<null | '6m' | '1m'>(null);
  const [screenPulse, setScreenPulse] = useState(false);
  const [reviewData, setReviewData] = useState<{
    score: number;
    total: number;
    results: {
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      points: number;
    }[];
  } | null>(null);
  
  const answersRef = useRef<Record<string, number | string>>({});
  const engineRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Enhanced Multi-tone Alert Utility
  const playPatternedSound = (frequency: number, duration: number, count: number, spacing: number = 0.3) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (startTime: number, freq: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'square'; // Sharper, more "digital" sound
        oscillator.frequency.setValueAtTime(freq, startTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      for (let i = 0; i < count; i++) {
        // Vary frequency slightly for the "Siren" effect at 1m
        const actualFreq = frequency + (count > 2 ? (i % 2 === 0 ? 100 : 0) : 0);
        playTone(audioCtx.currentTime + (i * spacing), actualFreq);
      }
    } catch (e) {
      console.warn("Audio alert failed", e);
    }
  };

  useEffect(() => {
    if (isStarted && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => {
          setAlerts(prev => [...prev, `[${new Date().toLocaleTimeString()}] Proctoring Alert: Camera access denied.`]);
        });
    }
  }, [isStarted]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isStarted) {
        setAlerts(prev => [...prev, `[${new Date().toLocaleTimeString()}] Proctoring Alert: Tab switching detected.`]);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isStarted) {
        setAlerts(prev => [...prev, `[${new Date().toLocaleTimeString()}] Proctoring Alert: Fullscreen exited.`]);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    let timerId: number;
    if (isStarted) {
      timerId = window.setInterval(() => {
        setTimeSpent(prev => prev + 1);
        setTimeLeft(prev => {
          // Warning Triggers: 6 minutes (360s)
          if (prev === 361) {
            setShowWarning('6m');
            setScreenPulse(true);
            playPatternedSound(440, 0.4, 2, 0.5); // A4 distinctive chime
            setTimeout(() => {
              setShowWarning(null);
              setScreenPulse(false);
            }, 6000);
          }
          // Critical Warning: 1 minute (60s)
          if (prev === 61) {
            setShowWarning('1m');
            setScreenPulse(true);
            playPatternedSound(987.77, 0.15, 6, 0.15); // B5 Rapid Siren/Beep
            setTimeout(() => {
              setShowWarning(null);
              setScreenPulse(false);
            }, 10000);
          }

          if (prev <= 1) {
            clearInterval(timerId);
            handleFinalCalculate(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (timerId) clearInterval(timerId);
    };
  }, [isStarted]);

  const enterSecureMode = async () => {
    setIsStarted(true);
    try {
      if (engineRef.current && engineRef.current.requestFullscreen) {
        await engineRef.current.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen mode unavailable", err);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (val: number | string) => {
    setAnswers(prev => ({ ...prev, [exam.questions[currentIdx].id]: val }));
  };

  const handleAnswerById = (id: string, val: number | string) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const toggleQuestionExpansion = (id: string) => {
    setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReview = () => {
    let score = 0;
    const results = exam.questions.map(q => {
      let isCorrect = false;
      let userAnswerStr = '';
      let correctAnswerStr = '';

      if (q.type === 'fill-in-the-blank') {
        userAnswerStr = String(answers[q.id] || '').trim();
        correctAnswerStr = String(q.correctAnswer).trim();
        isCorrect = userAnswerStr.toLowerCase() === correctAnswerStr.toLowerCase();
      } else {
        const userAnsIdx = answers[q.id] as number;
        isCorrect = userAnsIdx === q.correctAnswer;
        userAnswerStr = userAnsIdx !== undefined ? q.options[userAnsIdx] : 'No Answer';
        correctAnswerStr = q.options[q.correctAnswer as number];
      }

      if (isCorrect) score += q.points;

      return {
        question: q.text,
        userAnswer: userAnswerStr,
        correctAnswer: correctAnswerStr,
        isCorrect,
        points: q.points
      };
    });

    setReviewData({
      score,
      total: exam.totalPoints,
      results
    });
    setShowReviewModal(true);
  };

  const handleFinalCalculate = (isAuto: boolean) => {
    let score = 0;
    const categoryBreakdown: Record<string, { correct: number; total: number }> = {};
    const finalAnswers = answersRef.current;

    exam.questions.forEach(q => {
      let isCorrect = false;
      if (q.type === 'fill-in-the-blank') {
        isCorrect = String(finalAnswers[q.id] || '').trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      } else {
        isCorrect = finalAnswers[q.id] === q.correctAnswer;
      }

      if (isCorrect) score += q.points;
      
      if (!categoryBreakdown[q.category]) categoryBreakdown[q.category] = { correct: 0, total: 0 };
      categoryBreakdown[q.category].total++;
      if (isCorrect) categoryBreakdown[q.category].correct++;
    });

    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    onComplete({
      examId: exam.id,
      studentId: 'current-user',
      score,
      totalPoints: exam.totalPoints,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: timeSpent,
      answers: finalAnswers,
      categoryBreakdown
    });
  };

  const confirmExit = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onCancel();
  };

  if (!isStarted) {
    return (
      <div className="fixed inset-0 z-[10000] bg-slate-100 flex items-center justify-center p-6 text-center">
        <div className="bg-white border-8 border-black rounded-[4rem] p-12 md:p-20 w-full max-w-2xl space-y-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] animate-scaleIn relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 ethiopian-gradient"></div>
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 bg-slate-50 border-4 border-slate-200 rounded-3xl flex items-center justify-center text-7xl shadow-inner">🛡️</div>
          </div>
          <div className="space-y-4">
            <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Enter Secure Hall</h2>
            <div className="max-w-md mx-auto pt-4 space-y-4">
              <p className="text-xl font-bold text-slate-600 leading-relaxed">
                Subject: <span className="text-blue-600 font-black">{exam.subject}</span><br/>
                Identity Verification: <span className="text-green-600 font-black">Ready</span>
              </p>
              
              {exam.keyConcepts && exam.keyConcepts.length > 0 && (
                <div className="bg-blue-50 border-4 border-black rounded-3xl p-6 text-left space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-900 border-b-2 border-blue-200 pb-2">Unit 1: Key Concepts & Meanings</h4>
                  <div className="max-h-48 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {exam.keyConcepts.map((concept, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="text-sm font-black uppercase text-blue-800">{concept.term}</p>
                        <p className="text-xs font-bold text-slate-600 italic leading-snug">{concept.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-6 pt-6">
            <button onClick={onCancel} className="w-full py-8 bg-white border-8 border-black rounded-[2.5rem] font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">Cancel</button>
            <button onClick={enterSecureMode} className="w-full py-8 bg-blue-600 text-white border-8 border-black rounded-[2.5rem] font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">Begin Session</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div ref={engineRef} className={`fixed inset-0 z-[9999] bg-[#f8f9fb] flex flex-col font-['Inter'] transition-all duration-300 ${screenPulse ? (showWarning === '1m' ? 'ring-[50px] ring-inset ring-rose-600 animate-pulse' : 'ring-[40px] ring-inset ring-yellow-400') : ''}`}>
      
      {/* TIME WARNING OVERLAY - REDESIGNED FOR MAX IMPACT */}
      {showWarning && (
        <div className="fixed inset-0 z-[10020] pointer-events-none flex items-center justify-center p-4 bg-black/10 backdrop-blur-[2px]">
          <div className={`w-full max-w-4xl p-16 md:p-24 border-[15px] border-black rounded-[6rem] shadow-[40px_40px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-12 text-center transition-all ${showWarning === '1m' ? 'bg-rose-600 text-white animate-bounce' : 'bg-yellow-400 text-black animate-fadeIn'}`}>
            <div className="relative">
              <span className={`text-[15rem] leading-none drop-shadow-2xl ${showWarning === '1m' ? 'animate-pulse' : ''}`}>
                {showWarning === '1m' ? '🚫' : '⚠️'}
              </span>
              <div className="absolute -top-4 -right-4 bg-black text-white px-6 py-2 rounded-xl text-xl font-black italic shadow-lg">ALARM</div>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.75]">
                {showWarning === '6m' ? '6 Minutes' : '1 Minute'} <br/> Remaining.
              </h2>
              <div className="h-4 w-64 bg-black mx-auto rounded-full overflow-hidden">
                <div className="h-full bg-white animate-progress" style={{animationDuration: showWarning === '6m' ? '6s' : '10s'}}></div>
              </div>
              <p className={`text-3xl md:text-4xl font-black uppercase tracking-[0.3em] italic ${showWarning === '1m' ? 'text-rose-100' : 'text-yellow-900'}`}>
                {showWarning === '1m' ? 'SYSTEMS SHUTTING DOWN' : 'FINALIZE ALL MODULES'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STATUS BAR */}
      <div className="h-24 bg-black text-white border-b-[10px] border-black flex items-center justify-between px-6 md:px-12 shrink-0">
        <div className="flex items-center gap-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl border-4 border-white flex items-center justify-center font-black shadow-lg">I</div>
          <div className="hidden sm:block">
             <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{exam.title}</h1>
             <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mt-1 italic">
               {timeLeft < 60 ? '⚠️ CRITICAL PHASE ACTIVE' : 'Proctored Session'}
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
           <div className="flex items-center bg-slate-800 rounded-2xl border-4 border-slate-700 p-1">
             <button 
               onClick={() => setViewMode('single')}
               className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${viewMode === 'single' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               <Square size={12} /> Single
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               <LayoutList size={12} /> List
             </button>
           </div>
           <div className={`flex items-center gap-6 bg-slate-900 px-8 py-3 rounded-2xl border-4 shadow-inner transition-colors ${timeLeft < 60 ? 'border-rose-600 bg-rose-950 animate-pulse' : (timeLeft < 360 ? 'border-yellow-400 bg-yellow-950' : 'border-slate-700')}`}>
              <div className="flex flex-col items-end leading-none">
                <span className={`text-[10px] font-black uppercase opacity-60 mb-1 ${timeLeft < 60 ? 'text-rose-400' : ''}`}>
                  {timeLeft < 60 ? 'EMERGENCY TIME' : 'Time Remaining'}
                </span>
                <span className={`text-4xl font-black tracking-tighter tabular-nums ${timeLeft < 360 ? (timeLeft < 60 ? 'text-white' : 'text-yellow-400') : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
           </div>
           <button onClick={() => setShowExitModal(true)} className="bg-rose-600 px-8 py-4 rounded-2xl border-4 border-white font-black uppercase text-xs tracking-widest shadow-lg hover:bg-rose-700 transition-colors">EXIT HALL</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* PROCTOR FEED - FLOATING */}
        <div className="absolute bottom-10 right-10 w-48 h-64 bg-black border-4 border-black rounded-[3rem] overflow-hidden shadow-[20px_20px_0px_0px_rgba(0,0,0,0.5)] z-50 group hover:scale-110 transition-transform">
           <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-60" />
           <div className="absolute top-4 left-4 flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-black"></div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-3 py-1 rounded-lg backdrop-blur-sm">Live Proctor</span>
           </div>
           <div className="absolute bottom-4 right-4 text-white/40 font-mono text-[8px] tracking-tighter">SEC_STREAM_ACTIVE</div>
        </div>

        {/* MAIN DASHBOARD */}
        <div className="flex-1 overflow-y-auto p-6 md:p-16 scroll-smooth">
           <div className="max-w-4xl mx-auto space-y-16 pb-32">
              {viewMode === 'single' ? (
                <>
                  <div className={`bg-white border-[10px] border-black rounded-[5rem] p-10 md:p-24 shadow-[30px_30px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden transition-all ${timeLeft < 60 ? 'border-rose-600 shadow-rose-600/20' : ''}`}>
                    <div className="absolute top-0 left-0 w-full h-4 ethiopian-gradient"></div>
                    <div className="absolute top-12 left-12 inline-flex items-center gap-4 bg-blue-50 border-4 border-blue-600 px-6 py-2 rounded-2xl">
                      <span className="text-xs font-black uppercase tracking-widest text-blue-600">Unit Verification: {currentIdx + 1} / {exam.questions.length}</span>
                    </div>
                    <div className="mt-20 space-y-16">
                        <p className="text-3xl md:text-5xl font-black leading-[0.95] tracking-tighter italic text-slate-900 border-l-[15px] border-black pl-10">
                          {currentQuestion.text}
                        </p>
                        <div className="grid grid-cols-1 gap-8">
                          {currentQuestion.type === 'fill-in-the-blank' ? (
                            <div className="space-y-4">
                              <label className="text-xs font-black uppercase tracking-widest text-gray-400">Your Response</label>
                              <input 
                                type="text"
                                placeholder="Type your answer here..."
                                className="w-full p-10 bg-white border-8 border-black rounded-[3rem] font-black text-3xl outline-none shadow-inner focus:ring-8 focus:ring-blue-600/20 transition-all"
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => handleAnswer(e.target.value)}
                              />
                            </div>
                          ) : (
                            currentQuestion.options.map((opt, i) => (
                              <button 
                                key={i} 
                                onClick={() => handleAnswer(i)} 
                                className={`group text-left p-8 md:p-10 rounded-[3.5rem] border-8 border-black font-black text-2xl md:text-3xl transition-all flex items-center gap-8 md:gap-12 relative ${answers[currentQuestion.id] === i ? 'bg-blue-600 text-white shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] translate-x-2 translate-y-2' : 'bg-slate-50 hover:bg-white hover:-translate-y-1'}`}
                              >
                                <div className={`w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] border-4 border-black flex items-center justify-center shrink-0 font-black text-2xl md:text-4xl transition-colors ${answers[currentQuestion.id] === i ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                  {String.fromCharCode(65 + i)}
                                </div>
                                <span className="leading-[1.1] uppercase tracking-tighter">{opt}</span>
                              </button>
                            ))
                          )}
                        </div>
                    </div>
                  </div>
                  <div className="flex gap-6 md:gap-12">
                    <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)} className="flex-1 py-10 bg-white border-8 border-black rounded-[3.5rem] font-black uppercase text-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-2 disabled:opacity-20 transition-all">Previous</button>
                    <button disabled={currentIdx === exam.questions.length - 1} onClick={() => setCurrentIdx(currentIdx + 1)} className="flex-1 py-10 bg-blue-600 text-white border-8 border-black rounded-[3.5rem] font-black uppercase text-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-2 disabled:opacity-20 transition-all">Next Module</button>
                  </div>
                </>
              ) : (
                <div className="space-y-8">
                  {exam.questions.map((q, idx) => {
                    const isExpanded = expandedQuestions[q.id] !== false; // Default to expanded
                    const isAnswered = answers[q.id] !== undefined;
                    
                    return (
                      <div 
                        key={q.id} 
                        id={`question-${idx}`}
                        className={`bg-white border-8 border-black rounded-[3rem] overflow-hidden shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] transition-all ${isExpanded ? 'p-10 md:p-16' : 'p-6 md:p-8'}`}
                      >
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl border-4 border-black flex items-center justify-center font-black ${isAnswered ? 'bg-green-400' : 'bg-slate-200'}`}>
                              {idx + 1}
                            </div>
                            <h3 className={`font-black uppercase italic tracking-tighter transition-all ${isExpanded ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl truncate max-w-md'}`}>
                              {isExpanded ? q.category : q.text}
                            </h3>
                          </div>
                          <button 
                            onClick={() => toggleQuestionExpansion(q.id)}
                            className="p-3 bg-slate-100 border-4 border-black rounded-xl hover:bg-slate-200 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-10 space-y-10 animate-fadeIn">
                            <p className="text-3xl md:text-4xl font-black leading-[1.1] tracking-tighter italic text-slate-900 border-l-[10px] border-black pl-8">
                              {q.text}
                            </p>
                            <div className="grid grid-cols-1 gap-6">
                              {q.type === 'fill-in-the-blank' ? (
                                <input 
                                  type="text"
                                  placeholder="Type your answer here..."
                                  className="w-full p-8 bg-white border-6 border-black rounded-[2rem] font-black text-2xl outline-none shadow-inner focus:ring-6 focus:ring-blue-600/20 transition-all"
                                  value={answers[q.id] || ''}
                                  onChange={(e) => handleAnswerById(q.id, e.target.value)}
                                />
                              ) : (
                                q.options.map((opt, i) => (
                                  <button 
                                    key={i} 
                                    onClick={() => handleAnswerById(q.id, i)} 
                                    className={`group text-left p-6 md:p-8 rounded-[2.5rem] border-6 border-black font-black text-xl md:text-2xl transition-all flex items-center gap-6 md:gap-8 relative ${answers[q.id] === i ? 'bg-blue-600 text-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] translate-x-1 translate-y-1' : 'bg-slate-50 hover:bg-white hover:-translate-y-1'}`}
                                  >
                                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-[1rem] border-4 border-black flex items-center justify-center shrink-0 font-black text-lg md:text-2xl transition-colors ${answers[q.id] === i ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                      {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className="leading-[1.1] uppercase tracking-tighter">{opt}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
           </div>
        </div>

        {/* SIDEBAR */}
        <div className="hidden xl:flex w-[400px] bg-white border-l-[10px] border-black flex flex-col shrink-0">
           <div className="p-12 space-y-12 flex-1 overflow-y-auto">
              <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] border-8 border-black space-y-6 shadow-xl">
                 <div className="flex justify-between items-center">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-400">Ledger Mapping</p>
                    <span className="text-xl font-black italic">{Math.round((answeredCount / exam.questions.length) * 100)}%</span>
                 </div>
                 <div className="h-4 w-full bg-slate-800 rounded-full border-2 border-black overflow-hidden shadow-inner">
                    <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${(answeredCount / exam.questions.length) * 100}%` }} />
                 </div>
                 <p className="text-center text-[10px] font-black uppercase tracking-[0.2em]">{answeredCount} Units Validated of {exam.questions.length}</p>
              </div>
              
              <div className="space-y-8">
                 <h4 className="text-3xl font-black uppercase italic tracking-tighter border-b-4 border-black pb-2">Hall Navigator</h4>
                 <div className="grid grid-cols-5 gap-4">
                    {exam.questions.map((q, idx) => (
                      <button 
                        key={q.id} 
                        onClick={() => {
                          setCurrentIdx(idx);
                          if (viewMode === 'list') {
                            document.getElementById(`question-${idx}`)?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }} 
                        className={`w-full aspect-square rounded-2xl border-4 border-black font-black text-xl flex items-center justify-center transition-all ${currentIdx === idx ? 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : answers[q.id] !== undefined ? 'bg-green-400 text-black' : 'bg-slate-50'}`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="bg-rose-50 border-[6px] border-black rounded-[3rem] p-8 space-y-6 shadow-inner">
                 <h4 className="text-[11px] font-black uppercase text-rose-600 tracking-widest flex items-center gap-3">
                   <span className="w-2 h-2 bg-rose-600 rounded-full"></span>
                   Security Trace Log
                 </h4>
                 <div className="space-y-4 max-h-56 overflow-y-auto font-mono text-[10px] leading-relaxed">
                    {alerts.length > 0 ? alerts.slice(-5).map((a, i) => (
                      <p key={i} className="font-black italic text-rose-800 border-l-2 border-rose-200 pl-3">⚠️ {a}</p>
                    )) : <p className="italic text-gray-400">Audit link authenticated. System stable.</p>}
                 </div>
              </div>
           </div>
           
           <div className="p-10 border-t-[10px] border-black bg-slate-50">
              <button onClick={handleReview} className="w-full py-10 bg-green-600 text-white border-8 border-black rounded-[3rem] font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:bg-green-700 transition-colors active:translate-y-2 active:shadow-none">FINISH SCRIPT</button>
           </div>
        </div>
      </div>

      {/* FINAL CONFIRMATION / REVIEW MODAL */}
      {showReviewModal && reviewData && (
        <div className="fixed inset-0 z-[10005] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white border-[12px] border-black rounded-[5rem] w-full max-w-5xl h-[90vh] flex flex-col p-8 md:p-16 shadow-[40px_40px_0px_0px_rgba(34,197,94,1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-6 ethiopian-gradient"></div>
            
            <div className="text-center space-y-4 shrink-0 mb-8">
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-[0.8]">Review <br/>Script</h2>
              <p className="text-xl font-black text-gray-400 uppercase tracking-[0.2em] italic">
                Preliminary Score: <span className={reviewData.score >= reviewData.total / 2 ? 'text-green-600' : 'text-rose-600'}>{reviewData.score} / {reviewData.total}</span>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-4 mb-8">
              {reviewData.results.map((r, i) => {
                const qId = exam.questions[i].id;
                const isExpanded = expandedQuestions[`review-${qId}`] === true;
                
                return (
                  <div key={i} className={`rounded-[2rem] border-4 border-black overflow-hidden transition-all ${r.isCorrect ? 'bg-green-50' : 'bg-rose-50'}`}>
                    <button 
                      onClick={() => setExpandedQuestions(prev => ({ ...prev, [`review-${qId}`]: !isExpanded }))}
                      className="w-full p-6 flex items-center justify-between gap-4 text-left hover:bg-black/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shrink-0 ${r.isCorrect ? 'bg-green-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {r.isCorrect ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <p className="font-black text-xl truncate max-w-2xl">{i + 1}. {r.question}</p>
                      </div>
                      <div className="p-2 bg-white border-2 border-black rounded-lg">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-6 pt-0 space-y-6 animate-fadeIn">
                        <div className="h-1 bg-black/10 rounded-full mb-6" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border-2 border-black">
                            <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Your Answer</span>
                            <span className={`font-bold ${r.isCorrect ? 'text-green-600' : 'text-rose-600'}`}>{r.userAnswer || '—'}</span>
                          </div>
                          <div className="bg-white p-4 rounded-xl border-2 border-black">
                            <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Correct Answer</span>
                            <span className="font-bold text-green-600">{r.correctAnswer}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-8 shrink-0">
              <button onClick={() => setShowReviewModal(false)} className="flex-1 py-8 bg-white border-8 border-black rounded-[3.5rem] font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none">Return to Exam</button>
              <button onClick={() => handleFinalCalculate(false)} className="flex-1 py-8 bg-green-600 text-white border-8 border-black rounded-[3.5rem] font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none">Submit Registry</button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT HALL CONFIRMATION MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 z-[10015] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white border-[12px] border-black rounded-[5rem] w-full max-w-3xl p-16 md:p-24 space-y-16 shadow-[40px_40px_0px_0px_rgba(225,29,72,1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-6 bg-rose-600"></div>
            <div className="text-center space-y-8">
              <div className="text-[10rem] drop-shadow-xl">🚨</div>
              <h2 className="text-6xl md:text-[8rem] font-black uppercase italic tracking-tighter leading-[0.8] text-rose-600">Emergency <br/>Exit?</h2>
              <p className="text-2xl font-black text-slate-500 uppercase tracking-[0.1em] italic leading-relaxed">
                WARNING: Your current session will be <span className="text-rose-600">terminated</span> and marked as <span className="text-rose-600 underline">abandoned</span> in the National Registry. This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8">
              <button onClick={() => setShowExitModal(false)} className="flex-1 py-10 bg-white border-8 border-black rounded-[3.5rem] font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none">Resume Session</button>
              <button onClick={confirmExit} className="flex-1 py-10 bg-rose-600 text-white border-8 border-black rounded-[3.5rem] font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none">Abandon Hall</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamEngine;
