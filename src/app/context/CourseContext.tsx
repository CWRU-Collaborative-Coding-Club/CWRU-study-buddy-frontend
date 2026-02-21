"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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
}

const CourseContext = createContext<CourseContextProps>({
  selectedCourse: null,
  selectCourse: () => {},
  clearCourse: () => {},
});

const STORAGE_KEY = "selectedCourse";

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSelectedCourse(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const selectCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(course));
  }, []);

  const clearCourse = useCallback(() => {
    setSelectedCourse(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <CourseContext.Provider value={{ selectedCourse, selectCourse, clearCourse }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);
