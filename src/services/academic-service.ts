/**
 * The single contract between UI and data. Swap MockAcademicService for an
 * HTTP/extension-backed implementation without touching components.
 */
import type {
  AcademicEvent,
  ActivityItem,
  Assignment,
  AssignmentInput,
  AssignmentPatch,
  Course,
  DashboardSummary,
  DownloadInfo,
  ExtractedEvent,
  ID,
  Material,
  PersonalEventInput,
  SubmissionAlert,
  SyllabusScanResult,
  SyncRecord,
  SyncResult,
  WorkloadAnalytics,
  WorkloadFilters,
} from "@/types/academic";

export interface AcademicService {
  getDashboardSummary(): Promise<DashboardSummary>;
  getCourses(): Promise<Course[]>;
  getCourseById(id: ID): Promise<Course | null>;
  getAssignments(): Promise<Assignment[]>;
  getAssignmentById(id: ID): Promise<Assignment | null>;
  createAssignment(data: AssignmentInput): Promise<Assignment>;
  updateAssignment(id: ID, data: AssignmentPatch): Promise<Assignment>;
  deleteAssignment(id: ID): Promise<void>;
  getMaterials(): Promise<Material[]>;
  getMaterialDownload(id: ID): Promise<DownloadInfo>;
  getAcademicEvents(): Promise<AcademicEvent[]>;
  createPersonalEvent(data: PersonalEventInput): Promise<AcademicEvent>;
  deletePersonalEvent(id: ID): Promise<void>;
  getSubmissionAlerts(): Promise<SubmissionAlert[]>;
  getWorkloadAnalytics(filters?: WorkloadFilters): Promise<WorkloadAnalytics>;
  getActivity(): Promise<ActivityItem[]>;
  getSyncHistory(): Promise<SyncRecord[]>;
  syncLMS(): Promise<SyncResult>;
  scanSyllabus(file: File, courseId: ID): Promise<SyllabusScanResult>;
  importSyllabusEvents(courseId: ID, events: ExtractedEvent[]): Promise<Assignment[]>;
  resetDemoData(): Promise<void>;
  exportData(): Promise<string>;
}

/** Pluggable syllabus parser so real PDF processing can replace the mock. */
export interface SyllabusParser {
  parse(file: File, courseId: ID, courseName: string, now: Date): Promise<SyllabusScanResult>;
}
