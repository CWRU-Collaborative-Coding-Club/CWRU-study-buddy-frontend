"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCookie } from "@/utils/cookies";
import {
  clearLegacyPersistedCourse,
  clearPersistedCourseForToken,
  getPersistedCourseForToken,
  persistCourseForToken,
} from "@/utils/courseSelection";

export interface Course {
  id: string;
  name: string;
  professor: string;
  department: string;
  modules: number;
}

interface CourseContextProps {
  selectedCourse: Course | null;
  selectCourse: (course: Course) => void;
  clearCourse: () => void;
  restoreCourseForCurrentUser: () => Course | null;
}

const CourseContext = createContext<CourseContextProps>({
  selectedCourse: null,
  selectCourse: () => {},
  clearCourse: () => {},
  restoreCourseForCurrentUser: () => null,
});

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const restoreCourseForCurrentUser = useCallback((): Course | null => {
    const token = getCookie("token");
    const storedCourse = getPersistedCourseForToken<Course>(token);
    setSelectedCourse(storedCourse);
    return storedCourse;
  }, []);

  // Cleanup global legacy key and restore user-scoped course on mount.
  useEffect(() => {
    clearLegacyPersistedCourse();
    restoreCourseForCurrentUser();
  }, [restoreCourseForCurrentUser]);

  const selectCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
    const token = getCookie("token");
    persistCourseForToken(token, course);
  }, []);

  const clearCourse = useCallback(() => {
    setSelectedCourse(null);
    const token = getCookie("token");
    clearPersistedCourseForToken(token);
  }, []);

  return (
    <CourseContext.Provider
      value={{ selectedCourse, selectCourse, clearCourse, restoreCourseForCurrentUser }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);
