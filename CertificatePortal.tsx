
import React from 'react';
import { User, Course } from '../types';

interface CertificatePortalProps {
  user: User;
  course?: Course;
  examTitle?: string;
  onClose: () => void;
}

const CertificatePortal: React.FC<CertificatePortalProps> = ({ user, course, examTitle, onClose }) => {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const title = course?.title || examTitle || 'Academic Achievement';
  const stream = user.stream || 'NATURAL SCIENCES STREAM';
  
  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 overflow-y-auto animate-fadeIn">
      <div className="printable-transcript w-full max-w-5xl">
        <div className="bg-white border-[1px] border-gray-200 p-8 md:p-16 relative overflow-hidden shadow-2xl font-serif text-gray-800">
          {/* Blue Double Borders */}
          <div className="absolute top-4 left-4 right-4 h-[2px] bg-blue-500"></div>
          <div className="absolute top-6 left-4 right-4 h-[2px] bg-blue-500"></div>
          <div className="absolute bottom-4 left-4 right-4 h-[2px] bg-blue-500"></div>
          <div className="absolute bottom-6 left-4 right-4 h-[2px] bg-blue-500"></div>

          <div className="border-[1px] border-gray-100 p-4 md:p-8 flex flex-col items-center text-center space-y-6">
            {/* Header Text */}
            <div className="space-y-1">
              <h1 className="text-lg md:text-xl font-bold tracking-widest uppercase">
                OROMIYA EDUCATION BUREAU | BIIROO BARNOOTA OROMIYAA
              </h1>
              <h2 className="text-md md:text-lg font-bold tracking-wider uppercase">
                WEST ARSI ZONE | KORE WOREDA
              </h2>
              <h3 className="text-2xl md:text-3xl font-bold text-blue-500 uppercase tracking-tight">
                IFTU SECONDARY SCHOOL
              </h3>
              <h4 className="text-lg md:text-xl font-bold text-blue-400 uppercase">
                M.B. SAD. 2FFAA IFTU
              </h4>
            </div>

            <div className="w-full border-t-[1px] border-blue-200 my-2"></div>

            <div className="space-y-1">
              <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-gray-500">
                SCHOOL DIPLOMA | RAGAA XUMURA BARNOOTA SAD. 2FFAA
              </p>
              <h2 className="text-5xl md:text-7xl font-serif italic text-blue-700 py-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                High School Diploma
              </h2>
            </div>

            <div className="space-y-6 max-w-3xl">
              <p className="text-md md:text-lg italic text-gray-600">
                This certifies that / Waraqaan kun kan mirkaneessu barataa/tuu
              </p>
              
              <div className="relative inline-block">
                <h2 className="text-5xl md:text-7xl font-bold text-black border-b-2 border-gray-300 px-12 py-2">
                  {user.name}
                </h2>
              </div>

              <p className="text-md md:text-lg text-gray-600 leading-relaxed">
                satisfactorily completed the Course of Study prescribed for the Secondary Schools of Oromia.
              </p>

              <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-gray-900 pt-4">
                {stream}
              </h3>
            </div>

            {/* Footer / Seals */}
            <div className="w-full flex flex-col md:flex-row justify-between items-center pt-12 gap-12">
              <div className="text-left space-y-1">
                <p className="text-sm font-bold">Date: {dateStr}</p>
                <p className="text-sm font-bold">Place: KORE, WEST ARSI</p>
              </div>

              <div className="relative">
                <div className="w-40 h-40 border-4 border-blue-900 rounded-full flex items-center justify-center p-2 opacity-80">
                  <div className="w-full h-full border-2 border-blue-900 rounded-full flex flex-col items-center justify-center text-[8px] font-bold text-blue-900 text-center uppercase p-1">
                    <span className="mb-1">BIIROO BARNOOTA OROMIYAA</span>
                    <div className="w-12 h-12 bg-blue-900 rounded-sm mb-1 flex items-center justify-center">
                       <div className="w-6 h-8 bg-white rounded-t-full"></div>
                    </div>
                    <span>WEST ARSI ZONE KORE WOREDA</span>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="relative inline-block">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-40">
                    <img src="https://api.dicebear.com/7.x/initials/svg?seed=JF" className="w-32 h-12" alt="signature" />
                  </div>
                  <p className="text-xl font-bold border-b-2 border-black px-8 pb-1">JEMAL FANO HAJI</p>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">INSTITUTIONAL DIRECTOR</p>
              </div>
            </div>
          </div>
        </div>

        {/* Print / Actions */}
        <div className="no-print mt-12 flex flex-col sm:flex-row gap-8">
           <button onClick={() => window.print()} className="flex-1 py-10 bg-black text-white rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(34,197,94,1)] hover:translate-y-2 transition-all">Export Official PDF</button>
           <button onClick={onClose} className="flex-1 py-10 bg-white text-black rounded-[3rem] border-8 border-black font-black uppercase text-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 transition-all">Close Certificate View</button>
        </div>
      </div>
    </div>
  );
};

export default CertificatePortal;
