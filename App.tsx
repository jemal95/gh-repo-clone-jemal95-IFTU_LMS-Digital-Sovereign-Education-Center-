
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CourseCard from './components/CourseCard';
import AITutor from './components/AITutor';
import ExamEngine from './components/ExamEngine';
import CourseViewer from './components/CourseViewer';
import Leaderboard from './components/Leaderboard';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import PerformancePortal from './components/PerformancePortal';
import RegistrationPortal from './components/RegistrationPortal';
import AboutPortal from './components/AboutPortal';
import CampusLocator from './components/CampusLocator';
import DevPortal from './components/DevPortal';
import { MOCK_COURSES, MOCK_NEWS, MOCK_EXAMS, SUMMER_STATS, SUMMER_ACTIVITIES } from './constants';
import { Course, Grade, User, Exam, ExamResult, EducationLevel, Stream, Language, News } from './types';
import { fetchLatestEducationNews } from './services/geminiService';
import { dbService } from './services/dbService';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: { home: 'Home', courses: 'Courses', exams: 'Exams', tutor: 'AI Tutor', about: 'About', news: 'News', locator: 'Locator', login: 'Login', register: 'Register', leaderboard: 'Rankings', performance: 'My Results', documentation: 'Guide' },
  am: { home: 'መነሻ', courses: 'ትምህርቶች', exams: 'ፈተናዎች', tutor: 'AI ረዳት', about: 'ስለ እኛ', news: 'ዜና', locator: 'መፈለጊያ', login: 'ይግቡ', register: 'ይመዝገቡ', leaderboard: 'ደረጃዎች', performance: 'ውጤቴ', documentation: 'መመሪያ' },
  om: { home: 'Mana', courses: 'Koorsoota', exams: 'Qormaata', tutor: 'Gargaaraa AI', about: "Waa'ee", news: 'Oduu', locator: 'Bakka', login: 'Seeni', register: 'Galmaa’i', leaderboard: 'Sadarkaa', performance: 'Bu’aa koo', documentation: 'Qajeelfama' }
};

