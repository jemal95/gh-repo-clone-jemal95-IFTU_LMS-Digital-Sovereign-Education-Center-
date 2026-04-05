
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, updateDoc, onSnapshot, Unsubscribe, addDoc, orderBy, limit, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { User, ExamResult, Course, Exam, News, Assignment, AssignmentSubmission, AppNotification } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, isListener: boolean = false) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error(`Firestore ${isListener ? 'Listener' : 'Operation'} Error: `, JSON.stringify(errInfo, null, 2));
  
  if (isListener) {
    // Don't throw in listeners to avoid crashing the app, but log it clearly
    return;
  }
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  // AUTH
  async signIn(email: string, password?: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password || 'demo');
      return { user: { id: userCredential.user.uid } };
    } catch (error) {
      return { error };
    }
  },

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return { user: { id: userCredential.user.uid, email: userCredential.user.email, name: userCredential.user.displayName, photo: userCredential.user.photoURL } };
    } catch (error) {
      return { error };
    }
  },

  async signUp(email: string, password: string, user: User) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userRef, { ...user, id: userCredential.user.uid });
  },

  // REAL-TIME LISTENERS
  subscribeToExams(callback: (exams: Exam[]) => void, onError?: (error: any) => void): Unsubscribe {
    const path = 'exams';
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      callback(exams);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path, true);
      if (onError) onError(error);
    });
  },

  subscribeToCourses(callback: (courses: Course[]) => void, onError?: (error: any) => void): Unsubscribe {
    const path = 'courses';
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      callback(courses);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path, true);
      if (onError) onError(error);
    });
  },

  subscribeToNews(callback: (news: News[]) => void, onError?: (error: any) => void): Unsubscribe {
    const path = 'news';
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
      callback(news);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path, true);
      if (onError) onError(error);
    });
  },

  subscribeToUsers(callback: (users: User[]) => void, onError?: (error: any) => void): Unsubscribe {
    const path = 'users';
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      callback(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path, true);
      if (onError) onError(error);
    });
  },

  subscribeToAssignments(callback: (assignments: Assignment[]) => void, onError?: (error: any) => void): Unsubscribe {
    const path = 'assignments';
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
      callback(assignments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path, true);
      if (onError) onError(error);
    });
  },

  subscribeToSubmissions(callback: (submissions: AssignmentSubmission[]) => void, onError?: (error: any) => void): Unsubscribe {
    const path = 'submissions';
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssignmentSubmission));
      callback(submissions);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path, true);
      if (onError) onError(error);
    });
  },

  subscribeToExamResults(callback: (results: ExamResult[]) => void, onError?: (error: any) => void): Unsubscribe {
    const path = 'exam_results';
    const q = collection(db, path);
    return onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ ...doc.data() } as ExamResult));
      callback(results);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path, true);
      if (onError) onError(error);
    });
  },

  // FETCH NOTIFICATIONS
  async fetchNotifications(userId: string): Promise<AppNotification[]> {
    const path = 'notifications';
    try {
      const notifsCol = collection(db, path);
      const q = query(notifsCol, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // CREATE NOTIFICATION
  async createNotification(notification: Omit<AppNotification, 'id'>) {
    const path = 'notifications';
    try {
      await addDoc(collection(db, path), notification);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // MARK NOTIFICATION AS READ
  async markNotificationRead(notificationId: string) {
    if (!auth.currentUser) return;
    const path = 'notifications';
    try {
      const notifRef = doc(db, path, notificationId);
      await updateDoc(notifRef, { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // FETCH ALL USERS (Admin)
  async fetchAllUsers(): Promise<User[]> {
    const path = 'users';
    try {
      const usersCol = collection(db, path);
      const snapshot = await getDocs(usersCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // FETCH COURSES
  async fetchCourses(): Promise<Course[]> {
    const path = 'courses';
    try {
      const coursesCol = collection(db, path);
      const snapshot = await getDocs(coursesCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // FETCH EXAMS
  async fetchExams(): Promise<Exam[]> {
    const path = 'exams';
    try {
      const examsCol = collection(db, path);
      const snapshot = await getDocs(examsCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // FETCH NEWS
  async fetchNews(): Promise<News[]> {
    const path = 'news';
    try {
      const newsCol = collection(db, path);
      const snapshot = await getDocs(newsCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // FETCH ASSIGNMENTS
  async fetchAssignments(): Promise<Assignment[]> {
    const path = 'assignments';
    try {
      const assignmentsCol = collection(db, path);
      const snapshot = await getDocs(assignmentsCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // FETCH SUBMISSIONS
  async fetchSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    const path = 'submissions';
    try {
      const submissionsCol = collection(db, path);
      const q = query(submissionsCol, where('assignmentId', '==', assignmentId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssignmentSubmission));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // FETCH USER SUBMISSION
  async fetchUserSubmission(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    const path = 'submissions';
    try {
      const submissionsCol = collection(db, path);
      const q = query(submissionsCol, where('assignmentId', '==', assignmentId), where('studentId', '==', studentId));
      const snapshot = await getDocs(q);
      return snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AssignmentSubmission);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // FETCH ALL SUBMISSIONS (Admin)
  async fetchAllSubmissions(): Promise<AssignmentSubmission[]> {
    const path = 'submissions';
    try {
      const submissionsCol = collection(db, path);
      const snapshot = await getDocs(submissionsCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssignmentSubmission));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // SYNC SUBMISSION
  async syncSubmission(submission: AssignmentSubmission) {
    if (!auth.currentUser) return;
    const path = 'submissions';
    try {
      const submissionRef = doc(db, path, submission.id);
      await setDoc(submissionRef, submission, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // DELETE SUBMISSION
  async deleteSubmission(id: string) {
    if (!auth.currentUser) return;
    const path = 'submissions';
    try {
      const submissionRef = doc(db, path, id);
      await deleteDoc(submissionRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // FETCH RESULTS
  async fetchResults(studentId: string): Promise<ExamResult[]> {
    const path = 'exam_results';
    try {
      const resultsCol = collection(db, path);
      const q = query(resultsCol, where('studentId', '==', studentId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data() } as ExamResult));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // FETCH ALL RESULTS (Admin)
  async fetchAllResults(): Promise<ExamResult[]> {
    const path = 'exam_results';
    try {
      const resultsCol = collection(db, path);
      const snapshot = await getDocs(resultsCol);
      return snapshot.docs.map(doc => ({ ...doc.data() } as ExamResult));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // SYNC ASSIGNMENT DATA
  async syncAssignment(assignment: Assignment) {
    if (!auth.currentUser) return;
    const path = 'assignments';
    try {
      const assignmentRef = doc(db, path, assignment.id);
      await setDoc(assignmentRef, assignment, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // DELETE ASSIGNMENT
  async deleteAssignment(id: string) {
    if (!auth.currentUser) return;
    const path = 'assignments';
    try {
      const assignmentRef = doc(db, path, id);
      await deleteDoc(assignmentRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // RESTORED FUNCTIONS
  async fetchTopStudents(): Promise<User[]> {
    const path = 'users';
    try {
      const usersCol = collection(db, path);
      const snapshot = await getDocs(usersCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)).sort((a, b) => b.points - a.points).slice(0, 5);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async fetchUserProfile(id: string): Promise<User | null> {
    const path = 'users';
    try {
      const userRef = doc(db, path, id);
      const snapshot = await getDoc(userRef);
      return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as User) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async syncUser(user: User) {
    if (!auth.currentUser) return;
    const path = 'users';
    try {
      const userRef = doc(db, path, user.id);
      await setDoc(userRef, user, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteUser(id: string) {
    if (!auth.currentUser) return;
    const path = 'users';
    try {
      const userRef = doc(db, path, id);
      await deleteDoc(userRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async syncCourse(course: Course) {
    if (!auth.currentUser) return;
    const path = 'courses';
    try {
      const courseRef = doc(db, path, course.id);
      await setDoc(courseRef, course, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteCourse(id: string) {
    if (!auth.currentUser) return;
    const path = 'courses';
    try {
      const courseRef = doc(db, path, id);
      await deleteDoc(courseRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async syncNews(news: News) {
    if (!auth.currentUser) return;
    const path = 'news';
    try {
      const newsRef = doc(db, path, news.id);
      await setDoc(newsRef, news, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteNews(id: string) {
    if (!auth.currentUser) return;
    const path = 'news';
    try {
      const newsRef = doc(db, path, id);
      await deleteDoc(newsRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async syncExam(exam: Exam) {
    if (!auth.currentUser) return;
    const path = 'exams';
    try {
      const examRef = doc(db, path, exam.id);
      await setDoc(examRef, exam, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteExam(id: string) {
    if (!auth.currentUser) return;
    const path = 'exams';
    try {
      const examRef = doc(db, path, id);
      await deleteDoc(examRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async saveExamResult(result: ExamResult) {
    if (!auth.currentUser) return;
    const path = 'exam_results';
    try {
      const resultRef = doc(db, path, `${result.examId}_${result.studentId}`);
      await setDoc(resultRef, result, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async submitFeedback(feedback: any) {
    if (!auth.currentUser) return;
    const path = 'feedback';
    try {
      const feedbackRef = doc(db, path, `${Date.now()}`);
      await setDoc(feedbackRef, feedback);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Study Hall (Chat & Notes)
  subscribeToChat(hallId: string, callback: (messages: any[]) => void) {
    const path = `study_halls/${hallId}/messages`;
    const q = query(collection(db, path), orderBy('timestamp', 'asc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, path));
  },

  async sendChatMessage(hallId: string, message: any) {
    const path = `study_halls/${hallId}/messages`;
    try {
      await addDoc(collection(db, path), message);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  subscribeToNotes(hallId: string, callback: (notes: any[]) => void) {
    const path = `study_halls/${hallId}/notes`;
    const q = query(collection(db, path), orderBy('lastModifiedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, path));
  },

  async createNote(hallId: string, note: any) {
    const path = `study_halls/${hallId}/notes`;
    try {
      await addDoc(collection(db, path), note);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateNote(hallId: string, noteId: string, updates: any) {
    const path = `study_halls/${hallId}/notes`;
    try {
      await updateDoc(doc(db, path, noteId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteNote(hallId: string, noteId: string) {
    const path = `study_halls/${hallId}/notes`;
    try {
      await deleteDoc(doc(db, path, noteId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getUsers(): Promise<User[]> {
    const path = 'users';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      callback(notifications);
    }, (error) => {
      console.error("Notification subscription error:", error);
    });
  },

  async addNews(news: News) {
    const path = 'news';
    try {
      await setDoc(doc(db, path, news.id), news);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async addExam(exam: Exam) {
    const path = 'exams';
    try {
      await setDoc(doc(db, path, exam.id), exam);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateExam(exam: Exam) {
    const path = 'exams';
    try {
      await updateDoc(doc(db, path, exam.id), { ...exam });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
};
