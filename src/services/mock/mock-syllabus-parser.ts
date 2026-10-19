import { addDays, setHours, startOfDay } from "date-fns";
import type { SyllabusParser } from "@/services/academic-service";
import type { ExtractedEvent, SyllabusScanResult } from "@/types/academic";

export const MAX_SYLLABUS_BYTES = 20 * 1024 * 1024;

export class SyllabusValidationError extends Error {}

export function validateSyllabusFile(file: File) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new SyllabusValidationError("Only PDF files are supported.");
  if (file.size === 0) throw new SyllabusValidationError("The file is empty.");
  if (file.size > MAX_SYLLABUS_BYTES) throw new SyllabusValidationError("File exceeds 20 MB.");
}

/**
 * Demo parser: does NOT read the PDF. Returns sample events so the review flow
 * can be exercised. Replace with a real parser implementing SyllabusParser.
 */
export class MockSyllabusParser implements SyllabusParser {
  async parse(file: File, courseId: string, courseName: string, now: Date): Promise<SyllabusScanResult> {
    validateSyllabusFile(file);
    const base = startOfDay(now);
    const d = (days: number, h: number) => setHours(addDays(base, days), h).toISOString();
    const events: ExtractedEvent[] = [
      { id: `ext_${courseId}_1`, title: "Midterm Exam", type: "exam", date: d(17, 10), confidence: 0.94, sourceText: "Midterm Exam — in class, week 9" },
      { id: `ext_${courseId}_2`, title: "Assignment 3", type: "assignment", date: d(24, 23), confidence: 0.88, sourceText: "Assignment 3 due end of week 10" },
      { id: `ext_${courseId}_3`, title: "Quiz 3", type: "quiz", date: d(29, 10), confidence: 0.71, sourceText: "Quiz 3 (tentative)" },
      { id: `ext_${courseId}_4`, title: "Final Project", type: "project", date: d(45, 23), confidence: 0.9, sourceText: "Final Project submission" },
      { id: `ext_${courseId}_5`, title: "Final Exam", type: "exam", date: d(57, 9), confidence: 0.96, sourceText: "Final Exam — exam period" },
    ].map((e) => ({ ...e, title: `${e.title}` , sourceText: `[sample] ${e.sourceText} · ${courseName}` })) as ExtractedEvent[];
    return {
      id: `scan_${Date.now().toString(36)}`,
      courseId,
      fileName: file.name,
      fileSize: file.size,
      scannedAt: now.toISOString(),
      mode: "mock",
      events,
    };
  }
}
