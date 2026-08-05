export type AppRole = 'student' | 'admin';
export type EnrollmentStatus = 'active' | 'suspended';
export type EnrollmentRequestStatus = 'pending' | 'approved' | 'rejected';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  state?: string;
  city?: string;
  institution?: string;
  phone?: string;
  academic_level?: string;
  role: AppRole;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price_dzd?: number;
  payment_notes?: string;
  published: boolean;
  created_at: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  video_url: string | null;
  pdf_url: string | null;
  order_index: number;
  created_at: string;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
};

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  updated_at: string;
};

export type Quiz = {
  id: string;
  lesson_id: string;
  title: string;
  pass_mark: number;
  created_at: string;
};

export type Question = {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  created_at: string;
};

export type QuizAttempt = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  attempted_at: string;
};

export type EnrollmentRequest = {
  id: string;
  user_id: string;
  course_id: string;
  payment_method: 'baridi_mob' | 'bank_transfer';
  payment_reference: string;
  proof_note: string;
  status: EnrollmentRequestStatus;
  admin_note: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};