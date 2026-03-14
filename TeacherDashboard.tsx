
import React, { useState, useRef } from 'react';
import { Exam, Question, Grade, Stream, QuestionType, Course, Lesson } from '../types';
import { parseExamDocument, generateExamQuestions, parseExamFromDocument } from '../services/geminiService';

interface TeacherDashboardProps {
  exams: Exam[];
  courses: Course[];
  onAddExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onUpdateExam: (exam: Exam) => void;
  onAddCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  onUpdateCourse: (course: Course) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  exams, 
  courses, 
  onAddExam, 
  onDeleteExam,
  onUpdateExam,
  onAddCourse,
  onDeleteCourse,
  onUpdateCourse
}) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'courses'>('exams');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai' | 'generate' | 'upload'>('manual');
  const [isScanning, setIsScanning] = useState(false);
  const [rawText, setRawText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation Params
  const [genSubject, setGenSubject] = useState('');
  const [genTopic, setGenTopic] = useState('');
  const [genDifficulty, setGenDifficulty] = useState('Standard');
  const [genQuestionTypes, setGenQuestionTypes] = useState<string[]>(['multiple-choice']);
  const [genCount, setGenCount] = useState(5);

  const [newExam, setNewExam] = useState<Partial<Exam>>({
    title: '',
    durationMinutes: 90,
    questions: [],
    categories: [],
    grade: Grade.G12,
    stream: Stream.NATURAL_SCIENCE,
    academicYear: new Date().getFullYear(),
    totalPoints: 0,
    status: 'published',
    subject: 'General'
  });

  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
    category: 'General'
  });

  const [wizardStep, setWizardStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!newExam.title?.trim()) newErrors.title = "Exam title is required";
    if (!newExam.subject?.trim()) newErrors.subject = "Subject is required";
    if (!newExam.durationMinutes || newExam.durationMinutes <= 0) newErrors.duration = "Valid duration is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateQuestion = () => {
    const newErrors: Record<string, string> = {};
    if (!currentQuestion.text?.trim()) newErrors.qText = "Question text is required";
    if (!currentQuestion.category?.trim()) newErrors.qCategory = "Category is required";
    if (!currentQuestion.points || currentQuestion.points <= 0) newErrors.qPoints = "Points must be greater than 0";
    
    if (currentQuestion.type === 'multiple-choice') {
      if (currentQuestion.options?.some(opt => !opt.trim())) newErrors.qOptions = "All options must be filled";
    } else if (currentQuestion.type === 'fill-in-the-blank') {
      if (!currentQuestion.correctAnswer?.toString().trim()) newErrors.qAnswer = "Correct answer is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateCategories = (questions: Question[]) => {
    const uniqueCats = Array.from(new Set(questions.map(q => q.category)));
    setNewExam(prev => ({ ...prev, categories: uniqueCats }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      const mimeType = file.type || 'application/pdf';
      
      try {
        const extracted = await parseExamFromDocument(base64Data, mimeType);
        const formatted: Question[] = extracted.map((q, idx) => ({
          ...q,
          id: `upload-${Date.now()}-${idx}`
        })) as Question[];
        
        const updatedQuestions = [...(newExam.questions || []), ...formatted];
        setNewExam(prev => ({
          ...prev,
          questions: updatedQuestions,
          totalPoints: (prev.totalPoints || 0) + formatted.reduce((sum, q) => sum + q.points, 0)
        }));
        updateCategories(updatedQuestions);
        setIsScanning(false);
        setCreationMethod('manual');
        setWizardStep(2); // Jump to questions step
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error(error);
        setIsScanning(false);
        alert("Artifact Ingestion Failed. Ensure the document is high-contrast and readable.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAIScan = async () => {
    if (!rawText.trim()) return;
    setIsScanning(true);
    try {
      const extracted = await parseExamDocument(rawText);
      const formatted: Question[] = extracted.map((q, idx) => ({
        ...q,
        id: `ai-${Date.now()}-${idx}`
      })) as Question[];
      
      const updatedQuestions = [...(newExam.questions || []), ...formatted];
      setNewExam(prev => ({
        ...prev,
        questions: updatedQuestions,
        totalPoints: (prev.totalPoints || 0) + formatted.reduce((sum, q) => sum + q.points, 0)
      }));
      updateCategories(updatedQuestions);
      setIsScanning(false);
      setRawText('');
      setCreationMethod('manual');
      setWizardStep(2); // Jump to questions step
    } catch (error) {
      console.error(error);
      setIsScanning(false);
      alert("AI Processing Failed.");
    }
  };

  const handleAIGeneration = async () => {
    const newErrors: Record<string, string> = {};
    if (!genSubject.trim()) newErrors.genSubject = "Subject is required";
    if (!genTopic.trim()) newErrors.genTopic = "Topic is required";
    if (genQuestionTypes.length === 0) newErrors.genTypes = "Select at least one question type";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsScanning(true);
    try {
      const extracted = await generateExamQuestions(genSubject, genTopic, genDifficulty, genQuestionTypes, genCount);
      const formatted: Question[] = extracted.map((q, idx) => ({
        ...q,
        id: `gen-${Date.now()}-${idx}`
      })) as Question[];
      
      const updatedQuestions = [...(newExam.questions || []), ...formatted];
      setNewExam(prev => ({
        ...prev,
        questions: updatedQuestions,
        totalPoints: (prev.totalPoints || 0) + formatted.reduce((sum, q) => sum + q.points, 0)
      }));
      updateCategories(updatedQuestions);
      setIsScanning(false);
      setCreationMethod('manual');
      setWizardStep(2); // Jump to questions step
    } catch (error) {
      console.error(error);
      setIsScanning(false);
      alert("AI Generation Failed.");
    }
  };

  const addQuestion = () => {
    if (!validateQuestion()) return;
    const q = { ...currentQuestion, id: Date.now().toString() } as Question;
    const updatedQuestions = [...(newExam.questions || []), q];
    setNewExam(prev => ({
      ...prev,
      questions: updatedQuestions,
      totalPoints: (prev.totalPoints || 0) + q.points
    }));
    updateCategories(updatedQuestions);
    setCurrentQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0, points: 10, category: 'General' });
  };

  const handleSaveExam = () => {
    if (!newExam.title || !newExam.questions?.length) {
      alert("Please ensure the exam has a title and at least one question.");
      return;
    }
    
    if (editingExamId) {
      onUpdateExam({
        ...newExam,
        id: editingExamId,
      } as Exam);
    } else {
      onAddExam({ 
        ...newExam, 
        id: Date.now().toString(),
        type: 'mock-eaes',
        semester: 2,
        status: 'published'
      } as Exam);
    }
    
    setIsCreating(false);
    setEditingExamId(null);
    setWizardStep(1);
    // Reset
    setNewExam({
      title: '',
      durationMinutes: 90,
      questions: [],
      categories: [],
      grade: Grade.G12,
      stream: Stream.NATURAL_SCIENCE,
      academicYear: new Date().getFullYear(),
      totalPoints: 0,
      status: 'published',
      subject: 'General'
    });
  };

  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    grade: Grade.G12,
    stream: Stream.NATURAL_SCIENCE,
    lessons: [],
    thumbnail: 'https://picsum.photos/seed/course/800/600',
    points: 100,
    enrolledCount: 0,
    rating: 5.0
  });

  const [currentLesson, setCurrentLesson] = useState<Partial<Lesson>>({
    title: '',
    content: '',
    contentType: 'video',
    videoUrl: '',
    pdfUrl: ''
  });

  const handleSaveCourse = () => {
    if (!newCourse.title || !newCourse.lessons?.length) {
      alert("Please ensure the course has a title and at least one lesson.");
      return;
    }
    
    if (editingCourseId) {
      onUpdateCourse({
        ...newCourse,
        id: editingCourseId,
      } as Course);
    } else {
      onAddCourse({
        ...newCourse,
        id: `course-${Date.now()}`,
      } as Course);
    }
    
    setIsCreatingCourse(false);
    setEditingCourseId(null);
    setNewCourse({
      title: '',
      description: '',
      grade: Grade.G12,
      stream: Stream.NATURAL_SCIENCE,
      lessons: [],
      thumbnail: 'https://picsum.photos/seed/course/800/600',
      points: 100,
      enrolledCount: 0,
      rating: 5.0
    });
  };

  const addLesson = () => {
    if (!currentLesson.title || !currentLesson.content) {
      alert("Lesson title and content are required.");
      return;
    }
    const lesson = { ...currentLesson, id: `lesson-${Date.now()}` } as Lesson;
    setNewCourse(prev => ({
      ...prev,
      lessons: [...(prev.lessons || []), lesson]
    }));
    setCurrentLesson({ title: '', content: '', contentType: 'video', videoUrl: '', pdfUrl: '' });
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      {/* TAB NAVIGATION */}
      <div className="flex gap-4 border-b-8 border-black pb-4">
        <button 
          onClick={() => setActiveTab('exams')}
          className={`px-10 py-4 rounded-t-3xl border-x-4 border-t-4 border-black font-black uppercase text-sm transition-all ${activeTab === 'exams' ? 'bg-blue-600 text-white translate-y-2' : 'bg-gray-100'}`}
        >
          Exam Repository
        </button>
        <button 
          onClick={() => setActiveTab('courses')}
          className={`px-10 py-4 rounded-t-3xl border-x-4 border-t-4 border-black font-black uppercase text-sm transition-all ${activeTab === 'courses' ? 'bg-purple-600 text-white translate-y-2' : 'bg-gray-100'}`}
        >
          Course Curriculum
        </button>
      </div>

      {activeTab === 'exams' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-8 border-black pb-10">
            <div>
              <h2 className="text-7xl font-black uppercase tracking-tighter italic leading-none text-blue-900">Mock Repository.</h2>
              <p className="text-blue-600 font-black uppercase text-sm mt-4 tracking-[0.3em]">Official EAES Standard Creator</p>
            </div>
            <button 
              onClick={() => {
                setIsCreating(true);
                setWizardStep(1);
              }} 
              className="bg-black text-white px-10 py-5 rounded-[2.5rem] border-4 border-black font-black uppercase text-xl shadow-[10px_10px_0px_0px_rgba(59,130,246,1)] hover:translate-y-1 transition-all"
            >
              ＋ Deploy New Exam
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {exams.map(ex => (
              <div key={ex.id} className="bg-white p-10 rounded-[4rem] border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black ${ex.stream === Stream.NATURAL_SCIENCE ? 'bg-cyan-400' : 'bg-amber-400'}`}>
                      {ex.grade}
                    </span>
                    <span className="text-xs font-black text-gray-400 uppercase">{ex.durationMinutes}m</span>
                  </div>
                  <h4 className="text-4xl font-black uppercase italic tracking-tighter leading-none group-hover:text-blue-700 transition-all">{ex.title}</h4>
                  <div className="flex flex-wrap gap-2">
                    {ex.categories?.map(cat => (
                      <span key={cat} className="bg-gray-100 text-[8px] font-black uppercase px-2 py-1 rounded border border-black">{cat}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-10 pt-8 border-t-4 border-black flex justify-between items-center">
                  <span className="text-2xl font-black">{ex.questions.length} Items</span>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setNewExam(ex);
                        setEditingExamId(ex.id);
                        setIsCreating(true);
                        setWizardStep(1);
                      }} 
                      className="w-12 h-12 bg-blue-50 border-4 border-black rounded-xl text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                    >
                      ✏️
                    </button>
                    <button onClick={() => onDeleteExam(ex.id)} className="w-12 h-12 bg-rose-50 border-4 border-black rounded-xl text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-8 border-black pb-10">
            <div>
              <h2 className="text-7xl font-black uppercase tracking-tighter italic leading-none text-purple-900">Curriculum Forge.</h2>
              <p className="text-purple-600 font-black uppercase text-sm mt-4 tracking-[0.3em]">National Lesson Architect</p>
            </div>
            <button 
              onClick={() => setIsCreatingCourse(true)} 
              className="bg-black text-white px-10 py-5 rounded-[2.5rem] border-4 border-black font-black uppercase text-xl shadow-[10px_10px_0px_0px_rgba(147,51,234,1)] hover:translate-y-1 transition-all"
            >
              ＋ Architect New Course
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {courses.map(course => (
              <div key={course.id} className="bg-white p-10 rounded-[4rem] border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black bg-purple-100`}>
                      {course.grade}
                    </span>
                    <span className="text-xs font-black text-gray-400 uppercase">{course.lessons.length} Lessons</span>
                  </div>
                  <h4 className="text-4xl font-black uppercase italic tracking-tighter leading-none group-hover:text-purple-700 transition-all">{course.title}</h4>
                  <p className="text-sm font-bold text-gray-500 italic line-clamp-2">{course.description}</p>
                </div>
                <div className="mt-10 pt-8 border-t-4 border-black flex justify-between items-center">
                  <span className="text-2xl font-black">{course.points} XP</span>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setNewCourse(course);
                        setEditingCourseId(course.id);
                        setIsCreatingCourse(true);
                      }} 
                      className="w-12 h-12 bg-purple-50 border-4 border-black rounded-xl text-purple-600 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all"
                    >
                      ✏️
                    </button>
                    <button onClick={() => onDeleteCourse(course.id)} className="w-12 h-12 bg-rose-50 border-4 border-black rounded-xl text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* COURSE CREATION MODAL */}
      {isCreatingCourse && (
        <div className="fixed inset-0 z-[6000] bg-white overflow-y-auto p-6 md:p-20 flex flex-col items-center">
          <div className="w-full max-w-6xl space-y-12 py-12">
            <div className="flex justify-between items-center border-b-[10px] border-black pb-10">
              <h3 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">{editingCourseId ? 'Update Module.' : 'Course Architect.'}</h3>
              <button onClick={() => { setIsCreatingCourse(false); setEditingCourseId(null); }} className="w-20 h-20 bg-rose-50 border-8 border-black rounded-[2.5rem] flex items-center justify-center text-4xl font-black">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-12 rounded-[4rem] border-8 border-black shadow-[25px_25px_0px_0px_rgba(147,51,234,1)]">
              <div className="md:col-span-2 border-b-4 border-black pb-6">
                 <h4 className="text-4xl font-black uppercase italic text-purple-900">Course Identity</h4>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Course Title</label>
                <input placeholder="Advanced Physics Core" className="w-full p-8 border-4 border-black rounded-[2.5rem] text-3xl font-black outline-none" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Grade Level</label>
                <select className="w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none" value={newCourse.grade} onChange={e => setNewCourse({...newCourse, grade: e.target.value as Grade})}>
                  {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Description</label>
                <textarea placeholder="Comprehensive guide to..." className="w-full p-8 border-4 border-black rounded-[2.5rem] text-xl font-black outline-none h-32" value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} />
              </div>

              <div className="md:col-span-2 border-b-4 border-black pb-6 mt-10">
                 <h4 className="text-4xl font-black uppercase italic text-purple-900">Lesson Forge</h4>
              </div>
              
              <div className="md:col-span-2 space-y-8 bg-purple-50 p-10 rounded-[3rem] border-4 border-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lesson Title</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black" value={currentLesson.title} onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Content Type</label>
                    <select className="w-full p-6 border-4 border-black rounded-2xl font-black" value={currentLesson.contentType} onChange={e => setCurrentLesson({...currentLesson, contentType: e.target.value as 'video' | 'pdf'})}>
                      <option value="video">Video Stream</option>
                      <option value="pdf">Secure PDF</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Resource URL</label>
                    <input className="w-full p-6 border-4 border-black rounded-2xl font-black" placeholder={currentLesson.contentType === 'video' ? 'YouTube URL' : 'PDF URL'} value={currentLesson.contentType === 'video' ? currentLesson.videoUrl : currentLesson.pdfUrl} onChange={e => setCurrentLesson({...currentLesson, [currentLesson.contentType === 'video' ? 'videoUrl' : 'pdfUrl']: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lesson Content (Markdown)</label>
                    <textarea className="w-full p-6 border-4 border-black rounded-2xl font-black h-40" value={currentLesson.content} onChange={e => setCurrentLesson({...currentLesson, content: e.target.value})} />
                  </div>
                </div>
                <button onClick={addLesson} className="w-full py-6 bg-purple-600 text-white rounded-2xl border-4 border-black font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all">＋ Add Lesson to Curriculum</button>
              </div>

              {newCourse.lessons && newCourse.lessons.length > 0 && (
                <div className="md:col-span-2 space-y-6">
                  <h5 className="text-2xl font-black uppercase italic">Curriculum Inventory</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {newCourse.lessons.map((l, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-3xl border-4 border-black flex justify-between items-center">
                        <p className="font-black italic truncate pr-4">{idx + 1}. {l.title}</p>
                        <button onClick={() => {
                           const ls = [...(newCourse.lessons || [])];
                           ls.splice(idx, 1);
                           setNewCourse({...newCourse, lessons: ls});
                        }} className="text-rose-600 font-black">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2 pt-10">
                <button 
                  onClick={handleSaveCourse}
                  className="w-full py-10 bg-black text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(147,51,234,1)] hover:translate-y-2 transition-all"
                >
                  {editingCourseId ? 'Synchronize Updates →' : 'Deploy Curriculum Registry →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 z-[6000] bg-white overflow-y-auto p-6 md:p-20 flex flex-col items-center">
          <div className="w-full max-w-6xl space-y-12 py-12">
            <div className="flex justify-between items-center border-b-[10px] border-black pb-10">
              <h3 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">{editingExamId ? 'Update Forge.' : 'Exam Forge.'}</h3>
              <button onClick={() => { setIsCreating(false); setEditingExamId(null); }} className="w-20 h-20 bg-rose-50 border-8 border-black rounded-[2.5rem] flex items-center justify-center text-4xl font-black">✕</button>
            </div>

            <div className="flex flex-wrap gap-4">
               <button onClick={() => { setCreationMethod('manual'); setWizardStep(1); }} className={`px-10 py-6 rounded-2xl border-4 border-black font-black uppercase tracking-widest text-sm transition-all ${creationMethod === 'manual' ? 'bg-black text-white' : 'bg-gray-100'}`}>Manual Builder</button>
               <button onClick={() => setCreationMethod('upload')} className={`px-10 py-6 rounded-2xl border-4 border-black font-black uppercase tracking-widest text-sm transition-all ${creationMethod === 'upload' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>Upload Artifact (PDF/Word)</button>
               <button onClick={() => setCreationMethod('ai')} className={`px-10 py-6 rounded-2xl border-4 border-black font-black uppercase tracking-widest text-sm transition-all ${creationMethod === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>AI Intelligence Scan</button>
               <button onClick={() => setCreationMethod('generate')} className={`px-10 py-6 rounded-2xl border-4 border-black font-black uppercase tracking-widest text-sm transition-all ${creationMethod === 'generate' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>AI Generation Hall</button>
            </div>

            {creationMethod === 'upload' && (
              <div className="bg-purple-50 border-8 border-black rounded-[4rem] p-12 space-y-10 animate-fadeIn text-center">
                 <div className="flex flex-col items-center gap-6">
                    <h4 className="text-4xl font-black uppercase italic text-purple-900">National Archive Ingestion</h4>
                    <p className="text-sm font-black text-purple-600 uppercase tracking-widest">Sovereign OCR Engine Ready</p>
                 </div>
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full h-80 border-8 border-dashed border-purple-300 rounded-[4rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-purple-100 transition-all bg-white shadow-inner group"
                 >
                    <div className="text-9xl group-hover:scale-110 transition-transform duration-500">📄</div>
                    <div className="space-y-2">
                       <p className="text-2xl font-black uppercase italic tracking-tighter">Click to Select Artifact</p>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Supports PDF and Word (.docx) formats</p>
                    </div>
                 </div>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept=".pdf,.doc,.docx,.txt"
                   onChange={handleFileUpload}
                 />
                 {isScanning && (
                   <div className="py-10 animate-pulse space-y-8">
                      <div className="w-16 h-16 border-[8px] border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-3xl font-black uppercase italic tracking-tighter">Decompiling Document Logic...</p>
                   </div>
                 )}
              </div>
            )}

            {creationMethod === 'ai' && (
              <div className="bg-blue-50 border-8 border-black rounded-[4rem] p-12 space-y-10 animate-fadeIn">
                 <h4 className="text-4xl font-black uppercase italic text-blue-900">AI Subject Scanner</h4>
                 <textarea 
                   placeholder="Paste educational data here for processing..."
                   className="w-full h-80 p-10 bg-white border-4 border-black rounded-[3rem] font-black text-xl outline-none shadow-inner"
                   value={rawText}
                   onChange={e => setRawText(e.target.value)}
                 />
                 <button 
                   onClick={handleAIScan}
                   disabled={isScanning || !rawText.trim()}
                   className="w-full py-10 bg-blue-600 text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all disabled:opacity-30"
                 >
                   {isScanning ? 'Synchronizing Lab Logic...' : 'Trigger Structure Extraction'}
                 </button>
              </div>
            )}

            {creationMethod === 'generate' && (
              <div className="bg-green-50 border-8 border-black rounded-[4rem] p-12 space-y-10 animate-fadeIn">
                 <h4 className="text-4xl font-black uppercase italic text-green-900">AI Logic Generator</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Main Subject</label>
                     <input className="w-full p-6 border-4 border-black rounded-2xl font-black outline-none" placeholder="Ex: Physics" value={genSubject} onChange={e => setGenSubject(e.target.value)} />
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Specific Topic</label>
                     <input className="w-full p-6 border-4 border-black rounded-2xl font-black outline-none" placeholder="Ex: Newton's Laws" value={genTopic} onChange={e => setGenTopic(e.target.value)} />
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question Format</label>
                     <div className="flex flex-wrap gap-4 p-6 border-4 border-black rounded-2xl bg-white">
                        {['multiple-choice', 'true-false', 'fill-in-the-blank'].map(type => (
                          <label key={type} className="flex items-center gap-2 font-black uppercase text-xs cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={genQuestionTypes.includes(type)}
                              onChange={e => {
                                if (e.target.checked) setGenQuestionTypes([...genQuestionTypes, type]);
                                else setGenQuestionTypes(genQuestionTypes.filter(t => t !== type));
                              }}
                              className="w-5 h-5 accent-black"
                            />
                            {type.replace(/-/g, ' ')}
                          </label>
                        ))}
                     </div>
                     {errors.genTypes && <p className="text-rose-600 text-[10px] font-black uppercase">{errors.genTypes}</p>}
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Difficulty Level</label>
                     <select className="w-full p-6 border-4 border-black rounded-2xl font-black outline-none" value={genDifficulty} onChange={e => setGenDifficulty(e.target.value)}>
                        <option>Introductory</option>
                        <option>Standard</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Expert (EAES Prep)</option>
                     </select>
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unit Count</label>
                     <input type="number" min="1" max="50" className="w-full p-6 border-4 border-black rounded-2xl font-black outline-none" value={genCount} onChange={e => setGenCount(parseInt(e.target.value))} />
                   </div>
                 </div>
                 <button 
                   onClick={handleAIGeneration}
                   disabled={isScanning || !genSubject || !genTopic}
                   className="w-full py-10 bg-green-600 text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all disabled:opacity-30"
                 >
                   {isScanning ? 'Synthesizing Educational Artifacts...' : 'Deploy Generative Protocol'}
                 </button>
              </div>
            )}

            {creationMethod === 'manual' && (
              <div className="space-y-12 animate-fadeIn">
                {/* WIZARD PROGRESS BAR */}
                <div className="flex items-center justify-between px-10">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className={`w-16 h-16 rounded-full border-4 border-black flex items-center justify-center font-black text-xl transition-all ${wizardStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {step}
                      </div>
                      {step < 3 && (
                        <div className={`flex-1 h-2 mx-4 border-2 border-black rounded-full transition-all ${wizardStep > step ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* STEP 1: BASIC INFO */}
                {wizardStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-12 rounded-[4rem] border-8 border-black shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] animate-fadeIn">
                    <div className="md:col-span-2 border-b-4 border-black pb-6">
                       <h4 className="text-4xl font-black uppercase italic">Step 1: Identity & Parameters</h4>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Exam Title</label>
                      <input placeholder="National Mock Series" className={`w-full p-8 border-4 border-black rounded-[2.5rem] text-3xl font-black outline-none ${errors.title ? 'border-rose-500 bg-rose-50' : ''}`} value={newExam.title} onChange={e => { setNewExam({...newExam, title: e.target.value}); setErrors({...errors, title: ''}); }} />
                      {errors.title && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.title}</p>}
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Subject</label>
                      <input className={`w-full p-8 border-4 border-black rounded-[2.5rem] text-3xl font-black outline-none ${errors.subject ? 'border-rose-500 bg-rose-50' : ''}`} value={newExam.subject} onChange={e => { setNewExam({...newExam, subject: e.target.value}); setErrors({...errors, subject: ''}); }} />
                      {errors.subject && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.subject}</p>}
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Grade Level</label>
                      <select className="w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none" value={newExam.grade} onChange={e => setNewExam({...newExam, grade: e.target.value as Grade})}>
                        {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Duration (Minutes)</label>
                      <input type="number" className={`w-full p-8 border-4 border-black rounded-[2.5rem] text-3xl font-black outline-none ${errors.duration ? 'border-rose-500 bg-rose-50' : ''}`} value={newExam.durationMinutes} onChange={e => { setNewExam({...newExam, durationMinutes: parseInt(e.target.value)}); setErrors({...errors, duration: ''}); }} />
                      {errors.duration && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.duration}</p>}
                    </div>
                    <div className="md:col-span-2 pt-10">
                      <button 
                        onClick={() => { if (validateStep1()) setWizardStep(2); }}
                        className="w-full py-10 bg-black text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(59,130,246,1)] hover:translate-y-2 transition-all"
                      >
                        Proceed to Unit Forge →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: UNIT FORGE */}
                {wizardStep === 2 && (
                  <div className="space-y-12 animate-fadeIn">
                    <div className="bg-white border-8 border-black rounded-[5rem] p-12 md:p-20 space-y-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex justify-between items-center border-b-4 border-black pb-8">
                        <h4 className="text-5xl font-black uppercase italic">Step 2: Unit Forge</h4>
                        <span className="text-2xl font-black text-blue-600">{newExam.questions?.length} Items Staged</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-3 space-y-2">
                          <textarea placeholder="The derivative of sin(x) is..." className={`w-full p-10 border-4 border-black rounded-[3rem] font-black h-32 text-2xl bg-gray-50 outline-none ${errors.qText ? 'border-rose-500' : ''}`} value={currentQuestion.text} onChange={e => { setCurrentQuestion({...currentQuestion, text: e.target.value}); setErrors({...errors, qText: ''}); }} />
                          {errors.qText && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.qText}</p>}
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question Type</label>
                          <select className="w-full p-6 border-4 border-black rounded-2xl font-black" value={currentQuestion.type} onChange={e => setCurrentQuestion({...currentQuestion, type: e.target.value as QuestionType, options: e.target.value === 'fill-in-the-blank' ? [] : (e.target.value === 'true-false' ? ['True', 'False'] : ['', '', '', '']), correctAnswer: e.target.value === 'fill-in-the-blank' ? '' : 0})}>
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True / False</option>
                            <option value="fill-in-the-blank">Fill in the Blank</option>
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</label>
                          <input placeholder="Ex: Calculus" className={`w-full p-6 border-4 border-black rounded-2xl font-black ${errors.qCategory ? 'border-rose-500' : ''}`} value={currentQuestion.category} onChange={e => { setCurrentQuestion({...currentQuestion, category: e.target.value}); setErrors({...errors, qCategory: ''}); }} />
                          {errors.qCategory && <p className="text-rose-600 text-[10px] font-black uppercase">{errors.qCategory}</p>}
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Points</label>
                          <input placeholder="Points" type="number" className={`w-full p-6 border-4 border-black rounded-2xl font-black ${errors.qPoints ? 'border-rose-500' : ''}`} value={currentQuestion.points} onChange={e => { setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value)}); setErrors({...errors, qPoints: ''}); }} />
                          {errors.qPoints && <p className="text-rose-600 text-[10px] font-black uppercase">{errors.qPoints}</p>}
                        </div>
                      </div>
                      
                      {currentQuestion.type === 'fill-in-the-blank' ? (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Correct Answer (Exact Match)</label>
                          <input 
                            placeholder="Type the correct answer" 
                            className={`w-full p-8 border-4 border-black rounded-[2.5rem] text-2xl font-black outline-none bg-green-50 ${errors.qAnswer ? 'border-rose-500' : ''}`}
                            value={currentQuestion.correctAnswer as string}
                            onChange={e => { setCurrentQuestion({...currentQuestion, correctAnswer: e.target.value}); setErrors({...errors, qAnswer: ''}); }}
                          />
                          {errors.qAnswer && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.qAnswer}</p>}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {currentQuestion.options?.map((opt, i) => (
                               <div key={i} className="relative">
                                 <input 
                                   placeholder={`Option ${String.fromCharCode(65+i)}`}
                                   className={`w-full p-8 border-4 border-black rounded-[2rem] font-black text-xl ${currentQuestion.correctAnswer === i ? 'bg-green-100' : 'bg-white'} ${errors.qOptions ? 'border-rose-500' : ''}`}
                                   value={opt}
                                   onChange={e => {
                                     const opts = [...(currentQuestion.options || [])];
                                     opts[i] = e.target.value;
                                     setCurrentQuestion({...currentQuestion, options: opts});
                                     setErrors({...errors, qOptions: ''});
                                   }}
                                 />
                                 <button 
                                   onClick={() => setCurrentQuestion({...currentQuestion, correctAnswer: i})}
                                   className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black ${currentQuestion.correctAnswer === i ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
                                 >
                                   {currentQuestion.correctAnswer === i ? '✓' : ''}
                                 </button>
                               </div>
                             ))}
                          </div>
                          {errors.qOptions && <p className="text-rose-600 text-xs font-black uppercase ml-4">{errors.qOptions}</p>}
                        </div>
                      )}
                      <button onClick={addQuestion} className="w-full py-10 bg-black text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(34,197,94,1)] hover:translate-y-2 transition-all">Lock Unit to Forge</button>
                    </div>

                    {newExam.questions && newExam.questions.length > 0 && (
                      <div className="space-y-6">
                        <h5 className="text-2xl font-black uppercase italic">Staged Units</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {newExam.questions.map((q, idx) => (
                            <div key={idx} className="bg-gray-50 p-6 rounded-3xl border-4 border-black flex justify-between items-center">
                              <p className="font-black italic truncate pr-4">{q.text}</p>
                              <button onClick={() => {
                                 const qs = [...(newExam.questions || [])];
                                 qs.splice(idx, 1);
                                 setNewExam({...newExam, questions: qs});
                                 updateCategories(qs);
                              }} className="text-rose-600 font-black">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-6">
                      <button onClick={() => setWizardStep(1)} className="flex-1 py-10 bg-gray-100 border-8 border-black rounded-[3rem] font-black uppercase text-3xl hover:bg-gray-200 transition-all">← Back</button>
                      <button 
                        onClick={() => setWizardStep(3)} 
                        disabled={!newExam.questions?.length}
                        className="flex-[2] py-10 bg-blue-600 text-white border-8 border-black rounded-[3rem] font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all disabled:opacity-30"
                      >
                        Review & Finalize →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW */}
                {wizardStep === 3 && (
                  <div className="bg-white border-8 border-black rounded-[4rem] p-12 md:p-20 space-y-12 shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] animate-fadeIn">
                    <div className="border-b-4 border-black pb-6">
                       <h4 className="text-4xl font-black uppercase italic">Step 3: Final Review</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      <div className="bg-blue-50 p-8 rounded-3xl border-4 border-black">
                        <p className="text-[10px] font-black uppercase text-blue-600 mb-2">Title</p>
                        <p className="text-2xl font-black italic">{newExam.title}</p>
                      </div>
                      <div className="bg-green-50 p-8 rounded-3xl border-4 border-black">
                        <p className="text-[10px] font-black uppercase text-green-600 mb-2">Subject</p>
                        <p className="text-2xl font-black italic">{newExam.subject}</p>
                      </div>
                      <div className="bg-purple-50 p-8 rounded-3xl border-4 border-black">
                        <p className="text-[10px] font-black uppercase text-purple-600 mb-2">Parameters</p>
                        <p className="text-2xl font-black italic">{newExam.grade} // {newExam.durationMinutes}m</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-2xl font-black uppercase italic">Inventory Summary</h5>
                      <div className="bg-gray-50 p-10 rounded-[3rem] border-4 border-black">
                        <div className="flex justify-between items-center mb-8">
                          <span className="text-4xl font-black">{newExam.questions?.length} Total Units</span>
                          <span className="text-4xl font-black text-blue-600">{newExam.totalPoints} Points</span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {newExam.categories?.map(cat => (
                            <span key={cat} className="bg-white px-6 py-2 rounded-full border-2 border-black font-black uppercase text-xs">{cat}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 pt-10">
                      <button onClick={() => setWizardStep(2)} className="flex-1 py-10 bg-gray-100 border-8 border-black rounded-[3rem] font-black uppercase text-3xl hover:bg-gray-200 transition-all">← Edit Units</button>
                      <button onClick={handleSaveExam} className="flex-[2] py-16 bg-blue-700 text-white rounded-[5rem] border-[10px] border-black font-black uppercase text-5xl md:text-7xl shadow-[30px_30px_0px_0px_rgba(239,51,64,1)] hover:translate-y-4 transition-all">
                        {editingExamId ? 'Sync Updates' : 'Deploy Registry'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
