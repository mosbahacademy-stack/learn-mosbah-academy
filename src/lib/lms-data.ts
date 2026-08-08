import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

import type { Course, Enrollment, Lesson, LessonProgress, Profile, Question, Quiz, QuizAttempt } from '@/types/database';

type CourseEnrollmentRow = Enrollment & {
  courses: Course | null;
};

type StudentCourseCard = {
  id: string;
  title: string;
  description: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  nextLessonTitle: string;
};

type StudentDashboardData = {
  studentName: string;
  courses: StudentCourseCard[];
  completedLessons: number;
  quizAttempts: number;
  activeEnrollments: number;
};

type AdminOverviewData = {
  totalStudents: number;
  totalCourses: number;
  activeEnrollments: number;
  recentCourses: Array<Course & { lessonCount: number }>;
  recentStudents: Profile[];
};

type AdminCourseListItem = Course & {
  lessonCount: number;
  firstLessonTitle: string | null;
};

type AdminCourseLessonItem = Lesson & {
  quiz: Quiz | null;
  questions: Question[];
};

type AdminCourseDetailData = {
  course: Course;
  lessons: AdminCourseLessonItem[];
  selectedLesson: AdminCourseLessonItem | null;
  enrolledStudents: Array<Profile & { enrollment: Enrollment }>;
  availableStudents: Profile[];
};

type StudentListItem = Profile & {
  enrollments: Array<Enrollment & { courseTitle: string }>;
};

type CoursePlayerData = {
  course: Course;
  lessons: Array<Lesson & { completed: boolean; quiz: Quiz | null }>;
  selectedLesson: (Lesson & { completed: boolean; quiz: Quiz | null }) | null;
  selectedQuizQuestions: Question[];
  latestQuizAttempt: QuizAttempt | null;
  courseProgress: number;
};

export async function getStudentDashboardData(supabase: SupabaseClient, userId: string, profile: Profile): Promise<StudentDashboardData> {
  const { data: enrollmentsData } = await supabase
    .from('enrollments')
    .select('id, user_id, course_id, status, enrolled_at, courses(id, title, description, thumbnail_url, published, created_at)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });

  const enrollments = ((enrollmentsData ?? []) as unknown as CourseEnrollmentRow[]).filter((item) => item.courses);
  const courseIds = enrollments.map((item) => item.course_id);

  const lessonsPromise = courseIds.length
    ? supabase
        .from('lessons')
        .select('id, course_id, title, video_url, pdf_url, order_index, created_at')
        .in('course_id', courseIds)
        .order('order_index', { ascending: true })
    : Promise.resolve({ data: [] as Lesson[] });

  const [lessonsResult, progressResult, attemptsResult] = await Promise.all([
    lessonsPromise,
    supabase.from('lesson_progress').select('id, user_id, lesson_id, completed, updated_at').eq('user_id', userId),
    supabase.from('quiz_attempts').select('id, user_id, quiz_id, score, passed, attempted_at').eq('user_id', userId)
  ]);

  const lessons = (lessonsResult.data ?? []) as Lesson[];
  const progressRows = (progressResult.data ?? []) as LessonProgress[];
  const attempts = (attemptsResult.data ?? []) as QuizAttempt[];
  const progressByLesson = new Map(progressRows.map((row) => [row.lesson_id, row.completed]));

  const courses = enrollments.map((enrollment) => {
    const course = enrollment.courses as Course;
    const courseLessons = lessons.filter((lesson) => lesson.course_id === enrollment.course_id);
    const completedLessons = courseLessons.filter((lesson) => progressByLesson.get(lesson.id)).length;
    const totalLessons = courseLessons.length;
    const progress = totalLessons === 0 ? 0 : (completedLessons / totalLessons) * 100;
    const nextLesson = courseLessons.find((lesson) => !progressByLesson.get(lesson.id)) ?? courseLessons[0];

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      progress,
      completedLessons,
      totalLessons,
      nextLessonTitle: nextLesson?.title ?? 'لا توجد دروس بعد'
    };
  });

  return {
    studentName: profile.full_name || profile.email,
    courses,
    completedLessons: progressRows.filter((row) => row.completed).length,
    quizAttempts: attempts.length,
    activeEnrollments: enrollments.length
  };
}

export async function getAdminOverviewData(supabase: SupabaseClient): Promise<AdminOverviewData> {
  const [studentCountResult, courseCountResult, enrollmentCountResult, recentCoursesResult, recentStudentsResult, lessonsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('courses').select('id, title, description, thumbnail_url, published, created_at').order('created_at', { ascending: false }).limit(4),
    supabase.from('profiles').select('id, email, full_name, role, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(5),
    supabase.from('lessons').select('id, course_id, title, video_url, pdf_url, order_index, created_at')
  ]);

  const lessons = (lessonsResult.data ?? []) as Lesson[];
  const recentCourses = ((recentCoursesResult.data ?? []) as Course[]).map((course) => {
    const courseLessons = lessons.filter((lesson) => lesson.course_id === course.id);
    return {
      ...course,
      lessonCount: courseLessons.length
    };
  });

  return {
    totalStudents: studentCountResult.count ?? 0,
    totalCourses: courseCountResult.count ?? 0,
    activeEnrollments: enrollmentCountResult.count ?? 0,
    recentCourses,
    recentStudents: (recentStudentsResult.data ?? []) as Profile[]
  };
}

