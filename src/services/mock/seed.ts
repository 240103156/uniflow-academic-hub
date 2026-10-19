/**
 * Demo dataset, generated relative to "now" on first launch so deadlines stay
 * realistic. Every page derives its numbers from these same records.
 */
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";
import type {
  AcademicEvent,
  ActivityItem,
  Assignment,
  AssignmentStatus,
  AssignmentType,
  Course,
  Material,
  MaterialType,
  Priority,
  SourcePlatform,
  SyncRecord,
} from "@/types/academic";

export interface MockDatabase {
  version: 1;
  seededAt: string;
  courses: Course[];
  assignments: Assignment[];
  materials: Material[];
  personalEvents: AcademicEvent[];
  syncHistory: SyncRecord[];
  activity: ActivityItem[];
  /** Assignments the demo sync can "discover", consumed in order. */
  syncPool: Assignment[];
}

export const COURSES: Course[] = [
  {
    id: "ml",
    name: "Machine Learning",
    code: "CS 4780",
    instructor: "Dr. Elena Park",
    color: "oklch(0.58 0.17 262)",
    credits: 4,
    semester: "Fall 2026",
    description: "Supervised and unsupervised learning, model evaluation, and neural networks.",
    schedule: "Mon / Wed 10:00–11:30",
    platform: "canvas",
  },
  {
    id: "db",
    name: "Database Systems",
    code: "CS 3410",
    instructor: "Prof. Marcus Chen",
    color: "oklch(0.64 0.14 160)",
    credits: 3,
    semester: "Fall 2026",
    description: "Relational modeling, SQL, normalization, transactions, and indexing.",
    schedule: "Tue / Thu 13:00–14:30",
    platform: "moodle",
  },
  {
    id: "se",
    name: "Software Engineering",
    code: "SE 3200",
    instructor: "Dr. Aisha Rahman",
    color: "oklch(0.7 0.15 65)",
    credits: 4,
    semester: "Fall 2026",
    description: "Requirements, architecture, agile delivery, testing, and code review.",
    schedule: "Mon / Thu 15:00–16:30",
    platform: "moodle",
  },
  {
    id: "pm",
    name: "Project Management",
    code: "MGT 3050",
    instructor: "Prof. Daniel Okafor",
    color: "oklch(0.62 0.19 25)",
    credits: 3,
    semester: "Fall 2026",
    description: "Scheduling, risk, stakeholder communication, and team leadership.",
    schedule: "Wed 17:00–19:30",
    platform: "canvas",
  },
  {
    id: "hci",
    name: "Human-Computer Interaction",
    code: "CS 3720",
    instructor: "Dr. Sofia Lindqvist",
    color: "oklch(0.6 0.13 210)",
    credits: 3,
    semester: "Fall 2026",
    description: "User research, prototyping, usability evaluation, and accessible design.",
    schedule: "Tue / Fri 09:00–10:30",
    platform: "canvas",
  },
];

type Row = [
  course: string,
  title: string,
  type: AssignmentType,
  day: number,
  hour: number,
  status: AssignmentStatus,
  priority: Priority,
  hours: number | null,
];

const ROWS: Row[] = [
  ["ml", "Problem Set 1 — Linear Algebra Review", "assignment", -35, 23, "submitted", "medium", 4],
  ["ml", "Problem Set 2 — Regression", "assignment", -21, 23, "submitted", "medium", 6],
  ["ml", "Quiz 1 — Foundations", "quiz", -14, 10, "submitted", "medium", null],
  ["ml", "Problem Set 3 — Classification", "assignment", -3, 23, "not_submitted", "high", 6],
  ["ml", "Machine Learning Project Proposal", "project", 2, 23, "not_submitted", "high", 5],
  ["ml", "Quiz 2 — Model Evaluation", "quiz", 6, 10, "unknown", "medium", 2],
  ["ml", "Midterm Exam", "exam", 16, 10, "unknown", "critical", 12],
  ["ml", "Final Project — Kaggle Challenge", "project", 45, 23, "not_submitted", "high", 25],
  ["db", "Assignment 1 — ER Modeling", "assignment", -28, 23, "submitted", "medium", 4],
  ["db", "Database Assignment 2 — SQL Queries", "assignment", 3, 23, "draft", "high", 5],
  ["db", "Quiz — Normalization", "quiz", 5, 13, "unknown", "medium", null],
  ["db", "Lab 4 — Indexing Benchmarks", "lab", -2, 18, "draft", "medium", 3],
  ["db", "Midterm Exam", "exam", 12, 13, "unknown", "critical", 10],
  ["db", "Assignment 3 — Transactions", "assignment", 19, 23, "not_submitted", "medium", 6],
  ["se", "Requirements Specification", "assignment", -20, 23, "submitted", "medium", 6],
  ["se", "Software Engineering Report — Architecture", "assignment", 1, 23, "resubmission", "critical", 4],
  ["se", "Code Review Lab", "lab", 4, 17, "submitted", "low", 2],
  ["se", "Sprint 2 Demo", "project", 8, 15, "not_submitted", "high", 8],
  ["se", "Final Exam", "exam", 52, 9, "unknown", "critical", 14],
  ["pm", "Case Study 1 — Denver Airport", "assignment", -17, 23, "submitted", "medium", 3],
  ["pm", "Team Charter", "assignment", -9, 23, "resubmission", "high", 2],
  ["pm", "Gantt Chart Exercise", "assignment", -1, 23, "not_submitted", "medium", 3],
  ["pm", "Quiz 2 — Scheduling", "quiz", 3, 17, "unknown", "low", null],
  ["pm", "Risk Register", "assignment", 10, 23, "not_submitted", "medium", 4],
  ["hci", "Heuristic Evaluation", "assignment", -12, 23, "submitted", "medium", 5],
  ["hci", "Prototype Critique", "assignment", 5, 23, "not_submitted", "medium", 3],
  ["hci", "Usability Study Plan", "assignment", 7, 23, "draft", "high", 5],
  ["hci", "Midterm Exam", "exam", 14, 9, "unknown", "high", 8],
  ["hci", "Final Design Project", "project", 40, 23, "not_submitted", "high", 20],
];

