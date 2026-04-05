
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Course, Lesson, Question, Language, User, AssignmentSubmission } from '../types';
import { getLessonDeepDive } from '../services/geminiService';
import Markdown from 'react-markdown';
import { dbService } from '../services/dbService';
import LiveInterviewer from './LiveInterviewer';
import CertificatePortal from './CertificatePortal';

const SovereignSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 border-4 border-black/5 rounded-2xl ${className}`}>
    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
  </div>
);

interface CustomVideoPlayerProps {
  src: string;
  title: string;
  onEnded?: () => void;
}

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ src, title, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Handle YouTube Shorts
    if (url.includes('/shorts/')) {
      const id = url.split('/shorts/')[1].split(/[?#]/)[0];
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&origin=${window.location.origin}`;
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    
    if (id) {
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&origin=${window.location.origin}`;
    }
    return url;
  };

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be') || src.includes('youtube-nocookie.com');
  const sanitizedSrc = getEmbedUrl(src);

  useEffect(() => {
    setIsInitialLoading(true);
    setHasError(false);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) {
      if (isYouTube) {
        const timer = setTimeout(() => setIsInitialLoading(false), 1000);
        return () => clearTimeout(timer);
      }
      return;
    }
    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };
    const updateDuration = () => {
      setDuration(video.duration);
      setIsInitialLoading(false);
    };
    const handleError = () => {
      if (src) setHasError(true);
      setIsInitialLoading(false);
    };
    const handleVideoEnded = () => {
      if (onEnded) onEnded();
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleVideoEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleVideoEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [src, isYouTube]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setProgress(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) setVolume(0);
      else setVolume(videoRef.current.volume || 1);
    }
  };

  const toggleFullScreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative aspect-video w-full bg-black rounded-[3.5rem] border-[8px] border-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] overflow-hidden group"
    >
      {isInitialLoading && (
        <div className="absolute inset-0 z-20 bg-white p-8 flex flex-col items-center justify-center space-y-8">
          <div className="w-32 h-32 border-[12px] border-black border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xl font-black uppercase italic tracking-tighter">Establishing Module Link...</p>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 z-20 bg-rose-50 p-8 flex flex-col items-center justify-center space-y-6 text-center">
          <div className="text-6xl">⚠️</div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-rose-600">Video Stream Interrupted</h3>
          <p className="text-sm font-bold text-gray-500 uppercase">The resource at this address is currently unreachable.</p>
          <button onClick={() => window.location.reload()} className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase text-xs">Retry Connection</button>
        </div>
      )}

      {isYouTube && sanitizedSrc ? (
        <iframe 
          className="w-full h-full" 
          src={sanitizedSrc} 
          title={title} 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen 
          onLoad={() => setIsInitialLoading(false)}
        ></iframe>
      ) : (
        <>
          <video ref={videoRef} src={src} className="w-full h-full cursor-pointer" onClick={togglePlay} playsInline />
          
          {/* Custom Controls */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-8 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="space-y-4">
              {/* Seek Bar */}
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress} 
                onChange={handleSeek}
                className="w-full h-2 bg-white/30 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
              
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-6">
                  <button onClick={togglePlay} className="hover:scale-110 transition-transform">
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>
                  
                  <div className="flex items-center gap-3 group/volume">
                    <button onClick={toggleMute}>
                      {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={volume} 
                      onChange={handleVolumeChange}
                      className="w-0 group-hover/volume:w-24 transition-all h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-white"
                    />
                  </div>
                  
                  <span className="text-xs font-black font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                
                <div className="flex items-center gap-6">
                   <button onClick={() => { if(videoRef.current) videoRef.current.currentTime = 0; }} className="hover:rotate-[-45deg] transition-transform" title="Restart">
                     <RotateCcw size={20} />
                   </button>
                   <button onClick={toggleFullScreen} className="hover:scale-110 transition-transform" title="Full Screen">
                     <Maximize size={20} />
                   </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface SecurePDFViewerProps {
  url: string;
  title: string;
}

const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({ url, title }) => {
  const [loadError, setLoadError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(false);
    setLoadError(false);
  }, [url]);
  const secureUrl = url ? `${url}#toolbar=0&navpanes=0&scrollbar=0` : '';
  if (loadError || !url) {
    return (
      <div className="w-full h-[800px] bg-rose-50 border-8 border-black rounded-[3.5rem] flex flex-col items-center justify-center p-12 text-center space-y-8">
        <div className="text-9xl">📖</div>
        <h3 className="text-5xl font-black uppercase italic tracking-tighter text-rose-600">Secure Stream Failure</h3>
      </div>
    );
  }
  return (
    <div className="w-full h-[850px] bg-gray-200 border-8 border-black rounded-[3.5rem] shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative group">
      {!isLoaded && (
        <div className="absolute inset-0 bg-white p-20 z-10 space-y-12 flex flex-col items-center justify-center">
           <div className="w-24 h-24 border-[10px] border-black border-t-blue-600 rounded-full animate-spin"></div>
           <p className="text-2xl font-black uppercase italic tracking-tighter animate-pulse">Establishing Sovereign Stream...</p>
        </div>
      )}
      <iframe src={secureUrl} className="w-full h-full border-none" title={title} onLoad={() => setIsLoaded(true)}></iframe>
    </div>
  );
};

