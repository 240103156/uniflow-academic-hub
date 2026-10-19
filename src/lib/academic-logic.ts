/**
 * Pure business logic shared by the service layer and UI.
 * Every function takes `now` explicitly so it is deterministic and testable.
 */
import {
  addDays,
  differenceInMinutes,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import type {
  AlertSeverity,
  Assignment,
  AssignmentStatus,
  AssignmentType,
  Course,
  CourseAggregate,
  DashboardSummary,
  DayWorkload,
  Priority,
  SubmissionAlert,
  WeekWorkload,
} from "@/types/academic";

export const PRIORITY_RANK: Record<Priority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const WEEK_OPTIONS = { weekStartsOn: 1 as const };

/** Not-yet-submitted work whose deadline passed is treated as overdue. */
export function getEffectiveStatus(a: Assignment, now: Date): AssignmentStatus {
  const due = parseISO(a.dueDate);
  if ((a.status === "not_submitted" || a.status === "draft") && isBefore(due, now)) {
    return "overdue";
  }
  return a.status;
}

export function isOverdue(a: Assignment, now: Date): boolean {
  return getEffectiveStatus(a, now) === "overdue";
}

export function isPending(a: Assignment, now: Date): boolean {
  const s = getEffectiveStatus(a, now);
  return s === "not_submitted" || s === "draft" || s === "resubmission" || s === "overdue";
}

export function isUpcoming(a: Assignment, now: Date, withinDays = 7): boolean {
  const due = parseISO(a.dueDate);
  return isAfter(due, now) && isBefore(due, addDays(now, withinDays)) && a.status !== "submitted";
}

export interface AssignmentFilter {
  query?: string;
  courseId?: string | "all";
  status?: AssignmentStatus | "all";
}

export function filterAssignments(list: Assignment[], f: AssignmentFilter, now: Date) {
  const q = f.query?.trim().toLowerCase() ?? "";
  return list.filter((a) => {
    if (q && !a.title.toLowerCase().includes(q)) return false;
    if (f.courseId && f.courseId !== "all" && a.courseId !== f.courseId) return false;
    if (f.status && f.status !== "all" && getEffectiveStatus(a, now) !== f.status) return false;
    return true;
  });
}

export type AssignmentSort = "deadline_asc" | "deadline_desc" | "priority";

export function sortAssignments(list: Assignment[], sort: AssignmentSort): Assignment[] {
  const byDate = (a: Assignment, b: Assignment) =>
    parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
  const copy = [...list];
  if (sort === "deadline_asc") return copy.sort(byDate);
  if (sort === "deadline_desc") return copy.sort((a, b) => byDate(b, a));
  return copy.sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || byDate(a, b));
}

export function formatTimeRemaining(dueIso: string, now: Date): string {
  const mins = differenceInMinutes(parseISO(dueIso), now);
  const abs = Math.abs(mins);
  let text: string;
  if (abs < 60) text = `${abs}m`;
  else if (abs < 60 * 24) text = `${Math.floor(abs / 60)}h`;
  else {
    const d = Math.floor(abs / (60 * 24));
    const h = Math.floor((abs % (60 * 24)) / 60);
    text = h ? `${d}d ${h}h` : `${d}d`;
  }
  return mins < 0 ? `${text} overdue` : `in ${text}`;
}

const isExamLike = (t: AssignmentType) => t === "exam" || t === "quiz";

/** Counts per day (Mon–Sun) of the week containing `weekOf`. */
export function weeklyWorkload(list: Assignment[], weekOf: Date): DayWorkload[] {
  const start = startOfWeek(weekOf, WEEK_OPTIONS);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    const key = format(day, "yyyy-MM-dd");
    const items = list.filter((a) => format(parseISO(a.dueDate), "yyyy-MM-dd") === key);
    return {
      date: key,
      label: format(day, "EEE"),
      assignments: items.filter((a) => !isExamLike(a.type)).length,
      exams: items.filter((a) => isExamLike(a.type)).length,
    };
  });
}

