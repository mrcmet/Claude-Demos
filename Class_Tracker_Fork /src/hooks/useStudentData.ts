/**
 * useStudentData.ts
 *
 * React hook that manages the student's academic progress state.
 *
 * Responsibilities:
 * - Hydrates from localStorage on mount (via loadStudentData).
 * - Falls back to a default empty student if no persisted data exists.
 * - Persists every mutation back to localStorage synchronously so state
 *   survives page refresh.
 * - Exposes targeted mutation helpers instead of a raw setState to enforce
 *   invariants (e.g. a course cannot be both completed and in-progress).
 * - Supports loading student state from an exported JSON file.
 * - Supports exporting current state to a downloadable JSON file.
 *
 * Design decisions:
 * - useCallback on every mutation prevents child component re-renders when
 *   the hook is used at the App level and passed down as props.
 * - saveStudentData is called inside a functional state updater so it always
 *   writes the latest state, not a stale closure value.
 * - The default student uses today's year as catalogYear — a reasonable UX
 *   default that avoids an empty required field.
 */

import { useState, useCallback } from "react";
import type { StudentData } from "../types";
import {
  loadStudentData,
  saveStudentData,
  clearStudentData,
} from "../storage/localStorage";
import { importStudentFile } from "../storage/fileImport";
import { exportStudentData } from "../storage/fileExport";

// ---------------------------------------------------------------------------
// Default student factory
// ---------------------------------------------------------------------------

function createDefaultStudent(): StudentData {
  return {
    name: "Student",
    selectedProgram: null,
    catalogYear: new Date().getFullYear().toString(),
    completedCourses: [],
    inProgressCourses: [],
    version: "1.0",
  };
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseStudentDataReturn {
  /** Current student state, or null during the brief hydration window. */
  student: StudentData;
  /**
   * Applies a partial update to the student record and persists it.
   * Use this for fields like name, selectedProgram, catalogYear.
   */
  updateStudent: (patch: Partial<StudentData>) => void;
  /**
   * Moves a course to completedCourses and records the grade in gpaData.
   * Removes it from inProgressCourses if present — a course cannot be both.
   */
  markCourseCompleted: (courseId: string, grade?: string) => void;
  /**
   * Moves a course to inProgressCourses.
   * Removes it from completedCourses if present — a course cannot be both.
   */
  markCourseInProgress: (courseId: string) => void;
  /**
   * Removes a course from both completedCourses and inProgressCourses.
   * Used to "reset" a course to its evaluated status.
   */
  unmarkCourse: (courseId: string) => void;
  /**
   * Imports a student progress file and replaces current state.
   * Throws with a human-readable message if the file is invalid.
   */
  loadFromFile: (file: File) => Promise<void>;
  /** Exports current state as a downloadable JSON file. */
  exportToFile: () => void;
  /** Clears all progress and resets to the default empty student. */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useStudentData(): UseStudentDataReturn {
  const [student, setStudentRaw] = useState<StudentData>(() => {
    // Lazy initializer runs only once on mount — hydrate from localStorage.
    return loadStudentData() ?? createDefaultStudent();
  });

  /**
   * Internal setter that updates React state AND persists to localStorage in
   * a single operation. The functional updater form ensures we always
   * operate on the latest state even in rapid-fire mutation sequences.
   */
  const setStudent = useCallback((updater: (prev: StudentData) => StudentData) => {
    setStudentRaw((prev) => {
      const next = updater(prev);
      saveStudentData(next);
      return next;
    });
  }, []);

  const updateStudent = useCallback(
    (patch: Partial<StudentData>) => {
      setStudent((prev) => ({ ...prev, ...patch }));
    },
    [setStudent]
  );

  const markCourseCompleted = useCallback(
    (courseId: string, grade?: string) => {
      setStudent((prev) => {
        // Remove from inProgress, add to completed (deduped via Set).
        const completed = new Set(prev.completedCourses);
        completed.add(courseId);
        const inProgress = prev.inProgressCourses.filter((id) => id !== courseId);
        const gpaData = grade
          ? { ...prev.gpaData, [courseId]: grade }
          : prev.gpaData;
        return { ...prev, completedCourses: [...completed], inProgressCourses: inProgress, gpaData };
      });
    },
    [setStudent]
  );

  const markCourseInProgress = useCallback(
    (courseId: string) => {
      setStudent((prev) => {
        // Remove from completed, add to inProgress (deduped via Set).
        const inProgress = new Set(prev.inProgressCourses);
        inProgress.add(courseId);
        const completed = prev.completedCourses.filter((id) => id !== courseId);
        return {
          ...prev,
          completedCourses: completed,
          inProgressCourses: [...inProgress],
        };
      });
    },
    [setStudent]
  );

  const unmarkCourse = useCallback(
    (courseId: string) => {
      setStudent((prev) => {
        const gpaData = { ...prev.gpaData };
        delete gpaData[courseId];
        return {
          ...prev,
          completedCourses: prev.completedCourses.filter((id) => id !== courseId),
          inProgressCourses: prev.inProgressCourses.filter((id) => id !== courseId),
          gpaData,
        };
      });
    },
    [setStudent]
  );

  const loadFromFile = useCallback(async (file: File): Promise<void> => {
    // importStudentFile throws with a human-readable message on failure —
    // let the error propagate to the calling component's error handler.
    const imported = await importStudentFile(file);
    setStudent(() => imported);
  }, [setStudent]);

  const exportToFile = useCallback(() => {
    exportStudentData(student);
  }, [student]);

  const reset = useCallback(() => {
    const fresh = createDefaultStudent();
    clearStudentData();
    setStudentRaw(fresh);
  }, []);

  return {
    student,
    updateStudent,
    markCourseCompleted,
    markCourseInProgress,
    unmarkCourse,
    loadFromFile,
    exportToFile,
    reset,
  };
}
