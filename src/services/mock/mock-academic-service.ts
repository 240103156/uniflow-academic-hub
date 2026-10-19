import { addDays, endOfDay, parseISO, startOfDay, subDays } from "date-fns";
import type { AcademicService, SyllabusParser } from "@/services/academic-service";
import {
  aggregateByCourse,
  computeSummary,
  dailyCounts,
  deriveAlerts,
  detectBusyWeeks,
  semesterWeeks,
} from "@/lib/academic-logic";
import type {
  AcademicEvent,
  ActivityItem,
  ActivityType,
  Assignment,
  AssignmentInput,
  AssignmentPatch,
  ExtractedEvent,
  PersonalEventInput,
  SyncResult,
  WorkloadFilters,
} from "@/types/academic";
import { createSeed, type MockDatabase } from "./seed";
import { MockSyllabusParser } from "./mock-syllabus-parser";

export const STORAGE_KEY = "uniflow:db:v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

export interface MockServiceOptions {
  storage: StorageLike;
  latencyMs?: number;
  now?: () => Date;
  parser?: SyllabusParser;
}

let counter = 0;
const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export class MockAcademicService implements AcademicService {
  private db: MockDatabase | null = null;
  private storage: StorageLike;
  private latency: number;
  private now: () => Date;
  private parser: SyllabusParser;

  constructor(opts: MockServiceOptions) {
    this.storage = opts.storage;
    this.latency = opts.latencyMs ?? 250;
    this.now = opts.now ?? (() => new Date());
    this.parser = opts.parser ?? new MockSyllabusParser();
  }

  // ---------- persistence ----------
  private load(): MockDatabase {
    if (this.db) return this.db;
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as MockDatabase;
        if (parsed.version === 1) return (this.db = parsed);
      } catch {
        /* fall through to reseed */
      }
    }
    this.db = createSeed(this.now());
    this.save();
    return this.db;
  }

  private save() {
    if (this.db) this.storage.setItem(STORAGE_KEY, JSON.stringify(this.db));
  }

  private async delay<T>(fn: () => T, factor = 1): Promise<T> {
    if (this.latency > 0) await new Promise((r) => setTimeout(r, this.latency * factor));
    return structuredClone(fn());
  }

  private log(type: ActivityType, message: string, courseId?: string) {
    const db = this.load();
    db.activity.unshift({ id: uid("act"), timestamp: this.now().toISOString(), type, message, courseId });
    db.activity = db.activity.slice(0, 50);
  }

  // ---------- reads ----------
  getDashboardSummary() {
    return this.delay(() => {
      const db = this.load();
      return computeSummary(db.assignments, db.courses, this.now());
    });
  }
  getCourses() {
    return this.delay(() => this.load().courses);
  }
  getCourseById(id: string) {
    return this.delay(() => this.load().courses.find((c) => c.id === id) ?? null);
  }
  getAssignments() {
    return this.delay(() => this.load().assignments);
  }
  getAssignmentById(id: string) {
    return this.delay(() => this.load().assignments.find((a) => a.id === id) ?? null);
  }
  getMaterials() {
    return this.delay(() => this.load().materials);
  }
  getMaterialDownload(id: string) {
    return this.delay(() => {
      const m = this.load().materials.find((x) => x.id === id);
      return {
        available: false,
        reason: m
          ? `"${m.name}" is demo metadata. Downloads require a real LMS connection, which is not available yet.`
          : "Material not found.",
      };
    });
  }
  getAcademicEvents() {
    return this.delay(() => {
      const db = this.load();
      const derived: AcademicEvent[] = db.assignments.map((a) => ({
        id: `evt_${a.id}`,
        courseId: a.courseId,
        title: a.title,
        type: a.type,
        date: a.dueDate,
        source: a.source,
        assignmentId: a.id,
        description: a.description,
      }));
      return [...derived, ...db.personalEvents].sort((x, y) => x.date.localeCompare(y.date));
    });
  }
  getSubmissionAlerts() {
    return this.delay(() => {
      const db = this.load();
      return deriveAlerts(db.assignments, db.courses, this.now());
    });
  }
  getWorkloadAnalytics(filters: WorkloadFilters = {}) {
    return this.delay(() => {
      const db = this.load();
      const now = this.now();
      const from = filters.from ? startOfDay(parseISO(filters.from)) : subDays(startOfDay(now), 42);
      const to = filters.to ? endOfDay(parseISO(filters.to)) : endOfDay(addDays(now, 63));
      const tasks = db.assignments
        .filter((a) => {
          const d = parseISO(a.dueDate);
          if (d < from || d > to) return false;
          if (filters.courseId && filters.courseId !== "all" && a.courseId !== filters.courseId) return false;
          if (filters.type && filters.type !== "all" && a.type !== filters.type) return false;
          return true;
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      const weeks = semesterWeeks(tasks, from, to);
      return {
        weeks,
        busyWeeks: detectBusyWeeks(weeks),
        daily: dailyCounts(tasks, from, to),
        byCourse: aggregateByCourse(db.courses, tasks, now),
        tasks,
        totalHours: tasks.reduce((s, a) => s + (a.estimatedHours ?? 0), 0),
      };
    });
  }
  getActivity() {
    return this.delay(() => this.load().activity);
  }
  getSyncHistory() {
    return this.delay(() => this.load().syncHistory);
  }

  // ---------- writes ----------
  createAssignment(data: AssignmentInput) {
    return this.delay(() => {
      if (!data.title.trim()) throw new Error("Title is required");
      const db = this.load();
      if (!db.courses.some((c) => c.id === data.courseId)) throw new Error("Unknown course");
      const ts = this.now().toISOString();
      const a: Assignment = { ...data, id: uid("asg"), createdAt: ts, updatedAt: ts };
      db.assignments.push(a);
      this.log("assignment_created", `Assignment added: ${a.title}`, a.courseId);
      this.save();
      return a;
    });
  }

  updateAssignment(id: string, patch: AssignmentPatch) {
    return this.delay(() => {
      const db = this.load();
      const idx = db.assignments.findIndex((a) => a.id === id);
      if (idx < 0) throw new Error("Assignment not found");
      const prev = db.assignments[idx];
      const next: Assignment = { ...prev, ...patch, id, updatedAt: this.now().toISOString() };
      db.assignments[idx] = next;
      if (patch.status === "submitted" && prev.status !== "submitted")
        this.log("marked_submitted", `Marked as submitted (locally): ${next.title}`, next.courseId);
      else if (patch.dueDate && patch.dueDate !== prev.dueDate)
        this.log("deadline_changed", `Deadline changed: ${next.title}`, next.courseId);
      else if (!("estimatedHours" in patch && Object.keys(patch).length <= 2))
        this.log("assignment_updated", `Assignment updated: ${next.title}`, next.courseId);
      this.save();
      return next;
    });
  }

  deleteAssignment(id: string) {
    return this.delay(() => {
      const db = this.load();
      const a = db.assignments.find((x) => x.id === id);
      if (!a) throw new Error("Assignment not found");
      if (a.source !== "manual" && a.source !== "syllabus")
        throw new Error("Only manually created or syllabus-imported assignments can be deleted");
      db.assignments = db.assignments.filter((x) => x.id !== id);
      this.log("assignment_deleted", `Assignment deleted: ${a.title}`, a.courseId);
      this.save();
    });
  }

  createPersonalEvent(data: PersonalEventInput) {
    return this.delay(() => {
      if (!data.title.trim()) throw new Error("Title is required");
      const db = this.load();
      const e: AcademicEvent = { id: uid("evt"), type: "personal", source: "personal", ...data };
      db.personalEvents.push(e);
      this.log("event_created", `Personal event added: ${e.title}`, e.courseId ?? undefined);
      this.save();
      return e;
    });
  }

  deletePersonalEvent(id: string) {
    return this.delay(() => {
      const db = this.load();
      db.personalEvents = db.personalEvents.filter((e) => e.id !== id);
      this.save();
    });
  }

  /** Demo sync: pulls the next items from the sample pool and shifts one deadline. */
  syncLMS() {
    return this.delay((): SyncResult => {
      const db = this.load();
      const now = this.now();
      const discovered = db.syncPool.splice(0, 2).map((a) => ({
        ...a,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }));
      db.assignments.push(...discovered);
      discovered.forEach((a) =>
        this.log("assignment_discovered", `New assignment discovered (demo): ${a.title}`, a.courseId),
      );
      const updated: Assignment[] = [];
      const candidate = db.assignments.find(
        (a) => a.source !== "manual" && a.status !== "submitted" && parseISO(a.dueDate) > addDays(now, 3),
      );
      if (candidate && discovered.length) {
        candidate.dueDate = addDays(parseISO(candidate.dueDate), 1).toISOString();
        candidate.updatedAt = now.toISOString();
        updated.push(candidate);
        this.log("deadline_changed", `Deadline changed (demo): ${candidate.title} moved by 1 day`, candidate.courseId);
      }
      const record = {
        id: uid("sync"),
        timestamp: now.toISOString(),
        status: "success" as const,
        itemsDiscovered: discovered.length,
        itemsUpdated: updated.length,
        demo: true,
        notes: discovered.length ? "Demo sync — sample data" : "Demo sync — no new sample items left",
      };
      db.syncHistory.unshift(record);
      this.save();
      return { record, discovered, updated };
    }, 6);
  }

  async scanSyllabus(file: File, courseId: string) {
    const course = this.load().courses.find((c) => c.id === courseId);
    if (!course) throw new Error("Select a course first");
    const result = await this.parser.parse(file, courseId, course.name, this.now());
    return this.delay(() => result, 8);
  }

  importSyllabusEvents(courseId: string, events: ExtractedEvent[]) {
    return this.delay(() => {
      const db = this.load();
      const ts = this.now().toISOString();
      const created = events.map<Assignment>((e) => ({
        id: uid("asg"),
        courseId,
        title: e.title,
        description: `Imported from syllabus (sample extraction). ${e.sourceText}`,
        dueDate: e.date,
        status: e.type === "exam" || e.type === "quiz" ? "unknown" : "not_submitted",
        priority: e.type === "exam" ? "critical" : "medium",
        type: e.type,
        estimatedHours: null,
        estimateSource: null,
        source: "syllabus",
        sourceUrl: null,
        createdAt: ts,
        updatedAt: ts,
      }));
      db.assignments.push(...created);
      this.log("syllabus_imported", `${created.length} syllabus items added to calendar`, courseId);
      this.save();
      return created;
    });
  }

  resetDemoData() {
    return this.delay(() => {
      this.storage.removeItem(STORAGE_KEY);
      this.db = null;
      this.load();
    });
  }

  exportData() {
    return this.delay(() => JSON.stringify(this.load(), null, 2));
  }
}

export type { ActivityItem };
