
import React, { useState, useEffect } from 'react';
import { Assignment, AssignmentSubmission, User } from '../types';
import { dbService } from '../services/dbService';
import { getEthiopianDateString } from '../lib/dateUtils';
import { FileText, Calendar, CheckCircle, Clock, AlertCircle, Upload, Download, ExternalLink } from 'lucide-react';

interface AssignmentPortalProps {
  currentUser: User;
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
}

export const AssignmentPortal: React.FC<AssignmentPortalProps> = ({ currentUser, assignments, submissions }) => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const getSubmission = (assignmentId: string) => {
    return submissions.find(s => s.assignmentId === assignmentId && s.studentId === currentUser.id);
  };

  const handleUpload = async () => {
    if (!selectedAssignment || !uploadFile) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../firebase');
      
      const storageRef = ref(storage, `submissions/${selectedAssignment.id}/${currentUser.id}/${uploadFile.name}`);
      const snapshot = await uploadBytes(storageRef, uploadFile);
      const fileUrl = await getDownloadURL(snapshot.ref);

      clearInterval(interval);
      setUploadProgress(100);

      const submission: AssignmentSubmission = {
        id: `sub-${Date.now()}`,
        assignmentId: selectedAssignment.id,
        studentId: currentUser.id,
        studentName: currentUser.name,
        submittedAt: new Date().toISOString(),
        fileUrl,
        status: 'submitted'
      };

      await dbService.syncSubmission(submission);
      
      // Notify teachers/admins
      await dbService.createNotification({
        userId: 'admin', // Or specific teacher ID if available
        title: 'New Assignment Submission',
        message: `${currentUser.name} submitted work for "${selectedAssignment.title}".`,
        type: 'assignment',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: `/admin/submissions`
      });

      setSelectedAssignment(null);
      setUploadFile(null);
    } catch (error) {
      console.error("Upload failed:", error);
      alert('Failed to upload assignment. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const sortedAssignments = [...assignments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-8 border-black pb-10">
        <div>
          <h2 className="text-7xl font-black uppercase tracking-tighter italic leading-none text-orange-900">Task Portal.</h2>
          <p className="text-orange-600 font-black uppercase text-sm mt-4 tracking-[0.3em]">National Assignment Registry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Assignment List */}
        <div className="lg:col-span-2 space-y-8">
          {sortedAssignments.length > 0 ? (
            sortedAssignments.map(assignment => {
              const submission = getSubmission(assignment.id);
              const isOverdue = new Date(assignment.dueDate) < new Date() && !submission;
              
              return (
                <div 
                  key={assignment.id} 
                  className={`bg-white p-8 rounded-[3rem] border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-2 hover:-translate-y-2 cursor-pointer ${selectedAssignment?.id === assignment.id ? 'ring-8 ring-orange-400' : ''}`}
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black bg-orange-100">
                        {assignment.courseCode}
                      </span>
                      <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase border-2 border-black ${submission ? 'bg-green-400' : isOverdue ? 'bg-rose-400' : 'bg-blue-400'}`}>
                        {submission ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs font-black text-gray-400 uppercase">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                      <span className="text-[10px] font-black text-blue-500 tracking-tighter">
                        {getEthiopianDateString(assignment.dueDate)}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-4">{assignment.title}</h3>
                  <p className="text-gray-500 font-bold line-clamp-2 mb-6">{assignment.description}</p>

                  <div className="flex justify-between items-center pt-6 border-t-4 border-black">
                    <span className="text-2xl font-black">{assignment.points} Points</span>
                    {submission?.grade !== undefined && (
                      <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-2xl border-4 border-black">
                        <CheckCircle size={20} className="text-green-600" />
                        <span className="font-black text-green-600">Grade: {submission.grade}/{assignment.points}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-gray-50 p-20 rounded-[4rem] border-8 border-black border-dashed text-center">
              <FileText size={64} className="mx-auto text-gray-300 mb-6" />
              <p className="text-2xl font-black text-gray-400 uppercase italic">No assignments found.</p>
            </div>
          )}
        </div>

        {/* Details & Submission Panel */}
        <div className="lg:col-span-1">
          {selectedAssignment ? (
            <div className="bg-white p-10 rounded-[4rem] border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] sticky top-24">
              <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-6 border-b-4 border-black pb-4">Task Details</h3>
              
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</p>
                  <p className="font-bold text-gray-700 leading-relaxed">{selectedAssignment.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border-4 border-black">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Due Date</p>
                    <p className="font-black italic text-sm">{new Date(selectedAssignment.dueDate).toLocaleDateString()}</p>
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1">
                      {getEthiopianDateString(selectedAssignment.dueDate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border-4 border-black">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Max Points</p>
                    <p className="font-black italic">{selectedAssignment.points}</p>
                  </div>
                </div>

                {selectedAssignment.rubricUrl && (
                  <a 
                    href={selectedAssignment.rubricUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-blue-50 border-4 border-black rounded-2xl font-black uppercase text-sm hover:bg-blue-100 transition-all"
                  >
                    <Download size={18} />
                    Download Rubric
                  </a>
                )}

                <div className="pt-8 border-t-4 border-black">
                  <h4 className="text-2xl font-black uppercase italic mb-6">Your Submission</h4>
                  
                  {getSubmission(selectedAssignment.id) ? (
                    <div className="space-y-6">
                      <div className="bg-green-50 p-6 rounded-3xl border-4 border-black border-dashed">
                        <div className="flex items-center gap-4 mb-4">
                          <CheckCircle className="text-green-600" />
                          <div>
                            <p className="font-black uppercase text-xs text-green-600">Submitted Successfully</p>
                            <p className="text-[10px] font-bold text-gray-500">{new Date(getSubmission(selectedAssignment.id)!.submittedAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <a 
                          href={getSubmission(selectedAssignment.id)!.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-600 font-bold underline text-sm"
                        >
                          View Submitted File
                        </a>
                      </div>

                      {getSubmission(selectedAssignment.id)!.feedback && (
                        <div className="bg-blue-50 p-6 rounded-3xl border-4 border-black">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Teacher Feedback</p>
                          <p className="font-bold text-gray-700 italic">"{getSubmission(selectedAssignment.id)!.feedback}"</p>
                          {getSubmission(selectedAssignment.id)!.gradedFileUrl && (
                            <a 
                              href={getSubmission(selectedAssignment.id)!.gradedFileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 mt-4 text-blue-600 font-bold underline text-xs"
                            >
                              <Download size={14} />
                              Download Graded File
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative">
                        <input 
                          type="file" 
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="hidden" 
                          id="assignment-upload"
                        />
                        <label 
                          htmlFor="assignment-upload"
                          className="flex flex-col items-center justify-center gap-4 w-full py-10 bg-gray-50 border-4 border-black border-dashed rounded-[2.5rem] cursor-pointer hover:bg-gray-100 transition-all"
                        >
                          <Upload size={32} className="text-gray-400" />
                          <div className="text-center">
                            <p className="font-black uppercase text-sm">{uploadFile ? uploadFile.name : 'Select Work File'}</p>
                            <p className="text-[10px] font-bold text-gray-400">PDF, DOCX, or Images</p>
                          </div>
                        </label>
                      </div>

                      {isUploading && (
                        <div className="w-full bg-gray-200 h-6 rounded-full border-4 border-black overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}

                      <button 
                        onClick={handleUpload}
                        disabled={!uploadFile || isUploading}
                        className={`w-full py-5 rounded-[2rem] border-4 border-black font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all ${!uploadFile || isUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:translate-y-1 active:shadow-none'}`}
                      >
                        {isUploading ? 'Uploading...' : 'Submit Work'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-10 rounded-[4rem] border-8 border-black border-dashed text-center">
              <AlertCircle size={48} className="mx-auto text-blue-300 mb-6" />
              <p className="text-xl font-black text-blue-400 uppercase italic">Select an assignment to view details and submit your work.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