export async function getAdminCoursesData(supabase: SupabaseClient): Promise<AdminCourseListItem[]> {
  const [coursesResult, lessonsResult] = await Promise.all([
    supabase.from('courses').select('id, title, description, thumbnail_url, published, created_at').order('created_at', { ascending: false }),
    supabase.from('lessons').select('id, course_id, title, video_url, pdf_url, order_index, created_at').order('order_index', { ascending: true })
  ]);

  const lessons = (lessonsResult.data ?? []) as Lesson[];

  return ((coursesResult.data ?? []) as Course[]).map((course) => {
    const courseLessons = lessons.filter((lesson) => lesson.course_id === course.id);
    return {
      ...course,
      lessonCount: courseLessons.length,
      firstLessonTitle: courseLessons[0]?.title ?? null
    };
  });
}

export async function getAdminStudentsData(_supabase: SupabaseClient): Promise<{ students: StudentListItem[]; courses: Course[] }> {
  // Use admin client to bypass RLS and see all profiles/enrollments
  const { createSupabaseAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = createSupabaseAdminClient();

  const [studentsResult, coursesResult, enrollmentsResult] = await Promise.all([
    adminClient.from('profiles').select('id, email, full_name, role, created_at').eq('role', 'student').order('created_at', { ascending: false }),
    adminClient.from('courses').select('id, title, description, thumbnail_url, published, created_at').order('created_at', { ascending: false }),
    adminClient.from('enrollments').select('id, user_id, course_id, status, enrolled_at').order('enrolled_at', { ascending: false })
  ]);

  const courses = (coursesResult.data ?? []) as Course[];
  const courseById = new Map(courses.map((course) => [course.id, course.title]));
  const enrollments = (enrollmentsResult.data ?? []) as Enrollment[];

  const students = ((studentsResult.data ?? []) as Profile[]).map((student) => ({
    ...student,
    enrollments: enrollments
      .filter((enrollment) => enrollment.user_id === student.id)
      .map((enrollment) => ({
        ...enrollment,
        courseTitle: courseById.get(enrollment.course_id) ?? 'دورة غير معروفة'
      }))
  }));

  return { students, courses };
}

export type EnrollmentRequestItem = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentReference: string;
  receiptSignedUrl: string | null;
  createdAt: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseId: string;
  userId: string;
};

export async function getAdminEnrollmentRequests(): Promise<EnrollmentRequestItem[]> {
  const { createSupabaseAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = createSupabaseAdminClient();

  const { data } = await adminClient
    .from('enrollment_requests')
    .select('id, status, payment_method, payment_reference, created_at, user_id, course_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((r: { user_id: string }) => r.user_id))];
  const courseIds = [...new Set(data.map((r: { course_id: string }) => r.course_id))];

  const [profilesResult, coursesResult] = await Promise.all([
    adminClient.from('profiles').select('id, full_name, email').in('id', userIds),
    adminClient.from('courses').select('id, title').in('id', courseIds)
  ]);

  const profileMap = new Map((profilesResult.data ?? []).map((p: { id: string; full_name: string; email: string }) => [p.id, p]));
  const courseMap = new Map((coursesResult.data ?? []).map((c: { id: string; title: string }) => [c.id, c]));

  const items: EnrollmentRequestItem[] = await Promise.all(
    data.map(async (row: { id: string; status: string; payment_method: string; payment_reference: string; created_at: string; user_id: string; course_id: string }) => {
      let receiptSignedUrl: string | null = null;
      if (row.payment_reference) {
        const { data: signed } = await adminClient.storage
          .from('payment-receipts')
          .createSignedUrl(row.payment_reference, 3600);
        receiptSignedUrl = signed?.signedUrl ?? null;
      }
      const profile = profileMap.get(row.user_id);
      const course = courseMap.get(row.course_id);
      return {
        id: row.id,
        status: row.status,
        paymentMethod: row.payment_method,
        paymentReference: row.payment_reference,
        receiptSignedUrl,
        createdAt: row.created_at,
        studentName: profile?.full_name || profile?.email || 'غير معروف',
        studentEmail: profile?.email || '',
        courseTitle: course?.title || 'دورة غير معروفة',
        courseId: row.course_id,
        userId: row.user_id
      };
    })
  );

  return items;
}

export async function getCoursePlayerData(supabase: SupabaseClient, userId: string, courseId: string, selectedLessonId?: string): Promise<CoursePlayerData> {
  const [courseResult, enrollmentResult, lessonsResult, progressResult, quizzesResult] = await Promise.all([
    supabase.from('courses').select('id, title, description, thumbnail_url, published, created_at').eq('id', courseId).maybeSingle(),
    supabase.from('enrollments').select('id').eq('course_id', courseId).eq('user_id', userId).eq('status', 'active').maybeSingle(),
    supabase.from('lessons').select('id, course_id, title, video_url, pdf_url, order_index, created_at').eq('course_id', courseId).order('order_index', { ascending: true }),
    supabase.from('lesson_progress').select('id, user_id, lesson_id, completed, updated_at').eq('user_id', userId),
    supabase.from('quizzes').select('id, lesson_id, title, pass_mark, created_at').order('created_at', { ascending: true })
  ]);

  const course = courseResult.data as Course | null;

  if (!course || !enrollmentResult.data) {
    notFound();
  }

  const progressByLesson = new Map(((progressResult.data ?? []) as LessonProgress[]).map((row) => [row.lesson_id, row.completed]));
  const quizByLesson = new Map(((quizzesResult.data ?? []) as Quiz[]).map((quiz) => [quiz.lesson_id, quiz]));
  const lessons = ((lessonsResult.data ?? []) as Lesson[]).map((lesson) => ({
    ...lesson,
    completed: Boolean(progressByLesson.get(lesson.id)),
    quiz: quizByLesson.get(lesson.id) ?? null
  }));
  const fallbackLesson = lessons.find((lesson) => !lesson.completed) ?? lessons[0] ?? null;
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? fallbackLesson;

  const selectedQuiz = selectedLesson?.quiz ?? null;
  const [questionsResult, attemptsResult] = await Promise.all([
    selectedQuiz
      ? supabase
          .from('questions')
          .select('id, quiz_id, question_text, options, correct_option_index, created_at')
          .eq('quiz_id', selectedQuiz.id)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as Question[] }),
    selectedQuiz
      ? supabase
          .from('quiz_attempts')
          .select('id, user_id, quiz_id, score, passed, attempted_at')
          .eq('user_id', userId)
          .eq('quiz_id', selectedQuiz.id)
          .order('attempted_at', { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [] as QuizAttempt[] })
  ]);

  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((lesson) => lesson.completed).length;

  return {
    course,
    lessons,
    selectedLesson,
    selectedQuizQuestions: (questionsResult.data ?? []) as Question[],
    latestQuizAttempt: ((attemptsResult.data ?? []) as QuizAttempt[])[0] ?? null,
    courseProgress: totalLessons === 0 ? 0 : (completedLessons / totalLessons) * 100
  };
}

