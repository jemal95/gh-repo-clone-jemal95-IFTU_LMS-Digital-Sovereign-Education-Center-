
import React, { useState, useEffect } from 'react';
import { 
  Edit, Trash2, RefreshCw, TrendingUp, 
  Users, BookOpen, FileText, BarChart2, 
  Bell, Video, GraduationCap, ClipboardList, 
  LayoutDashboard, Menu, X, ChevronRight,
  Database, Settings, ShieldCheck, Sparkles,
  Zap, Award, Target, Activity
} from 'lucide-react';
import { User, Grade, EducationLevel, Course, Stream, Exam, News, Lesson, Language, ExamResult, Question, Assignment, AssignmentSubmission, AppNotification, ExamType, CourseMaterial } from '../types';
import { dbService } from '../services/dbService';
import { auth } from '../firebase';
import { VideoGenerator } from './VideoGenerator';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import * as geminiService from '../services/geminiService';
import { getEthiopianDateString } from '../lib/dateUtils';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase';

const AssignmentModal = ({ isOpen, onClose, onSave, assignment }: { isOpen: boolean, onClose: () => void, onSave: (assignment: Assignment, file: File | null) => void, assignment: Assignment | null }) => {
  const [formData, setFormData] = useState<Assignment>(assignment || { id: '', title: '', description: '', dueDate: '', points: 0, courseCode: '', rubricUrl: '', status: 'draft', progressStatus: 'Not Started' });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (assignment) setFormData(assignment);
    else setFormData({ id: '', title: '', description: '', dueDate: '', points: 0, courseCode: '', rubricUrl: '', status: 'draft', progressStatus: 'Not Started' });
    setFile(null);
  }, [assignment, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[8000] p-4 md:p-8 overflow-y-auto">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] border-8 border-black w-full max-w-2xl my-auto shadow-[30px_30px_0px_0px_rgba(0,0,0,1)] relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-3xl font-black hover:text-rose-600 transition-colors">✕</button>
        <h2 className="text-3xl font-black uppercase italic mb-6 border-b-4 border-black pb-4">{assignment ? 'Edit Assignment' : 'New Assignment'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Title</label>
            <input type="text" placeholder="Title" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 border-4 border-black rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Description</label>
            <textarea placeholder="Description" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 border-4 border-black rounded-lg h-32" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Due Date (Gregorian)</label>
            <input type="date" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-4 border-4 border-black rounded-lg" />
            {formData.dueDate && (
              <p className="text-[10px] font-black text-blue-600 mt-1 uppercase tracking-widest">
                Ethiopian: {getEthiopianDateString(formData.dueDate)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Points</label>
            <input type="number" placeholder="Points" value={formData.points || 0} onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})} className="w-full p-4 border-4 border-black rounded-lg" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Course Code</label>
            <input type="text" placeholder="Course Code" value={formData.courseCode || ''} onChange={e => setFormData({...formData, courseCode: e.target.value})} className="w-full p-4 border-4 border-black rounded-lg" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Progress Status</label>
            <select 
              value={formData.progressStatus || 'Not Started'} 
              onChange={e => setFormData({...formData, progressStatus: e.target.value as any})} 
              className="w-full p-4 border-4 border-black rounded-lg font-bold"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Needs Review">Needs Review</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Rubric URL</label>
          <input type="text" placeholder="Rubric URL" value={formData.rubricUrl || ''} onChange={e => setFormData({...formData, rubricUrl: e.target.value})} className="w-full p-4 border-4 border-black rounded-lg" />
        </div>
        <div className="mb-6">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Or Upload Rubric File:</label>
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full p-4 border-4 border-black rounded-lg" />
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="bg-gray-200 px-8 py-4 rounded-xl border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">Cancel</button>
          <button onClick={() => onSave({...formData, id: formData.id || Date.now().toString()}, file)} className="bg-blue-600 text-white px-8 py-4 rounded-xl border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">Save Assignment</button>
        </div>
      </div>
    </div>
  );
};