/** Per-week breakdown between two dates (inclusive). */
export function semesterWeeks(list: Assignment[], from: Date, to: Date): WeekWorkload[] {
  const weeks: WeekWorkload[] = [];
  let cursor = startOfWeek(from, WEEK_OPTIONS);
  while (!isAfter(cursor, to)) {
    const end = addDays(cursor, 7);
    const items = list.filter((a) => {
      const d = parseISO(a.dueDate);
      return !isBefore(d, cursor) && isBefore(d, end);
    });
    weeks.push({
      weekStart: cursor.toISOString(),
      label: format(cursor, "MMM d"),
      assignment: items.filter((a) => !isExamLike(a.type)).length,
      quiz: items.filter((a) => a.type === "quiz").length,
      exam: items.filter((a) => a.type === "exam").length,
      total: items.length,
      hours: items.reduce((s, a) => s + (a.estimatedHours ?? 0), 0),
    });
    cursor = end;
  }
  return weeks;
}

/** A week is busy when it has at least 3 deadlines and is above mean + 1 std dev. */
export function detectBusyWeeks(weeks: WeekWorkload[]): WeekWorkload[] {
  const active = weeks.filter((w) => w.total > 0);
  if (!active.length) return [];
  const mean = active.reduce((s, w) => s + w.total, 0) / active.length;
  const sd = Math.sqrt(active.reduce((s, w) => s + (w.total - mean) ** 2, 0) / active.length);
  const threshold = Math.max(3, mean + sd);
  return weeks.filter((w) => w.total >= threshold);
}

export function dailyCounts(list: Assignment[], from: Date, to: Date) {
  return eachDayOfInterval({ start: startOfDay(from), end: startOfDay(to) }).map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return {
      date: key,
      count: list.filter((a) => format(parseISO(a.dueDate), "yyyy-MM-dd") === key).length,
    };
  });
}

export function aggregateByCourse(
  courses: Course[],
  list: Assignment[],
  now: Date,
): CourseAggregate[] {
  return courses.map((c) => {
    const items = list.filter((a) => a.courseId === c.id);
    return {
      courseId: c.id,
      total: items.length,
      pending: items.filter((a) => isPending(a, now)).length,
      submitted: items.filter((a) => a.status === "submitted").length,
      overdue: items.filter((a) => isOverdue(a, now)).length,
      upcoming: items.filter((a) => isUpcoming(a, now, 14)).length,
      hours: items.reduce((s, a) => s + (a.estimatedHours ?? 0), 0),
    };
  });
}

export function deriveAlerts(list: Assignment[], courses: Course[], now: Date): SubmissionAlert[] {
  const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? "Course";
  const alerts: SubmissionAlert[] = [];
  for (const a of list) {
    const s = getEffectiveStatus(a, now);
    const label = `${courseName(a.courseId)}: ${a.title}`;
    let alert: { type: SubmissionAlert["type"]; message: string; severity: AlertSeverity } | null =
      null;
    if (s === "overdue")
      alert = { type: "overdue", message: `${label} is overdue and not submitted.`, severity: "critical" };
    else if (s === "resubmission")
      alert = { type: "resubmission", message: `${label} requires resubmission.`, severity: "critical" };
    else if (s === "draft")
      alert = { type: "draft", message: `${label} is still a draft.`, severity: "warning" };
    else if (s === "not_submitted" && isUpcoming(a, now, 7) && a.type !== "exam" && a.type !== "quiz")
      alert = { type: "not_submitted", message: `${label} has not been submitted.`, severity: "warning" };
    if (alert) alerts.push({ id: `alert_${a.id}`, assignmentId: a.id, ...alert });
  }
  const rank = { critical: 3, warning: 2, info: 1 };
  return alerts.sort((x, y) => rank[y.severity] - rank[x.severity]);
}

export function computeSummary(list: Assignment[], courses: Course[], now: Date): DashboardSummary {
  return {
    upcomingDeadlines: list.filter((a) => isUpcoming(a, now, 7)).length,
    pendingAssignments: list.filter((a) => isPending(a, now)).length,
    submittedAssignments: list.filter((a) => a.status === "submitted").length,
    activeCourses: courses.length,
  };
}
