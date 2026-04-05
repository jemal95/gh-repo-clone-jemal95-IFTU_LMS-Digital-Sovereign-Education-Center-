
export enum EducationLevel {
  SECONDARY = 'Secondary (Grades 9-12)',
  TVET = 'TVET College'
}

export enum Grade {
  G9 = 'Grade 9',
  G10 = 'Grade 10',
  G11 = 'Grade 11',
  G12 = 'Grade 12',
  TVET_LEVEL_1 = 'TVET Level 1',
  TVET_LEVEL_2 = 'TVET Level 2',
  TVET_LEVEL_3 = 'TVET Level 3',
  TVET_LEVEL_4 = 'TVET Level 4'
}

export enum Stream {
  GENERAL = 'General',
  NATURAL_SCIENCE = 'Natural Science',
  SOCIAL_SCIENCE = 'Social Science'
}

export type ExamType = 'mid' | 'final' | 'mock-eaes' | 'national-eaes' | 'tvet-exit' | 'National';
export type Language = 'en' | 'am' | 'om';
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-in-the-blank' | 'short-answer';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string;
  type: 'video' | 'reading' | 'quiz'; 
  contentType: 'video' | 'reading' | 'quiz' | 'assignment' | 'document';
  videoUrl?: string;
  pdfUrl?: string;
  fileUrl?: string; // Generic URL for PDF, Word, PPT
  fileName?: string;
  isCompleted?: boolean;
  questions?: Question[];
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'document' | 'video' | 'link' | 'other';
  url: string;
  addedAt: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  grade: Grade;
  stream: Stream;
  level: EducationLevel;
  thumbnail: string;
  description: string;
  syllabus?: string; // Markdown or URL
  learningObjectives?: string[];
  materials?: CourseMaterial[];
  lessons: Lesson[];
  instructor: string;
  instructorId?: string;
  instructorEmail?: string;
  instructorPhoto?: string;
  subject: string;
  enrolledStudents?: number;
  enrolledCount?: number; // Alias for enrolledStudents
  rating?: number;
  points?: number;
  prerequisites?: string[];
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer: number | string;
  points: number;
  category: string;
  tags?: string[];
}

export interface Exam {
  id: string;
  title: string;
  courseCode: string;
  grade: Grade;
  stream: Stream;
  academicYear: number;
  durationMinutes: number;
  questions: Question[];
  categories?: string[];
  totalPoints: number;
  status: 'draft' | 'published' | 'closed';
  type: ExamType;
  semester: 1 | 2;
  subject: string;
  difficulty?: Difficulty;
  description?: string;
  keyConcepts?: { term: string; meaning: string }[];
}

export interface News {
  id: string;
  date: string;
  tag: string;
  title: string;
  summary: string;
  content: string;
  image: string;
}

export interface Badge {
  id: string;
  title: string;
  icon: string;
  earnedAt: string;
}

export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin' | 'content_creator' | 'teaching_assistant' | 'guest_user';
  grade?: Grade;
  stream?: Stream;
  level?: EducationLevel;
  points: number;
  status: 'active' | 'pending' | 'suspended';
  email: string;
  joinedDate: string;
  nid?: string; // National Identity Number
  studentIdNumber?: string; // Student ID Number
  academicRecordsUrl?: string; // URL for uploaded academic records
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  salary?: number; // Base Salary for Teachers or Stipend for Students
  photo?: string;
  age?: number;
  department?: string; // Teachers only
  subjects?: string[]; // Teachers only
  phoneNumber?: string;
  address?: string;
  preferredLanguage: Language;
  badges: Badge[];
  school?: string;
  completedLessons?: string[];
  completedExams?: string[];
  completedCourses?: string[];
  certificatesPaid?: string[];
}

export interface ExamResult {
  examId: string;
  studentId: string;
  score: number;
  totalPoints: number;
  completedAt: string;
  timeSpentSeconds: number;
  answers: Record<string, number | string>;
  categoryBreakdown: Record<string, { correct: number; total: number }>;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseCode: string;
  dueDate: string;
  points: number;
  rubricUrl?: string;
  status: 'draft' | 'published' | 'closed';
  progressStatus?: 'Not Started' | 'In Progress' | 'Completed' | 'Needs Review';
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  fileUrl: string;
  status: 'submitted' | 'graded' | 'returned';
  gradedFileUrl?: string;
  grade?: number;
  feedback?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // The ID of the student or teacher who receives the notification
  title: string;
  message: string;
  type: 'assignment' | 'submission' | 'grade';
  isRead: boolean;
  createdAt: string;
  link?: string; // Optional link to the assignment or submission
}
