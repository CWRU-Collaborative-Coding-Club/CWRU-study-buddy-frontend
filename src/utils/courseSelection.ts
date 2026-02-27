import { jwtDecode } from "jwt-decode";

const COURSE_STORAGE_PREFIX = "selectedCourseByUser";
const LEGACY_COURSE_STORAGE_KEY = "selectedCourse";

interface CourseTokenPayload {
  user_id?: string;
  id?: string;
  email?: string;
}

function getUserIdentifierFromToken(token?: string | null): string | null {
  if (!token) return null;

  try {
    const decoded = jwtDecode<CourseTokenPayload>(token);
    const userIdentifier = decoded.user_id || decoded.id || decoded.email;
    return typeof userIdentifier === "string" && userIdentifier.trim().length > 0
      ? userIdentifier
      : null;
  } catch {
    return null;
  }
}

function getCourseStorageKeyForToken(token?: string | null): string | null {
  const userIdentifier = getUserIdentifierFromToken(token);
  return userIdentifier ? `${COURSE_STORAGE_PREFIX}:${userIdentifier}` : null;
}

export function getPersistedCourseForToken<T>(token?: string | null): T | null {
  if (typeof window === "undefined") return null;

  const storageKey = getCourseStorageKeyForToken(token);
  if (!storageKey) return null;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function hasPersistedCourseForToken(token?: string | null): boolean {
  const storedCourse = getPersistedCourseForToken<{ id?: unknown }>(token);
  return Boolean(
    storedCourse &&
    typeof storedCourse.id === "string" &&
    storedCourse.id.trim().length > 0
  );
}

export function persistCourseForToken(token: string | null, course: unknown): void {
  if (typeof window === "undefined") return;

  const storageKey = getCourseStorageKeyForToken(token);
  if (!storageKey) return;

  localStorage.setItem(storageKey, JSON.stringify(course));
}

export function clearPersistedCourseForToken(token?: string | null): void {
  if (typeof window === "undefined") return;

  const storageKey = getCourseStorageKeyForToken(token);
  if (!storageKey) return;

  localStorage.removeItem(storageKey);
}

export function clearLegacyPersistedCourse(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_COURSE_STORAGE_KEY);
}