const INITIAL_USERS: User[] = [
  { 
    id: 'adm-001', 
    name: 'Jemal Fano Haji', 
    role: 'admin', 
    points: 99999, 
    status: 'active', 
    email: 'admin@iftu.edu.et', 
    joinedDate: '2024-01-01', 
    preferredLanguage: 'om', 
    badges: [{ id: 'b1', title: 'Grand Architect', icon: '👑', earnedAt: '2024-01-01' }],
    school: 'IFTU National Digital Center', 
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jemal&backgroundColor=b6e3f4',
    completedLessons: [], completedExams: [], completedCourses: [], certificatesPaid: [],
    nid: 'ET-ADMIN-001', gender: 'Male', dob: '1975-04-12', phoneNumber: '+251 911 000000', address: 'IFTU HQ, Menelik II Square'
  },
  {
    id: 'tch-demo',
    name: 'Demo Instructor',
    role: 'teacher',
    points: 4200,
    status: 'active',
    email: 'demoteach',
    joinedDate: '2024-05-01',
    preferredLanguage: 'en',
    badges: [{ id: 'b-t1', title: 'Senior Mentor', icon: '👨‍🏫', earnedAt: '2024-05-01' }],
    school: 'National STEM Hub',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoTeach&backgroundColor=ffdfbf',
    department: 'Physics & STEM',
    subjects: ['Advanced Mechanics', 'Quantum Theory'],
    salary: 28000,
    nid: 'ET-DEMO-TCH',
    gender: 'Male',
    dob: '1980-01-01'
  },
  {
    id: 'std-demo', 
    name: 'Demo Student', 
    role: 'student', 
    grade: Grade.G12, 
    stream: Stream.NATURAL_SCIENCE,
    level: EducationLevel.SECONDARY, 
    points: 3500, 
    status: 'active', 
    email: 'demostu', 
    joinedDate: '2024-06-10', 
    preferredLanguage: 'en', 
    badges: [{ id: 'b-s1', title: 'Early Achiever', icon: '⭐', earnedAt: '2024-06-15' }],
    school: 'Demo Academy', 
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoStu&backgroundColor=00D05A',
    completedLessons: ['p11-l1'], 
    completedExams: [], 
    completedCourses: ['g11-phys-core'], 
    certificatesPaid: [],
    nid: 'ET-DEMO-STU', gender: 'Female', salary: 250, dob: '2008-01-01'
  },
  {
    id: 'tch-001',
    name: 'Dr. Tesfaye Wolde',
    role: 'teacher',
    points: 5500,
    status: 'active',
    email: 'tesfaye@iftu.edu.et',
    joinedDate: '2024-01-10',
    preferredLanguage: 'en',
    badges: [],
    school: 'Science Hub 1',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tesfaye&backgroundColor=ffdfbf',
    department: 'Physics & STEM',
    subjects: ['Advanced Mechanics', 'Quantum Theory'],
    salary: 24500,
    nid: 'ET-INST-992',
    gender: 'Male',
    dob: '1985-05-20',
    phoneNumber: '+251 922 111222',
    address: 'Bole, Addis Ababa'
  }
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [exams, setExams] = useState<Exam[]>(MOCK_EXAMS);
  const [news, setNews] = useState<News[]>(MOCK_NEWS as News[]);
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [userResults, setUserResults] = useState<ExamResult[]>([]);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [groundedNews, setGroundedNews] = useState<{ text: string, sources: any[] } | null>(null);
  const [isSyncingNews, setIsSyncingNews] = useState(false);
  const [allExamResults, setAllExamResults] = useState<ExamResult[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const dbExams = await dbService.fetchExams();
      if (dbExams && dbExams.length > 0) {
        setExams(dbExams as Exam[]);
      }

      const dbCourses = await dbService.fetchCourses();
      if (dbCourses && dbCourses.length > 0) {
        setCourses(dbCourses as Course[]);
      }

      const dbNews = await dbService.fetchNews();
      if (dbNews && dbNews.length > 0) {
        setNews(dbNews as News[]);
      }
      
      const topStudents = await dbService.fetchTopStudents();
      if (topStudents && topStudents.length > 0) {
        // Merge with initial users to ensure demo accounts are still there
        setUsers(prev => {
          const merged = [...prev];
          topStudents.forEach((s: any) => {
            if (!merged.find(u => u.id === s.id)) {
              merged.push(s as User);
            }
          });
          return merged;
        });
      }

      const dbResults = await dbService.fetchAllResults();
      if (dbResults) setAllExamResults(dbResults as ExamResult[]);
    };
    loadData();

    const handleSyncStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleSyncStatus);
    window.addEventListener('offline', handleSyncStatus);
    return () => {
      window.removeEventListener('online', handleSyncStatus);
      window.removeEventListener('offline', handleSyncStatus);
    };
  }, []);

  const t = (key: string) => TRANSLATIONS[currentLang][key] || key;

  const handleLogin = async (e?: React.FormEvent, overrideEmail?: string, overridePassword?: string) => {
    if (e) e.preventDefault();
    const targetEmail = overrideEmail || loginEmail;
    const targetPassword = overridePassword || loginPassword;
    setIsAuthenticating(true);
    
    try {
      // 1. Try Supabase Auth first
      const { user: authUser, error } = await dbService.signIn(targetEmail, targetPassword);
      
      if (authUser) {
        // 2. Fetch full profile from users table
        const profile = await dbService.fetchUserProfile(authUser.id);
        if (profile) {
          setIsLoggedIn(true);
          setCurrentUser(profile as User);
          setActiveView(profile.role === 'admin' ? 'admin' : profile.role === 'teacher' ? 'teacher' : 'home');
          
          // Fetch results
          const results = await dbService.fetchResults(profile.id);
          if (results) setUserResults(results as any);
          setIsAuthenticating(false);
          return;
        }
      }

      // 3. Fallback to Mock Users for demo accounts (demoteach, demostu)
      const mockUser = users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
      if (mockUser && (targetEmail === 'demoteach' || targetEmail === 'demostu' || targetEmail === 'admin@iftu.edu.et')) {
        setIsLoggedIn(true);
        setCurrentUser(mockUser);
        setActiveView(mockUser.role === 'admin' ? 'admin' : mockUser.role === 'teacher' ? 'teacher' : 'home');
        setIsAuthenticating(false);
        return;
      }

      alert(error?.message || "ERROR: Identity not found or invalid credentials.");
    } catch (err) {
      console.error(err);
      alert("Authentication failed.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCertPaid = async (courseId: string) => {
    if (currentUser) {
      const updatedPaid = Array.from(new Set([...(currentUser.certificatesPaid || []), courseId]));
      const updatedUser = { ...currentUser, certificatesPaid: updatedPaid };
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
      await dbService.syncUser(updatedUser);
    }
  };

  const renderContent = () => {
    if (activeView === 'login') return (
      <div className="max-w-4xl mx-auto py-24 px-4">
        <div className="bg-white p-12 md:p-24 rounded-[4rem] border-8 border-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] space-y-16 text-center">
          <h2 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-none">
            ENTER <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-green-500 bg-clip-text text-transparent">PORTAL.</span>
          </h2>
          
          <div className="space-y-8 max-w-md mx-auto">
            <div className="relative">
              <input 
                type="email" 
                placeholder="Identity Email" 
                className="w-full p-8 bg-white border-8 border-black rounded-[2.5rem] font-black text-xl outline-none focus:shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] transition-all"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <button 
              onClick={() => handleLogin()}
              disabled={isAuthenticating}
              className="w-full py-8 bg-black text-white rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4"
            >
              {isAuthenticating ? 'AUTHENTICATING...' : 'ACCESS REGISTRY →'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t-8 border-black/5">
             <button 
               onClick={() => handleLogin(undefined, 'admin@iftu.edu.et')} 
               className="p-6 bg-purple-100 border-4 border-black rounded-[2.5rem] font-black uppercase text-[10px] hover:bg-purple-200 transition-all flex items-center justify-center gap-4"
             >
               <span className="text-2xl">👑</span> Admin Demo
             </button>
             <button 
               onClick={() => handleLogin(undefined, 'demoteach')} 
               className="p-6 bg-orange-100 border-4 border-black rounded-[2.5rem] font-black uppercase text-[10px] hover:bg-orange-200 transition-all flex items-center justify-center gap-4"
             >
               <span className="text-2xl">👨‍🏫</span> Teacher Demo
             </button>
             <button 
               onClick={() => handleLogin(undefined, 'demostu')} 
               className="p-6 bg-blue-100 border-4 border-black rounded-[2.5rem] font-black uppercase text-[10px] hover:bg-blue-200 transition-all flex items-center justify-center gap-4"
             >
               <span className="text-2xl">🎓</span> Student Demo
             </button>
          </div>

          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Authorized Personnel Only • National Security Protocols Active
          </p>
        </div>
      </div>
    );

    if (activeView === 'register') return <RegistrationPortal onRegister={async (u, password) => { 
      setIsAuthenticating(true);
      try {
        const { user: authUser, session, error } = await dbService.signUp(u.email, password, u);
        
        if (error) {
          alert(`REGISTRATION FAILED: ${error.message}`);
          setIsAuthenticating(false);
          return;
        }

        if (authUser) {
          // If session is null, email confirmation is required
          if (!session && !authUser.email_confirmed_at) {
            alert("REGISTRATION SUCCESSFUL! Please check your email and click the confirmation link before logging in.");
            setActiveView('login');
          } else {
            const fullUser = { ...u, id: authUser.id };
            setUsers([...users, fullUser]); 
            setCurrentUser(fullUser); 
            setIsLoggedIn(true); 
            setActiveView('home'); 
          }
        }
      } catch (err) {
        console.error(err);
        alert("An unexpected error occurred during registration.");
      } finally {
        setIsAuthenticating(false);
      }
    }} onCancel={() => setActiveView('login')} />;

    if (isLoggedIn) {
      if (activeView === 'admin' && currentUser?.role === 'admin') {
        return (
          <AdminDashboard 
            users={users} 
            courses={courses} 
            exams={exams} 
            news={news} 
            examResults={allExamResults}
            onUpdateUser={async (u) => {
              setUsers(users.map(usr => usr.id === u.id ? u : usr));
              await dbService.syncUser(u);
            }} 
            onAddUser={async (u) => {
              setUsers([...users, u]);
              await dbService.syncUser(u);
            }} 
            onDeleteUser={async (id) => {
              setUsers(users.filter(u => u.id !== id));
              await dbService.deleteUser(id);
            }} 
            onUpdateCourse={async (c) => {
              setCourses(courses.map(crs => crs.id === c.id ? c : crs));
              await dbService.syncCourse(c);
            }} 
            onAddCourse={async (c) => {
              setCourses([...courses, c]);
              await dbService.syncCourse(c);
            }} 
            onDeleteCourse={async (id) => {
              setCourses(courses.filter(c => c.id !== id));
              await dbService.deleteCourse(id);
            }} 
            onAddNews={async (n) => {
              setNews([n, ...news]);
              await dbService.syncNews(n);
            }}
            onUpdateNews={async (n) => {
              setNews(news.map(bulletin => bulletin.id === n.id ? n : bulletin));
              await dbService.syncNews(n);
            }}
            onDeleteNews={async (id) => {
              setNews(news.filter(n => n.id !== id));
              await dbService.deleteNews(id);
            }}
            onNavClick={setActiveView}
          />
        );
      }
      if (activeView === 'teacher' && currentUser?.role === 'teacher') {
        return (
          <TeacherDashboard 
            exams={exams} 
            courses={courses}
            onAddExam={async (ex) => { 
              setExams([...exams, ex]); 
              await dbService.syncExam(ex);
            }} 
            onDeleteExam={(id) => setExams(exams.filter(e => e.id !== id))} 
            onUpdateExam={async (ex) => {
              setExams(exams.map(e => e.id === ex.id ? ex : e));
              await dbService.syncExam(ex);
            }}
            onAddCourse={async (c) => {
              setCourses([...courses, c]);
              await dbService.syncCourse(c);
            }}
            onDeleteCourse={async (id) => {
              setCourses(courses.filter(c => c.id !== id));
              await dbService.deleteCourse(id);
            }}
            onUpdateCourse={async (c) => {
              setCourses(courses.map(crs => crs.id === c.id ? c : crs));
              await dbService.syncCourse(c);
            }}
          />
        );
      }
    }

    switch(activeView) {
      case 'courses':
        return (
          <div className="space-y-16 animate-fadeIn">
            <h2 className="text-9xl font-black uppercase italic tracking-tighter leading-none text-blue-900">Catalogue.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {courses.map(c => (
                <CourseCard 
                  key={c.id} 
                  course={c} 
                  userRole={currentUser?.role}
                  onClick={(crs) => isLoggedIn ? setViewingCourse(crs) : setActiveView('login')} 
                  completedLessonIds={currentUser?.completedLessons}
                  completedCourseIds={currentUser?.completedCourses}
                />
              ))}
            </div>
          </div>
        );
      case 'news':
        return (
          <div className="max-w-6xl mx-auto space-y-24 py-12 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
              <h2 className="text-9xl font-black uppercase italic tracking-tighter leading-none text-blue-900">Bulletin.</h2>
              <button onClick={async () => { setIsSyncingNews(true); const d = await fetchLatestEducationNews(); if (d) setGroundedNews(d); setIsSyncingNews(false); }} disabled={isSyncingNews || !isOnline} className="bg-[#00D05A] text-white px-10 py-6 rounded-[2.5rem] border-8 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center gap-4">
                {isSyncingNews ? 'SYNCING...' : '📡 Sync National Feed'}
              </button>
            </div>
            {groundedNews && (
               <div className="bg-blue-50 border-8 border-black rounded-[5rem] p-12 md:p-20 space-y-10 shadow-[30px_30px_0px_0px_rgba(59,130,246,1)]">
                 <p className="text-sm font-black uppercase tracking-widest text-red-600 italic">Live Grounded Update</p>
                 <div className="prose prose-2xl max-w-none font-bold text-gray-800 italic whitespace-pre-wrap">{groundedNews.text}</div>
               </div>
            )}
            <div className="grid grid-cols-1 gap-16">
              {news.map(n => (
                <div key={n.id} className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row">
                  <div className="w-full lg:w-[450px] h-96 border-b-8 lg:border-b-0 lg:border-r-8 border-black shrink-0">
                    <img src={n.image} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="p-12 md:p-20 space-y-8">
                    <h3 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">{n.title}</h3>
                    <p className="text-2xl font-bold text-gray-500 italic leading-relaxed">{n.summary}</p>
                    <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">{n.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'exams':
        return (
          <div className="max-w-4xl mx-auto space-y-16 py-12 animate-fadeIn">
            <h2 className="text-8xl font-black uppercase italic tracking-tighter text-blue-900 leading-none">Mock Sessions.</h2>
            <div className="grid grid-cols-1 gap-8">
              {exams.map(ex => (
                <div key={ex.id} className="bg-white p-10 md:p-12 rounded-[3.5rem] border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-8 hover:translate-x-2 transition-all">
                  <h3 className="text-3xl md:text-4xl font-black uppercase italic leading-none tracking-tight">{ex.title}</h3>
                  <button onClick={() => isLoggedIn ? setActiveExam(ex) : setActiveView('login')} className="px-12 py-5 bg-black text-white rounded-2xl border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1">Launch</button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'performance':
        return <PerformancePortal results={userResults} exams={exams} currentUser={currentUser || undefined} courses={courses} onCertPaid={handleCertPaid} />;
      case 'leaderboard':
        return <Leaderboard students={users} />;
      case 'tutor':
        return <AITutor />;
      case 'locator':
        return <CampusLocator />;
      case 'about':
        return <AboutPortal />;
      case 'documentation':
        return <DevPortal />;
      default:
        return (
          <div className="space-y-24 animate-fadeIn">
            <section className="rounded-[4rem] p-12 md:p-32 text-white bg-gradient-to-br from-[#ef3340] to-black border-8 border-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col items-center text-center">
              <div className="relative z-10 max-w-6xl space-y-12">
                <h1 className="text-6xl md:text-[12rem] font-black uppercase tracking-tighter leading-[0.8] italic">
                  SOVEREIGN <br/> LEARNING
                </h1>
                <p className="text-xl md:text-3xl font-black uppercase tracking-widest italic opacity-90">Empowering Ethiopia's Digital Generation.</p>
                {!isLoggedIn && (
                  <div className="flex flex-col sm:flex-row gap-8 justify-center pt-8">
                    <button onClick={() => setActiveView('register')} className="bg-white text-black px-12 py-6 rounded-[2.5rem] border-8 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all">START REGISTRY</button>
                    <button onClick={() => setActiveView('login')} className="bg-black text-white px-12 py-6 rounded-[2.5rem] border-8 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] hover:scale-105 transition-all">ACCESS PORTAL</button>
                  </div>
                )}
              </div>
            </section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
              {SUMMER_STATS.map((s, i) => (
                <div key={i} className="bg-white border-8 border-black rounded-[3rem] p-8 md:p-12 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center group hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-gray-50 border-4 border-black rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                    {s.icon}
                  </div>
                  <h3 className="text-4xl md:text-6xl font-black italic mb-2" style={{ color: s.color }}>{s.value}</h3>
                  <p className="text-[8px] md:text-[10px] font-black uppercase text-gray-400 tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd]">
      {activeExam && (
        <ExamEngine 
          exam={activeExam} 
          onComplete={async (res) => { 
            setUserResults([...userResults, res]); 
            setActiveExam(null); 
            setActiveView('performance');
            if (currentUser) {
              await dbService.saveExamResult({ ...res, studentId: currentUser.id });
              await dbService.syncUser({ ...currentUser, points: currentUser.points + res.score });
            }
          }} 
          onCancel={() => setActiveExam(null)} 
        />
      )}
      {viewingCourse && (
        <CourseViewer 
          course={viewingCourse} 
          onClose={() => setViewingCourse(null)} 
          language={currentLang} 
          currentUser={currentUser}
          onUserUpdate={(updatedUser) => {
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
          }}
        />
      )}
      {!activeExam && !viewingCourse && (
        <>
          <Header onNavClick={setActiveView} activeView={activeView} isLoggedIn={isLoggedIn} userRole={currentUser?.role} onLogout={() => { setIsLoggedIn(false); setCurrentUser(null); setActiveView('home'); }} onLoginClick={() => setActiveView('login')} currentLang={currentLang} onLangChange={setCurrentLang} t={t} accessibilitySettings={{}} onAccessibilityChange={() => {}} />
          <main className="flex-grow w-full max-w-screen-2xl mx-auto px-4 py-16">{renderContent()}</main>
          <footer className="bg-black text-white py-24 px-8 mt-20 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 ethiopian-gradient"></div>
             <div className="flex flex-col items-center gap-8">
               <p className="text-[14px] font-black uppercase tracking-[0.6em] text-white/60">© 2026 <span className="liquid-spectrum-text">IFTU NATIONAL DIGITAL CENTER</span>.</p>
               <a 
                 href="https://github.com/jemalfano030/iftu-portal" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-full transition-all group"
               >
                 <span className="text-white/40 group-hover:text-white transition-colors">View Source on GitHub</span>
                 <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg">
                   <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black" xmlns="http://www.w3.org/2000/svg">
                     <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                   </svg>
                 </div>
               </a>
             </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