const StudentProgressModal = ({ isOpen, onClose, user, courses, examResults }: { isOpen: boolean, onClose: () => void, user: User | null, courses: Course[], examResults: ExamResult[] }) => {
  if (!isOpen || !user) return null;

  const userResults = examResults.filter(r => r.studentId === user.id);
  const completedCoursesList = courses.filter(c => user.completedCourses?.includes(c.id));

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[8000] p-4 md:p-8 overflow-y-auto">
      <div className="bg-white p-8 md:p-16 rounded-[4rem] border-[10px] border-black w-full max-w-5xl my-auto shadow-[40px_40px_0px_0px_rgba(59,130,246,1)] relative">
        <div className="flex justify-between items-center mb-8 border-b-8 border-black pb-6">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic text-blue-900 tracking-tighter">Student Progress: {user.name}</h2>
          <button onClick={onClose} className="text-5xl font-black hover:text-rose-600 transition-colors">✕</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-3xl border-4 border-black text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Total Points</p>
            <p className="text-4xl font-black italic text-blue-600">{user.points.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-3xl border-4 border-black text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Completed Courses</p>
            <p className="text-4xl font-black italic text-green-600">{user.completedCourses?.length || 0}</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-3xl border-4 border-black text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Exams Taken</p>
            <p className="text-4xl font-black italic text-orange-600">{userResults.length}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-black uppercase italic mb-4 border-l-8 border-green-600 pl-4 bg-green-50 py-2">Completed Courses</h3>
            {completedCoursesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {completedCoursesList.map(c => (
                  <div key={c.id} className="p-4 border-4 border-black rounded-2xl bg-gray-50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 border-2 border-black rounded-xl flex items-center justify-center text-xl">🎓</div>
                    <div>
                      <p className="font-black italic leading-tight">{c.title}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-500">{c.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic font-bold">No courses completed yet.</p>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-black uppercase italic mb-4 border-l-8 border-orange-400 pl-4 bg-orange-50 py-2">Recent Exam Activity</h3>
            {userResults.length > 0 ? (
              <div className="space-y-4">
                {userResults.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).slice(0, 5).map((r, idx) => (
                  <div key={idx} className="p-4 border-4 border-black rounded-2xl flex justify-between items-center bg-white hover:bg-orange-50 transition-colors">
                    <div>
                      <p className="font-black italic">Exam Score: {r.score}/{r.totalPoints}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-500">{new Date(r.completedAt).toLocaleString()}</p>
                    </div>
                    <div className="px-4 py-2 bg-black text-white rounded-xl font-black text-sm border-2 border-black">
                      {Math.round((r.score / r.totalPoints) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic font-bold">No exams taken yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GradingModal = ({ isOpen, onClose, onSave, submission }: { isOpen: boolean, onClose: () => void, onSave: (submission: AssignmentSubmission, file: File | null) => void, submission: AssignmentSubmission | null }) => {
  const [formData, setFormData] = useState<AssignmentSubmission>(submission || { id: '', assignmentId: '', studentId: '', studentName: '', submittedAt: '', fileUrl: '', grade: 0, feedback: '', status: 'submitted' });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (submission) setFormData(submission);
    setFile(null);
  }, [submission, isOpen]);

  if (!isOpen || !submission) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[8000] p-4 md:p-8 overflow-y-auto">
      <div className="bg-white p-8 md:p-16 rounded-[4rem] border-[10px] border-black w-full max-w-3xl my-auto shadow-[40px_40px_0px_0px_rgba(0,0,0,1)] relative">
        <button onClick={onClose} className="absolute top-8 right-8 text-4xl font-black hover:text-rose-600 transition-colors">✕</button>
        <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8 border-b-8 border-black pb-6">Grade Submission: {submission.studentName}</h2>
        
        <div className="mb-6">
          <p className="text-xs font-black uppercase text-gray-400 mb-1">Submitted File</p>
          <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline hover:text-blue-800">View Student Submission →</a>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Grade (Points)</label>
            <input 
              type="number" 
              value={formData.grade || 0} 
              onChange={e => setFormData({...formData, grade: parseInt(e.target.value) || 0})} 
              className="w-full p-4 border-4 border-black rounded-xl font-bold outline-none focus:bg-gray-50" 
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Feedback</label>
            <textarea 
              value={formData.feedback || ''} 
              onChange={e => setFormData({...formData, feedback: e.target.value})} 
              className="w-full p-4 border-4 border-black rounded-xl font-bold outline-none focus:bg-gray-50 min-h-[120px]" 
              placeholder="Provide feedback to the student..."
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Upload Graded File (Optional)</label>
            <input 
              type="file" 
              onChange={e => setFile(e.target.files?.[0] || null)} 
              className="w-full p-4 border-4 border-black rounded-xl font-bold outline-none focus:bg-gray-50" 
            />
            {submission.gradedFileUrl && (
              <p className="text-[10px] font-bold text-green-600 mt-2">Current Graded File: <a href={submission.gradedFileUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a></p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-10">
          <button onClick={onClose} className="px-8 py-4 bg-gray-200 border-4 border-black rounded-2xl font-black uppercase text-sm hover:bg-gray-300 transition-colors">Cancel</button>
          <button onClick={() => onSave(formData, file)} className="px-8 py-4 bg-black text-white border-4 border-black rounded-2xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all">Submit Grade</button>
        </div>
      </div>
    </div>
  );
};

interface AdminDashboardProps {
  users: User[];
  courses: Course[];
  exams: Exam[];
  initialAssignments: Assignment[];
  initialSubmissions: AssignmentSubmission[];
  news: News[];
  examResults: ExamResult[];
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User, password?: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateCourse: (course: Course) => void;
  onAddCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  onAddNews: (news: News) => void;
  onUpdateNews: (news: News) => void;
  onDeleteNews: (id: string) => void;
  onSendSMS?: (to: string, message: string) => void;
  onAddExam?: (exam: Exam) => void;
  onUpdateExam?: (exam: Exam) => void;
  onDeleteExam?: (id: string) => void;
  onAddAssignment?: (assignment: Assignment) => void;
  onUpdateAssignment?: (assignment: Assignment) => void;
  onDeleteAssignment?: (id: string) => void;
  onUpdateSubmission?: (submission: AssignmentSubmission) => void;
  onNavClick: (view: string) => void;
}

const REPORT_TRANSLATIONS = {
  en: {
    analytics: "Sovereign Analytics",
    students: "Student Registry",
    teachers: "Teacher Faculty",
    general: "General System",
    export: "Export Protocol",
    name: "Legal Name",
    role: "Role",
    points: "Knowledge Points",
    status: "Registry Status",
    subject: "Primary Subject",
    totalUsers: "Total Citizens",
    activeCourses: "Active Modules",
    growth: "System Growth",
    afanOromo: "Afan Oromo",
    english: "English",
  },
  om: {
    analytics: "Xiinxala Ol’aanaa",
    students: "Galmee Barattootaa",
    teachers: "Galmee Barsiisotaa",
    general: "Sirna Waliigalaa",
    export: "Gabaasa Baasi",
    name: "Maqaa Seeraa",
    role: "Gahee",
    points: "Qabxii Beekumsaa",
    status: "Haala Galmee",
    subject: "Barnoota Bu'uuraa",
    totalUsers: "Lakkoofsa Lammiilee",
    activeCourses: "Moojuloota Hojirra Jiran",
    growth: "Guddina Sirnaa",
    afanOromo: "Afaan Oromoo",
    english: "Ingiliffa",
  }
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  users: initialUsers, courses: initialCourses, exams: initialExams, initialAssignments, initialSubmissions, news: initialNews, examResults: initialResults,
  onUpdateUser, onAddUser, onDeleteUser, 
  onUpdateCourse, onAddCourse, onDeleteCourse,
  onAddNews, onUpdateNews, onDeleteNews,
  onAddExam, onUpdateExam, onDeleteExam,
  onAddAssignment, onUpdateAssignment, onDeleteAssignment,
  onUpdateSubmission,
  onSendSMS,
  onNavClick
}) => {
  const [activeTab, setActiveTab] = React.useState<'command_center' | 'identities' | 'courses' | 'bulletins' | 'analytics' | 'results' | 'exams' | 'assignments' | 'submissions' | 'videos'>('command_center');
  const [sovereignInsights, setSovereignInsights] = React.useState<{title: string, insight: string, impact: string}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reportLang, setReportLang] = useState<'en' | 'om'>('en');

  const navSections = [
    {
      title: "Core Command",
      items: [
        { id: 'command_center', label: 'Command Center', icon: ShieldCheck },
        { id: 'analytics', label: 'Sovereign Intel', icon: LayoutDashboard },
      ]
    },
    {
      title: "User Management",
      items: [
        { id: 'identities', label: 'Identity Registry', icon: Users },
      ]
    },
    {
      title: "Academic Content",
      items: [
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'videos', label: 'Video Lab', icon: Video },
      ]
    },
    {
      title: "Assessments",
      items: [
        { id: 'exams', label: 'Exam Engine', icon: GraduationCap },
        { id: 'results', label: 'Exam Results', icon: BarChart2 },
        { id: 'assignments', label: 'Assignments', icon: ClipboardList },
        { id: 'submissions', label: 'Submissions', icon: FileText },
      ]
    },
    {
      title: "Communications",
      items: [
        { id: 'bulletins', label: 'Bulletins', icon: Bell },
      ]
    }
  ];
  
  // Local Data State
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments || []);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(initialSubmissions || []);
  const [news, setNews] = useState<News[]>(initialNews);
  const [examResults, setExamResults] = useState<ExamResult[]>(initialResults);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  useEffect(() => {
    setExams(initialExams);
  }, [initialExams]);

  useEffect(() => {
    setAssignments(initialAssignments || []);
  }, [initialAssignments]);

  useEffect(() => {
    setSubmissions(initialSubmissions || []);
  }, [initialSubmissions]);

  useEffect(() => {
    setNews(initialNews);
  }, [initialNews]);

  useEffect(() => {
    setExamResults(initialResults);
  }, [initialResults]);

  const performanceData = React.useMemo(() => {
    if (!examResults || examResults.length === 0) return [{ date: 'N/A', average: 0 }];
    const grouped = examResults.reduce((acc: any, r) => {
      const date = new Date(r.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!acc[date]) acc[date] = { date, score: 0, count: 0 };
      acc[date].score += r.score;
      acc[date].count += 1;
      return acc;
    }, {});
    return Object.values(grouped).map((g: any) => ({
      date: g.date,
      average: Math.round(g.score / g.count)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [examResults]);

  const courseEngagementData = React.useMemo(() => {
    return courses.map(c => ({
      name: c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title,
      students: users.filter(u => u.completedCourses?.includes(c.id)).length
    })).sort((a, b) => b.students - a.students).slice(0, 5);
  }, [courses, users]);

  const fetchInsights = async () => {
    setIsAnalyzing(true);
    const data = {
      totalUsers: users.length,
      students: users.filter(u => u.role === 'student').length,
      teachers: users.filter(u => u.role === 'teacher').length,
      courses: courses.length,
      averageExamScore: examResults.length > 0 ? Math.round(examResults.reduce((acc, r) => acc + r.score, 0) / examResults.length) : 0,
      topStudent: users.filter(u => u.role === 'student').sort((a, b) => b.points - a.points)[0]?.name || 'None'
    };
    const insights = await geminiService.getSovereignInsights(data);
    setSovereignInsights(insights);
    setIsAnalyzing(false);
  };

  const handleGenerateAIExam = async (course: Course) => {
    setIsAnalyzing(true);
    showNotification(`Generating AI Exam for ${course.title}...`, 'info');
    try {
      const questions = await geminiService.generateExamQuestions(
        course.subject,
        course.title,
        'Medium',
        ['multiple-choice', 'true-false'],
        10
      );
      
      if (questions && questions.length > 0) {
        const newExam: Exam = {
          id: `ai-exam-${Date.now()}`,
          title: `AI Generated: ${course.title} Mastery`,
          courseCode: course.code,
          grade: course.grade,
          stream: course.stream,
          academicYear: new Date().getFullYear(),
          durationMinutes: 30,
          questions: questions as Question[],
          totalPoints: questions.reduce((sum, q) => sum + (q.points || 0), 0),
          status: 'draft',
          type: 'mock-eaes',
          semester: 1,
          subject: course.subject,
          difficulty: 'Medium',
          categories: [course.subject]
        };
        
        if (onAddExam) {
          await onAddExam(newExam);
          setExams([...exams, newExam]);
          showNotification(`AI Exam generated and saved as draft!`, 'success');
          setActiveTab('exams');
        }
      } else {
        showNotification("Failed to generate questions. Please try again.", 'error');
      }
    } catch (error) {
      console.error("AI Exam Generation Error:", error);
      showNotification("Error connecting to AI Lab.", 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [questionBank, setQuestionBank] = useState<Question[]>(() => {
    const allQuestions: Question[] = [];
    initialExams.forEach(e => allQuestions.push(...e.questions));
    return allQuestions;
  });
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState<User | null>(null);

  const handleAddAssignment = async (assignment: Assignment, file: File | null) => {
    let rubricUrl = assignment.rubricUrl;
    if (file) {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../firebase');
      const storageRef = ref(storage, `rubrics/${assignment.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      rubricUrl = await getDownloadURL(storageRef);
    }
    const assignmentWithRubric = { ...assignment, rubricUrl };
    await onAddAssignment?.(assignmentWithRubric);
    setAssignments([...assignments, assignmentWithRubric]);
    setIsAssignmentModalOpen(false);
  };

  const handleUpdateAssignment = async (assignment: Assignment, file: File | null) => {
    let rubricUrl = assignment.rubricUrl;
    if (file) {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../firebase');
      const storageRef = ref(storage, `rubrics/${assignment.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      rubricUrl = await getDownloadURL(storageRef);
    }
    const assignmentWithRubric = { ...assignment, rubricUrl };
    await onUpdateAssignment?.(assignmentWithRubric);
    setAssignments(assignments.map(a => a.id === assignment.id ? assignmentWithRubric : a));
    setIsAssignmentModalOpen(false);
    setEditingAssignment(null);
  };

  const handleResetUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to reset this user's Knowledge Points to 0?")) {
      const user = users.find(u => u.id === userId);
      if (user) {
        const updatedUser = { ...user, points: 0 };
        await onUpdateUser(updatedUser);
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        showNotification(`Identity ${user.name} has been reset to 0 KP.`, 'info');
      }
    }
  };

  const handleGradeSubmission = async (submission: AssignmentSubmission, file: File | null) => {
    let gradedFileUrl = submission.gradedFileUrl;
    if (file) {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../firebase');
      const storageRef = ref(storage, `graded_submissions/${submission.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      gradedFileUrl = await getDownloadURL(storageRef);
    }
    const updatedSubmission: AssignmentSubmission = { ...submission, gradedFileUrl, status: 'graded' };
    await onUpdateSubmission?.(updatedSubmission);
    setSubmissions(submissions.map(s => s.id === updatedSubmission.id ? updatedSubmission : s));
    setIsGradingModalOpen(false);
    setSelectedSubmission(null);
    showNotification(`Submission for ${submission.studentName} graded successfully.`, 'success');
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    await onDeleteAssignment(assignmentId);
    setAssignments(assignments.filter(a => a.id !== assignmentId));
  };

  const initialQuestionForm: Partial<Question> = {
    text: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1,
    category: '',
    tags: []
  };
  const [questionForm, setQuestionForm] = useState<Partial<Question>>(initialQuestionForm);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    // Populate question bank from loaded exams
    const allQuestions: Question[] = [];
    exams.forEach(exam => {
      exam.questions.forEach(q => {
        if (!allQuestions.some(existing => existing.id === q.id)) {
          allQuestions.push(q);
        }
      });
    });
    setQuestionBank(allQuestions);
  }, [exams]);

  // User CRUD State
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [isUploadingPic, setIsUploadingPic] = useState(false);

  // Curriculum CRUD State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courseWizardStep, setCourseWizardStep] = useState(1);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const initialExamForm: Partial<Exam> = {
    title: '',
    courseCode: '',
    grade: Grade.G12,
    stream: Stream.NATURAL_SCIENCE,
    academicYear: new Date().getFullYear(),
    durationMinutes: 60,
    questions: [],
    totalPoints: 0,
    status: 'draft',
    type: 'mock-eaes',
    semester: 1,
    subject: '',
    difficulty: 'Medium',
    categories: []
  };
  const [examForm, setExamForm] = useState<Partial<Exam>>(initialExamForm);
  const [examErrors, setExamErrors] = useState<{title?: string}>({});

  const handleSaveQuestion = () => {
    if (!questionForm.text || questionForm.text.trim().length === 0) return;
    
    if (editingQuestion) {
      setQuestionBank(questionBank.map(q => q.id === editingQuestion.id ? { ...editingQuestion, ...questionForm } as Question : q));
    } else {
      const newQuestion = { ...questionForm, id: `q-${Date.now()}` } as Question;
      setQuestionBank([...questionBank, newQuestion]);
    }
    setIsAddingQuestion(false);
    setEditingQuestion(null);
    setQuestionForm(initialQuestionForm);
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm("Are you sure you want to delete this question from the bank?")) {
      setQuestionBank(questionBank.filter(q => q.id !== id));
    }
  };

  const handleSaveExam = () => {
    const errors: {title?: string} = {};
    if (!examForm.title || examForm.title.trim().length === 0) {
      errors.title = "Exam title is required";
    } else if (examForm.title.trim().length < 5) {
      errors.title = "Exam title must be at least 5 characters";
    }
    
    if (Object.keys(errors).length > 0) {
      setExamErrors(errors);
      return;
    }

    if (editingExam && onUpdateExam) {
      onUpdateExam({ ...editingExam, ...examForm } as Exam);
      setExams(exams.map(e => e.id === editingExam.id ? { ...editingExam, ...examForm } as Exam : e));
    } else if (onAddExam) {
      const newExam = { ...examForm, id: `exam-${Date.now()}` } as Exam;
      onAddExam(newExam);
      setExams([...exams, newExam]);
    }
    setIsAddingExam(false);
    setEditingExam(null);
  };

  const handleSelectExam = (examId: string) => {
    setSelectedExams(prev => 
      prev.includes(examId) ? prev.filter(id => id !== examId) : [...prev, examId]
    );
  };

  const handleSelectAllExams = () => {
    if (selectedExams.length === exams.length && exams.length > 0) {
      setSelectedExams([]);
    } else {
      setSelectedExams(exams.map(e => e.id));
    }
  };

  const handleStatusChange = (examId: string, newStatus: 'draft' | 'published' | 'closed') => {
    const updatedExams = exams.map(e => e.id === examId ? { ...e, status: newStatus } : e);
    setExams(updatedExams);
    const updatedExam = updatedExams.find(e => e.id === examId);
    if (updatedExam && onUpdateExam) {
      onUpdateExam(updatedExam);
    }
  };

  const handleBulkPublishExams = () => {
    if (!onUpdateExam) return;
    const updatedExams = exams.map(exam => {
      if (selectedExams.includes(exam.id)) {
        const updated = { ...exam, status: 'published' as const };
        onUpdateExam(updated);
        return updated;
      }
      return exam;
    });
    setExams(updatedExams);
    setSelectedExams([]);
  };

  const handleBulkDeleteExams = () => {
    if (!onDeleteExam) return;
    if (window.confirm(`Are you sure you want to delete ${selectedExams.length} exams?`)) {
      selectedExams.forEach(id => onDeleteExam(id));
      setExams(exams.filter(e => !selectedExams.includes(e.id)));
      setSelectedExams([]);
    }
  };

  // News/Bulletins CRUD State
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);

  // Sorting State
  const [userSortConfig, setUserSortConfig] = useState<{ key: keyof User, direction: 'asc' | 'desc' } | null>(null);

  const sortedUsers = React.useMemo(() => {
    let sortableUsers = users.filter(u => 
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
      (u.nid || '').toLowerCase().includes(userSearchTerm.toLowerCase())
    );
    if (userSortConfig !== null) {
      sortableUsers.sort((a, b) => {
        const aValue = a[userSortConfig.key] ?? '';
        const bValue = b[userSortConfig.key] ?? '';
        if (aValue < bValue) {
          return userSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return userSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, userSortConfig, userSearchTerm]);

  const requestUserSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (userSortConfig && userSortConfig.key === key && userSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setUserSortConfig({ key, direction });
  };

  const rt = REPORT_TRANSLATIONS[reportLang];

  const initialUserForm: Partial<User> = {
    name: '', email: '', role: 'student', status: 'active', points: 0,
    grade: Grade.G12, stream: Stream.NATURAL_SCIENCE, level: EducationLevel.SECONDARY,
    gender: 'Male', nid: '', dob: '', age: 0, salary: 0, school: '',
    preferredLanguage: 'en', phoneNumber: '', address: ''
  };

  // Fix: Added missing initial course form
  const initialCourseForm: Partial<Course> = {
    title: '', code: '', grade: Grade.G12, stream: Stream.NATURAL_SCIENCE,
    level: EducationLevel.SECONDARY, thumbnail: '', description: '',
    syllabus: '', learningObjectives: [], materials: [],
    lessons: [], instructor: '', subject: '', prerequisites: []
  };

  // Fix: Added missing initial news form
  const initialNewsForm: Partial<News> = {
    title: '', summary: '', content: '', tag: '', image: '', date: new Date().toLocaleDateString()
  };

  const [userForm, setUserForm] = useState<Partial<User>>(initialUserForm);
  
  // Fix: Added missing state for course and news forms
  const [courseForm, setCourseForm] = useState<Partial<Course>>(initialCourseForm);
  const [newsForm, setNewsForm] = useState<Partial<News>>(initialNewsForm);

  const [currentLesson, setCurrentLesson] = useState<Partial<Lesson>>({
    title: '',
    content: '',
    contentType: 'video',
    videoUrl: '',
    pdfUrl: '',
    fileUrl: '',
    fileName: ''
  });

  const [newObjective, setNewObjective] = useState('');
  const [newMaterial, setNewMaterial] = useState<Partial<CourseMaterial>>({
    title: '',
    type: 'document',
    url: ''
  });

  // EXPORT LOGIC
  const downloadCSV = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(e => Object.values(e).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadWord = (elementId: string, filename: string) => {
    const html = document.getElementById(elementId)?.innerHTML || "";
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // USER CRUD LOGIC
  const openUserModal = (user: User | null = null) => {
    setProfilePicFile(null);
    if (user) {
      setEditingUser(user);
      setUserForm(user);
    } else {
      setEditingUser(null);
      setUserForm(initialUserForm);
    }
    setIsIdentityModalOpen(true);
  };

  const handleCommitUser = async () => {
    // For students, email is automatically generated if not provided, or set to students@iftu.edu.et
    // But to keep it unique for login, we'll use [nid]@students.iftu.edu.et
    const isStudent = userForm.role === 'student';
    
    if (isStudent && !userForm.nid) {
      showNotification("Validation Error: National Digital ID (NID) is mandatory for student registry.", 'error');
      return;
    }

    if (isStudent && !editingUser && !userForm.phoneNumber) {
      showNotification("Validation Error: Mobile Phone Number is required to dispatch credentials via SMS.", 'error');
      return;
    }

    // Auto-generate student email if it's a new student or if we want to enforce the pattern
    let email = userForm.email;
    if (isStudent && !editingUser) {
      email = `${userForm.nid?.toLowerCase().replace(/[^a-z0-9]/g, '')}@students.iftu.edu.et`;
    }

    const password = isStudent ? userForm.nid : 'ChangeMe123!'; // Use NID as password for students

    if (!userForm.name || !email || !userForm.nid) {
      showNotification("Validation Error: Name, Email, and National ID (NID) are mandatory for registry.", 'error');
      return;
    }

    setIsUploadingPic(true);
    let photoUrl = userForm.photo;

    // Handle profile picture upload if a new file is selected
    if (profilePicFile) {
      try {
        const storageRef = ref(storage, `profile_pics/${editingUser?.id || `usr-${Date.now()}`}_${profilePicFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, profilePicFile);
        
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('Upload is ' + progress + '% done');
            }, 
            (error) => reject(error), 
            () => resolve(null)
          );
        });
        
        photoUrl = await getDownloadURL(uploadTask.snapshot.ref);
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        showNotification("Failed to upload profile picture. Using default.", "error");
      }
    }

    const userData: User = {
      ...(userForm as User),
      email,
      id: editingUser?.id || `usr-${Date.now()}`,
      joinedDate: editingUser?.joinedDate || new Date().toISOString().split('T')[0],
      badges: editingUser?.badges || [],
      photo: photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userForm.name}&backgroundColor=b6e3f4`,
      completedLessons: editingUser?.completedLessons || [],
      completedExams: editingUser?.completedExams || [],
      completedCourses: editingUser?.completedCourses || [],
      certificatesPaid: editingUser?.certificatesPaid || []
    };

    if (editingUser?.id) {
      onUpdateUser(userData);
      setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
      showNotification(`Identity ${userData.name} updated successfully.`, 'success');
    } else {
      onAddUser(userData, password);
      setUsers(prev => [...prev, userData]);
      
      if (isStudent && userData.phoneNumber) {
        const smsMessage = `Welcome to IFTU! Email: ${email} | Pass: ${password} (NID)`;
        console.log(`[NATIONAL SMS GATEWAY] Dispatching to ${userData.phoneNumber}: ${smsMessage}`);
        if (onSendSMS) onSendSMS(userData.phoneNumber, smsMessage);
        showNotification(`SMS Credentials dispatched to ${userData.phoneNumber} via National Gateway.`, 'success');
      } else {
        showNotification(`Identity ${userData.name} successfully deployed to National Registry.`, 'success');
      }
    }
    
    setIsUploadingPic(false);
    setIsIdentityModalOpen(false);
    setEditingUser(null);
    setUserForm(initialUserForm);
    setProfilePicFile(null);
  };

  const handleDeleteUser = (id: string) => {
    onDeleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    showNotification("Identity purged from National Registry.", 'info');
  };

  // CURRICULUM CRUD LOGIC
  const handleCommitCourse = () => {
    if (!courseForm.title || !courseForm.code) {
      showNotification("Validation Error: Title and Code are mandatory for courses.", 'error');
      return;
    }

    const courseData: Course = {
      ...(courseForm as Course),
      id: editingCourse?.id || `crs-${Date.now()}`,
      lessons: courseForm.lessons || []
    };

    if (editingCourse?.id) {
      onUpdateCourse(courseData);
      setCourses(prev => prev.map(c => c.id === courseData.id ? courseData : c));
    } else {
      onAddCourse(courseData);
      setCourses(prev => [...prev, courseData]);
    }
    
    setIsAddingCourse(false);
    setEditingCourse(null);
    setCourseForm(initialCourseForm);
    setCourseWizardStep(1);
    setEditingLessonIndex(null);
    setCurrentLesson({ title: '', content: '', contentType: 'video', videoUrl: '', pdfUrl: '', fileUrl: '', fileName: '' });
  };

  const addLesson = () => {
    if (!currentLesson.title || !currentLesson.content) {
      showNotification("Lesson title and content are required.", 'error');
      return;
    }
    
    const newLesson: Lesson = {
      ...currentLesson as Lesson,
      id: currentLesson.id || `lsn-${Date.now()}`,
      duration: currentLesson.duration || '15 mins',
      type: currentLesson.contentType === 'video' ? 'video' : 'reading'
    };

    const updatedLessons = [...(courseForm.lessons || [])];
    if (editingLessonIndex !== null) {
      updatedLessons[editingLessonIndex] = newLesson;
    } else {
      updatedLessons.push(newLesson);
    }

    setCourseForm({ ...courseForm, lessons: updatedLessons });
    setCurrentLesson({ title: '', content: '', contentType: 'video', videoUrl: '', pdfUrl: '', fileUrl: '', fileName: '' });
    setEditingLessonIndex(null);
  };

  const editLesson = (index: number) => {
    if (!courseForm.lessons) return;
    const lesson = courseForm.lessons[index];
    setCurrentLesson(lesson);
    setEditingLessonIndex(index);
  };

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    if (!courseForm.lessons) return;
    const newLessons = [...courseForm.lessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLessons.length) return;
    
    [newLessons[index], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[index]];
    setCourseForm({ ...courseForm, lessons: newLessons });
  };

  const handleDeleteCourse = (id: string) => {
    if (window.confirm("Purge this course from the registry?")) {
      onDeleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  // NEWS CRUD LOGIC
  const handleCommitNews = () => {
    if (!newsForm.title || !newsForm.summary) {
      showNotification("Validation Error: Title and Summary are mandatory for bulletins.", 'error');
      return;
    }

    const newsData: News = {
      ...(newsForm as News),
      id: editingNews?.id || `news-${Date.now()}`,
      date: editingNews?.date || new Date().toLocaleDateString()
    };

    if (editingNews?.id) {
      onUpdateNews(newsData);
      setNews(prev => prev.map(n => n.id === newsData.id ? newsData : n));
    } else {
      onAddNews(newsData);
      setNews(prev => [...prev, newsData]);
    }
    
    setIsNewsModalOpen(false);
    setEditingNews(null);
    setNewsForm(initialNewsForm);
  };

  // Fix: Added missing news modal logic
  const openNewsModal = (item: News | null = null) => {
    if (item) {
      setEditingNews(item);
      setNewsForm(item);
    } else {
      setEditingNews(null);
      setNewsForm(initialNewsForm);
    }
    setIsNewsModalOpen(true);
  };

  // Fix: Added missing news deletion handler
  const handleDeleteNews = (id: string) => {
    if (window.confirm("Purge this bulletin from the registry?")) {
      onDeleteNews(id);
      setNews(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 -m-8 md:-m-12 relative overflow-hidden">
      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[6000] bg-black text-white transition-all duration-500 ease-in-out border-r-8 border-black shadow-[10px_0px_0px_0px_rgba(59,130,246,1)] ${
          isSidebarOpen ? 'w-80' : 'w-24'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-8 border-b-4 border-white/10 flex items-center justify-between">
            <div className={`flex items-center gap-4 ${!isSidebarOpen && 'hidden'}`}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center border-2 border-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="font-black uppercase italic text-xl tracking-tighter">IFTU Admin</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors hidden md:block"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                {isSidebarOpen && (
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 px-4">
                    {section.title}
                  </p>
                )}
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                        title={!isSidebarOpen ? item.label : ''}
                      >
                        <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                        {isSidebarOpen && (
                          <span className="font-black uppercase italic text-xs tracking-tight">{item.label}</span>
                        )}
                        {isActive && isSidebarOpen && (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-8 border-t-4 border-white/10 space-y-6">
            <div className={`flex items-center gap-4 ${!isSidebarOpen && 'justify-center'}`}>
              <div className="w-10 h-10 rounded-full border-2 border-blue-600 overflow-hidden bg-white">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jemal&backgroundColor=b6e3f4" alt="Admin" />
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <p className="font-black uppercase text-[10px] truncate">Jemal Fano Haji</p>
                  <p className="text-[8px] text-blue-400 uppercase font-bold">Supreme Admin</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => onNavClick('home')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white border-2 border-rose-600/20 ${!isSidebarOpen && 'justify-center'}`}
            >
              <X className="w-6 h-6 shrink-0" />
              {isSidebarOpen && (
                <span className="font-black uppercase italic text-xs tracking-tight">Exit Dashboard</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[5500] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main 
        className={`flex-1 transition-all duration-500 p-8 md:p-16 ${
          isSidebarOpen ? 'md:ml-80' : 'md:ml-24'
        }`}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-8 bg-black text-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
            <h1 className="font-black uppercase italic text-xl tracking-tighter">IFTU Command</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-blue-600 rounded-xl border-2 border-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-16 animate-fadeIn pb-32 relative">
          {/* Command Center View */}
          {activeTab === 'command_center' && (
            <div className="space-y-12 animate-fadeIn">
              <div className="bg-gradient-to-br from-blue-900 to-black p-12 md:p-20 rounded-[5rem] border-8 border-black shadow-[30px_30px_0px_0px_rgba(59,130,246,1)] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl border-4 border-white flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <ShieldCheck className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Command Center.</h2>
                      <p className="text-blue-400 font-black uppercase tracking-widest text-sm mt-2">Authorized Access: Jemal Fano Haji</p>
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-300 max-w-3xl italic">Welcome to the National Digital Education Command. Manage identities, curriculum, and assessments from this centralized hub.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {navSections.flatMap(s => s.items).filter(i => i.id !== 'command_center').map(item => {
                  const Icon = item.icon;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className="bg-white border-8 border-black rounded-[4rem] p-10 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-8px] hover:shadow-[25px_25px_0px_0px_rgba(59,130,246,1)] transition-all flex flex-col items-center text-center group"
                    >
                      <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] border-4 border-black flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
                        <Icon className="w-12 h-12 text-black group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h4 className="text-3xl font-black uppercase italic leading-none mb-2">{item.label}</h4>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Access Protocol {item.id.toUpperCase()}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notification Toast */}
          {notification && (
            <div className={`fixed top-10 right-10 z-[10000] px-10 py-6 rounded-3xl border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] animate-bounceIn ${
              notification.type === 'success' ? 'bg-green-500 text-white' : 
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              <p className="font-black uppercase italic text-xl tracking-tighter">{notification.message}</p>
            </div>
          )}
          
          {/* Sovereign Stats Bar */}
          <div className="bg-black text-white p-8 md:p-12 rounded-[3.5rem] md:rounded-[5rem] border-8 border-black shadow-[15px_15px_0px_0px_rgba(59,130,246,1)] md:shadow-[25px_25px_0px_0px_rgba(59,130,246,1)] flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10">
            <div className="text-center md:text-left">
               <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-white">
                 {navSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || 'Sovereign Command'}.
               </h2>
               <p className="text-blue-400 font-black uppercase tracking-widest text-[10px] mt-4">Authorized Admin Hub: Jemal Fano Haji</p>
            </div>
            <div className="flex gap-8 md:gap-12">
               <div className="text-center group">
                  <p className="text-4xl md:text-6xl font-black italic group-hover:text-blue-400 transition-colors">{users.length}</p>
                  <p className="text-[10px] font-black uppercase opacity-60">Identities</p>
               </div>
               <div className="text-center group">
                  <p className="text-4xl md:text-6xl font-black italic text-green-400 group-hover:text-green-300 transition-colors">{courses.length}</p>
                  <p className="text-[10px] font-black uppercase opacity-60">Modules</p>
               </div>
            </div>
          </div>

          {/* Content Views */}
          <div className="min-h-[60vh]">
            {/* Analytics & Reports View */}
            {activeTab === 'analytics' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-16 printable-transcript" 
          id="analytics-report-container"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 no-print">
             <div>
               <h3 className="text-4xl font-black uppercase italic tracking-tighter text-blue-900">{rt.analytics}</h3>
               <div className="flex gap-4 mt-4">
                 <button onClick={() => setReportLang('en')} className={`px-4 py-1 border-2 border-black font-black uppercase text-[10px] rounded-lg ${reportLang === 'en' ? 'bg-black text-white' : 'bg-white'}`}>{rt.english}</button>
                 <button onClick={() => setReportLang('om')} className={`px-4 py-1 border-2 border-black font-black uppercase text-[10px] rounded-lg ${reportLang === 'om' ? 'bg-black text-white' : 'bg-white'}`}>{rt.afanOromo}</button>
               </div>
             </div>
             <div className="flex gap-4 flex-wrap">
                <button 
                  onClick={fetchInsights} 
                  disabled={isAnalyzing}
                  className="bg-purple-600 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 flex items-center gap-2"
                >
                  <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                  {isAnalyzing ? 'Analyzing...' : 'Generate AI Insights'}
                </button>
                <button onClick={handlePrintPDF} className="bg-rose-600 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1">PDF Gabaasa</button>
                <button onClick={() => downloadCSV(users, "IFTU_Registry_Export")} className="bg-green-600 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1">Excel (CSV)</button>
                <button onClick={() => downloadWord("analytics-report-container", "IFTU_Sovereign_Doc")} className="bg-blue-600 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1">Word Module</button>
             </div>
          </div>

          {/* AI Insights Section */}
          <AnimatePresence>
            {sovereignInsights.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {sovereignInsights.map((insight, idx) => (
                  <div key={idx} className="bg-purple-50 border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-200 rounded-full opacity-20 group-hover:scale-150 transition-transform"></div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full border-2 border-black text-[8px] font-black uppercase ${insight.impact === 'High' ? 'bg-rose-400' : insight.impact === 'Medium' ? 'bg-orange-400' : 'bg-green-400'}`}>
                        {insight.impact} Impact
                      </span>
                      <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <h5 className="text-xl font-black uppercase italic mb-2">{insight.title}</h5>
                    <p className="text-sm font-bold text-gray-600 leading-relaxed">{insight.insight}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visual Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             {/* Performance Trend Chart */}
             <div className="bg-white border-8 border-black rounded-[4rem] p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-3xl font-black uppercase italic border-l-8 border-blue-600 pl-4">Performance Trend</h4>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: '4px solid black', fontWeight: 'bold' }}
                        itemStyle={{ color: '#2563eb' }}
                      />
                      <Area type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorAvg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 text-center">Average Exam Scores Over Time</p>
             </div>

             {/* Course Engagement Chart */}
             <div className="bg-white border-8 border-black rounded-[4rem] p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-3xl font-black uppercase italic border-l-8 border-green-600 pl-4">Top Courses</h4>
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courseEngagementData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} width={100} />
                      <Tooltip 
                        cursor={{fill: '#f3f4f6'}}
                        contentStyle={{ borderRadius: '1rem', border: '4px solid black', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="students" fill="#10b981" radius={[0, 10, 10, 0]}>
                        {courseEngagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 text-center">Student Completion Count per Course</p>
             </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl border-4 border-black flex items-center justify-center text-3xl">👥</div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">Total Users</p>
                <p className="text-3xl font-black italic">{users.length}</p>
              </div>
            </div>
            <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl border-4 border-black flex items-center justify-center text-3xl">📚</div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">Active Courses</p>
                <p className="text-3xl font-black italic">{courses.length}</p>
              </div>
            </div>
            <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-6">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl border-4 border-black flex items-center justify-center text-3xl">📝</div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">Exams Taken</p>
                <p className="text-3xl font-black italic">{examResults.length}</p>
              </div>
            </div>
            <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-6">
              <div className="w-16 h-16 bg-rose-100 rounded-2xl border-4 border-black flex items-center justify-center text-3xl">⚡</div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">System Uptime</p>
                <p className="text-3xl font-black italic">99.2%</p>
              </div>
            </div>
          </div>

          {/* Detailed Tables Section */}
          <div className="space-y-12">
             <div className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-8 bg-black text-white flex justify-between items-center border-b-8 border-black">
                   <h4 className="text-2xl font-black uppercase italic">{rt.students}</h4>
                </div>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 font-black uppercase text-[10px] border-b-4 border-black">
                        <tr>
                          <th className="p-8">{rt.name}</th>
                          <th className="p-8">{rt.points}</th>
                          <th className="p-8">{rt.status}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-4 divide-black">
                        {users.filter(u => u.role === 'student').slice(0, 10).map(u => (
                          <tr key={u.id} className="font-bold">
                            <td className="p-8">{u.name}</td>
                            <td className="p-8 text-blue-600">{u.points}</td>
                            <td className="p-8"><span className={`px-4 py-1 border-2 border-black rounded-xl text-[8px] uppercase ${u.status === 'active' ? 'bg-green-100' : 'bg-rose-100'}`}>{u.status}</span></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden divide-y-4 divide-black">
                  {users.filter(u => u.role === 'student').slice(0, 10).map(u => (
                    <div key={u.id} className="p-6 space-y-2">
                      <p className="font-black italic">{u.name}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-black text-blue-600">{u.points} KP</p>
                        <span className={`px-3 py-1 border-2 border-black rounded-lg text-[8px] uppercase font-black ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{u.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-8 bg-blue-900 text-white flex justify-between items-center border-b-8 border-black">
                   <h4 className="text-2xl font-black uppercase italic">{rt.teachers}</h4>
                </div>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 font-black uppercase text-[10px] border-b-4 border-black">
                        <tr>
                          <th className="p-8">{rt.name}</th>
                          <th className="p-8">{rt.subject}</th>
                          <th className="p-8">{rt.status}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-4 divide-black">
                        {users.filter(u => u.role === 'teacher').slice(0, 10).map(u => (
                          <tr key={u.id} className="font-bold">
                            <td className="p-8">{u.name}</td>
                            <td className="p-8 italic">{u.department || 'N/A'}</td>
                            <td className="p-8"><span className={`px-4 py-1 border-2 border-black rounded-xl text-[8px] uppercase ${u.status === 'active' ? 'bg-green-100' : 'bg-rose-100'}`}>{u.status}</span></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden divide-y-4 divide-black">
                  {users.filter(u => u.role === 'teacher').slice(0, 10).map(u => (
                    <div key={u.id} className="p-6 space-y-2">
                      <p className="font-black italic">{u.name}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-black text-gray-500 italic">{u.department || 'N/A'}</p>
                        <span className={`px-3 py-1 border-2 border-black rounded-lg text-[8px] uppercase font-black ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{u.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </motion.div>
      )}

      {/* Submissions View */}
      {activeTab === 'submissions' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h3 className="text-4xl font-black uppercase italic tracking-tighter text-blue-900 leading-none">Assignment Submissions</h3>
              <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">Grade student work and provide feedback</p>
            </div>
          </div>

          <div className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 font-black uppercase text-[10px] border-b-4 border-black">
                  <tr>
                    <th className="p-8">Student</th>
                    <th className="p-8">Assignment</th>
                    <th className="p-8">Submitted At</th>
                    <th className="p-8">Status</th>
                    <th className="p-8">Grade</th>
                    <th className="p-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-black">
                  {submissions.map(s => {
                    const assignment = assignments.find(a => a.id === s.assignmentId);
                    return (
                      <tr key={s.id} className="font-bold hover:bg-gray-50 transition-colors">
                        <td className="p-8">
                          <p className="font-black italic">{s.studentName}</p>
                          <p className="text-[8px] uppercase text-gray-400">ID: {s.studentId}</p>
                        </td>
                        <td className="p-8">
                          <p className="font-black italic">{assignment?.title || 'Unknown Assignment'}</p>
                          <p className="text-[8px] uppercase text-gray-400">{assignment?.courseCode}</p>
                        </td>
                        <td className="p-8 text-xs">{new Date(s.submittedAt).toLocaleString()}</td>
                        <td className="p-8">
                          <span className={`px-4 py-1 border-2 border-black rounded-xl text-[8px] uppercase ${s.grade !== undefined ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                            {s.grade !== undefined ? 'Graded' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-8">
                          {s.grade !== undefined ? (
                            <span className="font-black italic text-blue-600">{s.grade} / {assignment?.points || 100}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not graded</span>
                          )}
                        </td>
                        <td className="p-8 text-right">
                          <button 
                            onClick={() => { setSelectedSubmission(s); setIsGradingModalOpen(true); }}
                            className="px-6 py-2 bg-black text-white rounded-xl border-2 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all"
                          >
                            {s.grade !== undefined ? 'Update Grade' : 'Grade Now'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-20 text-center text-gray-400 font-black uppercase tracking-widest italic">No submissions found in registry.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y-4 divide-black">
              {submissions.map(s => {
                const assignment = assignments.find(a => a.id === s.assignmentId);
                return (
                  <div key={s.id} className="p-8 space-y-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black italic text-lg">{s.studentName}</p>
                        <p className="text-[8px] uppercase text-gray-400">ID: {s.studentId}</p>
                      </div>
                      <span className={`px-3 py-1 border-2 border-black rounded-lg text-[8px] uppercase font-black ${s.grade !== undefined ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {s.grade !== undefined ? 'Graded' : 'Pending'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border-2 border-black space-y-2">
                      <p className="text-[10px] font-black uppercase text-gray-400">Assignment</p>
                      <p className="font-black italic">{assignment?.title || 'Unknown'}</p>
                      <p className="text-[8px] uppercase text-blue-600">{assignment?.courseCode}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[8px] font-black uppercase text-gray-400">Submitted</p>
                        <p className="text-[10px] font-bold">{new Date(s.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-gray-400">Grade</p>
                        {s.grade !== undefined ? (
                          <p className="font-black italic text-blue-600">{s.grade} / {assignment?.points || 100}</p>
                        ) : (
                          <p className="text-gray-400 italic text-[10px]">Not graded</p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSelectedSubmission(s); setIsGradingModalOpen(true); }}
                      className="w-full py-4 bg-black text-white rounded-xl border-2 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]"
                    >
                      {s.grade !== undefined ? 'Update Grade' : 'Grade Now'}
                    </button>
                  </div>
                );
              })}
              {submissions.length === 0 && (
                <div className="p-20 text-center text-gray-400 font-black uppercase tracking-widest italic">No submissions found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Identities View */}
      {activeTab === 'identities' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
             <div>
               <h3 className="text-4xl font-black uppercase italic tracking-tighter text-blue-900 leading-none">Identity Registry</h3>
               <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">National Sovereign Citizen Database</p>
             </div>
             <div className="flex gap-4 w-full md:w-auto">
               <input 
                 type="text" 
                 placeholder="Search by Name, Email, or NID..." 
                 className="flex-1 md:w-80 p-5 bg-white border-8 border-black rounded-3xl font-black text-sm outline-none focus:shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] transition-all"
                 value={userSearchTerm}
                 onChange={(e) => setUserSearchTerm(e.target.value)}
               />
               <button 
                 onClick={() => {
                   setIsLoading(true);
                   dbService.fetchAllUsers().then(u => {
                     setUsers(u.length > 0 ? u : initialUsers);
                     setIsLoading(false);
                     showNotification("Registry data synchronized with National Database.", 'success');
                   });
                 }} 
                 className="bg-black text-white p-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all"
                 title="Sync with Database"
               >
                 <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
               </button>
               <button 
                 onClick={() => openUserModal()} 
                 className="bg-blue-600 text-white px-10 py-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all"
               >
                 ＋ Deploy Identity
               </button>
             </div>
          </div>
          <div className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-black text-white border-b-[12px] border-black font-black uppercase text-[10px] tracking-[0.2em]">
                   <tr>
                     <th className="p-10 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => requestUserSort('name')}>
                       Legal Identity {userSortConfig?.key === 'name' ? (userSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                     </th>
                     <th className="p-10 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => requestUserSort('role')}>
                       Role/Status {userSortConfig?.key === 'role' ? (userSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                     </th>
                     <th className="p-10 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => requestUserSort('points')}>
                       Registry Details {userSortConfig?.key === 'points' ? (userSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                     </th>
                     <th className="p-10 text-center">Command</th>
                   </tr>
                </thead>
                <tbody className="divide-y-8 divide-black font-black">
                   {sortedUsers.map(u => (
                     <tr key={u.id} className="hover:bg-blue-50 transition-all group">
                       <td className="p-10">
                          <div className="flex items-center gap-6">
                             <div className="relative">
                               <img src={u.photo} className="w-20 h-20 rounded-3xl border-4 border-black bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-y-[-4px] transition-all" alt="" />
                               {u.status === 'active' && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 border-4 border-black rounded-full"></div>}
                             </div>
                             <div>
                                <p className="text-3xl italic leading-none tracking-tighter group-hover:text-blue-600 transition-colors">{u.name}</p>
                                <p className="text-[10px] text-gray-400 uppercase mt-2 tracking-widest">{u.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="p-10">
                          <div className="flex flex-col gap-3">
                            <span className={`px-6 py-2 rounded-2xl border-4 border-black text-[10px] uppercase font-black w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${u.role === 'admin' ? 'bg-black text-white' : u.role === 'teacher' ? 'bg-orange-400' : 'bg-blue-100'}`}>
                              {u.role}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-rose-500'} border-2 border-black`}></span>
                              <span className={`text-[10px] uppercase font-black tracking-widest ${u.status === 'active' ? 'text-green-600' : 'text-rose-600'}`}>
                                {u.status}
                              </span>
                            </div>
                          </div>
                       </td>
                       <td className="p-10">
                          <div className="space-y-2 text-sm bg-gray-50 p-6 rounded-3xl border-4 border-black shadow-inner">
                             <p className="italic text-gray-400 flex justify-between">NID: <span className="text-black not-italic font-black">{u.nid || 'ARCHIVE_PENDING'}</span></p>
                             <p className="italic text-gray-400 flex justify-between">Level: <span className="text-black not-italic font-black">{u.grade || 'STAFF'}</span></p>
                             <p className="italic text-gray-400 flex justify-between">KP: <span className="text-blue-600 not-italic font-black">{u.points.toLocaleString()}</span></p>
                          </div>
                       </td>
                       <td className="p-10">
                          <div className="flex justify-center gap-4">
                             {u.role === 'student' && (
                               <button 
                                 onClick={() => setSelectedStudentForProgress(u)}
                                 className="p-4 bg-green-600 text-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 active:shadow-none transition-all"
                                 title="View Progress"
                               >
                                 <TrendingUp className="w-6 h-6" />
                               </button>
                             )}
                             <button 
                               onClick={() => openUserModal(u)}
                               className="p-4 bg-blue-600 text-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 active:shadow-none transition-all"
                               title="Edit Identity"
                             >
                               <Edit className="w-6 h-6" />
                             </button>
                             <button 
                               onClick={() => handleResetUser(u.id)}
                               className="p-4 bg-orange-500 text-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 active:shadow-none transition-all"
                               title="Reset Identity"
                             >
                               <RefreshCw className="w-6 h-6" />
                             </button>
                             <button 
                               onClick={() => handleDeleteUser(u.id)}
                               className="p-4 bg-rose-600 text-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 active:shadow-none transition-all"
                               title="Purge Identity"
                             >
                               <Trash2 className="w-6 h-6" />
                             </button>
                          </div>
                       </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y-8 divide-black">
              {sortedUsers.map(u => (
                <div key={u.id} className="p-8 space-y-6 bg-white hover:bg-blue-50 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <img src={u.photo} className="w-24 h-24 rounded-3xl border-4 border-black bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" alt="" />
                      {u.status === 'active' && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 border-4 border-black rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <p className="text-3xl font-black italic leading-tight tracking-tighter">{u.name}</p>
                      <p className="text-xs text-gray-500 font-bold truncate">{u.email}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-lg border-2 border-black text-[8px] uppercase font-black ${u.role === 'admin' ? 'bg-black text-white' : u.role === 'teacher' ? 'bg-orange-400' : 'bg-blue-100'}`}>
                          {u.role}
                        </span>
                        <span className={`px-3 py-1 rounded-lg border-2 border-black text-[8px] uppercase font-black ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                          {u.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-3xl border-4 border-black">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-gray-400">NID</p>
                      <p className="text-sm font-black italic">{u.nid || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-gray-400">Level</p>
                      <p className="text-sm font-black italic">{u.grade || 'STAFF'}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-[8px] font-black uppercase text-gray-400">Knowledge Points</p>
                      <p className="text-2xl font-black italic text-blue-600">{u.points.toLocaleString()} KP</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {u.role === 'student' && (
                      <button 
                        onClick={() => setSelectedStudentForProgress(u)}
                        className="flex items-center justify-center gap-2 p-4 bg-green-600 text-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-[10px]"
                      >
                        <TrendingUp className="w-4 h-4" /> Progress
                      </button>
                    )}
                    <button 
                      onClick={() => openUserModal(u)}
                      className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-[10px]"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button 
                      onClick={() => handleResetUser(u.id)}
                      className="flex items-center justify-center gap-2 p-4 bg-orange-500 text-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-[10px]"
                    >
                      <RefreshCw className="w-4 h-4" /> Reset
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="flex items-center justify-center gap-2 p-4 bg-rose-600 text-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-[10px]"
                    >
                      <Trash2 className="w-4 h-4" /> Purge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {isIdentityModalOpen && (
        <div className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-fadeIn overflow-y-auto">
           <div className="bg-white w-full max-w-6xl rounded-[5rem] border-[12px] border-black p-8 md:p-20 space-y-12 shadow-[50px_50px_0px_0px_rgba(59,130,246,1)] my-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-6 ethiopian-gradient"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-black pb-10 gap-6">
                <div className="space-y-2">
                  <h3 className="text-4xl md:text-6xl font-black uppercase italic text-blue-900 tracking-tighter leading-none">Identity Architect.</h3>
                  <p className="text-xl font-black uppercase text-gray-400 tracking-widest">Registry Deployment Protocol</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-gray-400">Registry Trace</p>
                   <p className="text-2xl font-black italic text-blue-600">{userForm.id || 'NEW_DEPLOYMENT'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <div className="space-y-8">
                  <h4 className="text-2xl font-black uppercase italic border-l-8 border-blue-600 pl-4 bg-blue-50 py-2">Biological Data</h4>
                  
                  <div className="flex flex-col items-center gap-4 p-6 border-4 border-dashed border-gray-200 rounded-3xl bg-gray-50">
                    <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                      <img 
                        src={profilePicFile ? URL.createObjectURL(profilePicFile) : (userForm.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userForm.name || 'default'}&backgroundColor=b6e3f4`)} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-xl border-4 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">
                      {isUploadingPic ? 'Processing...' : 'Upload Identity Photo'}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setProfilePicFile(file);
                        }} 
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex justify-between">Legal Name <span className="text-rose-500">*REQUIRED</span></label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-blue-50 focus:border-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} placeholder="Full Legal Name" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex justify-between">Identity Email <span className="text-blue-600">AUTO-GEN IF STUDENT</span></label>
                    <input 
                      className={`w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${userForm.role === 'student' ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'focus:bg-blue-50 focus:border-blue-600'}`} 
                      value={userForm.role === 'student' && !editingUser ? (userForm.nid ? `${userForm.nid.toLowerCase().replace(/[^a-z0-9]/g, '')}@students.iftu.edu.et` : 'Auto-generated from NID') : (userForm.email || '')} 
                      onChange={e => setUserForm({...userForm, email: e.target.value})} 
                      disabled={userForm.role === 'student' && !editingUser}
                      placeholder={userForm.role === 'student' ? 'Auto-generated from NID' : 'example@iftu.edu.et'}
                    />
                    {userForm.role === 'student' && !editingUser && (
                      <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest ml-2">National Student Domain Enforced</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex justify-between">National ID (NID) <span className="text-rose-500">*REQUIRED</span></label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-blue-50 focus:border-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.nid || ''} onChange={e => setUserForm({...userForm, nid: e.target.value})} placeholder="ET-2025-XXXX" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex justify-between">Mobile Phone <span className="text-blue-600">SMS GATEWAY</span></label>
                    <input type="tel" className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-blue-50 focus:border-blue-600 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.phoneNumber || ''} onChange={e => setUserForm({...userForm, phoneNumber: e.target.value})} placeholder="+251 9XX XXX XXX" />
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-2xl font-black uppercase italic border-l-8 border-orange-400 pl-4 bg-orange-50 py-2">Clearance & Role</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Portal Role</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-orange-50 focus:border-orange-400 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})}>
                      <option value="student">STUDENT</option>
                      <option value="teacher">TEACHER</option>
                      <option value="admin">ADMINISTRATOR</option>
                      <option value="content_creator">CONTENT CREATOR</option>
                      <option value="teaching_assistant">TEACHING ASSISTANT</option>
                      <option value="guest_user">GUEST USER</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registry Status</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-orange-50 focus:border-orange-400 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.status} onChange={e => setUserForm({...userForm, status: e.target.value as any})}>
                      <option value="active">ACTIVE_CLEARANCE</option>
                      <option value="pending">PENDING_REVIEW</option>
                      <option value="suspended">SUSPENDED_ACCESS</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Knowledge Points (KP)</label>
                    <input type="number" className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-orange-50 focus:border-orange-400 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.points || 0} onChange={e => setUserForm({...userForm, points: parseInt(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-2xl font-black uppercase italic border-l-8 border-green-600 pl-4 bg-green-50 py-2">Sector Mapping</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Hub (Grade/Level)</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-green-50 focus:border-green-600 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.grade} onChange={e => setUserForm({...userForm, grade: e.target.value as Grade})}>
                       {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Education Level</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-green-50 focus:border-green-600 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.level} onChange={e => setUserForm({...userForm, level: e.target.value as EducationLevel})}>
                       {Object.values(EducationLevel).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Allocation Stream</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-green-50 focus:border-green-600 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.stream} onChange={e => setUserForm({...userForm, stream: e.target.value as Stream})}>
                       {Object.values(Stream).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monthly Remuneration (ETB)</label>
                    <input type="number" className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-green-50 focus:border-green-600 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.salary || 0} onChange={e => setUserForm({...userForm, salary: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Age</label>
                    <input type="number" className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-green-50 focus:border-green-600 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" value={userForm.age || 0} onChange={e => setUserForm({...userForm, age: parseInt(e.target.value) || 0})} placeholder="Age" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 pt-12 border-t-8 border-black">
                <button onClick={() => setIsIdentityModalOpen(false)} className="flex-1 py-8 border-8 border-black rounded-[3rem] font-black uppercase text-2xl hover:bg-gray-50 transition-all">Abort Changes</button>
                <button onClick={handleCommitUser} disabled={isUploadingPic} className={`flex-1 py-8 bg-black text-white border-8 border-black rounded-[3rem] font-black uppercase text-2xl shadow-[15px_15px_0px_0px_rgba(59,130,246,1)] hover:translate-y-2 active:shadow-none transition-all ${isUploadingPic ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isUploadingPic ? 'Synchronizing...' : (editingUser ? 'Update Identity' : 'Synchronize & Dispatch SMS')}
                </button>
              </div>
              {!editingUser && (
                <p className="text-[10px] font-black text-rose-500 uppercase text-center mt-4 italic">
                  ⚠️ NOTE: Synchronizing a new identity will temporarily suspend your current session for security validation.
                </p>
              )}
           </div>
        </div>
      )}

      {/* Question Bank Modal */}
      {isQuestionBankOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] border-8 border-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] p-12 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setIsQuestionBankOpen(false)} className="absolute top-8 right-8 text-4xl font-black hover:text-rose-600 transition-colors">×</button>
            <h3 className="text-4xl font-black uppercase italic mb-8 text-purple-900">Question Bank</h3>
            
            {!isAddingQuestion ? (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold text-gray-500">{questionBank.length} Questions Available</p>
                  <button onClick={() => { setQuestionForm(initialQuestionForm); setIsAddingQuestion(true); }} className="bg-green-600 text-white px-8 py-4 rounded-2xl border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">＋ Add Question</button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {questionBank.map(q => (
                    <div key={q.id} className="border-4 border-black rounded-3xl p-6 bg-gray-50 flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <p className="font-bold text-lg">{q.text}</p>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => { setEditingQuestion(q); setQuestionForm(q); setIsAddingQuestion(true); }} className="bg-black text-white px-4 py-2 rounded-lg border-2 border-black font-black uppercase text-[10px]">Edit</button>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="text-rose-600 font-black uppercase text-[10px] p-2">🗑️</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-[10px] font-black uppercase rounded-full border-2 border-blue-200">{q.type}</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-black uppercase rounded-full border-2 border-yellow-200">{q.points} pts</span>
                        {q.category && <span className="px-3 py-1 bg-purple-100 text-purple-800 text-[10px] font-black uppercase rounded-full border-2 border-purple-200">{q.category}</span>}
                        {q.tags && q.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-200 text-gray-700 text-[9px] font-bold uppercase rounded-md border border-gray-300">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {questionBank.length === 0 && (
                     <div className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest">No questions in bank</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-3xl font-black uppercase italic">{editingQuestion ? 'Edit Question' : 'New Question'}</h4>
                  <button onClick={() => { setIsAddingQuestion(false); setEditingQuestion(null); }} className="text-gray-400 hover:text-black font-black uppercase text-sm">← Back to Bank</button>
                </div>
                
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Question Text</label>
                  <textarea 
                    value={questionForm.text || ''} 
                    onChange={e => setQuestionForm({...questionForm, text: e.target.value})}
                    className="w-full p-6 bg-gray-50 border-4 border-black rounded-2xl font-bold outline-none focus:bg-white min-h-[120px]"
                    placeholder="Enter the question text..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Type</label>
                    <select 
                      value={questionForm.type || 'multiple-choice'} 
                      onChange={e => setQuestionForm({...questionForm, type: e.target.value as any})}
                      className="w-full p-6 bg-gray-50 border-4 border-black rounded-2xl font-bold outline-none focus:bg-white"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="fill-in-the-blank">Fill in the Blank</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Points</label>
                    <input 
                      type="number" 
                      min="1"
                      value={questionForm.points || 1} 
                      onChange={e => setQuestionForm({...questionForm, points: parseInt(e.target.value) || 1})}
                      className="w-full p-6 bg-gray-50 border-4 border-black rounded-2xl font-bold outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {questionForm.type === 'multiple-choice' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Options & Correct Answer</label>
                    {questionForm.options?.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <input 
                          type="radio" 
                          name="correctAnswer" 
                          checked={questionForm.correctAnswer === idx}
                          onChange={() => setQuestionForm({...questionForm, correctAnswer: idx})}
                          className="w-6 h-6 border-2 border-black accent-green-600"
                        />
                        <input 
                          type="text" 
                          value={opt} 
                          onChange={e => {
                            const newOpts = [...(questionForm.options || [])];
                            newOpts[idx] = e.target.value;
                            setQuestionForm({...questionForm, options: newOpts});
                          }}
                          className="flex-1 p-4 bg-gray-50 border-4 border-black rounded-xl font-bold outline-none focus:bg-white"
                          placeholder={`Option ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {questionForm.type === 'true-false' && (
                  <div className="space-y-4">
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Correct Answer</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tfAnswer" checked={questionForm.correctAnswer === 0} onChange={() => setQuestionForm({...questionForm, correctAnswer: 0, options: ['True', 'False']})} className="w-6 h-6 border-2 border-black accent-green-600" />
                        <span className="font-bold">True</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tfAnswer" checked={questionForm.correctAnswer === 1} onChange={() => setQuestionForm({...questionForm, correctAnswer: 1, options: ['True', 'False']})} className="w-6 h-6 border-2 border-black accent-green-600" />
                        <span className="font-bold">False</span>
                      </label>
                    </div>
                  </div>
                )}

                {questionForm.type === 'fill-in-the-blank' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Correct Answer (Exact Text)</label>
                    <input 
                      type="text" 
                      value={questionForm.correctAnswer as string || ''} 
                      onChange={e => setQuestionForm({...questionForm, correctAnswer: e.target.value})}
                      className="w-full p-6 bg-gray-50 border-4 border-black rounded-2xl font-bold outline-none focus:bg-white"
                      placeholder="Enter the exact correct answer"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Category</label>
                    <input 
                      type="text" 
                      value={questionForm.category || ''} 
                      onChange={e => setQuestionForm({...questionForm, category: e.target.value})}
                      className="w-full p-6 bg-gray-50 border-4 border-black rounded-2xl font-bold outline-none focus:bg-white"
                      placeholder="e.g. Algebra"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Tags (comma-separated)</label>
                    <input 
                      type="text" 
                      value={questionForm.tags?.join(', ') || ''} 
                      onChange={e => setQuestionForm({...questionForm, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      className="w-full p-6 bg-gray-50 border-4 border-black rounded-2xl font-bold outline-none focus:bg-white"
                      placeholder="e.g. hard, word-problem"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button onClick={handleSaveQuestion} className="flex-1 bg-black text-white py-6 rounded-2xl border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] hover:translate-y-1 transition-all">Save Question</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {isAddingExam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] border-8 border-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] p-12 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-4xl font-black uppercase italic mb-8">{editingExam ? 'Edit Exam' : 'New Exam'}</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Exam Title</label>
                <input 
                  type="text" 
                  required
                  minLength={5}
                  value={examForm.title || ''} 
                  onChange={e => { setExamForm({...examForm, title: e.target.value}); setExamErrors({}); }}
                  className={`w-full p-6 bg-gray-50 border-4 border-black rounded-2xl font-bold outline-none focus:bg-white ${examErrors.title ? 'border-rose-500 bg-rose-50' : ''}`}
                  placeholder="e.g. National Mock Exam 2026"
                />
                {examErrors.title && <p className="text-rose-500 text-xs font-bold mt-2">{examErrors.title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Subject</label>
                  <input 
                    type="text" 
                    value={examForm.subject || ''} 
                    onChange={e => setExamForm({...examForm, subject: e.target.value})}
                    className="w-full p-6 bg-gray-50 border-4 border-black rounded-2xl font-bold outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Difficulty</label>
                  <select 
                    value={examForm.difficulty || 'Medium'} 
                    onChange={e => setExamForm({...examForm, difficulty: e.target.value as any})}
                    className="w-full p-6 bg-gray-50 border-4 border-black rounded-2xl font-bold outline-none focus:bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Categories (comma-separated)</label>
                <input 
                  type="text" 
                  value={examForm.categories?.join(', ') || ''} 
                  onChange={e => setExamForm({...examForm, categories: e.target.value.split(',').map(s => s.trimStart())})}
                  className="w-full p-6 bg-gray-50 border-4 border-black rounded-2xl font-bold outline-none focus:bg-white"
                  placeholder="e.g. Algebra, Geometry, Calculus"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500">Exam Questions ({examForm.questions?.length || 0})</label>
                  <button onClick={() => setIsQuestionBankOpen(true)} className="text-[10px] font-black uppercase bg-purple-100 text-purple-800 px-3 py-1 rounded-lg border-2 border-purple-200 hover:bg-purple-200">Open Question Bank</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto p-4 bg-gray-50 border-4 border-black rounded-2xl">
                  {questionBank.map(q => {
                    const isSelected = examForm.questions?.some(eq => eq.id === q.id);
                    return (
                      <label key={q.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-600' : 'bg-white border-gray-200 hover:border-black'}`}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            const currentQuestions = examForm.questions || [];
                            if (e.target.checked) {
                              setExamForm({...examForm, questions: [...currentQuestions, q], totalPoints: (examForm.totalPoints || 0) + q.points});
                            } else {
                              setExamForm({...examForm, questions: currentQuestions.filter(eq => eq.id !== q.id), totalPoints: (examForm.totalPoints || 0) - q.points});
                            }
                          }}
                          className="mt-1 w-5 h-5 border-2 border-black accent-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-sm line-clamp-2">{q.text}</p>
                          <div className="flex flex-wrap gap-2 mt-1 items-center">
                            <span className="text-[9px] font-black uppercase text-gray-500">{q.type}</span>
                            <span className="text-[9px] font-black uppercase text-yellow-600">{q.points} pts</span>
                            {q.tags && q.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[8px] font-bold uppercase rounded border border-gray-300">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  {questionBank.length === 0 && (
                    <p className="text-center text-xs font-bold text-gray-400 py-4">No questions available. Add some in the Question Bank.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button onClick={handleSaveExam} className="flex-1 bg-black text-white py-6 rounded-2xl border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all">Save Exam</button>
                <button onClick={() => { setIsAddingExam(false); setEditingExam(null); }} className="px-8 py-6 bg-gray-200 text-black rounded-2xl border-4 border-black font-black uppercase text-xl hover:bg-gray-300 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum Architect Modal */}
      {isAddingCourse && (
        <div className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-fadeIn overflow-y-auto">
           <div className="bg-white w-full max-w-6xl rounded-[5rem] border-[12px] border-black p-8 md:p-20 space-y-12 shadow-[50px_50px_0px_0px_rgba(0,208,90,1)] my-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-6 ethiopian-gradient"></div>
              
              <div className="flex justify-between items-end border-b-8 border-black pb-10">
                <h3 className="text-4xl md:text-6xl font-black uppercase italic text-green-900 tracking-tighter leading-none">Course Architect.</h3>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-gray-400">Registry Trace</p>
                   <p className="text-2xl font-black italic">{courseForm.id || 'NEW_COURSE'}</p>
                </div>
              </div>

              {/* Wizard Progress Indicator */}
              <div className="flex justify-between items-center mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-2 bg-gray-200 rounded-full z-0"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-green-600 rounded-full z-0 transition-all duration-300" style={{ width: `${((courseWizardStep - 1) / 4) * 100}%` }}></div>
                
                {[1, 2, 3, 4, 5].map(step => (
                  <div key={step} className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center font-black text-lg transition-colors ${courseWizardStep >= step ? 'bg-green-600 border-black text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                    {step}
                  </div>
                ))}
              </div>

              {courseWizardStep === 1 && (
                <div className="space-y-8 animate-fadeIn">
                  <h4 className="text-3xl font-black uppercase italic border-l-8 border-green-600 pl-4">Step 1: Module Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Title</label>
                      <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-green-50" value={courseForm.title || ''} onChange={e => setCourseForm({...courseForm, title: e.target.value})} placeholder="e.g. Advanced Calculus" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Code</label>
                      <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-green-50" value={courseForm.code || ''} onChange={e => setCourseForm({...courseForm, code: e.target.value})} placeholder="e.g. MATH-401" />
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</label>
                      <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-green-50" value={courseForm.subject || ''} onChange={e => setCourseForm({...courseForm, subject: e.target.value})} placeholder="e.g. Mathematics" />
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                      <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none h-32 focus:bg-green-50" value={courseForm.description || ''} onChange={e => setCourseForm({...courseForm, description: e.target.value})} placeholder="Enter a comprehensive description for this module..." />
                    </div>
                  </div>
                </div>
              )}

              {courseWizardStep === 2 && (
                <div className="space-y-8 animate-fadeIn">
                  <h4 className="text-3xl font-black uppercase italic border-l-8 border-blue-600 pl-4">Step 2: Allocation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Grade</label>
                      <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-blue-50" value={courseForm.grade} onChange={e => setCourseForm({...courseForm, grade: e.target.value as Grade})}>
                         {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stream</label>
                      <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-blue-50" value={courseForm.stream} onChange={e => setCourseForm({...courseForm, stream: e.target.value as Stream})}>
                         {Object.values(Stream).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Instructor</label>
                      <div className="flex gap-4">
                        <select 
                          className="flex-1 p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-blue-50" 
                          value={users.find(u => u.name === courseForm.instructor)?.id || ''} 
                          onChange={e => {
                            const selectedUser = users.find(u => u.id === e.target.value);
                            if (selectedUser) {
                              setCourseForm({
                                ...courseForm, 
                                instructor: selectedUser.name,
                                instructorId: selectedUser.id,
                                instructorEmail: selectedUser.email,
                                instructorPhoto: selectedUser.photo
                              });
                            } else {
                              setCourseForm({
                                ...courseForm, 
                                instructor: '',
                                instructorId: '',
                                instructorEmail: '',
                                instructorPhoto: ''
                              });
                            }
                          }}
                        >
                          <option value="">Select Instructor from Faculty</option>
                          {users.filter(u => u.role === 'teacher' || u.role === 'admin').map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))}
                        </select>
                        <div className="flex-1 space-y-4">
                          <input 
                            className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-blue-50" 
                            value={courseForm.instructor || ''} 
                            onChange={e => setCourseForm({...courseForm, instructor: e.target.value})} 
                            placeholder="Or enter name manually..." 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {courseWizardStep === 3 && (
                <div className="space-y-8 animate-fadeIn">
                  <h4 className="text-3xl font-black uppercase italic border-l-8 border-purple-600 pl-4">Step 3: Prerequisites & Metadata</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Prerequisites</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-48 overflow-y-auto p-4 border-4 border-black rounded-2xl bg-gray-50">
                        {courses.map(c => (
                          <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={courseForm.prerequisites?.includes(c.code)}
                              onChange={(e) => {
                                const currentPrereqs = courseForm.prerequisites || [];
                                if (e.target.checked) {
                                  setCourseForm({...courseForm, prerequisites: [...currentPrereqs, c.code]});
                                } else {
                                  setCourseForm({...courseForm, prerequisites: currentPrereqs.filter(p => p !== c.code)});
                                }
                              }}
                              className="w-4 h-4 border-2 border-black rounded accent-purple-600"
                            />
                            <span className="text-[10px] font-black uppercase group-hover:text-purple-600 transition-colors">{c.code}</span>
                          </label>
                        ))}
                        {courses.length === 0 && <p className="text-[10px] font-bold text-gray-400 uppercase italic col-span-full">No courses available for selection.</p>}
                      </div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase italic">Selected: {courseForm.prerequisites?.join(', ') || 'None'}</p>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Initial Enrolled Students</label>
                      <input type="number" min="0" className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-purple-50" value={courseForm.enrolledStudents || 0} onChange={e => setCourseForm({...courseForm, enrolledStudents: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Thumbnail URL</label>
                      <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-purple-50" value={courseForm.thumbnail || ''} onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})} placeholder="https://example.com/image.jpg" />
                      {courseForm.thumbnail && (
                        <div className="mt-4 border-4 border-black rounded-2xl overflow-hidden h-32 w-full bg-gray-100">
                          <img src={courseForm.thumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {courseWizardStep === 4 && (
                <div className="space-y-8 animate-fadeIn">
                  <h4 className="text-3xl font-black uppercase italic border-l-8 border-yellow-500 pl-4">Step 4: Lesson Forge</h4>
                  
                  <div className="space-y-8 bg-yellow-50 p-10 rounded-[3rem] border-4 border-black">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lesson Title</label>
                        <input className="w-full p-6 border-4 border-black rounded-2xl font-black focus:bg-white" value={currentLesson.title || ''} onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})} />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Content Type</label>
                        <select className="w-full p-6 border-4 border-black rounded-2xl font-black focus:bg-white" value={currentLesson.contentType} onChange={e => setCurrentLesson({...currentLesson, contentType: e.target.value as 'video' | 'reading' | 'document'})}>
                          <option value="video">Video Stream</option>
                          <option value="reading">Secure PDF</option>
                          <option value="document">Document (PDF/Word/PPT)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {currentLesson.contentType === 'document' ? 'Upload Lesson Document' : 'Resource URL'}
                        </label>
                        {currentLesson.contentType === 'document' ? (
                          <div className="flex flex-col gap-4">
                            <input 
                              type="file" 
                              accept=".pdf,.doc,.docx,.ppt,.pptx"
                              className="w-full p-6 border-4 border-black rounded-2xl font-black focus:bg-white bg-white"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // In a real app, we would upload to Firebase Storage
                                  // For now, we'll use a data URL for demo purposes
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCurrentLesson({
                                      ...currentLesson,
                                      fileUrl: reader.result as string,
                                      fileName: file.name
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {currentLesson.fileName && (
                              <p className="text-xs font-black text-blue-600 uppercase">Selected: {currentLesson.fileName}</p>
                            )}
                          </div>
                        ) : (
                          <input className="w-full p-6 border-4 border-black rounded-2xl font-black focus:bg-white" placeholder={currentLesson.contentType === 'video' ? 'YouTube URL' : 'PDF URL'} value={currentLesson.contentType === 'video' ? currentLesson.videoUrl : currentLesson.pdfUrl} onChange={e => setCurrentLesson({...currentLesson, [currentLesson.contentType === 'video' ? 'videoUrl' : 'pdfUrl']: e.target.value})} />
                        )}
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lesson Content (Markdown)</label>
                        <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black h-40 focus:bg-white" value={currentLesson.content} onChange={e => setCurrentLesson({...currentLesson, content: e.target.value})} />
                      </div>
                    </div>
                    <button onClick={addLesson} className="w-full py-6 bg-yellow-500 text-black rounded-2xl border-4 border-black font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">
                      {editingLessonIndex !== null ? 'Update Lesson' : '＋ Add Lesson to Curriculum'}
                    </button>
                    {editingLessonIndex !== null && (
                      <button onClick={() => { setEditingLessonIndex(null); setCurrentLesson({ title: '', content: '', contentType: 'video', videoUrl: '', pdfUrl: '', fileUrl: '', fileName: '' }); }} className="w-full mt-4 text-rose-600 font-black uppercase text-xs">Cancel Edit</button>
                    )}
                  </div>

                  {courseForm.lessons && courseForm.lessons.length > 0 && (
                    <div className="space-y-6">
                      <h5 className="text-2xl font-black uppercase italic">Curriculum Inventory</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {courseForm.lessons.map((l, idx) => (
                          <div key={idx} className="bg-white p-6 rounded-3xl border-4 border-black flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-4 overflow-hidden">
                              <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</span>
                              <div className="truncate">
                                <p className="font-black italic truncate">{l.title}</p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase">{l.contentType}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => moveLesson(idx, 'up')} disabled={idx === 0} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30">⬆️</button>
                              <button onClick={() => moveLesson(idx, 'down')} disabled={idx === (courseForm.lessons?.length || 0) - 1} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30">⬇️</button>
                              <button onClick={() => editLesson(idx)} className="text-blue-600 font-black text-[10px] p-2">EDIT</button>
                              <button onClick={() => {
                                 const ls = [...(courseForm.lessons || [])];
                                 ls.splice(idx, 1);
                                 setCourseForm({...courseForm, lessons: ls});
                              }} className="text-rose-600 font-black text-[10px] p-2">✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {courseWizardStep === 5 && (
                <div className="space-y-8 animate-fadeIn">
                  <h4 className="text-3xl font-black uppercase italic border-l-8 border-rose-600 pl-4">Step 5: Syllabus & Resources</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syllabus (Markdown or URL)</label>
                        <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none h-40 focus:bg-rose-50" value={courseForm.syllabus} onChange={e => setCourseForm({...courseForm, syllabus: e.target.value})} placeholder="Enter course syllabus or link to PDF..." />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Learning Objectives</label>
                        <div className="flex gap-4">
                          <input className="flex-1 p-6 border-4 border-black rounded-2xl font-black text-lg outline-none focus:bg-rose-50" value={newObjective} onChange={e => setNewObjective(e.target.value)} placeholder="e.g. Master quantum mechanics" />
                          <button 
                            onClick={() => {
                              if (newObjective) {
                                setCourseForm({...courseForm, learningObjectives: [...(courseForm.learningObjectives || []), newObjective]});
                                setNewObjective('');
                              }
                            }}
                            className="px-8 bg-black text-white rounded-2xl border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {courseForm.learningObjectives?.map((obj, idx) => (
                            <span key={idx} className="px-4 py-2 bg-rose-100 text-rose-800 rounded-full border-2 border-rose-200 font-black text-xs flex items-center gap-2">
                              {obj}
                              <button onClick={() => setCourseForm({...courseForm, learningObjectives: courseForm.learningObjectives?.filter((_, i) => i !== idx)})} className="hover:text-rose-600">×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4 p-8 bg-gray-50 border-4 border-black rounded-[3rem]">
                        <h5 className="text-xl font-black uppercase italic">Add Course Material</h5>
                        <div className="space-y-4">
                          <input className="w-full p-4 border-4 border-black rounded-xl font-black" placeholder="Material Title" value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} />
                          <select className="w-full p-4 border-4 border-black rounded-xl font-black" value={newMaterial.type} onChange={e => setNewMaterial({...newMaterial, type: e.target.value as any})}>
                            <option value="document">Document (PDF/Doc)</option>
                            <option value="video">Video Resource</option>
                            <option value="link">External Link</option>
                            <option value="other">Other Resource</option>
                          </select>
                          <input className="w-full p-4 border-4 border-black rounded-xl font-black" placeholder="Resource URL" value={newMaterial.url} onChange={e => setNewMaterial({...newMaterial, url: e.target.value})} />
                          <button 
                            onClick={() => {
                              if (newMaterial.title && newMaterial.url) {
                                const material: CourseMaterial = {
                                  ...newMaterial as CourseMaterial,
                                  id: `mat-${Date.now()}`,
                                  addedAt: new Date().toISOString()
                                };
                                setCourseForm({...courseForm, materials: [...(courseForm.materials || []), material]});
                                setNewMaterial({ title: '', type: 'document', url: '' });
                              }
                            }}
                            className="w-full py-4 bg-green-600 text-white rounded-xl border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >Deploy Material</button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Material Inventory</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {courseForm.materials?.map((mat, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <div>
                                <p className="font-black text-sm">{mat.title}</p>
                                <p className="text-[8px] font-bold text-blue-600 uppercase">{mat.type}</p>
                              </div>
                              <button onClick={() => setCourseForm({...courseForm, materials: courseForm.materials?.filter((_, i) => i !== idx)})} className="text-rose-600 font-black text-xs">REMOVE</button>
                            </div>
                          ))}
                          {(!courseForm.materials || courseForm.materials.length === 0) && <p className="text-center text-xs font-bold text-gray-400 py-4 uppercase">No materials deployed.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-8 pt-12 border-t-8 border-black">
                <button onClick={() => { setIsAddingCourse(false); setCourseWizardStep(1); }} className="flex-1 py-8 border-8 border-black rounded-[3rem] font-black uppercase text-2xl hover:bg-gray-50 transition-all">Abort</button>
                
                {courseWizardStep > 1 && (
                  <button onClick={() => setCourseWizardStep(prev => prev - 1)} className="flex-1 py-8 border-8 border-black rounded-[3rem] font-black uppercase text-2xl hover:bg-gray-50 transition-all">Previous</button>
                )}
                
                {courseWizardStep < 5 ? (
                  <button onClick={() => setCourseWizardStep(prev => prev + 1)} className="flex-2 py-8 bg-black text-white border-8 border-black rounded-[3rem] font-black uppercase text-2xl shadow-[15px_15px_0px_0px_rgba(0,208,90,1)] hover:translate-y-2 active:shadow-none transition-all">Next Step</button>
                ) : (
                  <button onClick={() => handleCommitCourse()} className="flex-2 py-8 bg-black text-white border-8 border-black rounded-[3rem] font-black uppercase text-2xl shadow-[15px_15px_0px_0px_rgba(0,208,90,1)] hover:translate-y-2 active:shadow-none transition-all">Synchronize Course</button>
                )}
              </div>
           </div>
        </div>
      )}

      {/* Bulletin Architect Modal */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-fadeIn overflow-y-auto">
           <div className="bg-white w-full max-w-6xl rounded-[5rem] border-[12px] border-black p-8 md:p-20 space-y-12 shadow-[50px_50px_0px_0px_rgba(239,51,64,1)] my-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-6 ethiopian-gradient"></div>
              
              <div className="flex justify-between items-end border-b-8 border-black pb-10">
                <h3 className="text-4xl md:text-6xl font-black uppercase italic text-red-900 tracking-tighter leading-none">Bulletin Architect.</h3>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-gray-400">Registry Trace</p>
                   <p className="text-2xl font-black italic">{newsForm.id || 'NEW_BULLETIN'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-xl font-black uppercase italic border-l-8 border-red-600 pl-4">Content</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Title</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={newsForm.title || ''} onChange={e => setNewsForm({...newsForm, title: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tag</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={newsForm.tag || ''} onChange={e => setNewsForm({...newsForm, tag: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xl font-black uppercase italic border-l-8 border-blue-600 pl-4">Media</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Image URL</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={newsForm.image || ''} onChange={e => setNewsForm({...newsForm, image: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Summary</label>
                <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none h-24" value={newsForm.summary || ''} onChange={e => setNewsForm({...newsForm, summary: e.target.value})} />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Content</label>
                <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none h-48" value={newsForm.content || ''} onChange={e => setNewsForm({...newsForm, content: e.target.value})} />
              </div>

              <div className="flex gap-8 pt-12">
                <button onClick={() => setIsNewsModalOpen(false)} className="flex-1 py-8 border-8 border-black rounded-[3rem] font-black uppercase text-2xl hover:bg-gray-50 transition-all">Abort Changes</button>
                <button onClick={handleCommitNews} className="flex-1 py-8 bg-black text-white border-8 border-black rounded-[3rem] font-black uppercase text-2xl shadow-[15px_15px_0px_0px_rgba(239,51,64,1)] hover:translate-y-2 active:shadow-none transition-all">Synchronize Bulletin</button>
              </div>
           </div>
        </div>
      )}

      {/* Courses View */}
      {activeTab === 'courses' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex justify-between items-center">
             <h3 className="text-4xl font-black uppercase italic tracking-tighter text-blue-900">Course Registry</h3>
             {/* Fix: setCourseForm and initialCourseForm now defined */}
             <button onClick={() => { setCourseForm(initialCourseForm); setCourseWizardStep(1); setIsAddingCourse(true); }} className="bg-green-600 text-white px-10 py-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">＋ Deploy New Course</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {courses.map(course => (
              <div key={course.id} className="bg-white border-8 border-black rounded-[3rem] p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 ethiopian-gradient"></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{course.code}</p>
                  <h4 className="text-2xl font-black uppercase italic leading-none">{course.title}</h4>
                  <p className="text-[10px] font-bold text-blue-600 uppercase mt-2">{course.subject} / {course.grade}</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase mt-1 italic">Instructor: {course.instructor}</p>
                </div>
                <div className="mt-8 pt-6 border-t-2 border-black flex justify-between items-center">
                   <p className="text-xs font-black uppercase text-gray-400">{course.lessons.length} Lessons</p>
                   <div className="flex gap-3">
                      <button onClick={() => handleGenerateAIExam(course)} className="bg-purple-600 text-white px-6 py-2 rounded-lg border-2 border-black font-black uppercase text-[10px] flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> AI Exam
                      </button>
                      {/* Fix: setCourseForm and editingCourse handled */}
                      <button onClick={() => { setEditingCourse(course); setCourseForm(course); setCourseWizardStep(1); setIsAddingCourse(true); }} className="bg-black text-white px-6 py-2 rounded-lg border-2 border-black font-black uppercase text-[10px]">Edit Course</button>
                      <button onClick={() => handleDeleteCourse(course.id)} className="text-rose-600 font-black uppercase text-[10px] p-2">🗑️</button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exams View */}
      {activeTab === 'exams' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-4">
               <h3 className="text-4xl font-black uppercase italic tracking-tighter text-blue-900">Exam Architect</h3>
               {exams.length > 0 && (
                 <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <input 
                     type="checkbox" 
                     checked={selectedExams.length === exams.length}
                     onChange={handleSelectAllExams}
                     className="w-5 h-5 border-2 border-black rounded-sm accent-blue-600"
                   />
                   <span className="text-xs font-black uppercase">Select All</span>
                 </label>
               )}
             </div>
             <div className="flex items-center gap-4">
               {selectedExams.length > 0 && (
                 <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <span className="text-xs font-black uppercase mr-2">{selectedExams.length} Selected</span>
                   <button onClick={handleBulkPublishExams} className="bg-blue-600 text-white px-4 py-2 rounded-xl border-2 border-black font-black uppercase text-[10px] hover:bg-blue-700">Publish</button>
                   <button onClick={handleBulkDeleteExams} className="bg-rose-600 text-white px-4 py-2 rounded-xl border-2 border-black font-black uppercase text-[10px] hover:bg-rose-700">Delete</button>
                 </div>
               )}
               <button onClick={() => setIsQuestionBankOpen(true)} className="bg-purple-600 text-white px-10 py-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">Question Bank</button>
               <button onClick={() => { setExamForm(initialExamForm); setIsAddingExam(true); }} className="bg-green-600 text-white px-10 py-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">＋ Create New Exam</button>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {exams.map(exam => (
              <div key={exam.id} className={`bg-white border-8 border-black rounded-[3rem] p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group overflow-hidden relative transition-all ${selectedExams.includes(exam.id) ? 'ring-4 ring-blue-500 ring-offset-4' : ''}`}>
                <div className="absolute top-0 left-0 w-full h-2 ethiopian-gradient"></div>
                <div className="absolute top-6 right-6 z-10">
                  <input 
                    type="checkbox" 
                    checked={selectedExams.includes(exam.id)}
                    onChange={() => handleSelectExam(exam.id)}
                    className="w-6 h-6 border-2 border-black rounded-md accent-blue-600 cursor-pointer"
                  />
                </div>
                <div className="pr-8">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-2xl font-black uppercase italic leading-none">{exam.title}</h4>
                    <select 
                      value={exam.status} 
                      onChange={(e) => handleStatusChange(exam.id, e.target.value as 'draft' | 'published' | 'closed')}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 border-black outline-none cursor-pointer transition-colors ${
                        exam.status === 'published' ? 'bg-green-400' : 
                        exam.status === 'closed' ? 'bg-rose-400' : 'bg-yellow-400'
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase mt-2">{exam.subject} / {exam.grade}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 border-black bg-purple-400">
                      {exam.type?.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 border-black bg-blue-400">
                      S{exam.semester}
                    </span>
                    {exam.difficulty && (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 border-black ${exam.difficulty === 'Easy' ? 'bg-green-400' : exam.difficulty === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'}`}>
                        {exam.difficulty}
                      </span>
                    )}
                  </div>
                  {exam.categories && exam.categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {exam.categories.map(cat => (
                        <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-600 text-[9px] font-bold uppercase rounded-md border border-gray-200">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-8 pt-6 border-t-2 border-black flex justify-between items-center">
                   <p className="text-xs font-black uppercase text-gray-400">{exam.questions.length} Questions</p>
                   <div className="flex gap-3">
                      <button onClick={() => { setEditingExam(exam); setExamForm(exam); setIsAddingExam(true); }} className="bg-black text-white px-6 py-2 rounded-lg border-2 border-black font-black uppercase text-[10px]">Edit</button>
                      <button onClick={() => {
                        if (onDeleteExam) {
                          onDeleteExam(exam.id);
                          setExams(exams.filter(e => e.id !== exam.id));
                        }
                      }} className="text-rose-600 font-black uppercase text-[10px] p-2">🗑️</button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments View */}
      {activeTab === 'assignments' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex justify-between items-center">
             <h3 className="text-4xl font-black uppercase italic tracking-tighter text-blue-900">Assignment Architect</h3>
             <button onClick={() => { setIsAssignmentModalOpen(true); setEditingAssignment(null); }} className="bg-green-600 text-white px-10 py-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">＋ Deploy New Assignment</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {assignments.map(assignment => (
              <div key={assignment.id} className="bg-white border-8 border-black rounded-[3rem] p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 ethiopian-gradient"></div>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-black uppercase text-gray-400">{assignment.courseCode}</p>
                    {assignment.progressStatus && (
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border-2 border-black ${
                        assignment.progressStatus === 'Completed' ? 'bg-green-400' :
                        assignment.progressStatus === 'In Progress' ? 'bg-blue-400' :
                        assignment.progressStatus === 'Needs Review' ? 'bg-orange-400' :
                        'bg-gray-200'
                      }`}>
                        {assignment.progressStatus}
                      </span>
                    )}
                  </div>
                  <h4 className="text-2xl font-black uppercase italic leading-none">{assignment.title}</h4>
                  <div className="flex flex-col mt-2">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Due: {assignment.dueDate}</p>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">
                      {getEthiopianDateString(assignment.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t-2 border-black flex justify-between items-center">
                   <p className="text-xs font-black uppercase text-gray-400">{assignment.points} Points</p>
                   <div className="flex gap-3">
                      <button onClick={() => { setIsAssignmentModalOpen(true); setEditingAssignment(assignment); }} className="bg-black text-white px-6 py-2 rounded-lg border-2 border-black font-black uppercase text-[10px]">Edit</button>
                      <button onClick={() => handleDeleteAssignment(assignment.id)} className="text-rose-600 font-black uppercase text-[10px] p-2">🗑️</button>
                   </div>
                </div>
              </div>
            ))}
          </div>
          <AssignmentModal 
            isOpen={isAssignmentModalOpen} 
            onClose={() => setIsAssignmentModalOpen(false)} 
            onSave={editingAssignment ? handleUpdateAssignment : handleAddAssignment} 
            assignment={editingAssignment} 
          />
        </div>
      )}

      {/* Bulletins View */}
      {activeTab === 'bulletins' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <h3 className="text-4xl font-black uppercase italic tracking-tighter text-blue-900">National Bulletins</h3>
             <div className="flex gap-4">
               <button onClick={() => {
                 setNewsForm({
                   title: `${new Date().getFullYear()} Ethiopian National Exam Registration Schedule`,
                   summary: 'Official registration dates for regular and private candidates have been announced.',
                   content: `The Ethiopian Educational Assessment and Examinations Service (EAES) has officially announced the registration schedule for the ${new Date().getFullYear()} National Examinations.\n\n• Regular Registration: Starts March 20, ${new Date().getFullYear()} and ends April 15, ${new Date().getFullYear()}.\n• Private Candidate Registration: Starts April 1, ${new Date().getFullYear()} and ends April 30, ${new Date().getFullYear()}.\n\nAll candidates must complete their registration through the official portal before the strict deadlines. Late registrations will not be accepted under any circumstances.`,
                   tag: 'Exams',
                   image: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&q=80&w=600',
                   date: new Date().toLocaleDateString()
                 });
                 setEditingNews(null);
                 setIsNewsModalOpen(true);
               }} className="bg-blue-600 text-white px-8 py-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">
                 📝 Draft Exam Announcement
               </button>
               <button onClick={() => openNewsModal()} className="bg-red-600 text-white px-10 py-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">＋ Deploy New Bulletin</button>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {news.map(item => (
              <div key={item.id} className="bg-white border-8 border-black rounded-[4rem] overflow-hidden shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] flex flex-col group">
                <div className="h-48 border-b-8 border-black relative">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                </div>
                <div className="p-8 space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-2xl font-black uppercase italic leading-none">{item.title}</h4>
                    <span className="text-[10px] font-bold text-gray-400">{item.date}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-500 line-clamp-2 uppercase italic">{item.summary}</p>
                </div>
                <div className="p-8 border-t-4 border-black flex justify-between gap-4">
                  {/* Fix: Handled news modal opening and deletion */}
                  <button onClick={() => openNewsModal(item)} className="flex-1 bg-blue-50 text-blue-700 py-3 rounded-xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">✏️ Edit Bulletin</button>
                  <button onClick={() => handleDeleteNews(item.id)} className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam Results View */}
      {activeTab === 'results' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex justify-between items-center">
             <h3 className="text-4xl font-black uppercase italic tracking-tighter text-blue-900">National Exam Registry</h3>
             <button onClick={() => downloadCSV(examResults, "National_Exam_Results")} className="bg-green-600 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1">Export Results (CSV)</button>
          </div>
          <div className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b-8 border-black font-black uppercase text-[10px] tracking-widest text-gray-400">
                   <tr>
                     <th className="p-10">Student Identity</th>
                     <th className="p-10">Exam Module</th>
                     <th className="p-10">Performance Metrics</th>
                     <th className="p-10">Timestamp</th>
                   </tr>
                </thead>
                <tbody className="divide-y-8 divide-black font-black">
                   {examResults.map((res, idx) => {
                     const student = users.find(u => u.id === res.studentId);
                     const exam = exams.find(e => e.id === res.examId);
                     return (
                       <tr key={`${res.examId}-${res.studentId}-${idx}`} className="hover:bg-blue-50 transition-colors">
                         <td className="p-10">
                            <div className="flex items-center gap-6">
                               <img src={student?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.studentId}`} className="w-12 h-12 rounded-xl border-2 border-black bg-gray-100" alt="" />
                               <div>
                                  <p className="text-xl italic leading-none">{student?.name || 'UNKNOWN_CITIZEN'}</p>
                                  <p className="text-[9px] text-gray-400 uppercase mt-1">{student?.email || res.studentId}</p>
                               </div>
                            </div>
                         </td>
                         <td className="p-10">
                            <div>
                               <p className="text-xl italic leading-none">{exam?.title || res.examId}</p>
                               <p className="text-[9px] text-blue-600 uppercase mt-1">{exam?.subject || 'GENERAL_EXAM'}</p>
                            </div>
                         </td>
                         <td className="p-10">
                            <div className="flex items-center gap-4">
                               <div className="text-center">
                                  <p className="text-2xl text-blue-600 leading-none">{res.score}</p>
                                  <p className="text-[8px] uppercase opacity-60">Score</p>
                               </div>
                               <div className="h-10 w-1 bg-black/10"></div>
                               <div className="text-center">
                                  <p className="text-2xl leading-none">{res.totalPoints}</p>
                                  <p className="text-[8px] uppercase opacity-60">Total</p>
                               </div>
                               <div className="h-10 w-1 bg-black/10"></div>
                               <div className="text-center">
                                  <p className="text-2xl text-green-600 leading-none">{Math.round((res.score / res.totalPoints) * 100)}%</p>
                                  <p className="text-[8px] uppercase opacity-60">Accuracy</p>
                               </div>
                            </div>
                         </td>
                         <td className="p-10">
                            <p className="text-xs italic text-gray-400">{new Date(res.completedAt).toLocaleString()}</p>
                            <p className="text-[9px] uppercase font-black mt-1">Time: {Math.floor(res.timeSpentSeconds / 60)}m {res.timeSpentSeconds % 60}s</p>
                         </td>
                       </tr>
                     );
                   })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y-8 divide-black">
              {examResults.map((res, idx) => {
                const student = users.find(u => u.id === res.studentId);
                const exam = exams.find(e => e.id === res.examId);
                return (
                  <div key={`${res.examId}-${res.studentId}-${idx}`} className="p-8 space-y-6 bg-white hover:bg-blue-50 transition-all">
                    <div className="flex items-center gap-4">
                      <img src={student?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.studentId}`} className="w-16 h-16 rounded-2xl border-4 border-black bg-gray-100" alt="" />
                      <div>
                        <p className="text-2xl font-black italic leading-none">{student?.name || 'UNKNOWN'}</p>
                        <p className="text-[8px] text-gray-400 uppercase mt-1">{student?.email || res.studentId}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border-4 border-black space-y-4">
                      <div>
                        <p className="text-[8px] font-black uppercase text-gray-400">Exam Module</p>
                        <p className="font-black italic">{exam?.title || res.examId}</p>
                        <p className="text-[8px] text-blue-600 uppercase font-bold">{exam?.subject || 'GENERAL'}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t-2 border-black/5">
                        <div className="text-center">
                          <p className="text-xl font-black text-blue-600">{res.score}</p>
                          <p className="text-[8px] uppercase font-bold opacity-60">Score</p>
                        </div>
                        <div className="text-center border-x-2 border-black/5">
                          <p className="text-xl font-black">{res.totalPoints}</p>
                          <p className="text-[8px] uppercase font-bold opacity-60">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-black text-green-600">{Math.round((res.score / res.totalPoints) * 100)}%</p>
                          <p className="text-[8px] uppercase font-bold opacity-60">Acc.</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 italic">
                      <p>{new Date(res.completedAt).toLocaleDateString()}</p>
                      <p className="uppercase not-italic font-black text-black">Time: {Math.floor(res.timeSpentSeconds / 60)}m {res.timeSpentSeconds % 60}s</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Video Generator View */}
      {activeTab === 'videos' && (
        <div className="space-y-12 animate-fadeIn">
          <VideoGenerator />
        </div>
      )}

          </div>
        </div>
      </main>

      <GradingModal 
        isOpen={isGradingModalOpen} 
        onClose={() => { setIsGradingModalOpen(false); setSelectedSubmission(null); }} 
        onSave={handleGradeSubmission} 
        submission={selectedSubmission} 
      />

      <StudentProgressModal
        isOpen={!!selectedStudentForProgress}
        onClose={() => setSelectedStudentForProgress(null)}
        user={selectedStudentForProgress}
        courses={courses}
        examResults={examResults}
      />
    </div>
  );
};

export default AdminDashboard;