const POOL_ROWS: Row[] = [
  ["ml", "Reading Response — Bias in ML", "assignment", 9, 23, "not_submitted", "low", null],
  ["db", "Lab 5 — Query Optimization", "lab", 11, 18, "not_submitted", "medium", null],
  ["hci", "Accessibility Audit", "assignment", 17, 23, "not_submitted", "medium", null],
  ["pm", "Stakeholder Map", "assignment", 22, 23, "not_submitted", "low", null],
  ["se", "Sprint 3 Retrospective", "assignment", 24, 15, "not_submitted", "low", null],
];

const at = (base: Date, day: number, hour: number) =>
  setMinutes(setHours(addDays(base, day), hour), hour === 23 ? 59 : 0).toISOString();

function lmsUrl(course: Course, kind: "assign" | "resource", n: number) {
  return course.platform === "moodle"
    ? `https://moodle.example.edu/mod/${kind}/view.php?id=${n}`
    : `https://canvas.example.edu/courses/${course.code.replace(/\D/g, "")}/${kind === "assign" ? "assignments" : "files"}/${n}`;
}

function rowToAssignment(r: Row, i: number, base: Date, prefix: string): Assignment {
  const course = COURSES.find((c) => c.id === r[0])!;
  const ts = base.toISOString();
  return {
    id: `${prefix}_${String(i + 1).padStart(3, "0")}`,
    courseId: r[0],
    title: r[1],
    description: `${r[1]} for ${course.name}. See the course page on ${course.platform === "moodle" ? "Moodle" : "Canvas"} for full instructions and rubric.`,
    type: r[2],
    dueDate: at(base, r[3], r[4]),
    status: r[5],
    priority: r[6],
    estimatedHours: r[7],
    estimateSource: r[7] === null ? null : "sample",
    source: course.platform as SourcePlatform,
    sourceUrl: lmsUrl(course, "assign", 1000 + i * 7),
    createdAt: ts,
    updatedAt: ts,
  };
}

const MATERIALS: Record<string, [string, MaterialType, string][]> = {
  ml: [
    ["Lecture 01 — Introduction.pdf", "pdf", "Week 1"],
    ["Lecture 02 — Linear Regression.pdf", "pdf", "Week 2"],
    ["Lecture 03 — Classification.pptx", "pptx", "Week 3"],
    ["Lecture 04 — Decision Trees.pdf", "pdf", "Week 4"],
    ["Lab 02 — Gradient Descent.ipynb", "ipynb", "Week 2"],
    ["Lecture 05 — Model Evaluation.pptx", "pptx", "Week 5"],
    ["Recording — Lecture 05.mp4", "video", "Week 5"],
    ["Problem Set 3 Starter Code.zip", "zip", "Week 6"],
  ],
  db: [
    ["Week 1 — SQL Basics.pdf", "pdf", "Week 1"],
    ["Week 2 — Normalization.pdf", "pdf", "Week 2"],
    ["Week 3 — Relational Algebra.pdf", "pdf", "Week 3"],
    ["Week 4 — Indexing and B-Trees.pptx", "pptx", "Week 4"],
    ["Week 5 — Transactions.pdf", "pdf", "Week 5"],
    ["Sample Schema — University.zip", "zip", "Week 2"],
    ["Lab Handout — Indexing.docx", "docx", "Week 4"],
  ],
  se: [
    ["Lecture 1 — Software Process.pdf", "pdf", "Week 1"],
    ["Lecture 2 — Requirements Engineering.pptx", "pptx", "Week 2"],
    ["Lecture 3 — Software Architecture.pptx", "pptx", "Week 3"],
    ["Lecture 4 — Testing Strategies.pdf", "pdf", "Week 4"],
    ["Report Template.docx", "docx", "Week 3"],
    ["Code Review Checklist.pdf", "pdf", "Week 5"],
  ],
  pm: [
    ["Session 1 — Project Lifecycle.pdf", "pdf", "Week 1"],
    ["Session 2 — Scope and WBS.pptx", "pptx", "Week 2"],
    ["Session 3 — Scheduling.pptx", "pptx", "Week 3"],
    ["Case Study — Denver Airport.pdf", "pdf", "Week 2"],
    ["Risk Register Template.docx", "docx", "Week 5"],
  ],
  hci: [
    ["Lecture 1 — What is HCI.pdf", "pdf", "Week 1"],
    ["Lecture 2 — User Research Methods.pptx", "pptx", "Week 2"],
    ["Lecture 3 — Heuristic Evaluation.pdf", "pdf", "Week 3"],
    ["Lecture 4 — Prototyping.pptx", "pptx", "Week 4"],
    ["Usability Test Script.docx", "docx", "Week 5"],
    ["Recording — Guest Talk.mp4", "video", "Week 5"],
  ],
};

