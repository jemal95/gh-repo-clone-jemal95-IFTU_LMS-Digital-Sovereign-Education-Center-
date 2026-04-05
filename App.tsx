
import React, { useState, useEffect } from 'react';
import StudentProfile from './components/StudentProfile';
import Header from './components/Header';
import CourseCard from './components/CourseCard';
import AITutor from './components/AITutor';
import ExamEngine from './components/ExamEngine';
import CourseViewer from './components/CourseViewer';
import Leaderboard from './components/Leaderboard';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import PerformancePortal from './components/PerformancePortal';
import AboutPortal from './components/AboutPortal';
import CampusLocator from './components/CampusLocator';
import DevPortal from './components/DevPortal';
import ProjectReportPortal from './components/ProjectReportPortal';
import FeedbackWidget from './components/FeedbackWidget';
import { MOCK_COURSES, MOCK_NEWS, MOCK_EXAMS, SUMMER_STATS, SUMMER_ACTIVITIES } from './constants';
import { Course, Grade, User, Exam, ExamResult, EducationLevel, Stream, Language, News, Assignment, AssignmentSubmission } from './types';
import { fetchLatestEducationNews, generateExamsForGrades } from './services/geminiService';
import { auth } from './firebase';
import { AssignmentPortal } from './components/AssignmentPortal';
import { StudyHall } from './components/StudyHall';
import { dbService } from './services/dbService';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: { 
    home: 'Home', 
    courses: 'Courses', 
    news: 'News', 
    mediahub: 'Media Hub', 
    about: 'About', 
    locator: 'Locator', 
    guide: 'Guide', 
    projectreport: 'Project Report',
    exams: 'Exams', 
    assignments: 'Assignments', 
    studyhall: 'Study Hall', 
    tutor: 'AI Tutor', 
    login: 'Login', 
    leaderboard: 'Rankings', 
    performance: 'My Results'
  },
  am: { 
    home: 'መነሻ', 
    courses: 'ትምህርቶች', 
    news: 'ዜና', 
    mediahub: 'ሚዲያ', 
    about: 'ስለ እኛ', 
    locator: 'መፈለጊያ', 
    guide: 'መመሪያ', 
    projectreport: 'የፕሮጀክት ሪፖርት',
    exams: 'ፈተናዎች', 
    assignments: 'ተግባራት', 
    studyhall: 'የጥናት አዳራሽ', 
    tutor: 'AI ረዳት', 
    login: 'ይግቡ', 
    leaderboard: 'ደረጃዎች', 
    performance: 'ውጤቴ'
  },
  om: { 
    home: 'Mana', 
    courses: 'Koorsoota', 
    news: 'Oduu', 
    mediahub: 'Media Hub', 
    about: "Waa'ee", 
    locator: 'Bakka', 
    guide: 'Qajeelfama', 
    projectreport: 'Gabaasa Piroojektii',
    exams: 'Qormaata', 
    assignments: 'Hojiiwwan', 
    studyhall: 'Mana Qo’annoo', 
    tutor: 'Gargaaraa AI', 
    login: 'Seeni', 
    leaderboard: 'Sadarkaa', 
    performance: 'Bu’aa koo'
  }
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
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
    completedLessons: [], completedExams: [], completedCourses: [], certificatesPaid: [],
    nid: 'ET-ADMIN-001', gender: 'Male', dob: '1975-04-12', phoneNumber: '+251 911 000000', address: 'IFTU HQ, Menelik II Square'
  },
  {
    id: 'tch-demo',
    name: 'Demo Instructor',
    role: 'teacher',
    points: 4200,
    status: 'active',
    email: 'teacher@iftu.edu.et',
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
    email: 'student@iftu.edu.et', 
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
    id: 'std-abdulkadir',
    name: 'Abdulkadir Nure hinsene',
    role: 'student',
    grade: Grade.G12,
    stream: Stream.NATURAL_SCIENCE,
    level: EducationLevel.SECONDARY,
    points: 0,
    status: 'active',
    email: '5890385378017045@students.iftu.edu.et',
    joinedDate: '2026-03-20',
    preferredLanguage: 'en',
    badges: [],
    school: 'National Digital Center',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abdulkadir&backgroundColor=b6e3f4',
    completedLessons: [],
    completedExams: [],
    completedCourses: [],
    certificatesPaid: [],
    nid: '5890385378017045',
    gender: 'Male',
    dob: '2007-05-15'
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
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [userResults, setUserResults] = useState<ExamResult[]>([]);
  const [simulatedMessages, setSimulatedMessages] = useState<{id: string, text: string, date: string}[]>([]);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [groundedNews, setGroundedNews] = useState<{ text: string, sources: any[] } | null>(null);
  const [isSyncingNews, setIsSyncingNews] = useState(false);
  const [isGeneratingExams, setIsGeneratingExams] = useState(false);
  const [examGenProgress, setExamGenProgress] = useState('');
  const [allExamResults, setAllExamResults] = useState<ExamResult[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ courses: Course[], news: News[], exams: Exam[] }>({ courses: [], news: [], exams: [] });
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [streamFilter, setStreamFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dbError, setDbError] = useState<string | null>(null);

  const handleGlobalSearch = (query: string) => {
    setGlobalSearchQuery(query);
    const lowerQuery = query.toLowerCase();
    
    const filteredCourses = courses.filter(c => 
      c.title.toLowerCase().includes(lowerQuery) || 
      c.description.toLowerCase().includes(lowerQuery) ||
      c.code.toLowerCase().includes(lowerQuery)
    );

    const filteredNews = news.filter(n => 
      n.title.toLowerCase().includes(lowerQuery) || 
      n.content.toLowerCase().includes(lowerQuery) ||
      n.tag.toLowerCase().includes(lowerQuery)
    );

    const filteredExams = exams.filter(e => 
      e.title.toLowerCase().includes(lowerQuery) || 
      e.description?.toLowerCase().includes(lowerQuery) ||
      e.subject?.toLowerCase().includes(lowerQuery)
    );

    setSearchResults({ courses: filteredCourses, news: filteredNews, exams: filteredExams });
    setActiveView('search');
  };

  const handleSyncNews = async () => {
    if (!isOnline) return;
    setIsSyncingNews(true);
    try {
      const latestNews = await fetchLatestEducationNews();
      if (latestNews && latestNews.length > 0) {
        // Update local state
        setNews(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newItems = latestNews.filter(n => !existingIds.has(n.id));
          return [...newItems, ...prev];
        });
        // Sync to Firestore
        for (const item of latestNews) {
          await dbService.addNews(item);
        }
      }
    } catch (error) {
      console.error("Sync News Error:", error);
    } finally {
      setIsSyncingNews(false);
    }
  };

  const handleGenerateNationalExams = async () => {
    if (!isOnline) return;
    setIsGeneratingExams(true);
    const grades: Grade[] = [Grade.G9, Grade.G10, Grade.G11, Grade.G12];
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Geography', 'History', 'Economics', 'Civics'];
    
    try {
      for (const grade of grades) {
        for (const subject of subjects) {
          setExamGenProgress(`Generating ${subject} for Grade ${grade}...`);
          const examData = await generateExamsForGrades(grade, subject);
          
          if (examData && examData.questions && examData.questions.length > 0) {
            const newExam: Exam = {
              id: `nat-${grade}-${subject.toLowerCase()}-${Date.now()}`,
              title: examData.title || `${subject} - Grade ${grade} (Unit 1)`,
              courseCode: examData.courseCode || `${subject.substring(0,3).toUpperCase()}-${grade}`,
              grade: grade,
              stream: (grade === Grade.G11 || grade === Grade.G12) 
                ? (['Geography', 'History', 'Economics', 'Civics'].includes(subject) ? Stream.SOCIAL_SCIENCE : Stream.NATURAL_SCIENCE)
                : Stream.GENERAL,
              academicYear: 2025,
              durationMinutes: 30,
              questions: examData.questions.map((q: any, idx: number) => ({
                ...q,
                id: `q-${idx}-${Date.now()}`
              })),
              totalPoints: examData.totalPoints || 100,
              status: 'published',
              type: 'National',
              semester: 1,
              subject: subject,
              description: examData.description,
              keyConcepts: examData.keyConcepts
            };
            
            setExams(prev => [...prev, newExam]);
            await dbService.addExam(newExam);
          }
        }
      }
      setExamGenProgress('All National Exams Generated Successfully!');
    } catch (error) {
      console.error("Exam Generation Error:", error);
      setExamGenProgress('Error generating exams.');
    } finally {
      setTimeout(() => {
        setIsGeneratingExams(false);
        setExamGenProgress('');
      }, 3000);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;

    // Auto-sync news if empty
    if (news.length === 0) {
      handleSyncNews();
    }

    const handleError = (err: any) => {
      setDbError(err.message || "Database connection error");
    };

    const unsubExams = dbService.subscribeToExams((data) => {
      if (data.length > 0) setExams(data);
    }, handleError);

    const unsubCourses = dbService.subscribeToCourses((data) => {
      if (data.length > 0) setCourses(data);
    }, handleError);

    const unsubNews = dbService.subscribeToNews((data) => {
      if (data.length > 0) setNews(data);
    }, handleError);

    const unsubUsers = dbService.subscribeToUsers(async (data) => {
      if (data.length > 0) {
        setUsers(data);
        // Sync INITIAL_USERS to Firestore if they don't exist
        for (const initialUser of INITIAL_USERS) {
          if (!data.find(u => u.id === initialUser.id || u.email === initialUser.email)) {
            await dbService.syncUser(initialUser);
          }
        }
      }
    }, handleError);

    const unsubResults = dbService.subscribeToExamResults((data) => {
      setAllExamResults(data);
      if (currentUser) {
        setUserResults(data.filter(r => r.studentId === currentUser.id));
      }
    }, handleError);

    const unsubAssignments = dbService.subscribeToAssignments((data) => {
      setAssignments(data);
    }, handleError);

    const unsubSubmissions = dbService.subscribeToSubmissions((data) => {
      setSubmissions(data);
    }, handleError);

    return () => {
      unsubExams();
      unsubCourses();
      unsubNews();
      unsubUsers();
      unsubResults();
      unsubAssignments();
      unsubSubmissions();
    };
  }, [isLoggedIn, currentUser?.id, isOnline]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setIsDemoSession(false); // Real auth takes over
        // User is signed in, fetch profile
        try {
          let profile = await dbService.fetchUserProfile(authUser.uid);
          
          if (!profile) {
            // Check if this is the admin email
            const isDefaultAdmin = authUser.email === 'jemalfano030@gmail.com' || authUser.email === 'jemalfan030@gmail.com';
            profile = {
              id: authUser.uid,
              name: authUser.displayName || 'New User',
              role: isDefaultAdmin ? 'admin' : 'student',
              points: 0,
              status: 'active',
              email: authUser.email || '',
              joinedDate: new Date().toISOString().split('T')[0],
              preferredLanguage: 'en',
              badges: [],
              photo: authUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.uid}&backgroundColor=b6e3f4`,
              completedExams: [],
              completedCourses: [],
              certificatesPaid: [],
              nid: `G-${authUser.uid.substring(0, 8)}`,
              gender: 'Other',
              dob: '2000-01-01'
            };
            await dbService.syncUser(profile);
          } else if ((authUser.email === 'jemalfano030@gmail.com' || authUser.email === 'jemalfan030@gmail.com') && profile.role !== 'admin') {
            // Force admin role for this specific email if it's not already
            profile.role = 'admin';
            await dbService.syncUser(profile);
          }

          setCurrentUser(profile as User);
          setIsLoggedIn(true);
          
          if (activeView === 'login') {
            setActiveView(profile.role === 'admin' ? 'admin' : profile.role === 'teacher' || profile.role === 'teaching_assistant' ? 'teacher' : 'home');
          }
        } catch (err) {
          console.error("Error restoring session:", err);
        }
      } else if (!isDemoSession) {
        // User is signed out and not in a demo session
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [activeView]);

  useEffect(() => {
    const handleSyncStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleSyncStatus);
    window.addEventListener('offline', handleSyncStatus);
    return () => {
      window.removeEventListener('online', handleSyncStatus);
      window.removeEventListener('offline', handleSyncStatus);
    };
  }, []);

  const t = (key: string) => TRANSLATIONS[currentLang][key] || key;

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const { user: authUser, error } = await dbService.signInWithGoogle();
      
      if (authUser) {
        setAuthError(null);
        let profile = await dbService.fetchUserProfile(authUser.id);
        
        if (!profile) {
          // Create a new user profile if it doesn't exist
          const isDefaultAdmin = authUser.email === 'jemalfano030@gmail.com' || authUser.email === 'jemalfan030@gmail.com';
          profile = {
            id: authUser.id,
            name: isDefaultAdmin ? 'Jemal Fano Haji' : (authUser.name || 'New User'),
            role: isDefaultAdmin ? 'admin' : 'student',
            points: 0,
            status: 'active',
            email: authUser.email || '',
            joinedDate: new Date().toISOString().split('T')[0],
            preferredLanguage: 'en',
            badges: [],
            photo: authUser.photo || (isDefaultAdmin ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jemal&backgroundColor=b6e3f4' : `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}&backgroundColor=b6e3f4`),
            completedExams: [],
            completedCourses: [],
            certificatesPaid: [],
            nid: `G-${authUser.id.substring(0, 8)}`,
            gender: 'Other',
            dob: '2000-01-01'
          };
          await dbService.syncUser(profile);
        }

        setIsLoggedIn(true);
        setCurrentUser(profile as User);
        setActiveView(profile.role === 'admin' ? 'admin' : profile.role === 'teacher' || profile.role === 'teaching_assistant' ? 'teacher' : 'home');
        
        const results = await dbService.fetchResults(profile.id);
        if (results) setUserResults(results as any);
      } else if (error) {
        console.error("Google Auth Error:", error);
        const errorCode = (error as any).code || "";
        const errorMessage = (error as any).message || "";
        
        let message = errorMessage || "Google Sign-In failed.";
        
        if (errorCode === 'auth/network-request-failed' || errorMessage.includes('network-request-failed')) {
          message = "Network error or browser blocking popup. Please ensure your connection is stable and try again.";
        } else if (errorMessage.includes('projectconfigservice.getprojectconfig-are-blocked')) {
          message = "The Identity Toolkit API is blocked. Please check your Firebase configuration.";
        } else if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('unauthorized-domain')) {
          message = "This domain is not authorized for Google Sign-In. Please check your Firebase settings.";
        } else if (errorCode === 'auth/popup-closed-by-user' || errorMessage.includes('popup-closed-by-user')) {
          message = "Sign-in popup was closed. Please try again.";
        } else if (errorCode === 'auth/internal-error' || errorMessage.includes('internal-error')) {
          message = "Internal authentication error. Please refresh the page.";
        }
        
        setAuthError(message);
      }
    } catch (err) {
      console.error(err);
      setAuthError("Authentication failed.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent, overrideEmail?: string, overridePassword?: string) => {
    if (e) e.preventDefault();
    const targetEmail = (overrideEmail || loginEmail).trim().toLowerCase();
    const targetPassword = overridePassword || loginPassword;
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      // 1. Check for Demo Accounts first (Bypass real auth for demo)
      const demoEmails = ['teacher@iftu.edu.et', 'student@iftu.edu.et', 'admin@iftu.edu.et', '5890385378017045@students.iftu.edu.et', 'barataa@iftu.edu.et', 'demoteach', 'demostu'];
      const isDemo = demoEmails.includes(targetEmail);
      
      if (isDemo && targetPassword === 'demo') {
        const localUser = users.find(u => u.email.toLowerCase() === targetEmail || (targetEmail === 'demoteach' && u.email === 'teacher@iftu.edu.et') || (targetEmail === 'demostu' && u.email === 'student@iftu.edu.et')) 
          || INITIAL_USERS.find(u => u.email.toLowerCase() === targetEmail || (targetEmail === 'demoteach' && u.email === 'teacher@iftu.edu.et') || (targetEmail === 'demostu' && u.email === 'student@iftu.edu.et'));
        
        if (localUser) {
          setIsDemoSession(true);
          setIsLoggedIn(true);
          setCurrentUser(localUser);
          setActiveView(localUser.role === 'admin' ? 'admin' : localUser.role === 'teacher' || localUser.role === 'teaching_assistant' ? 'teacher' : 'home');
          setIsAuthenticating(false);
          return;
        }
      }

      // 2. Try Real Auth
      const { user: authUser, error } = await dbService.signIn(targetEmail, targetPassword);
      
      if (authUser) {
        setAuthError(null);
        const profile = await dbService.fetchUserProfile(authUser.id);
        if (profile) {
          setIsLoggedIn(true);
          setCurrentUser(profile as User);
          setActiveView(profile.role === 'admin' ? 'admin' : profile.role === 'teacher' ? 'teacher' : 'home');
          
          const results = await dbService.fetchResults(profile.id);
          if (results) setUserResults(results as any);
          setIsAuthenticating(false);
          return;
        }
      }

      // 3. Fallback to Local Users (for new students or offline mode)
      const localUser = users.find(u => u.email.toLowerCase() === targetEmail);
      if (localUser) {
        const isCorrectPassword = targetPassword === localUser.nid || targetPassword === 'demo';
        if (isCorrectPassword) {
          setIsLoggedIn(true);
          setCurrentUser(localUser);
          setActiveView(localUser.role === 'admin' ? 'admin' : localUser.role === 'teacher' || localUser.role === 'teaching_assistant' ? 'teacher' : 'home');
          setIsAuthenticating(false);
          return;
        }
      }

      setAuthError(error?.message || "ERROR: Identity not found or invalid credentials.");
    } catch (err) {
      console.error(err);
      setAuthError("Authentication failed.");
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
          <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
            ENTER <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-green-500 bg-clip-text text-transparent">PORTAL.</span>
          </h2>
          
          <div className="space-y-8 max-w-md mx-auto">
            {authError && (
              <div className="p-6 bg-red-50 border-4 border-red-600 text-red-600 rounded-2xl font-bold text-xs">
                <p>⚠️ {authError}</p>
              </div>
            )}
            <div className="relative">
              <input 
                type="email" 
                placeholder="Identity Email" 
                className="w-full p-8 bg-white border-8 border-black rounded-[2.5rem] font-black text-xl outline-none focus:shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] transition-all"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <input 
                type="password" 
                placeholder="Registry Password" 
                className="w-full p-8 bg-white border-8 border-black rounded-[2.5rem] font-black text-xl outline-none focus:shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] transition-all"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <p className="text-[10px] font-black text-gray-400 uppercase mt-2 text-left ml-4 italic">Students: Use your National ID (NID) as password</p>
            </div>
            <button 
              onClick={() => handleLogin()}
              disabled={isAuthenticating}
              className="w-full py-8 bg-black text-white rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4"
            >
              {isAuthenticating ? 'AUTHENTICATING...' : 'ACCESS REGISTRY →'}
            </button>
            <button 
              onClick={handleGoogleLogin}
              disabled={isAuthenticating}
              className="w-full py-8 bg-white text-black rounded-[2.5rem] border-8 border-black font-black uppercase text-2xl shadow-[12px_12px_0px_0px_rgba(239,68,68,1)] hover:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              SIGN IN WITH GOOGLE
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t-8 border-black/5">
             <button 
               onClick={() => handleLogin(undefined, 'admin@iftu.edu.et', 'demo')} 
               className="p-6 bg-purple-100 border-4 border-black rounded-[2.5rem] font-black uppercase text-[10px] hover:bg-purple-200 transition-all flex items-center justify-center gap-4"
             >
               <span className="text-2xl">👑</span> Admin Demo
             </button>
             <button 
               onClick={() => handleLogin(undefined, 'teacher@iftu.edu.et', 'demo')} 
               className="p-6 bg-orange-100 border-4 border-black rounded-[2.5rem] font-black uppercase text-[10px] hover:bg-orange-200 transition-all flex items-center justify-center gap-4"
             >
               <span className="text-2xl">👨‍🏫</span> Teacher Demo
             </button>
             <button 
               onClick={() => handleLogin(undefined, 'student@iftu.edu.et', 'demo')} 
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

    if (isLoggedIn) {
      if (activeView === 'admin' && currentUser?.role === 'admin') {
        return (
          <AdminDashboard 
            users={users} 
            courses={courses} 
            exams={exams} 
            initialAssignments={assignments}
            initialSubmissions={submissions}
            news={news} 
            examResults={allExamResults}
            onUpdateUser={async (u) => {
              setUsers(users.map(usr => usr.id === u.id ? u : usr));
              if (currentUser?.id === u.id) {
                setCurrentUser(u);
              }
              await dbService.syncUser(u);
            }} 
            onAddUser={async (u, password) => {
              setUsers([...users, u]);
              if (password) {
                // For new users created by admin (like students with NID as password)
                await dbService.signUp(u.email, password, u);
              } else {
                await dbService.syncUser(u);
              }
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
              // Notify all students
              const students = users.filter(u => u.role === 'student');
              for (const student of students) {
                await dbService.createNotification({
                  userId: student.id,
                  title: 'New Bulletin Published',
                  message: n.title,
                  type: 'assignment', // Using assignment type as a generic for now, or I should add 'news'
                  isRead: false,
                  createdAt: new Date().toISOString()
                });
              }
            }}
            onUpdateNews={async (n) => {
              setNews(news.map(bulletin => bulletin.id === n.id ? n : bulletin));
              await dbService.syncNews(n);
            }}
            onDeleteNews={async (id) => {
              setNews(news.filter(n => n.id !== id));
              await dbService.deleteNews(id);
            }}
            onAddAssignment={async (a) => {
              setAssignments([...assignments, a]);
              await dbService.syncAssignment(a);
              // Notify students in the relevant grade/stream
              const course = courses.find(c => c.code === a.courseCode);
              if (course) {
                const targetStudents = users.filter(u => 
                  u.role === 'student' && 
                  u.grade === course.grade && 
                  (course.stream === Stream.GENERAL || u.stream === course.stream)
                );
                for (const student of targetStudents) {
                  await dbService.createNotification({
                    userId: student.id,
                    title: 'New Assignment',
                    message: `${a.title} - Due: ${new Date(a.dueDate).toLocaleDateString()}`,
                    type: 'assignment',
                    isRead: false,
                    createdAt: new Date().toISOString()
                  });
                }
              }
            }}
            onUpdateAssignment={async (a) => {
              setAssignments(assignments.map(item => item.id === a.id ? a : item));
              await dbService.syncAssignment(a);
            }}
            onDeleteAssignment={async (id) => {
              setAssignments(assignments.filter(a => a.id !== id));
              await dbService.deleteAssignment(id);
            }}
            onUpdateSubmission={async (s) => {
              setSubmissions(submissions.map(item => item.id === s.id ? s : item));
              await dbService.syncSubmission(s);
              // Notify student if graded
              if (s.status === 'graded') {
                await dbService.createNotification({
                  userId: s.studentId,
                  title: 'Assignment Graded',
                  message: `Your submission for assignment ID ${s.assignmentId} has been graded. Score: ${s.grade || 0}`,
                  type: 'grade',
                  isRead: false,
                  createdAt: new Date().toISOString()
                });
              }
            }}
            onSendSMS={(to, msg) => {
              setSimulatedMessages(prev => [{ id: Date.now().toString(), text: msg, date: new Date().toLocaleTimeString() }, ...prev]);
            }}
            onNavClick={setActiveView}
          />
        );
      }
      if ((activeView === 'teacher' || activeView === 'admin') && (currentUser?.role === 'teacher' || currentUser?.role === 'teaching_assistant' || currentUser?.role === 'content_creator')) {
        return (
          <TeacherDashboard 
            currentUser={currentUser}
            exams={exams} 
            courses={courses}
            onAddExam={async (ex) => { 
              setExams([...exams, ex]); 
              await dbService.syncExam(ex);
            }} 
            onDeleteExam={async (id) => {
              setExams(exams.filter(e => e.id !== id));
              await dbService.deleteExam(id);
            }} 
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
            onAddAssignment={async (a) => {
              setAssignments([...assignments, a]);
              await dbService.syncAssignment(a);
              // Notify students in the relevant grade/stream
              const course = courses.find(c => c.code === a.courseCode);
              if (course) {
                const targetStudents = users.filter(u => 
                  u.role === 'student' && 
                  u.grade === course.grade && 
                  (course.stream === Stream.GENERAL || u.stream === course.stream)
                );
                for (const student of targetStudents) {
                  await dbService.createNotification({
                    userId: student.id,
                    title: 'New Assignment',
                    message: `${a.title} - Due: ${new Date(a.dueDate).toLocaleDateString()}`,
                    type: 'assignment',
                    isRead: false,
                    createdAt: new Date().toISOString()
                  });
                }
              }
            }}
            onUpdateAssignment={async (a) => {
              setAssignments(assignments.map(item => item.id === a.id ? a : item));
              await dbService.syncAssignment(a);
            }}
            onDeleteAssignment={async (id) => {
              setAssignments(assignments.filter(a => a.id !== id));
              await dbService.deleteAssignment(id);
            }}
            onUpdateSubmission={async (s) => {
              setSubmissions(submissions.map(item => item.id === s.id ? s : item));
              await dbService.syncSubmission(s);
              // Notify student if graded
              if (s.status === 'graded') {
                await dbService.createNotification({
                  userId: s.studentId,
                  title: 'Assignment Graded',
                  message: `Your submission for assignment ID ${s.assignmentId} has been graded. Score: ${s.grade || 0}`,
                  type: 'grade',
                  isRead: false,
                  createdAt: new Date().toISOString()
                });
              }
            }}
          />
        );
      }
    }

    switch(activeView) {
      case 'courses':
        const filteredCourses = courses.filter(c => {
          const matchesSearch = c.title.toLowerCase().includes(courseSearch.toLowerCase()) || 
                               c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
                               c.subject.toLowerCase().includes(courseSearch.toLowerCase());
          
          // If student is logged in, only show courses matching their profile by default
          const isStudent = currentUser?.role === 'student';
          const matchesGrade = gradeFilter === 'all' ? (isStudent ? c.grade === currentUser.grade : true) : c.grade === gradeFilter;
          const matchesStream = streamFilter === 'all' ? (isStudent ? (c.stream === currentUser.stream || c.stream === Stream.GENERAL) : true) : c.stream === streamFilter;
          const matchesLevel = isStudent ? c.level === currentUser.level : true;
          const matchesSubject = subjectFilter === 'all' || c.subject === subjectFilter;
          
          return matchesSearch && matchesGrade && matchesStream && matchesSubject && matchesLevel;
        });

        const subjects = Array.from(new Set(courses.map(c => c.subject)));

        return (
          <div className="space-y-16 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
              <h2 className="text-7xl font-black uppercase italic tracking-tighter leading-none text-blue-900">Catalogue.</h2>
              <div className="w-full md:w-96">
                <input 
                  type="text" 
                  placeholder="Search Modules..." 
                  className="w-full p-6 bg-white border-8 border-black rounded-[2rem] font-black text-xl outline-none focus:shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] transition-all"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 bg-gray-50 p-8 rounded-[3rem] border-4 border-black">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Grade Level</label>
                 <select 
                   className="p-4 bg-white border-4 border-black rounded-2xl font-black uppercase text-xs outline-none"
                   value={gradeFilter}
                   onChange={(e) => setGradeFilter(e.target.value)}
                 >
                   <option value="all">All Grades</option>
                   {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Stream</label>
                 <select 
                   className="p-4 bg-white border-4 border-black rounded-2xl font-black uppercase text-xs outline-none"
                   value={streamFilter}
                   onChange={(e) => setStreamFilter(e.target.value)}
                 >
                   <option value="all">All Streams</option>
                   {Object.values(Stream).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Subject</label>
                 <select 
                   className="p-4 bg-white border-4 border-black rounded-2xl font-black uppercase text-xs outline-none"
                   value={subjectFilter}
                   onChange={(e) => setSubjectFilter(e.target.value)}
                 >
                   <option value="all">All Subjects</option>
                   {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>

               <button 
                 onClick={() => { setCourseSearch(''); setGradeFilter('all'); setStreamFilter('all'); setSubjectFilter('all'); }}
                 className="mt-auto p-4 bg-black text-white border-4 border-black rounded-2xl font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] active:translate-y-1 transition-all"
               >
                 Reset Filters
               </button>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {filteredCourses.map(c => (
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
            ) : (
              <div className="py-32 text-center space-y-8">
                <div className="text-7xl grayscale opacity-20">🔍</div>
                <h3 className="text-5xl font-black uppercase italic tracking-tighter text-gray-400">No Modules Cataloged.</h3>
                <p className="text-xl font-bold text-gray-400 uppercase">Adjust your search or filters to find educational artifacts.</p>
              </div>
            )}
          </div>
        );
      case 'media':
        return (
          <div className="max-w-6xl mx-auto space-y-24 py-12 animate-fadeIn">
            <div className="text-center space-y-6">
              <h2 className="text-7xl md:text-9xl font-black uppercase italic tracking-tighter leading-none text-red-600">Media Hub.</h2>
              <p className="text-2xl font-bold text-gray-500 uppercase italic">Official Video Broadcasting & Educational Content</p>
            </div>

            <div className="bg-white border-8 border-black rounded-[5rem] p-12 md:p-20 shadow-[30px_30px_0px_0px_rgba(220,38,38,1)] flex flex-col md:flex-row gap-16 items-center">
              <div className="w-full md:w-1/2 space-y-8">
                <div className="w-24 h-24 bg-red-600 rounded-3xl border-4 border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Soof Umar Media 256</h3>
                <p className="text-xl font-medium leading-relaxed text-gray-600">
                  Welcome to the official media wing of IFTU National Digital Center. We provide high-quality educational broadcasts, 
                  national exam preparation videos, and digital literacy content for students across the nation.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a 
                    href="https://www.youtube.com/@soof-UmarMedia256" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-red-600 text-white px-10 py-6 rounded-[2.5rem] border-8 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center gap-4"
                  >
                    Visit Channel →
                  </a>
                </div>
              </div>
              <div className="w-full md:w-1/2 aspect-video bg-black rounded-[3rem] border-8 border-black overflow-hidden shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/videoseries?list=UU-soof-UmarMedia256" 
                  title="Soof Umar Media 256"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: 'Educational Series', icon: '📚', count: '150+ Videos' },
                { title: 'Exam Prep', icon: '📝', count: '45+ Modules' },
                { title: 'Tech Tutorials', icon: '💻', count: '80+ Guides' }
              ].map((item, i) => (
                <div key={i} className="bg-white border-8 border-black rounded-[3rem] p-10 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center space-y-4">
                  <div className="text-5xl">{item.icon}</div>
                  <h4 className="text-2xl font-black uppercase italic">{item.title}</h4>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'news':
        return (
          <div className="max-w-6xl mx-auto space-y-24 py-12 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
              <div className="space-y-4">
                <h2 className="text-7xl font-black uppercase italic tracking-tighter leading-none text-blue-900">Bulletin.</h2>
                <p className="text-xl font-bold text-gray-500 uppercase italic">Official National Education Feed</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleSyncNews} 
                  disabled={isSyncingNews || !isOnline} 
                  className="bg-[#00D05A] text-white px-10 py-6 rounded-[2.5rem] border-8 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center gap-4 disabled:opacity-50"
                >
                  {isSyncingNews ? 'SYNCING...' : '📡 Sync National Feed'}
                </button>
                {currentUser?.role === 'admin' && (
                  <button 
                    onClick={handleGenerateNationalExams} 
                    disabled={isGeneratingExams || !isOnline} 
                    className="bg-purple-500 text-white px-10 py-6 rounded-[2.5rem] border-8 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all flex items-center gap-4 disabled:opacity-50"
                  >
                    {isGeneratingExams ? 'GENERATING...' : '📝 Generate National Exams'}
                  </button>
                )}
              </div>
            </div>

            {examGenProgress && (
              <div className="bg-purple-100 border-8 border-black rounded-[3rem] p-8 text-center animate-pulse">
                <p className="text-2xl font-black uppercase italic">{examGenProgress}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="lg:col-span-2 space-y-16">
                <h3 className="text-4xl font-black uppercase italic tracking-tighter text-blue-900">Latest Updates.</h3>
                {news.length > 0 ? news.map(n => (
                  <div key={n.id} className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:translate-y-[-10px] transition-all">
                    {n.image && (
                      <div className="w-full h-80 border-b-8 border-black shrink-0">
                        <img src={n.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="p-12 space-y-6">
                      <div className="flex justify-between items-start">
                        <span className="px-6 py-2 bg-red-600 text-white font-black uppercase italic rounded-full border-4 border-black text-sm">{n.tag}</span>
                        <span className="text-xl font-bold text-gray-400 italic">{n.date}</span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">{n.title}</h3>
                      <div className="h-2 w-24 bg-black"></div>
                      <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">{n.content}</p>
                      {n.tag && (
                        <div className="flex flex-wrap gap-2 pt-4">
                          <span className="text-xs font-black uppercase text-blue-600">#{n.tag}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="py-32 text-center space-y-8 bg-gray-50 border-8 border-dashed border-gray-300 rounded-[5rem]">
                    <div className="text-7xl grayscale opacity-20">📡</div>
                    <h3 className="text-4xl font-black uppercase italic text-gray-400">No News Synchronized.</h3>
                    <p className="text-xl font-bold text-gray-400 uppercase">Click sync to fetch latest national updates.</p>
                  </div>
                )}
              </div>

              <div className="space-y-16">
                <h3 className="text-4xl font-black uppercase italic tracking-tighter text-purple-900">National Exams.</h3>
                <div className="space-y-8">
                  {exams.filter(ex => ex.type === 'National').slice(0, 5).map(ex => (
                    <div key={ex.id} className="bg-purple-50 border-8 border-black rounded-[3rem] p-8 space-y-4 shadow-[15px_15px_0px_0px_rgba(168,85,247,1)] hover:translate-x-2 transition-all cursor-pointer" onClick={() => { setActiveExam(ex); setActiveView('exams'); }}>
                      <div className="flex justify-between items-center">
                        <span className="px-4 py-1 bg-purple-600 text-white font-black uppercase italic rounded-full border-2 border-black text-[10px]">{ex.grade}</span>
                        <span className="text-xs font-black uppercase text-purple-900">{ex.subject}</span>
                      </div>
                      <h4 className="text-xl font-black uppercase italic leading-none">{ex.title}</h4>
                      {ex.description && (
                        <p className="text-xs font-bold text-purple-700 italic line-clamp-2">{ex.description}</p>
                      )}
                      <div className="flex justify-between items-center pt-4 border-t-4 border-black/10">
                        <span className="text-[10px] font-black uppercase">{ex.questions.length} Questions</span>
                        <span className="text-[10px] font-black uppercase text-blue-600">Start Now →</span>
                      </div>
                    </div>
                  ))}
                  {exams.filter(ex => ex.type === 'National').length === 0 && (
                    <div className="p-12 text-center bg-purple-50 border-8 border-dashed border-purple-200 rounded-[3rem] space-y-4">
                      <div className="text-4xl grayscale opacity-20">📝</div>
                      <p className="text-sm font-black uppercase text-purple-400">No National Exams Generated Yet.</p>
                    </div>
                  )}
                  <button onClick={() => setActiveView('exams')} className="w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase italic text-xl hover:bg-purple-600 transition-colors">
                    View All Exams
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'exams':
        const filteredExams = exams.filter(ex => {
          if (currentUser?.role !== 'student') return true;
          return ex.grade === currentUser.grade && (ex.stream === currentUser.stream || ex.stream === Stream.GENERAL);
        });
        return (
          <div className="max-w-4xl mx-auto space-y-16 py-12 animate-fadeIn">
            <h2 className="text-6xl font-black uppercase italic tracking-tighter text-blue-900 leading-none">Mock Sessions.</h2>
            <div className="grid grid-cols-1 gap-8">
              {filteredExams.map(ex => (
                <div key={ex.id} className="bg-white p-10 md:p-12 rounded-[3.5rem] border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-8 hover:translate-x-2 transition-all">
                  <div className="space-y-4 flex-1">
                    <div className="flex gap-4">
                      <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-600 px-3 py-1 rounded-full border-2 border-black">{ex.grade}</span>
                      <span className="text-[10px] font-black uppercase bg-orange-100 text-orange-600 px-3 py-1 rounded-full border-2 border-black">{ex.stream}</span>
                      <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-600 px-3 py-1 rounded-full border-2 border-black">{ex.type}</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black uppercase italic leading-none tracking-tight">{ex.title}</h3>
                    {ex.description && (
                      <p className="text-lg font-bold text-gray-400 italic leading-tight">{ex.description}</p>
                    )}
                    {ex.keyConcepts && ex.keyConcepts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {ex.keyConcepts.slice(0, 3).map((c, i) => (
                          <span key={i} className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            {c.term}
                          </span>
                        ))}
                        {ex.keyConcepts.length > 3 && <span className="text-[10px] font-bold text-gray-400">+{ex.keyConcepts.length - 3} more</span>}
                      </div>
                    )}
                  </div>
                  <button onClick={() => isLoggedIn ? setActiveExam(ex) : setActiveView('login')} className="px-12 py-8 bg-blue-600 text-white border-8 border-black rounded-[2.5rem] font-black uppercase text-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all shrink-0">Launch</button>
                </div>
              ))}
              {filteredExams.length === 0 && (
                <div className="py-20 text-center space-y-6">
                  <div className="text-6xl grayscale opacity-20">📝</div>
                  <h3 className="text-4xl font-black uppercase italic text-gray-400">No Exams for your profile.</h3>
                </div>
              )}
            </div>
          </div>
        );
      case 'performance':
        return <PerformancePortal results={userResults} exams={exams} currentUser={currentUser || undefined} courses={courses} onCertPaid={handleCertPaid} />;
      case 'leaderboard':
        return <Leaderboard students={users} />;
      case 'profile':
        return currentUser ? <StudentProfile user={currentUser} onUpdateUser={(updatedUser) => { setCurrentUser(updatedUser); setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u)); }} /> : null;
      case 'tutor':
        return <AITutor />;
      case 'assignments':
        return currentUser ? <AssignmentPortal currentUser={currentUser} assignments={assignments} submissions={submissions} /> : null;
      case 'studyhall':
        return currentUser ? <StudyHall currentUser={currentUser} lang={currentLang} /> : null;
      case 'locator':
        return <CampusLocator />;
      case 'about':
        return <AboutPortal currentUser={currentUser} />;
      case 'documentation':
        return <DevPortal />;
      case 'report':
        return <ProjectReportPortal />;
      case 'search':
        return (
          <div className="max-w-6xl mx-auto space-y-16 py-12 animate-fadeIn">
            <div className="flex items-center gap-6 border-b-8 border-black pb-8">
              <div className="w-20 h-20 bg-yellow-400 border-8 border-black rounded-[2rem] flex items-center justify-center text-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">🔍</div>
              <div>
                <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Search Results.</h2>
                <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">Query: "{globalSearchQuery}"</p>
              </div>
            </div>

            {searchResults.courses.length === 0 && searchResults.news.length === 0 && searchResults.exams.length === 0 ? (
              <div className="bg-white p-24 rounded-[4rem] border-8 border-black text-center shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-4xl font-black uppercase italic text-gray-400">No results found for your query.</p>
                <button onClick={() => setActiveView('home')} className="mt-8 px-12 py-4 bg-black text-white rounded-2xl border-4 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all">Return Home</button>
              </div>
            ) : (
              <div className="space-y-24">
                {searchResults.courses.length > 0 && (
                  <div className="space-y-8">
                    <h3 className="text-3xl font-black uppercase italic border-l-8 border-blue-600 pl-6">Courses ({searchResults.courses.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {searchResults.courses.map(course => (
                        <CourseCard 
                          key={course.id} 
                          course={course} 
                          onClick={() => setViewingCourse(course)} 
                          language={currentLang}
                          isEnrolled={currentUser?.completedCourses.includes(course.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.news.length > 0 && (
                  <div className="space-y-8">
                    <h3 className="text-3xl font-black uppercase italic border-l-8 border-red-600 pl-6">Bulletins ({searchResults.news.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {searchResults.news.map(n => (
                        <div key={n.id} className="bg-white border-8 border-black rounded-[3rem] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:translate-y-[-4px] transition-all cursor-pointer" onClick={() => setActiveView('news')}>
                          <div className="h-32 border-b-4 border-black">
                            <img src={n.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="p-6 space-y-2">
                            <h4 className="text-xl font-black uppercase italic leading-none">{n.title}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{n.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.exams.length > 0 && (
                  <div className="space-y-8">
                    <h3 className="text-3xl font-black uppercase italic border-l-8 border-yellow-400 pl-6">Exams ({searchResults.exams.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {searchResults.exams.map(exam => (
                        <div key={exam.id} className="bg-white border-8 border-black rounded-[3rem] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-all cursor-pointer" onClick={() => { setActiveExam(exam); setActiveView('exams'); }}>
                          <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border-2 border-black rounded-full text-[8px] font-black uppercase">{exam.type}</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase">Grade {exam.grade}</span>
                          </div>
                          <h4 className="text-xl font-black uppercase italic leading-tight mb-2">{exam.title}</h4>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{exam.subject}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="space-y-24 animate-fadeIn">
            <section className="rounded-[4rem] p-12 md:p-32 text-black bg-blue-100 border-8 border-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col items-center text-center">
              <div className="relative z-10 max-w-6xl space-y-12">
                <div className="space-y-4">
                  {isLoggedIn && (
                    <div className="bg-blue-600/10 backdrop-blur-md px-8 py-3 rounded-full border-2 border-blue-600/20 inline-block mb-8">
                      <p className="text-sm font-black uppercase tracking-[0.3em] text-blue-800">Welcome back, {currentUser?.name}</p>
                    </div>
                  )}
                  <h1 className="text-6xl md:text-[12rem] font-black uppercase tracking-tighter leading-[0.8] italic">
                    <span className="text-[#009b44] block">SOVEREIGN</span>
                    <span className="text-[#ffcd00] block text-4xl md:text-8xl my-4">⚡</span>
                    <span className="text-[#ef3340] block">LEARNING</span>
                  </h1>
                  {news.length > 0 && (
                    <div className="mt-8 animate-pulse">
                      <button 
                        onClick={() => setActiveView('news')}
                        className="bg-red-600 text-white px-6 py-2 rounded-full border-4 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all"
                      >
                        LATEST BULLETIN: {news[0].title} →
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xl md:text-3xl font-black uppercase tracking-widest italic text-[#ffcd00] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Empowering Ethiopia's Digital Generation.</p>
                <p className="text-lg md:text-xl font-black uppercase tracking-widest text-black/40 mt-4 animate-bounce">Developer JEMAL FANO HAJI</p>
                {!isLoggedIn && (
                  <div className="flex flex-col sm:flex-row gap-8 justify-center pt-8">
                    <button onClick={() => setActiveView('login')} className="bg-black text-white px-12 py-6 rounded-[2.5rem] border-8 border-black font-black uppercase text-xl shadow-[15px_15px_0px_0px_rgba(59,130,246,1)] hover:scale-105 transition-all">ACCESS PORTAL</button>
                  </div>
                )}
              </div>
            </section>

            {/* News & Announcements Section (Beeksisa) */}
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="flex items-center justify-between border-b-8 border-black pb-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-red-600 border-8 border-black rounded-[2rem] flex items-center justify-center text-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">📢</div>
                  <div>
                    <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Bulletins.</h2>
                    <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">Latest Announcements & Beeksisa</p>
                  </div>
                </div>
                <button onClick={() => setActiveView('news')} className="text-sm font-black uppercase italic border-b-4 border-black hover:text-red-600 transition-colors">View All →</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {news.slice(0, 2).map(n => (
                  <div key={n.id} className="bg-white border-8 border-black rounded-[4rem] overflow-hidden shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:translate-y-[-8px] transition-all cursor-pointer" onClick={() => setActiveView('news')}>
                    <div className="h-48 border-b-8 border-black">
                      <img src={n.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="px-4 py-1 bg-red-100 text-red-600 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-widest">{n.tag}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase">{n.date}</span>
                      </div>
                      <h3 className="text-3xl font-black uppercase italic leading-none tracking-tight">{n.title}</h3>
                      <p className="text-sm font-bold text-gray-500 italic line-clamp-2">{n.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isLoggedIn && currentUser?.role === 'student' && (
              <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-600 border-8 border-black rounded-[2rem] flex items-center justify-center text-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">📋</div>
                  <div>
                    <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Identity Board.</h2>
                    <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">Official Registration Trace</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="bg-white border-8 border-black rounded-[4rem] p-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 border-4 border-black rounded-xl flex items-center justify-center text-2xl">👤</div>
                      <h3 className="text-2xl font-black uppercase italic">Sovereign Data</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 border-4 border-black rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Full Legal Name</p>
                        <p className="text-xl font-black italic">{currentUser.name}</p>
                      </div>
                      <div className="p-4 bg-gray-50 border-4 border-black rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">National ID (NID)</p>
                        <p className="text-xl font-black italic">{currentUser.nid || 'NOT_ASSIGNED'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-8 border-black rounded-[4rem] p-12 shadow-[20px_20px_0px_0px_rgba(59,130,246,1)] space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 border-4 border-black rounded-xl flex items-center justify-center text-2xl">🎓</div>
                      <h3 className="text-2xl font-black uppercase italic">Academic Trace</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border-4 border-black rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Grade / Level</p>
                        <p className="text-xl font-black italic">{currentUser.grade || 'UNMAPPED'}</p>
                      </div>
                      <div className="p-4 bg-blue-50 border-4 border-black rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Stream / Sector</p>
                        <p className="text-xl font-black italic">{currentUser.stream || 'GENERAL'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-8 border-black rounded-[4rem] p-12 shadow-[20px_20px_0px_0px_rgba(0,208,90,1)] space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 border-4 border-black rounded-xl flex items-center justify-center text-2xl">⚡</div>
                      <h3 className="text-2xl font-black uppercase italic">Registry Status</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border-4 border-black rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Knowledge Points (KP)</p>
                        <p className="text-3xl font-black italic text-green-600">{currentUser.points} KP</p>
                      </div>
                      <div className="p-4 bg-green-50 border-4 border-black rounded-2xl">
                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Registry State</p>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-xl font-black italic uppercase">{currentUser.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLoggedIn && simulatedMessages.length > 0 && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-400 border-4 border-black rounded-xl flex items-center justify-center text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">📩</div>
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter">National SMS Inbox</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {simulatedMessages.map(m => (
                    <div key={m.id} className="bg-white p-8 rounded-[2.5rem] border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center group hover:bg-blue-50 transition-all">
                      <div className="space-y-2">
                        <p className="text-xl font-bold italic leading-relaxed">{m.text}</p>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{m.date} • National Gateway Dispatch</p>
                      </div>
                      <button 
                        onClick={() => setSimulatedMessages(prev => prev.filter(msg => msg.id !== m.id))}
                        className="w-12 h-12 flex items-center justify-center bg-gray-100 border-4 border-black rounded-xl hover:bg-red-100 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
    <div className="min-h-screen flex flex-col bg-blue-50 text-black">
      {activeExam && (
        <ExamEngine 
          exam={activeExam} 
          onComplete={async (res) => { 
            setUserResults([...userResults, res]); 
            setActiveExam(null); 
            setActiveView('performance');
            if (currentUser) {
              const updatedUser = { ...currentUser, points: currentUser.points + res.score };
              setCurrentUser(updatedUser);
              setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
              await dbService.saveExamResult({ ...res, studentId: currentUser.id });
              await dbService.syncUser(updatedUser);
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
          <Header 
            onNavClick={setActiveView} 
            activeView={activeView} 
            isLoggedIn={isLoggedIn} 
            userRole={currentUser?.role} 
            onLogout={async () => { await auth.signOut(); setIsLoggedIn(false); setCurrentUser(null); setActiveView('home'); }} 
            onLoginClick={() => setActiveView('login')} 
            currentLang={currentLang} 
            onLangChange={setCurrentLang} 
            t={t} 
            accessibilitySettings={{}} 
            onAccessibilityChange={() => {}} 
            isOnline={isOnline} 
            onSearch={handleGlobalSearch}
          />
          {dbError && (
            <div className="bg-red-500 text-white p-4 text-center font-black uppercase text-xs animate-pulse">
              ⚠️ {dbError} <button onClick={() => window.location.reload()} className="underline ml-4">Retry</button>
            </div>
          )}
          <main className="flex-grow w-full max-w-screen-2xl mx-auto px-4 py-16">{renderContent()}</main>
          <FeedbackWidget />
          <footer className="bg-gray-50 text-black py-24 px-8 mt-20 text-center relative overflow-hidden border-t-8 border-black">
             <div className="absolute top-0 left-0 w-full h-2 ethiopian-gradient"></div>
             <div className="flex flex-col items-center gap-8">
               <p className="text-[14px] font-black uppercase tracking-[0.6em] text-black/60">© 2026 <span className="liquid-spectrum-text">IFTU NATIONAL DIGITAL CENTER</span>.</p>
               <div className="flex flex-wrap justify-center gap-6">
                 <a 
                   href="https://www.youtube.com/@soof-UmarMedia256" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 px-6 py-3 bg-red-600/5 hover:bg-red-600/10 border-2 border-red-600/20 rounded-full transition-all group"
                 >
                   <span className="text-red-600 font-black uppercase text-[10px] tracking-widest">Official YouTube Channel</span>
                   <div className="w-8 h-8 flex items-center justify-center bg-red-600 rounded-lg">
                     <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                       <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                     </svg>
                   </div>
                 </a>
                 <a 
                   href="https://github.com/jemalfano030/iftu-portal" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 px-6 py-3 bg-black/5 hover:bg-black/10 border-2 border-black/20 rounded-full transition-all group"
                 >
                   <span className="text-black/40 group-hover:text-black transition-colors">View Source on GitHub</span>
                   <div className="w-8 h-8 flex items-center justify-center bg-black rounded-lg">
                     <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                       <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                     </svg>
                   </div>
                 </a>
                 <a 
                   href="https://ais-dev-adyv3zaxyzietvbae52va4-107893339879.europe-west2.run.app"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 px-6 py-3 bg-green-500/5 border-2 border-green-500/20 rounded-full hover:bg-green-500/10 transition-all group"
                 >
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-green-600 group-hover:underline">Live on Cloud Run</span>
                 </a>
               </div>
             </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
