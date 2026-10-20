import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from "@/lib/format";
import type { AssignmentStatus, AssignmentType, Course, Priority } from "@/types/academic";

const pill = "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function StatusBadge({ status, className }: { status: AssignmentStatus; className?: string }) {
  return <span className={cn(pill, STATUS_TONE[status], className)}>{STATUS_LABEL[status]}</span>;
}

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-muted-foreground/40",
  medium: "bg-info",
  high: "bg-warning",
  critical: "bg-destructive",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
      <span className={cn("size-1.5 rounded-full", PRIORITY_DOT[priority])} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function TypeBadge({ type }: { type: AssignmentType }) {
  const tone = type === "exam" ? "tone-danger" : type === "quiz" ? "tone-warning" : "tone-muted";
  return <span className={cn(pill, tone)}>{TYPE_LABEL[type]}</span>;
}

export function CourseDot({ course, className }: { course?: Course; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: course?.color ?? "var(--muted-foreground)" }}
    />
  );
}

export function CourseTag({ course }: { course?: Course }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
      <CourseDot course={course} />
      {course?.name ?? "—"}
    </span>
  );
}

export function DemoBadge({ children = "Demo", className }: { children?: string; className?: string }) {
  return <span className={cn(pill, "tone-warning", className)}>{children}</span>;
}
