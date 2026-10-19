/**
 * Core UniFlow domain models. All dates are ISO-8601 strings (UTC) so they
 * serialize cleanly to localStorage today and to a real API later.
 */

export type ID = string;

export type AssignmentStatus =
  | "submitted"
  | "not_submitted"
  | "draft"
  | "resubmission"
  | "overdue"
  | "unknown";

export type Priority = "low" | "medium" | "high" | "critical";

export type AssignmentType = "assignment" | "quiz" | "exam" | "project" | "lab";

/** Where a record came from. `manual` records are user-created and deletable. */
export type SourcePlatform = "moodle" | "canvas" | "syllabus" | "manual";

export type EstimateSource = "user" | "sample";

export interface Course {
  id: ID;
  name: string;
  code: string;
  instructor: string;
  /** CSS color value (data-driven, applied via inline style). */
  color: string;
  credits: number;
  semester: string;
  description: string;
  schedule: string;
  platform: Exclude<SourcePlatform, "manual" | "syllabus">;
}

export interface Assignment {
  id: ID;
  courseId: ID;
  title: string;
  description: string;
  dueDate: string;
  /** Stored status; use getEffectiveStatus() to account for passed deadlines. */
  status: AssignmentStatus;
  priority: Priority;
  type: AssignmentType;
  estimatedHours: number | null;
  estimateSource: EstimateSource | null;
  source: SourcePlatform;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AssignmentInput = Omit<Assignment, "id" | "createdAt" | "updatedAt">;
export type AssignmentPatch = Partial<AssignmentInput>;

export type MaterialType = "pdf" | "pptx" | "docx" | "zip" | "ipynb" | "video";

export interface Material {
  id: ID;
  courseId: ID;
  name: string;
  type: MaterialType;
  /** Bytes. */
  size: number;
  uploadedAt: string;
  topic: string;
  sourceUrl: string;
}

export type AcademicEventType = AssignmentType | "personal" | "lecture";
export type EventSource = SourcePlatform | "personal";

export interface AcademicEvent {
  id: ID;
  courseId: ID | null;
  title: string;
  type: AcademicEventType;
  date: string;
  source: EventSource;
  description?: string;
  /** Present when the event is derived from an assignment record. */
  assignmentId?: ID;
}

export interface PersonalEventInput {
  title: string;
  date: string;
  courseId: ID | null;
  description?: string;
}

export type AlertType = "overdue" | "not_submitted" | "draft" | "resubmission";
export type AlertSeverity = "info" | "warning" | "critical";

export interface SubmissionAlert {
  id: ID;
  assignmentId: ID;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
}

export interface SyncRecord {
  id: ID;
  timestamp: string;
  status: "success" | "partial" | "failed";
  itemsDiscovered: number;
  itemsUpdated: number;
  /** Always true until a real LMS integration exists. */
  demo: boolean;
  notes: string;
}

export type ActivityType =
  | "assignment_discovered"
  | "deadline_changed"
  | "material_added"
  | "marked_submitted"
  | "assignment_created"
  | "assignment_updated"
  | "assignment_deleted"
  | "syllabus_imported"
  | "event_created";

export interface ActivityItem {
  id: ID;
  timestamp: string;
  type: ActivityType;
  message: string;
  courseId?: ID;
}

export interface DashboardSummary {
  upcomingDeadlines: number;
  pendingAssignments: number;
  submittedAssignments: number;
  activeCourses: number;
}

export interface DayWorkload {
  date: string;
  label: string;
  assignments: number;
  exams: number;
}

export interface WeekWorkload {
  weekStart: string;
  label: string;
  assignment: number;
  quiz: number;
  exam: number;
  total: number;
  hours: number;
}

export interface CourseAggregate {
  courseId: ID;
  total: number;
  pending: number;
  submitted: number;
  overdue: number;
  upcoming: number;
  hours: number;
}

export interface WorkloadFilters {
  courseId?: ID | "all";
  type?: AssignmentType | "all";
  from?: string;
  to?: string;
}

export interface WorkloadAnalytics {
  weeks: WeekWorkload[];
  busyWeeks: WeekWorkload[];
  daily: { date: string; count: number }[];
  byCourse: CourseAggregate[];
  tasks: Assignment[];
  totalHours: number;
}

export interface ExtractedEvent {
  id: ID;
  title: string;
  type: AssignmentType;
  date: string;
  confidence: number;
  sourceText: string;
}

export interface SyllabusScanResult {
  id: ID;
  courseId: ID;
  fileName: string;
  fileSize: number;
  scannedAt: string;
  /** `mock` means the file contents were NOT read; events are sample data. */
  mode: "mock" | "parsed";
  events: ExtractedEvent[];
}

export interface SyncResult {
  record: SyncRecord;
  discovered: Assignment[];
  updated: Assignment[];
}

export interface DownloadInfo {
  available: boolean;
  reason: string;
}
