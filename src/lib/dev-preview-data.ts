import 'server-only';

import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { Course, Enrollment, Lesson, Profile } from '@/types/database';

type DevPreviewStore = {
  courses: Course[];
  lessons: Lesson[];
  profiles: Profile[];
  enrollments: Enrollment[];
  accountStatus: Record<string, boolean>;
};

const DEV_PREVIEW_FILE = path.join(process.cwd(), '.dev-preview-data.json');

const DEV_STUDENT_PROFILE: Profile = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'student-preview@mosbah.local',
  full_name: 'طالب المعاينة',
  role: 'student',
  created_at: '2026-01-01T00:00:00.000Z'
};

function baseStore(): DevPreviewStore {
  return {
    courses: [],
    lessons: [],
    profiles: [DEV_STUDENT_PROFILE],
    enrollments: [],
    accountStatus: {
      [DEV_STUDENT_PROFILE.id]: true
    }
  };
}

async function readRawStore(): Promise<DevPreviewStore> {
  try {
    const content = await fs.readFile(DEV_PREVIEW_FILE, 'utf8');
    const parsed = JSON.parse(content) as Partial<DevPreviewStore>;

    return {
      courses: parsed.courses ?? [],
      lessons: parsed.lessons ?? [],
      profiles: parsed.profiles?.length ? parsed.profiles : [DEV_STUDENT_PROFILE],
      enrollments: parsed.enrollments ?? [],
      accountStatus: parsed.accountStatus ?? {
        [DEV_STUDENT_PROFILE.id]: true
      }
    };
  } catch {
    return baseStore();
  }
}

async function writeRawStore(store: DevPreviewStore): Promise<void> {
  await fs.writeFile(DEV_PREVIEW_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export async function getDevPreviewStore(): Promise<DevPreviewStore> {
  return readRawStore();
}

export async function createDevCourse(input: {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  priceDzd: number;
  paymentNotes: string;
  published: boolean;
}): Promise<{ course: Course }> {
  const store = await readRawStore();
  const now = new Date().toISOString();
  const course: Course = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    thumbnail_url: input.thumbnailUrl,
    price_dzd: input.priceDzd,
    payment_notes: input.paymentNotes,
    published: input.published,
    created_at: now
  };

  store.courses.unshift(course);

  const alreadyEnrolled = store.enrollments.some(
    (enrollment) => enrollment.user_id === DEV_STUDENT_PROFILE.id && enrollment.course_id === course.id
  );

  if (!alreadyEnrolled) {
    store.enrollments.unshift({
      id: crypto.randomUUID(),
      user_id: DEV_STUDENT_PROFILE.id,
      course_id: course.id,
      status: 'active',
      enrolled_at: now
    });
  }

  await writeRawStore(store);

  return { course };
}

export async function createDevStudent(input: {
  fullName: string;
  email: string;
  courseIds: string[];
}): Promise<Profile> {
  const store = await readRawStore();
  const existing = store.profiles.find((profile) => profile.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    throw new Error('هذا البريد الإلكتروني مسجل مسبقًا.');
  }

  const now = new Date().toISOString();
  const student: Profile = {
    id: crypto.randomUUID(),
    email: input.email,
    full_name: input.fullName,
    role: 'student',
    created_at: now
  };

  store.profiles.unshift(student);
  store.accountStatus[student.id] = true;

  for (const courseId of input.courseIds) {
    if (!store.courses.some((course) => course.id === courseId)) {
      continue;
    }

    const existingEnrollment = store.enrollments.find((enrollment) => enrollment.user_id === student.id && enrollment.course_id === courseId);
    if (!existingEnrollment) {
      store.enrollments.unshift({
        id: crypto.randomUUID(),
        user_id: student.id,
        course_id: courseId,
        status: 'active',
        enrolled_at: now
      });
    }
  }

  await writeRawStore(store);
  return student;
}

export async function setDevEnrollmentStatusById(enrollmentId: string, status: Enrollment['status']): Promise<void> {
  const store = await readRawStore();
  const enrollment = store.enrollments.find((row) => row.id === enrollmentId);
  if (!enrollment) {
    return;
  }

  enrollment.status = status;
  await writeRawStore(store);
}

export async function setDevStudentCourseStatus(input: {
  studentId: string;
  courseId: string;
  status: Enrollment['status'];
}): Promise<void> {
  const store = await readRawStore();
  const existing = store.enrollments.find((row) => row.user_id === input.studentId && row.course_id === input.courseId);

  if (existing) {
    existing.status = input.status;
  } else {
    store.enrollments.unshift({
      id: crypto.randomUUID(),
      user_id: input.studentId,
      course_id: input.courseId,
      status: input.status,
      enrolled_at: new Date().toISOString()
    });
  }

  await writeRawStore(store);
}

export async function setDevStudentAccountStatus(studentId: string, isActive: boolean): Promise<void> {
  const store = await readRawStore();
  store.accountStatus[studentId] = isActive;

  for (const enrollment of store.enrollments) {
    if (enrollment.user_id === studentId) {
      enrollment.status = isActive ? 'active' : 'suspended';
    }
  }

  await writeRawStore(store);
}

export async function isDevStudentAccountActive(studentId: string): Promise<boolean> {
  const store = await readRawStore();
  return store.accountStatus[studentId] ?? true;
}

export async function removeDevEnrollmentById(enrollmentId: string): Promise<void> {
  const store = await readRawStore();
  store.enrollments = store.enrollments.filter((row) => row.id !== enrollmentId);
  await writeRawStore(store);
}

export async function createDevLesson(input: {
  courseId: string;
  title: string;
  videoUrl: string | null;
  pdfUrl: string | null;
  orderIndex: number;
}): Promise<Lesson> {
  const store = await readRawStore();
  const lesson: Lesson = {
    id: crypto.randomUUID(),
    course_id: input.courseId,
    title: input.title,
    video_url: input.videoUrl,
    pdf_url: input.pdfUrl,
    order_index: input.orderIndex,
    created_at: new Date().toISOString()
  };

  store.lessons.push(lesson);
  await writeRawStore(store);

  return lesson;
}