const SIZE: Record<MaterialType, number> = {
  pdf: 1_800_000,
  pptx: 5_400_000,
  docx: 240_000,
  zip: 12_600_000,
  ipynb: 380_000,
  video: 284_000_000,
};

export function createSeed(now: Date): MockDatabase {
  const base = startOfDay(now);
  const assignments = ROWS.map((r, i) => rowToAssignment(r, i, base, "asg"));
  const syncPool = POOL_ROWS.map((r, i) => rowToAssignment(r, i, base, "asg_sync"));

  let n = 0;
  const materials: Material[] = Object.entries(MATERIALS).flatMap(([courseId, list]) => {
    const course = COURSES.find((c) => c.id === courseId)!;
    return list.map(([name, type, topic], i) => {
      n++;
      const week = Number(topic.replace(/\D/g, "")) || 1;
      return {
        id: `mat_${String(n).padStart(3, "0")}`,
        courseId,
        name,
        type,
        size: Math.round(SIZE[type] * (0.6 + ((i * 37) % 80) / 100)),
        uploadedAt: at(base, -42 + week * 7 - (i % 3), 9 + (i % 6)),
        topic,
        sourceUrl: lmsUrl(course, "resource", 5000 + n),
      };
    });
  });

  const ts = (d: number, h = 9) => at(base, d, h);
  return {
    version: 1,
    seededAt: now.toISOString(),
    courses: COURSES,
    assignments,
    materials,
    syncPool,
    personalEvents: [
      {
        id: "evt_001",
        courseId: "ml",
        title: "Study group — ML midterm",
        type: "personal",
        date: at(base, 13, 18),
        source: "personal",
        description: "Library room 3B",
      },
      {
        id: "evt_002",
        courseId: null,
        title: "Career fair",
        type: "personal",
        date: at(base, 9, 12),
        source: "personal",
      },
    ],
    syncHistory: [
      { id: "sync_003", timestamp: ts(-1, 8), status: "success", itemsDiscovered: 2, itemsUpdated: 1, demo: true, notes: "Demo sync — sample data" },
      { id: "sync_002", timestamp: ts(-4, 19), status: "partial", itemsDiscovered: 1, itemsUpdated: 0, demo: true, notes: "Demo sync — one sample course timed out" },
      { id: "sync_001", timestamp: ts(-9, 7), status: "success", itemsDiscovered: 6, itemsUpdated: 2, demo: true, notes: "Demo sync — initial import" },
    ],
    activity: [
      { id: "act_006", timestamp: ts(-1, 8), type: "assignment_discovered", message: "New assignment discovered: Machine Learning Project Proposal", courseId: "ml" },
      { id: "act_005", timestamp: ts(-1, 8), type: "deadline_changed", message: "Deadline changed: Database Assignment 2 moved by 2 days", courseId: "db" },
      { id: "act_004", timestamp: ts(-2, 14), type: "material_added", message: "New lecture material: Lecture 05 — Model Evaluation.pptx", courseId: "ml" },
      { id: "act_003", timestamp: ts(-3, 11), type: "marked_submitted", message: "Marked as submitted: Code Review Lab", courseId: "se" },
      { id: "act_002", timestamp: ts(-5, 16), type: "material_added", message: "New lecture material: Week 5 — Transactions.pdf", courseId: "db" },
      { id: "act_001", timestamp: ts(-9, 7), type: "assignment_discovered", message: "Initial demo import: 29 assignments across 5 courses" },
    ],
  };
}
