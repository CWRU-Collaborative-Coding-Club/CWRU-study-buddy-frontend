import type { Course } from "@/app/context/CourseContext";

// Active courses available for student selection.
export const STUDENT_COURSES: Course[] = [
  { id: "CS101", name: "Introduction to Computer Science", professor: "Dr. Alan Turing", department: "Computer Science", modules: 12 },
  { id: "CS201", name: "Data Structures & Algorithms", professor: "Dr. Ada Lovelace", department: "Computer Science", modules: 10 },
  { id: "MATH101", name: "Calculus I", professor: "Prof. Carl Gauss", department: "Mathematics", modules: 14 },
  { id: "MATH201", name: "Linear Algebra", professor: "Prof. Emmy Noether", department: "Mathematics", modules: 11 },
  { id: "PHY101", name: "Classical Mechanics", professor: "Dr. Isaac Newton", department: "Physics", modules: 13 },
  { id: "PHY201", name: "Quantum Mechanics", professor: "Dr. Niels Bohr", department: "Physics", modules: 9 },
  { id: "ENG101", name: "Technical Writing", professor: "Prof. Virginia Woolf", department: "English", modules: 8 },
  { id: "BIO101", name: "Cell Biology", professor: "Dr. Rosalind Franklin", department: "Biology", modules: 11 },
  { id: "CS301", name: "Machine Learning", professor: "Dr. Alan Turing", department: "Computer Science", modules: 15 },
  { id: "ECON101", name: "Microeconomics", professor: "Prof. John Nash", department: "Economics", modules: 10 },
];

export const DEPT_COLORS: Record<string, string> = {
  "Computer Science": "#1976d2",
  Mathematics: "#8b5cf6",
  Physics: "#06b6d4",
  English: "#f59e0b",
  Biology: "#22c55e",
  Economics: "#ef4444",
  History: "#d97706",
  Arts: "#ec4899",
};
