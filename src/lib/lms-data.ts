import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

import { getDevPreviewStore } from '@/lib/dev-preview-data';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Course, Enrollment, EnrollmentRequest, Lesson, LessonProgress, Profile, Question, Quiz, QuizAttempt } from '@/types/database';

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
  accountActive?: boolean;
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

type PublicCourseListItem = Course & {
  requestStatus: 'pending' | 'approved' | 'rejected' | 'none';
};

type PublicCourseCheckoutData = {
  course: Course;
  request: EnrollmentRequest | null;
};

type AdminEnrollmentRequestItem = EnrollmentRequest & {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  receiptImageUrl: string | null;
};

const RECEIPTS_BUCKET = 'payment-receipts';

function isDevBypassEnabled() {
  return process.env.DEV_ADMIN_BYPASS === 'true';
}

export async function getStudentDashboardData(supabase: SupabaseClient, userId: string, profile: Profile): Promise<StudentDashboardData> {
  if (isDevBypassEnabled()) {
    const store = await getDevPreviewStore();
    const activeEnrollments = store.enrollments.filter((enrollment) => enrollment.user_id === userId && enrollment.status === 'active');

    const courses = activeEnrollments
      .map((enrollment) => store.courses.find((course) => course.id === enrollment.course_id))
      .filter((course): course is Course => Boolean(course))
      .map((course) => {
        const courseLessons = store.lessons
          .filter((lesson) => lesson.course_id === course.id)
          .sort((a, b) => a.order_index - b.order_index);

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          progress: 0,
          completedLessons: 0,
          totalLessons: courseLessons.length,
          nextLessonTitle: courseLessons[0]?.title ?? 'لا توجد دروس بعد'
        };
      });

    return {
      studentName: profile.full_name || profile.email,
      courses,
      completedLessons: 0,
      quizAttempts: 0,
      activeEnrollments: activeEnrollments.length
    };
  }

  const { data: enrollmentsData } = await supabase
    .from('enrollments')
    .select('id, user_id, course_id, status, enrolled_at, courses(id, title, description, thumbnail_url, price_dzd, payment_notes, published, created_at)')
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
  if (isDevBypassEnabled()) {
    const store = await getDevPreviewStore();
    const recentCourses = [...store.courses]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 4)
      .map((course) => {
        const courseLessons = store.lessons.filter((lesson) => lesson.course_id === course.id);
        return {
          ...course,
          lessonCount: courseLessons.length
        };
      });

    const recentStudents = store.profiles
      .filter((profile) => profile.role === 'student')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5);

    return {
      totalStudents: store.profiles.filter((profile) => profile.role === 'student').length,
      totalCourses: store.courses.length,
      activeEnrollments: store.enrollments.filter((enrollment) => enrollment.status === 'active').length,
      recentCourses,
      recentStudents
    };
  }

  const [studentCountResult, courseCountResult, enrollmentCountResult, recentCoursesResult, recentStudentsResult, lessonsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('courses').select('id, title, description, thumbnail_url, price_dzd, payment_notes, published, created_at').order('created_at', { ascending: false }).limit(4),
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
  if (isDevBypassEnabled()) {
    const store = await getDevPreviewStore();
    return store.courses.map((course) => {
      const courseLessons = store.lessons
        .filter((lesson) => lesson.course_id === course.id)
        .sort((a, b) => a.order_index - b.order_index);

      return {
        ...course,
        lessonCount: courseLessons.length,
        firstLessonTitle: courseLessons[0]?.title ?? null
      };
    });
  }

  const [coursesResult, lessonsResult] = await Promise.all([
    supabase.from('courses').select('id, title, description, thumbnail_url, price_dzd, payment_notes, published, created_at').order('created_at', { ascending: false }),
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

export async function getAdminStudentsData(supabase: SupabaseClient): Promise<{ students: StudentListItem[]; courses: Course[] }> {
  if (isDevBypassEnabled()) {
    const store = await getDevPreviewStore();
    const courses = [...store.courses];
    const courseById = new Map(courses.map((course) => [course.id, course.title]));

    const students = store.profiles
      .filter((profile) => profile.role === 'student')
      .map((student) => ({
        ...student,
        accountActive: store.accountStatus?.[student.id] ?? true,
        enrollments: store.enrollments
          .filter((enrollment) => enrollment.user_id === student.id)
          .map((enrollment) => ({
            ...enrollment,
            courseTitle: courseById.get(enrollment.course_id) ?? 'دورة غير معروفة'
          }))
      }));

    return { students, courses };
  }

  const [studentsResult, coursesResult, enrollmentsResult] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, role, created_at').eq('role', 'student').order('created_at', { ascending: false }),
    supabase.from('courses').select('id, title, description, thumbnail_url, price_dzd, payment_notes, published, created_at').order('created_at', { ascending: false }),
    supabase.from('enrollments').select('id, user_id, course_id, status, enrolled_at').order('enrolled_at', { ascending: false })
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

export async function getCoursePlayerData(supabase: SupabaseClient, userId: string, courseId: string, selectedLessonId?: string): Promise<CoursePlayerData> {
  if (isDevBypassEnabled()) {
    const store = await getDevPreviewStore();
    const course = store.courses.find((item) => item.id === courseId) ?? null;
    const hasEnrollment = store.enrollments.some(
      (enrollment) => enrollment.user_id === userId && enrollment.course_id === courseId && enrollment.status === 'active'
    );

    if (!course || !hasEnrollment) {
      notFound();
    }

    const lessons = store.lessons
      .filter((lesson) => lesson.course_id === courseId)
      .sort((a, b) => a.order_index - b.order_index)
      .map((lesson) => ({
        ...lesson,
        completed: false,
        quiz: null
      }));

    const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0] ?? null;

    return {
      course,
      lessons,
      selectedLesson,
      selectedQuizQuestions: [],
      latestQuizAttempt: null,
      courseProgress: 0
    };
  }

  const [courseResult, enrollmentResult, lessonsResult, progressResult, quizzesResult] = await Promise.all([
    supabase.from('courses').select('id, title, description, thumbnail_url, price_dzd, payment_notes, published, created_at').eq('id', courseId).maybeSingle(),
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
  if (isDevBypassEnabled()) {
    const store = await getDevPreviewStore();
    const course = store.courses.find((item) => item.id === courseId) ?? null;

    if (!course) {
      notFound();
    }

    const lessons = store.lessons
      .filter((lesson) => lesson.course_id === courseId)
      .sort((a, b) => a.order_index - b.order_index)
      .map((lesson) => ({
        ...lesson,
        quiz: null,
        questions: []
      }));

    const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0] ?? null;
    const students = store.profiles.filter((profile) => profile.role === 'student');
    const enrollments = store.enrollments.filter((enrollment) => enrollment.course_id === courseId);
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

  const [courseResult, lessonsResult, quizzesResult, questionsResult, studentsResult, enrollmentsResult] = await Promise.all([
    supabase.from('courses').select('id, title, description, thumbnail_url, price_dzd, payment_notes, published, created_at').eq('id', courseId).maybeSingle(),
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

export async function getPublicCoursesData(supabase: SupabaseClient, userId: string): Promise<{ studentName: string; courses: PublicCourseListItem[] }> {
  const [profileResult, coursesResult, requestsResult] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, role, created_at').eq('id', userId).maybeSingle(),
    supabase.from('courses').select('id, title, description, thumbnail_url, price_dzd, payment_notes, published, created_at').eq('published', true).order('created_at', { ascending: false }),
    supabase.from('enrollment_requests').select('id, user_id, course_id, payment_method, payment_reference, proof_note, status, admin_note, reviewed_by, reviewed_at, created_at').eq('user_id', userId).order('created_at', { ascending: false })
  ]);

  const profile = profileResult.data as Profile | null;
  const requests = (requestsResult.data ?? []) as EnrollmentRequest[];
  const latestStatusByCourse = new Map<string, EnrollmentRequest['status']>();

  for (const request of requests) {
    if (!latestStatusByCourse.has(request.course_id)) {
      latestStatusByCourse.set(request.course_id, request.status);
    }
  }

  const courses = ((coursesResult.data ?? []) as Course[]).map((course) => ({
    ...course,
    requestStatus: (latestStatusByCourse.get(course.id) ?? 'none') as PublicCourseListItem['requestStatus']
  }));

  return {
    studentName: profile?.full_name || profile?.email || 'طالب جديد',
    courses
  };
}

export async function getPublicCourseCheckoutData(supabase: SupabaseClient, userId: string, courseId: string): Promise<PublicCourseCheckoutData> {
  const [courseResult, requestResult] = await Promise.all([
    supabase.from('courses').select('id, title, description, thumbnail_url, price_dzd, payment_notes, published, created_at').eq('id', courseId).eq('published', true).maybeSingle(),
    supabase
      .from('enrollment_requests')
      .select('id, user_id, course_id, payment_method, payment_reference, proof_note, status, admin_note, reviewed_by, reviewed_at, created_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(1)
  ]);

  const course = courseResult.data as Course | null;
  if (!course) {
    notFound();
  }

  return {
    course,
    request: ((requestResult.data ?? []) as EnrollmentRequest[])[0] ?? null
  };
}

export async function getAdminEnrollmentRequestsData(supabase: SupabaseClient): Promise<AdminEnrollmentRequestItem[]> {
  const { data } = await supabase
    .from('enrollment_requests')
    .select('id, user_id, course_id, payment_method, payment_reference, proof_note, status, admin_note, reviewed_by, reviewed_at, created_at')
    .order('created_at', { ascending: false });

  const requests = (data ?? []) as EnrollmentRequest[];
  if (requests.length === 0) {
    return [];
  }

  const userIds = [...new Set(requests.map((item) => item.user_id))];
  const courseIds = [...new Set(requests.map((item) => item.course_id))];

  const [profilesResult, coursesResult] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, role, created_at').in('id', userIds),
    supabase.from('courses').select('id, title, description, thumbnail_url, price_dzd, payment_notes, published, created_at').in('id', courseIds)
  ]);

  const profileById = new Map(((profilesResult.data ?? []) as Profile[]).map((profile) => [profile.id, profile]));
  const courseById = new Map(((coursesResult.data ?? []) as Course[]).map((course) => [course.id, course]));
  let adminClient: ReturnType<typeof createSupabaseAdminClient> | null = null;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    adminClient = null;
  }

  const receiptUrlMap = new Map<string, string | null>();
  await Promise.all(
    requests.map(async (request) => {
      if (request.payment_reference.startsWith('http')) {
        receiptUrlMap.set(request.id, request.payment_reference);
        return;
      }

      if (!request.payment_reference.includes('/')) {
        receiptUrlMap.set(request.id, null);
        return;
      }

      if (!adminClient) {
        receiptUrlMap.set(request.id, null);
        return;
      }

      const signed = await adminClient.storage.from(RECEIPTS_BUCKET).createSignedUrl(request.payment_reference, 60 * 60);
      receiptUrlMap.set(request.id, signed.data?.signedUrl ?? null);
    })
  );

  return requests.map((request) => {
    const profile = profileById.get(request.user_id);
    const course = courseById.get(request.course_id);
    return {
      ...request,
      studentName: profile?.full_name || profile?.email || 'طالب',
      studentEmail: profile?.email || '-',
      courseTitle: course?.title || 'دورة غير متوفرة',
      receiptImageUrl: receiptUrlMap.get(request.id) ?? null
    };
  });
}