interface LessonQuizProps {
  questions: Question[];
  onComplete: (score: number) => void;
  onCancel: () => void;
}

const LessonQuiz: React.FC<LessonQuizProps> = ({ questions, onComplete, onCancel }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentIdx];

  const handleAnswer = (answer: number | string) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return Math.round((correct / questions.length) * 100);
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="bg-white p-12 rounded-[3rem] border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] text-center space-y-8 animate-scaleIn">
        <div className="text-8xl">🎯</div>
        <h3 className="text-4xl font-black uppercase italic tracking-tighter">Quiz Complete!</h3>
        <div className="text-6xl font-black text-blue-600">{score}%</div>
        <p className="text-xl font-bold text-gray-500 uppercase tracking-widest">
          {score >= 70 ? 'Excellent Work! You have mastered this lesson.' : 'Good effort, but you might want to review the material again.'}
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={onCancel} className="px-8 py-4 bg-gray-100 border-4 border-black rounded-2xl font-black uppercase text-sm">Review Lesson</button>
          <button onClick={() => onComplete(score)} className="px-12 py-4 bg-black text-white border-4 border-black rounded-2xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]">Continue →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-12 rounded-[3rem] border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center border-b-4 border-black pb-4">
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Question {currentIdx + 1} of {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-8 h-2 rounded-full border-2 border-black ${i <= currentIdx ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
          ))}
        </div>
      </div>

      <h4 className="text-2xl md:text-3xl font-black leading-tight">{currentQuestion.text}</h4>

      <div className="grid gap-4">
        {currentQuestion.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            className={`w-full text-left p-6 rounded-2xl border-4 border-black font-black transition-all flex items-center gap-4 ${answers[currentQuestion.id] === i ? 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}`}
          >
            <span className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center bg-black/10 text-xs">{String.fromCharCode(65 + i)}</span>
            {opt}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4">
        <button onClick={onCancel} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Exit Quiz</button>
        <button 
          onClick={nextQuestion}
          disabled={answers[currentQuestion.id] === undefined}
          className={`px-10 py-4 rounded-2xl border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${answers[currentQuestion.id] === undefined ? 'bg-gray-100 text-gray-400 shadow-none' : 'bg-yellow-400 hover:translate-y-1'}`}
        >
          {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

interface CourseViewerProps {
  course: Course;
  initialLessonId?: string;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdate: (user: User) => void;
  language?: Language;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ 
  course, 
  initialLessonId, 
  onClose, 
  currentUser,
  onUserUpdate,
  language = 'en' 
}) => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(
    course.lessons.find(l => l.id === initialLessonId) || course.lessons[0] || null
  );
  const [deepDive, setDeepDive] = useState<{ content: string; type: 'simpler' | 'advanced' | null }>({ content: '', type: null });
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  const completedLessonIds = currentUser?.completedLessons || [];
  const isCourseComplete = course.lessons.every(l => completedLessonIds.includes(l.id));

  useEffect(() => {
    const fetchSubmission = async () => {
      if (activeLesson?.contentType === 'assignment' && currentUser) {
        const sub = await dbService.fetchUserSubmission(activeLesson.id, currentUser.id);
        setSubmission(sub);
      } else {
        setSubmission(null);
      }
    };
    fetchSubmission();
  }, [activeLesson, currentUser]);

  const handleAssignmentSubmit = async () => {
    if (!activeLesson || !currentUser || !uploadFile) return;

    setIsSubmitting(true);
    try {
      // Simulate file upload - in a real app, this would be Firebase Storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileUrl = reader.result as string; // Data URL for simulation
        
        const newSubmission: AssignmentSubmission = {
          id: `sub-${Date.now()}`,
          assignmentId: activeLesson.id,
          studentId: currentUser.id,
          studentName: currentUser.name,
          submittedAt: new Date().toISOString(),
          fileUrl: fileUrl,
          status: 'submitted',
        };

        await dbService.syncSubmission(newSubmission);
        setSubmission(newSubmission);
        setUploadFile(null);
        alert("Assignment Submitted Successfully!");
        
        // Mark lesson as complete after submission
        handleFinish(100);
      };
      reader.readAsDataURL(uploadFile);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async (score?: number) => {
    if (!activeLesson || isSyncing) return;

    if (!currentUser) {
      alert("Please login to track your progress and earn points.");
      return;
    }

    // If lesson has a quiz and we haven't shown it yet, show it
    if (activeLesson.questions && activeLesson.questions.length > 0 && !showQuiz && !completedLessonIds.includes(activeLesson.id)) {
      setShowQuiz(true);
      return;
    }

    const points = score !== undefined ? Math.round(score / 2) : 50;
    
    // Check if already completed to avoid duplicate points/entries
    const isAlreadyCompleted = completedLessonIds.includes(activeLesson.id);
    
    setIsSyncing(true);
    try {
      const updatedCompletedLessons = Array.from(new Set([...completedLessonIds, activeLesson.id]));
      
      // Check if course is now complete
      const isCourseComplete = course.lessons.every(l => updatedCompletedLessons.includes(l.id));
      const updatedCompletedCourses = isCourseComplete 
        ? Array.from(new Set([...(currentUser.completedCourses || []), course.id])) 
        : (currentUser.completedCourses || []);

      const updatedUser: User = { 
        ...currentUser, 
        points: isAlreadyCompleted ? currentUser.points : currentUser.points + points, 
        completedLessons: updatedCompletedLessons, 
        completedCourses: updatedCompletedCourses 
      };

      // Update local state
      onUserUpdate(updatedUser);

      // Persist to database
      await dbService.syncUser(updatedUser);

      setJustCompletedId(activeLesson.id);
      setShowQuiz(false);
      setTimeout(() => setJustCompletedId(null), 2000);

      // Move to next lesson or close
      const currentIdx = course.lessons.findIndex(l => l.id === activeLesson.id);
      if (currentIdx < course.lessons.length - 1) {
        // Optional: show a small success message
        setTimeout(() => {
          setActiveLesson(course.lessons[currentIdx + 1]);
          setDeepDive({ content: '', type: null });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
      } else if (isCourseComplete) {
        setTimeout(() => {
          setShowCompletionScreen(true);
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#009b44', '#ffcd00', '#ef3340', '#3b82f6'] // Ethiopian + Blue
          });
        }, 1500);
      } else {
        setTimeout(() => alert("Lesson Completed! You have finished all lessons in this course."), 1500);
      }
    } catch (error) {
      console.error("Failed to sync completion:", error);
      alert("National Registry Sync Interrupted. Please check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeepDive = async (type: 'simpler' | 'advanced') => {
    if (!activeLesson || isDeepDiving) return;
    setIsDeepDiving(true);
    setDeepDive({ content: '', type });
    const response = await getLessonDeepDive(activeLesson.content, type, language as Language);
    setDeepDive({ content: response, type });
    setIsDeepDiving(false);
  };

  if (!activeLesson) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden animate-fadeIn no-select">
      {justCompletedId === activeLesson.id && (
        <div className="absolute top-40 left-1/2 -translate-x-1/2 z-[300] bg-green-500 text-white px-10 py-5 rounded-[2.5rem] border-4 border-black font-black uppercase text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 animate-bounce">
          <span className="text-4xl bg-white text-green-500 rounded-full w-10 h-10 flex items-center justify-center">✓</span>
          Lesson Mastered!
        </div>
      )}
      <div className="h-24 md:h-32 border-b-8 border-black flex items-center justify-between px-8 md:px-16 bg-white z-20">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="w-16 h-16 bg-gray-50 border-4 border-black rounded-2xl flex items-center justify-center text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">←</button>
          <h2 className="text-xl md:text-4xl font-black uppercase tracking-tighter italic leading-none">{course.title}</h2>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl border-4 border-black flex items-center justify-center text-2xl">🔒</div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden lg:flex w-96 border-r-8 border-black flex-col bg-gray-50 overflow-y-auto p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="font-black uppercase italic p-4 border-b-4 border-black">Lesson Plan</h3>
            <div className="space-y-4">
              {course.lessons.map((lesson, idx) => (
                <button
                  key={idx}
                  onClick={() => { 
                    setActiveLesson(lesson); 
                    setDeepDive({ content: '', type: null }); 
                    setShowQuiz(false);
                    setShowCompletionScreen(false);
                  }}
                  className={`w-full text-left p-6 rounded-[2rem] border-4 border-black font-black transition-all ${activeLesson.id === lesson.id && !showCompletionScreen ? 'bg-blue-600 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : completedLessonIds.includes(lesson.id) ? 'bg-green-50' : 'bg-white'}`}
                >
                  {idx + 1}. {lesson.title}
                </button>
              ))}
            </div>
          </div>

          {isCourseComplete && (
            <button 
              onClick={() => setShowCompletionScreen(true)}
              className="w-full p-6 bg-yellow-400 border-4 border-black rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <span>🎓</span> Claim Certificate
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f0f2f5] p-6 md:p-12">
          <div className="max-w-5xl mx-auto space-y-12 pb-24">
            {showCompletionScreen ? (
              <div className="bg-white p-12 md:p-24 rounded-[5rem] border-8 border-black shadow-[30px_30px_0px_0px_rgba(34,197,94,1)] text-center space-y-12 animate-scaleIn">
                <div className="text-9xl">🏆</div>
                <div className="space-y-4">
                  <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-blue-900 leading-none">Course <br/>Mastered!</h2>
                  <p className="text-2xl font-bold text-gray-500 uppercase tracking-widest">You have successfully cataloged all knowledge modules.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-6 justify-center">
                  <button 
                    onClick={() => setShowCertificate(true)}
                    className="px-12 py-8 bg-[#00D05A] text-white rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all"
                  >
                    Claim Official Certificate →
                  </button>
                  <button 
                    onClick={() => setShowCompletionScreen(false)}
                    className="px-12 py-8 bg-white text-black rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all"
                  >
                    Review Lessons
                  </button>
                </div>
              </div>
            ) : showQuiz && activeLesson.questions ? (
              <LessonQuiz 
                questions={activeLesson.questions} 
                onComplete={handleFinish} 
                onCancel={() => setShowQuiz(false)} 
              />
            ) : (
              <>
                {/* Conditional Rendering for TVET Oral Assessment or Standard Content */}
            {activeLesson.id.includes('oral') ? (
              <LiveInterviewer topic={activeLesson.title} onComplete={handleFinish} onCancel={onClose} />
            ) : (
              <>
                {activeLesson.contentType === 'video' ? (
                  <CustomVideoPlayer 
                    src={activeLesson.videoUrl || ''} 
                    title={activeLesson.title} 
                    onEnded={() => handleFinish()}
                  />
                ) : activeLesson.contentType === 'assignment' ? (
                  <div className="w-full bg-white border-8 border-black rounded-[3.5rem] p-12 md:p-20 shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] space-y-10">
                    <div className="flex items-center gap-8 border-b-8 border-black pb-8">
                       <div className="w-24 h-24 bg-purple-600 text-white rounded-3xl border-4 border-black flex items-center justify-center text-5xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">📝</div>
                       <div>
                         <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Assignment Portal</h3>
                         <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Submit your work for evaluation</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-2xl font-black uppercase italic">Task Description</h4>
                      <div className="prose prose-xl max-w-none text-gray-700 bg-gray-50 p-8 rounded-3xl border-4 border-black">
                        <Markdown>{activeLesson.content}</Markdown>
                      </div>
                    </div>

                    {submission ? (
                      <div className="bg-green-50 border-4 border-green-600 p-8 rounded-3xl space-y-4">
                        <div className="flex items-center gap-4 text-green-700">
                          <span className="text-3xl">✓</span>
                          <h5 className="text-xl font-black uppercase italic">Work Submitted</h5>
                        </div>
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border-2 border-green-200">
                          <p className="font-bold text-sm">Submitted on: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                          <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-black uppercase text-xs hover:underline">View Submission</a>
                        </div>
                        {submission.grade !== undefined && (
                          <div className="mt-6 p-6 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h6 className="text-lg font-black uppercase italic mb-2">Evaluation Result</h6>
                            <div className="flex items-center gap-4">
                              <span className="text-4xl font-black text-purple-600">{submission.grade}%</span>
                              <p className="text-sm font-bold text-gray-500 italic">"{submission.feedback || 'No feedback provided.'}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="p-12 border-4 border-dashed border-black rounded-[3rem] bg-gray-50 flex flex-col items-center justify-center space-y-6 text-center">
                          <div className="text-6xl">📤</div>
                          <div>
                            <p className="text-xl font-black uppercase italic">Upload your work</p>
                            <p className="text-xs font-bold text-gray-400 uppercase">PDF, DOCX, or ZIP (Max 10MB)</p>
                          </div>
                          <input 
                            type="file" 
                            id="assignment-upload" 
                            className="hidden" 
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          />
                          <label 
                            htmlFor="assignment-upload" 
                            className="px-10 py-4 bg-white border-4 border-black rounded-2xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:translate-y-1 transition-all"
                          >
                            {uploadFile ? uploadFile.name : 'Select File'}
                          </label>
                        </div>

                        <button 
                          onClick={handleAssignmentSubmit}
                          disabled={!uploadFile || isSubmitting}
                          className={`w-full py-8 rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl shadow-[12px_12px_0px_0px_rgba(147,51,234,1)] transition-all ${!uploadFile || isSubmitting ? 'bg-gray-200 text-gray-400 shadow-none' : 'bg-purple-600 text-white hover:translate-y-2'}`}
                        >
                          {isSubmitting ? 'Transmitting...' : 'Deploy Submission →'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : activeLesson.contentType === 'document' ? (
                  <div className="w-full bg-white border-8 border-black rounded-[3.5rem] p-12 md:p-20 shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] space-y-10">
                    <div className="flex items-center gap-8 border-b-8 border-black pb-8">
                       <div className="w-24 h-24 bg-blue-600 text-white rounded-3xl border-4 border-black flex items-center justify-center text-5xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">📚</div>
                       <div>
                         <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Lesson Resource</h3>
                         <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Download or view lesson materials</p>
                       </div>
                    </div>

                    <div className="space-y-8">
                      <div className="p-12 border-4 border-black rounded-[3rem] bg-gray-50 flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="text-8xl">📄</div>
                        <h4 className="text-3xl font-black uppercase italic">{activeLesson.fileName || 'Lesson Document'}</h4>
                        <a 
                          href={activeLesson.fileUrl} 
                          download={activeLesson.fileName || 'lesson-document'}
                          className="px-12 py-6 bg-black text-white border-4 border-black rounded-2xl font-black uppercase text-lg shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all"
                        >
                          📥 Download Document
                        </a>
                      </div>
                      
                      {activeLesson.fileName?.toLowerCase().endsWith('.pdf') && (
                        <SecurePDFViewer url={activeLesson.fileUrl || ''} title={activeLesson.title} />
                      )}
                    </div>
                  </div>
                ) : (
                  <SecurePDFViewer url={activeLesson.pdfUrl || ''} title={activeLesson.title} />
                )}
                
                <div className="bg-white p-10 md:p-20 rounded-[4rem] border-8 border-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] space-y-12">
                  <div className="flex flex-col gap-6">
                    <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none">{activeLesson.title}</h1>
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => handleDeepDive('simpler')} 
                        className="flex items-center gap-2 bg-yellow-400 border-4 border-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all hover:bg-yellow-300"
                      >
                        <Sparkles className="w-4 h-4" />
                        Explain This Simply
                      </button>
                      <button 
                        onClick={() => handleDeepDive('advanced')} 
                        className="bg-blue-600 text-white border-4 border-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all hover:bg-blue-500"
                      >
                        Advanced Context
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-2xl max-w-none text-gray-700 leading-relaxed">
                    <Markdown>{activeLesson.content}</Markdown>
                  </div>
                  <div className="pt-10 flex justify-center">
                    <button 
                      onClick={() => handleFinish()} 
                      disabled={isSyncing}
                      className={`px-20 py-8 rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl transition-all duration-500 ${
                        !currentUser 
                          ? 'bg-gray-200 text-gray-500 shadow-none'
                          : completedLessonIds.includes(activeLesson.id) 
                            ? `bg-green-500 text-white shadow-none cursor-default ${justCompletedId === activeLesson.id ? 'scale-105' : ''}` 
                            : 'bg-black text-white shadow-[12px_12px_0px_0px_rgba(34,197,94,1)] hover:translate-y-2'
                      }`}
                    >
                      {isSyncing ? 'Syncing...' : !currentUser ? 'Login to Track Progress' : completedLessonIds.includes(activeLesson.id) ? (
                        <span className="flex items-center gap-4">
                          Lesson Completed 
                          <span className={`inline-block ${justCompletedId === activeLesson.id ? 'animate-bounce text-4xl' : ''}`}>✓</span>
                        </span>
                      ) : 'Mark Complete →'}
                    </button>
                  </div>
                </div>

                {(deepDive.type || isDeepDiving) && (
                  <div className="bg-blue-50 border-8 border-black rounded-[4rem] p-12 md:p-20 shadow-[25px_25px_0px_0px_rgba(59,130,246,1)] relative">
                    <button 
                      onClick={() => setDeepDive({ content: '', type: null })}
                      className="absolute top-8 right-8 w-12 h-12 bg-white border-4 border-black rounded-xl flex items-center justify-center text-xl hover:bg-gray-100 transition-colors"
                    >
                      ✕
                    </button>
                    <h4 className="text-4xl font-black uppercase italic mb-8">{deepDive.type === 'simpler' ? 'Simpler logic' : 'Advanced context'}</h4>
                    {isDeepDiving ? <p className="animate-pulse">Synthesizing...</p> : <p className="text-2xl leading-relaxed italic">{deepDive.content}</p>}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  </div>
      {showCertificate && currentUser && (
        <CertificatePortal 
          user={currentUser} 
          course={course} 
          onClose={() => { setShowCertificate(false); onClose(); }} 
        />
      )}
    </div>
  );
};

export default CourseViewer;
