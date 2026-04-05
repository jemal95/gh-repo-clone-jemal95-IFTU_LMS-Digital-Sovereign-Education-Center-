
import React, { useState, useMemo } from 'react';
import { ExamResult, Exam, User, Course } from '../types';
import ReportCard from './ReportCard';
import PaymentPortal from './PaymentPortal';
import CertificatePortal from './CertificatePortal';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, TrendingUp, Award, Target, BookOpen, ChevronRight } from 'lucide-react';
import * as geminiService from '../services/geminiService';

interface PerformancePortalProps {
  results: ExamResult[];
  exams: Exam[];
  currentUser?: User;
  courses: Course[];
  onCertPaid: (courseId: string) => void;
}

const PerformancePortal: React.FC<PerformancePortalProps> = ({ results, exams, currentUser, courses, onCertPaid }) => {
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [showPayment, setShowPayment] = useState<Course | null>(null);
  const [showCertificate, setShowCertificate] = useState<Course | null>(null);
  const [showExamCert, setShowExamCert] = useState<ExamResult | null>(null);
  const [learningPath, setLearningPath] = useState<{title: string, suggestion: string, priority: string}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const performanceData = useMemo(() => {
    if (results.length === 0) return [];
    return results.map(r => {
      const exam = exams.find(e => e.id === r.examId);
      return {
        name: exam?.title.substring(0, 10) || 'Exam',
        score: Math.round((r.score / r.totalPoints) * 100),
        date: new Date(r.completedAt).toLocaleDateString()
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [results, exams]);

  const fetchLearningPath = async () => {
    if (!currentUser) return;
    setIsAnalyzing(true);
    
    const performanceSummary = results.map(r => {
      const exam = exams.find(e => e.id === r.examId);
      return {
        subject: exam?.subject || 'General',
        score: Math.round((r.score / r.totalPoints) * 100)
      };
    });

    const prompt = `Based on the following student performance data: ${JSON.stringify(performanceSummary)}. 
    The student is in Grade ${currentUser.grade}, Stream ${currentUser.stream}.
    Provide 3-4 specific learning path suggestions. 
    Format as a JSON array of objects with 'title', 'suggestion', and 'priority' (High/Medium/Low).`;

    try {
      const response = await geminiService.askTutor(prompt, 'en', 'You are an academic advisor.');
      // Simple extraction of JSON from response
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        setLearningPath(JSON.parse(jsonMatch[0]));
      }
    } catch (error) {
      console.error("Error fetching learning path:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analytics = (() => {
    if (results.length === 0) return { averageScore: 0, trend: [] };
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalPossible = results.reduce((sum, r) => sum + r.totalPoints, 0);
    const averageScore = Math.round((totalScore / totalPossible) * 100);
    const trend = results.slice(-5).map(r => Math.round((r.score / r.totalPoints) * 100));
    return { averageScore, trend };
  })();

  const handlePaymentSuccess = () => {
    if (showPayment) {
      onCertPaid(showPayment.id);
      setShowCertificate(showPayment);
      setShowPayment(null);
    }
  };

  if (selectedResult) return (
    <ReportCard 
      result={selectedResult} 
      user={currentUser}
      onClose={() => setSelectedResult(null)} 
      onViewCertificate={() => setShowExamCert(selectedResult)}
    />
  );

  return (
    <div className="max-w-7xl mx-auto space-y-24 animate-fadeIn py-12 px-4 selection:bg-yellow-200">
      
      {/* CUMULATIVE TRANSCRIPT HEADER */}
      <section className="bg-white border-[10px] border-black rounded-[5rem] p-12 md:p-24 shadow-[30px_30px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-8 ethiopian-gradient"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 relative z-10">
          <div className="space-y-10 max-w-2xl">
            <span className="inline-block bg-blue-700 text-white px-10 py-4 rounded-3xl border-4 border-black font-black uppercase text-sm tracking-[0.5em] shadow-xl">National Academic Registry</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-[0.75] text-blue-900">Transcript <br/>Summary.</h2>
          </div>
          <div className="flex flex-col items-center bg-gray-50 border-8 border-black p-12 rounded-[4rem] shadow-inner w-full lg:w-auto">
             <div className="text-center">
                <p className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none">{analytics.averageScore}%</p>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600 mt-4">Aggregate Mastery</p>
             </div>
          </div>
        </div>
      </section>

      {/* PERFORMANCE VISUALIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="bg-white border-8 border-black rounded-[4rem] p-12 shadow-[20px_20px_0px_0px_rgba(59,130,246,1)]">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-blue-100 rounded-2xl border-4 border-black">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter">Mastery Trend</h3>
          </div>
          <div className="h-[300px] w-full">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" stroke="#000" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#000" fontSize={10} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '4px solid black', borderRadius: '1rem', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-black uppercase italic">No Data Points Yet</div>
            )}
          </div>
        </section>

        <section className="bg-white border-8 border-black rounded-[4rem] p-12 shadow-[20px_20px_0px_0px_rgba(168,85,247,1)] flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-2xl border-4 border-black">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-4xl font-black uppercase italic tracking-tighter">AI Learning Path</h3>
            </div>
            <button 
              onClick={fetchLearningPath}
              disabled={isAnalyzing}
              className="bg-black text-white px-6 py-3 rounded-2xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] hover:translate-y-1 transition-all"
            >
              {isAnalyzing ? 'Analyzing...' : 'Refresh Path'}
            </button>
          </div>

          <div className="flex-1 space-y-4">
            {learningPath.length > 0 ? (
              <AnimatePresence>
                {learningPath.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 bg-gray-50 border-4 border-black rounded-3xl flex items-start gap-4 group hover:bg-purple-50 transition-colors"
                  >
                    <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${item.priority === 'High' ? 'bg-red-500 animate-pulse' : item.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div>
                      <h4 className="font-black uppercase italic text-sm">{item.title}</h4>
                      <p className="text-xs font-bold text-gray-500 mt-1">{item.suggestion}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="text-6xl">🧠</div>
                <p className="text-xs font-black uppercase tracking-widest">Generate your personalized AI learning path based on performance data.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* COMPLETED MODULES & CERTIFICATES */}
      <section className="space-y-16">
        <div className="flex items-center gap-8 border-l-[20px] border-green-600 pl-10">
           <h3 className="text-6xl font-black uppercase italic tracking-tighter text-blue-900">Completed Hubs</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           {courses.filter(c => currentUser?.completedCourses?.includes(c.id)).map(c => {
             const isPaid = currentUser?.certificatesPaid?.includes(c.id);
             return (
               <div key={c.id} className="bg-white border-8 border-black rounded-[4rem] p-12 space-y-10 shadow-[20px_20px_0px_0px_rgba(0,155,68,1)] hover:translate-y-[-8px] transition-transform">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{c.code}</p>
                       <h4 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{c.title}</h4>
                    </div>
                    <span className="text-7xl">{isPaid ? '📜' : '🏆'}</span>
                  </div>
                  <div className="pt-8 border-t-8 border-black flex flex-col sm:flex-row gap-6">
                     {isPaid ? (
                       <button 
                         onClick={() => setShowCertificate(c)}
                         className="flex-1 py-8 bg-green-600 text-white rounded-[2.5rem] border-4 border-black font-black uppercase text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all"
                       >
                         View Sovereign Credential
                       </button>
                     ) : (
                       <button 
                         onClick={() => setShowPayment(c)}
                         className="flex-1 py-8 bg-black text-white rounded-[2.5rem] border-4 border-black font-black uppercase text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all"
                       >
                         Claim Master Credential (150 ETB)
                       </button>
                     )}
                     <button onClick={() => alert("Trace ID exported to personal academic ledger.")} className="flex-1 py-8 bg-white border-4 border-black rounded-[2.5rem] font-black uppercase text-xs hover:bg-gray-50 transition-colors">Export Evidence</button>
                  </div>
               </div>
             );
           })}
           {(!currentUser?.completedCourses || currentUser.completedCourses.length === 0) && (
             <div className="col-span-full bg-gray-50 border-8 border-dashed border-black/10 p-24 text-center rounded-[4rem]">
                <p className="text-4xl font-black uppercase italic text-gray-300">No Credentials Minted Yet.</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-4">Complete module units to unlock registry entries</p>
             </div>
           )}
        </div>
      </section>

      {/* MODALS */}
      {showPayment && (
        <PaymentPortal 
          itemTitle={`Master Credential: ${showPayment.title}`} 
          price={150} 
          onSuccess={handlePaymentSuccess} 
          onClose={() => setShowPayment(null)} 
        />
      )}

      {showCertificate && currentUser && (
        <CertificatePortal 
          user={currentUser} 
          course={showCertificate} 
          onClose={() => setShowCertificate(null)} 
        />
      )}

      {showExamCert && currentUser && (
        <CertificatePortal 
          user={currentUser} 
          examTitle={exams.find(e => e.id === showExamCert.examId)?.title}
          onClose={() => setShowExamCert(null)} 
        />
      )}

      <div className="h-24"></div>
    </div>
  );
};

export default PerformancePortal;
