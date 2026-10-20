import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import type {
  AssignmentStatus,
  AssignmentType,
  MaterialType,
  Priority,
  SourcePlatform,
} from "@/types/academic";

export const STATUS_LABEL: Record<AssignmentStatus, string> = {
  submitted: "Submitted",
  not_submitted: "Not submitted",
  draft: "Draft",
  resubmission: "Requires resubmission",
  overdue: "Overdue",
  unknown: "Unknown",
};

export const STATUS_TONE: Record<AssignmentStatus, string> = {
  submitted: "tone-success",
  not_submitted: "tone-info",
  draft: "tone-warning",
  resubmission: "tone-danger",
  overdue: "tone-danger",
  unknown: "tone-muted",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const TYPE_LABEL: Record<AssignmentType, string> = {
  assignment: "Assignment",
  quiz: "Quiz",
  exam: "Exam",
  project: "Project",
  lab: "Lab",
};

export const SOURCE_LABEL: Record<SourcePlatform, string> = {
  moodle: "Moodle (demo)",
  canvas: "Canvas (demo)",
  syllabus: "Syllabus",
  manual: "Manual",
};

export const MATERIAL_LABEL: Record<MaterialType, string> = {
  pdf: "PDF",
  pptx: "Slides",
  docx: "Document",
  zip: "Archive",
  ipynb: "Notebook",
  video: "Video",
};

export const fmtDate = (iso: string) => format(parseISO(iso), "MMM d, yyyy");
export const fmtDateTime = (iso: string) => format(parseISO(iso), "EEE, MMM d · HH:mm");
export const fmtRelative = (iso: string) =>
  formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

/** Convert ISO to value for <input type="datetime-local"> in local time. */
export const toLocalInput = (iso: string) => format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
export const fromLocalInput = (v: string) => new Date(v).toISOString();