export async function getAdminCourseDetailData(supabase: SupabaseClient, courseId: string, selectedLessonId?: string): Promise<AdminCourseDetailData> {
  const [courseResult, lessonsResult, quizzesResult, questionsResult, studentsResult, enrollmentsResult] = await Promise.all([
    supabase.from('courses').select('id, title, description, thumbnail_url, published, created_at').eq('id', courseId).maybeSingle(),
    supabase.from('lessons').select('id, course_id, title, video_url, pdf_url, order_index, created_at').eq('course_id', courseId).order('order_index', { ascending: true }),
    supabase.from('quizzes').select('id, lesson_id, title, pass_mark, created_at').order('created_at', { ascending: true }),
    supabase.from('questions').select('id, quiz_id, question_text, options, correct_option_index, created_at').order('created_at', { ascending: true }),
    supabase.from('profiles').select('id, email, full_name, role, created_at').eq('role', 'student').order('created_at', { ascending: false }),
    supabase.from('enrollments').select('id, user_id, course_id, status, enrolled_at').eq('course_id', courseId).order('enrolled_at', { ascending: false })
  ]);

  const course = courseResult.data as Course | null;

  if (!course) {
    notFound();
  }

  const quizzes = (quizzesResult.data ?? []) as Quiz[];
  const questions = (questionsResult.data ?? []) as Question[];
  const quizByLesson = new Map(quizzes.map((quiz) => [quiz.lesson_id, quiz]));
  const questionsByQuiz = new Map<string, Question[]>();

  for (const question of questions) {
    const bucket = questionsByQuiz.get(question.quiz_id) ?? [];
    bucket.push(question);
    questionsByQuiz.set(question.quiz_id, bucket);
  }

  const lessons = ((lessonsResult.data ?? []) as Lesson[]).map((lesson) => {
    const quiz = quizByLesson.get(lesson.id) ?? null;
    return {
      ...lesson,
      quiz,
      questions: quiz ? questionsByQuiz.get(quiz.id) ?? [] : []
    };
  });

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0] ?? null;
  const students = (studentsResult.data ?? []) as Profile[];
  const enrollments = (enrollmentsResult.data ?? []) as Enrollment[];
  const enrollmentByUserId = new Map(enrollments.map((enrollment) => [enrollment.user_id, enrollment]));
  const enrolledStudents = students
    .filter((student) => enrollmentByUserId.has(student.id))
    .map((student) => ({
      ...student,
      enrollment: enrollmentByUserId.get(student.id) as Enrollment
    }));
  const availableStudents = students.filter((student) => !enrollmentByUserId.has(student.id));

  return {
    course,
    lessons,
    selectedLesson,
    enrolledStudents,
    availableStudents
  };
}