
import React, { useState } from 'react';
import { User, Grade, EducationLevel, Course, Stream, Exam, News, Lesson, Language, ExamResult } from '../types';

interface AdminDashboardProps {
  users: User[];
  courses: Course[];
  exams: Exam[];
  news: News[];
  examResults: ExamResult[];
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onUpdateCourse: (course: Course) => void;
  onAddCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  onAddNews: (news: News) => void;
  onUpdateNews: (news: News) => void;
  onDeleteNews: (id: string) => void;
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
  users, courses, exams, news, examResults,
  onUpdateUser, onAddUser, onDeleteUser, 
  onUpdateCourse, onAddCourse, onDeleteCourse,
  onAddNews, onUpdateNews, onDeleteNews,
  onNavClick
}) => {
  const [activeTab, setActiveTab] = useState<'identities' | 'curriculum' | 'bulletins' | 'analytics' | 'results'>('identities');
  const [reportLang, setReportLang] = useState<'en' | 'om'>('en');
  
  // User CRUD State
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  // Curriculum CRUD State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  // News/Bulletins CRUD State
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);

  const rt = REPORT_TRANSLATIONS[reportLang];

  const initialUserForm: Partial<User> = {
    name: '', email: '', role: 'student', status: 'active', points: 0,
    grade: Grade.G12, stream: Stream.NATURAL_SCIENCE, level: EducationLevel.SECONDARY,
    gender: 'Male', nid: '', dob: '', salary: 0, school: '',
    preferredLanguage: 'en', phoneNumber: '', address: ''
  };

  // Fix: Added missing initial course form
  const initialCourseForm: Partial<Course> = {
    title: '', code: '', grade: Grade.G12, stream: Stream.NATURAL_SCIENCE,
    level: EducationLevel.SECONDARY, thumbnail: '', description: '',
    lessons: [], instructor: '', subject: ''
  };

  // Fix: Added missing initial news form
  const initialNewsForm: Partial<News> = {
    title: '', summary: '', content: '', tag: '', image: '', date: new Date().toLocaleDateString()
  };

  const [userForm, setUserForm] = useState<Partial<User>>(initialUserForm);
  
  // Fix: Added missing state for course and news forms
  const [courseForm, setCourseForm] = useState<Partial<Course>>(initialCourseForm);
  const [newsForm, setNewsForm] = useState<Partial<News>>(initialNewsForm);

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
    if (user) {
      setEditingUser(user);
      setUserForm(user);
    } else {
      setEditingUser(null);
      setUserForm(initialUserForm);
    }
    setIsIdentityModalOpen(true);
  };

  const handleCommitUser = () => {
    if (!userForm.name || !userForm.email || !userForm.nid) {
      alert("Validation Error: Name, Email, and National ID (NID) are mandatory for registry.");
      return;
    }

    const userData: User = {
      ...(userForm as User),
      id: editingUser?.id || `usr-${Date.now()}`,
      joinedDate: editingUser?.joinedDate || new Date().toISOString().split('T')[0],
      badges: editingUser?.badges || [],
      photo: userForm.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userForm.name}&backgroundColor=b6e3f4`,
      completedLessons: editingUser?.completedLessons || [],
      completedExams: editingUser?.completedExams || [],
      completedCourses: editingUser?.completedCourses || [],
      certificatesPaid: editingUser?.certificatesPaid || []
    };

    if (editingUser?.id) {
      onUpdateUser(userData);
    } else {
      onAddUser(userData);
    }
    
    setIsIdentityModalOpen(false);
    setEditingUser(null);
    setUserForm(initialUserForm);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm("WARNING: You are about to purge this identity from the National Registry. Proceed?")) {
      onDeleteUser(id);
    }
  };

  // CURRICULUM CRUD LOGIC
  const handleCommitCourse = () => {
    if (!courseForm.title || !courseForm.code) {
      alert("Validation Error: Title and Code are mandatory for curriculum modules.");
      return;
    }

    const courseData: Course = {
      ...(courseForm as Course),
      id: editingCourse?.id || `crs-${Date.now()}`,
      lessons: editingCourse?.lessons || []
    };

    if (editingCourse?.id) {
      onUpdateCourse(courseData);
    } else {
      onAddCourse(courseData);
    }
    
    setIsAddingCourse(false);
    setEditingCourse(null);
    setCourseForm(initialCourseForm);
  };

  // NEWS CRUD LOGIC
  const handleCommitNews = () => {
    if (!newsForm.title || !newsForm.summary) {
      alert("Validation Error: Title and Summary are mandatory for bulletins.");
      return;
    }

    const newsData: News = {
      ...(newsForm as News),
      id: editingNews?.id || `news-${Date.now()}`,
      date: editingNews?.date || new Date().toLocaleDateString()
    };

    if (editingNews?.id) {
      onUpdateNews(newsData);
    } else {
      onAddNews(newsData);
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
    }
  };

  return (
    <div className="space-y-16 animate-fadeIn pb-32">
      {/* Sovereign Stats Bar */}
      <div className="bg-black text-white p-12 rounded-[5rem] border-8 border-black shadow-[25px_25px_0px_0px_rgba(59,130,246,1)] flex flex-col md:flex-row justify-between items-center gap-10">
        <div>
           <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-white">Sovereign Command.</h2>
           <p className="text-blue-400 font-black uppercase tracking-widest text-[10px] mt-4">Authorized Admin Hub: Jemal Fano Haji</p>
        </div>
        <div className="flex gap-12">
           <div className="text-center group">
              <p className="text-6xl font-black italic group-hover:text-blue-400 transition-colors">{users.length}</p>
              <p className="text-[10px] font-black uppercase opacity-60">Identities</p>
           </div>
           <div className="text-center group">
              <p className="text-6xl font-black italic text-green-400 group-hover:text-green-300 transition-colors">{courses.length}</p>
              <p className="text-[10px] font-black uppercase opacity-60">Modules</p>
           </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex flex-wrap gap-4 border-b-8 border-black pb-4 no-print">
        {['identities', 'curriculum', 'bulletins', 'analytics', 'results'].map((t) => (
          <button 
            key={t} 
            onClick={() => setActiveTab(t as any)} 
            className={`px-12 py-7 font-black uppercase text-2xl transition-all ${activeTab === t ? 'bg-black text-white shadow-[10px_10px_0px_0px_rgba(59,130,246,1)]' : 'text-gray-400 hover:text-black hover:translate-x-1'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Analytics & Reports View */}
      {activeTab === 'analytics' && (
        <div className="space-y-16 animate-fadeIn printable-transcript" id="analytics-report-container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 no-print">
             <div>
               <h3 className="text-5xl font-black uppercase italic tracking-tighter text-blue-900">{rt.analytics}</h3>
               <div className="flex gap-4 mt-4">
                 <button onClick={() => setReportLang('en')} className={`px-4 py-1 border-2 border-black font-black uppercase text-[10px] rounded-lg ${reportLang === 'en' ? 'bg-black text-white' : 'bg-white'}`}>{rt.english}</button>
                 <button onClick={() => setReportLang('om')} className={`px-4 py-1 border-2 border-black font-black uppercase text-[10px] rounded-lg ${reportLang === 'om' ? 'bg-black text-white' : 'bg-white'}`}>{rt.afanOromo}</button>
               </div>
             </div>
             <div className="flex gap-4 flex-wrap">
                <button onClick={handlePrintPDF} className="bg-rose-600 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1">PDF Gabaasa</button>
                <button onClick={() => downloadCSV(users, "IFTU_Registry_Export")} className="bg-green-600 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1">Excel (CSV)</button>
                <button onClick={() => downloadWord("analytics-report-container", "IFTU_Sovereign_Doc")} className="bg-blue-600 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1">Word Module</button>
             </div>
          </div>

          {/* Visual Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="bg-white border-8 border-black rounded-[4rem] p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] space-y-8">
                <h4 className="text-3xl font-black uppercase italic border-l-8 border-blue-600 pl-4">{rt.general} Breakdown</h4>
                <div className="space-y-6">
                   <div>
                      <div className="flex justify-between font-black uppercase text-xs mb-2"><span>{rt.totalUsers}</span><span>{users.length}</span></div>
                      <div className="h-6 w-full bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                         <div className="h-full bg-blue-600 border-r-2 border-black" style={{width: '100%'}}></div>
                      </div>
                   </div>
                   <div>
                      <div className="flex justify-between font-black uppercase text-xs mb-2"><span>{rt.activeCourses}</span><span>{courses.length}</span></div>
                      <div className="h-6 w-full bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                         <div className="h-full bg-green-500 border-r-2 border-black" style={{width: `${(courses.length / 50) * 100}%`}}></div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white border-8 border-black rounded-[4rem] p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center items-center">
                <div className="relative w-48 h-48">
                   <svg className="w-full h-full transform -rotate-90">
                      <circle cx="50%" cy="50%" r="40%" stroke="#f3f4f6" strokeWidth="20" fill="transparent" />
                      <circle cx="50%" cy="50%" r="40%" stroke="#ef3340" strokeWidth="20" fill="transparent" strokeDasharray="251.2%" strokeDashoffset="50%" />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black italic">99.2%</span>
                      <span className="text-[8px] font-black uppercase opacity-60">Uptime</span>
                   </div>
                </div>
                <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-gray-400">IFTU National Link Status</p>
             </div>
          </div>

          {/* Detailed Tables Section */}
          <div className="space-y-12">
             <div className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-8 bg-black text-white flex justify-between items-center border-b-8 border-black">
                   <h4 className="text-2xl font-black uppercase italic">{rt.students}</h4>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-gray-50 font-black uppercase text-[10px] border-b-4 border-black">
                      <tr>
                        <th className="p-8">{rt.name}</th>
                        <th className="p-8">{rt.points}</th>
                        <th className="p-8">{rt.status}</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y-4 divide-black">
                      {users.filter(u => u.role === 'student').map(u => (
                        <tr key={u.id} className="font-bold">
                           <td className="p-8">{u.name}</td>
                           <td className="p-8 text-blue-600">{u.points}</td>
                           <td className="p-8"><span className={`px-4 py-1 border-2 border-black rounded-xl text-[8px] uppercase ${u.status === 'active' ? 'bg-green-100' : 'bg-rose-100'}`}>{u.status}</span></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-8 bg-blue-900 text-white flex justify-between items-center border-b-8 border-black">
                   <h4 className="text-2xl font-black uppercase italic">{rt.teachers}</h4>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-gray-50 font-black uppercase text-[10px] border-b-4 border-black">
                      <tr>
                        <th className="p-8">{rt.name}</th>
                        <th className="p-8">{rt.subject}</th>
                        <th className="p-8">{rt.status}</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y-4 divide-black">
                      {users.filter(u => u.role === 'teacher').map(u => (
                        <tr key={u.id} className="font-bold">
                           <td className="p-8">{u.name}</td>
                           <td className="p-8 italic">{u.department || 'N/A'}</td>
                           <td className="p-8"><span className={`px-4 py-1 border-2 border-black rounded-xl text-[8px] uppercase ${u.status === 'active' ? 'bg-green-100' : 'bg-rose-100'}`}>{u.status}</span></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* Identities View */}
      {activeTab === 'identities' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex justify-between items-center">
             <h3 className="text-5xl font-black uppercase italic tracking-tighter text-blue-900">Identity Registry</h3>
             <button 
               onClick={() => openUserModal()} 
               className="bg-blue-600 text-white px-10 py-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all"
             >
               ＋ Deploy New Identity
             </button>
          </div>
          <div className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b-8 border-black font-black uppercase text-[10px] tracking-widest text-gray-400">
                   <tr>
                     <th className="p-10">Legal Identity</th>
                     <th className="p-10">Role/Status</th>
                     <th className="p-10">Registry Details</th>
                     <th className="p-10">Command</th>
                   </tr>
                </thead>
                <tbody className="divide-y-8 divide-black font-black">
                   {users.map(u => (
                     <tr key={u.id} className="hover:bg-blue-50 transition-colors">
                       <td className="p-10">
                          <div className="flex items-center gap-6">
                             <img src={u.photo} className="w-16 h-16 rounded-2xl border-4 border-black bg-gray-100" alt="" />
                             <div>
                                <p className="text-2xl italic leading-none">{u.name}</p>
                                <p className="text-[10px] text-gray-400 uppercase mt-2">{u.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="p-10">
                          <div className="flex flex-col gap-2">
                            <span className={`px-4 py-1.5 rounded-xl border-2 border-black text-[10px] uppercase font-black w-fit ${u.role === 'admin' ? 'bg-black text-white' : u.role === 'teacher' ? 'bg-orange-400' : 'bg-blue-100'}`}>
                              {u.role}
                            </span>
                            <span className={`text-[9px] uppercase font-black ${u.status === 'active' ? 'text-green-600' : 'text-rose-600'}`}>
                              ● {u.status}
                            </span>
                          </div>
                       </td>
                       <td className="p-10">
                          <div className="space-y-1 text-xs">
                             <p className="italic text-gray-400">NID: <span className="text-black not-italic font-black">{u.nid || 'ARCHIVE_PENDING'}</span></p>
                             <p className="italic text-gray-400">Level: <span className="text-black not-italic font-black">{u.grade || 'STAFF'}</span></p>
                             <p className="italic text-gray-400">KP: <span className="text-blue-600 not-italic font-black">{u.points.toLocaleString()}</span></p>
                          </div>
                       </td>
                       <td className="p-10">
                          <div className="flex gap-4">
                            <button onClick={() => openUserModal(u)} className="p-4 border-4 border-black rounded-2xl hover:bg-blue-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">✏️</button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-4 border-4 border-black rounded-2xl hover:bg-rose-100 text-rose-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">🗑️</button>
                          </div>
                       </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* Identity Architect Modal */}
      {isIdentityModalOpen && (
        <div className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-fadeIn overflow-y-auto">
           <div className="bg-white w-full max-w-6xl rounded-[5rem] border-[12px] border-black p-8 md:p-20 space-y-12 shadow-[50px_50px_0px_0px_rgba(59,130,246,1)] my-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-6 ethiopian-gradient"></div>
              
              <div className="flex justify-between items-end border-b-8 border-black pb-10">
                <h3 className="text-6xl md:text-8xl font-black uppercase italic text-blue-900 tracking-tighter leading-none">Identity Architect.</h3>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-gray-400">Registry Trace</p>
                   <p className="text-2xl font-black italic">{userForm.id || 'NEW_DEPLOYMENT'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <div className="space-y-6">
                  <h4 className="text-xl font-black uppercase italic border-l-8 border-blue-600 pl-4">Biological Data</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Legal Name</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Identity Email</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">National ID (NID)</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={userForm.nid} onChange={e => setUserForm({...userForm, nid: e.target.value})} placeholder="ET-2025-XXXX" />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xl font-black uppercase italic border-l-8 border-orange-400 pl-4">Clearance & Role</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Portal Role</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})}>
                      <option value="student">STUDENT</option>
                      <option value="teacher">TEACHER</option>
                      <option value="admin">ADMINISTRATOR</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registry Status</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={userForm.status} onChange={e => setUserForm({...userForm, status: e.target.value as any})}>
                      <option value="active">ACTIVE_CLEARANCE</option>
                      <option value="pending">PENDING_REVIEW</option>
                      <option value="suspended">SUSPENDED_ACCESS</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Knowledge Points (KP)</label>
                    <input type="number" className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={userForm.points} onChange={e => setUserForm({...userForm, points: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xl font-black uppercase italic border-l-8 border-green-600 pl-4">Sector Mapping</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Hub (Grade/Level)</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={userForm.grade} onChange={e => setUserForm({...userForm, grade: e.target.value as Grade})}>
                       {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Allocation Stream</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={userForm.stream} onChange={e => setUserForm({...userForm, stream: e.target.value as Stream})}>
                       {Object.values(Stream).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monthly Remuneration (ETB)</label>
                    <input type="number" className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={userForm.salary} onChange={e => setUserForm({...userForm, salary: parseInt(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="flex gap-8 pt-12">
                <button onClick={() => setIsIdentityModalOpen(false)} className="flex-1 py-8 border-8 border-black rounded-[3rem] font-black uppercase text-2xl hover:bg-gray-50 transition-all">Abort Changes</button>
                <button onClick={handleCommitUser} className="flex-1 py-8 bg-black text-white border-8 border-black rounded-[3rem] font-black uppercase text-2xl shadow-[15px_15px_0px_0px_rgba(59,130,246,1)] hover:translate-y-2 active:shadow-none transition-all">Synchronize Registry Entry</button>
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
                <h3 className="text-6xl md:text-8xl font-black uppercase italic text-green-900 tracking-tighter leading-none">Module Architect.</h3>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-gray-400">Registry Trace</p>
                   <p className="text-2xl font-black italic">{courseForm.id || 'NEW_MODULE'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-xl font-black uppercase italic border-l-8 border-green-600 pl-4">Module Details</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Title</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Code</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={courseForm.subject} onChange={e => setCourseForm({...courseForm, subject: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xl font-black uppercase italic border-l-8 border-blue-600 pl-4">Allocation</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Grade</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={courseForm.grade} onChange={e => setCourseForm({...courseForm, grade: e.target.value as Grade})}>
                       {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stream</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={courseForm.stream} onChange={e => setCourseForm({...courseForm, stream: e.target.value as Stream})}>
                       {Object.values(Stream).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Instructor</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={courseForm.instructor} onChange={e => setCourseForm({...courseForm, instructor: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none h-32" value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
              </div>

              <div className="flex gap-8 pt-12">
                <button onClick={() => setIsAddingCourse(false)} className="flex-1 py-8 border-8 border-black rounded-[3rem] font-black uppercase text-2xl hover:bg-gray-50 transition-all">Abort Changes</button>
                <button onClick={handleCommitCourse} className="flex-1 py-8 bg-black text-white border-8 border-black rounded-[3rem] font-black uppercase text-2xl shadow-[15px_15px_0px_0px_rgba(0,208,90,1)] hover:translate-y-2 active:shadow-none transition-all">Synchronize Module</button>
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
                <h3 className="text-6xl md:text-8xl font-black uppercase italic text-red-900 tracking-tighter leading-none">Bulletin Architect.</h3>
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
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tag</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={newsForm.tag} onChange={e => setNewsForm({...newsForm, tag: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xl font-black uppercase italic border-l-8 border-blue-600 pl-4">Media</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Image URL</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none" value={newsForm.image} onChange={e => setNewsForm({...newsForm, image: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Summary</label>
                <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none h-24" value={newsForm.summary} onChange={e => setNewsForm({...newsForm, summary: e.target.value})} />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Content</label>
                <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black text-lg outline-none h-48" value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})} />
              </div>

              <div className="flex gap-8 pt-12">
                <button onClick={() => setIsNewsModalOpen(false)} className="flex-1 py-8 border-8 border-black rounded-[3rem] font-black uppercase text-2xl hover:bg-gray-50 transition-all">Abort Changes</button>
                <button onClick={handleCommitNews} className="flex-1 py-8 bg-black text-white border-8 border-black rounded-[3rem] font-black uppercase text-2xl shadow-[15px_15px_0px_0px_rgba(239,51,64,1)] hover:translate-y-2 active:shadow-none transition-all">Synchronize Bulletin</button>
              </div>
           </div>
        </div>
      )}

      {/* Curriculum View */}
      {activeTab === 'curriculum' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex justify-between items-center">
             <h3 className="text-5xl font-black uppercase italic tracking-tighter text-blue-900">Curriculum Architect</h3>
             {/* Fix: setCourseForm and initialCourseForm now defined */}
             <button onClick={() => { setCourseForm(initialCourseForm); setIsAddingCourse(true); }} className="bg-green-600 text-white px-10 py-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">＋ Deploy New Module</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {courses.map(course => (
              <div key={course.id} className="bg-white border-8 border-black rounded-[3rem] p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 ethiopian-gradient"></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{course.code}</p>
                  <h4 className="text-2xl font-black uppercase italic leading-none">{course.title}</h4>
                  <p className="text-[10px] font-bold text-blue-600 uppercase mt-2">{course.subject} / {course.grade}</p>
                </div>
                <div className="mt-8 pt-6 border-t-2 border-black flex justify-between items-center">
                   <p className="text-xs font-black uppercase text-gray-400">{course.lessons.length} Modules</p>
                   <div className="flex gap-3">
                      {/* Fix: setCourseForm and editingCourse handled */}
                      <button onClick={() => { setEditingCourse(course); setCourseForm(course); setIsAddingCourse(true); }} className="bg-black text-white px-6 py-2 rounded-lg border-2 border-black font-black uppercase text-[10px]">Edit Architect</button>
                      <button onClick={() => onDeleteCourse(course.id)} className="text-rose-600 font-black uppercase text-[10px] p-2">🗑️</button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulletins View */}
      {activeTab === 'bulletins' && (
        <div className="space-y-12 animate-fadeIn">
          <div className="flex justify-between items-center">
             <h3 className="text-5xl font-black uppercase italic tracking-tighter text-blue-900">National Bulletins</h3>
             {/* Fix: Added openNewsModal handler */}
             <button onClick={() => openNewsModal()} className="bg-red-600 text-white px-10 py-5 rounded-3xl border-8 border-black font-black uppercase text-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">＋ Deploy New Bulletin</button>
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
             <h3 className="text-5xl font-black uppercase italic tracking-tighter text-blue-900">National Exam Registry</h3>
             <button onClick={() => downloadCSV(examResults, "National_Exam_Results")} className="bg-green-600 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1">Export Results (CSV)</button>
          </div>
          <div className="bg-white border-8 border-black rounded-[5rem] overflow-hidden shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
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
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
