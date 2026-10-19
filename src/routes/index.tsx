import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addWeeks, format, startOfWeek } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle, ArrowRight, BookOpen, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Clock,
  FileText, ListTodo, RefreshCw, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivity, useAlerts, useAssignments, useCourses, useSummary } from "@/hooks/use-academic";
import { formatTimeRemaining, getEffectiveStatus, isUpcoming, sortAssignments, weeklyWorkload, WEEK_OPTIONS } from "@/lib/academic-logic";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { CourseTag, PriorityBadge, StatusBadge } from "@/components/academic/badges";
import { EmptyState, ListSkeleton, Panel } from "@/components/academic/states";
import { useAssignmentUI } from "@/components/academic/assignment-detail";
import { ChartTooltip } from "@/components/academic/chart-tooltip";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/types/academic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — UniFlow" },
      { name: "description", content: "Your semester at a glance: upcoming deadlines, submissions and weekly workload." },
      { property: "og:title", content: "Dashboard — UniFlow" },
      { property: "og:description", content: "Your semester at a glance: upcoming deadlines, submissions and weekly workload." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const summary = useSummary();
  const cards = [
    { label: "Upcoming deadlines", hint: "Next 7 days", value: summary.data?.upcomingDeadlines, icon: CalendarClock },
    { label: "Pending assignments", hint: "Incl. drafts & overdue", value: summary.data?.pendingAssignments, icon: ListTodo },
    { label: "Submitted", hint: "This semester", value: summary.data?.submittedAssignments, icon: CheckCircle2 },
    { label: "Active courses", hint: "Fall 2026", value: summary.data?.activeCourses, icon: BookOpen },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Good to see you, Alex</h1>
        <p className="mt-1 text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")} · Here's what needs your attention.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="surface p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{c.label}</span>
              <c.icon className="size-4" />
            </div>
            {c.value === undefined ? <Skeleton className="mt-3 h-8 w-12" /> : <p className="tabular mt-2 text-3xl font-semibold tracking-tight">{c.value}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <UpcomingDeadlines className="xl:col-span-3" />
        <WeeklyWorkloadChart className="xl:col-span-2" />
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <SubmissionAlerts className="xl:col-span-3" />
        <RecentActivity className="xl:col-span-2" />
      </div>
    </div>
  );
}

function UpcomingDeadlines({ className }: { className?: string }) {
  const { data, isLoading } = useAssignments();
  const { data: courses = [] } = useCourses();
  const { openDetail } = useAssignmentUI();
  const now = new Date();
  const items = useMemo(
    () => sortAssignments((data ?? []).filter((a) => isUpcoming(a, now, 14)), "deadline_asc").slice(0, 7),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );
  return (
    <Panel className={className} title="Upcoming deadlines" description="Next 14 days, soonest first"
      action={<Button asChild variant="ghost" size="sm"><Link to="/assignments">View all <ArrowRight className="size-3.5" /></Link></Button>}>
      {isLoading ? <ListSkeleton /> : items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing due soon" description="No open deadlines in the next two weeks." />
      ) : (
        <ul className="divide-y">
          {items.map((a) => {
            const hours = (new Date(a.dueDate).getTime() - now.getTime()) / 36e5;
            return (
              <li key={a.id}>
                <button onClick={() => openDetail(a.id)} className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-muted/40">
                  <PriorityBadge priority={a.priority} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs">
                      <CourseTag course={courses.find((c) => c.id === a.courseId)} />
                      <span className="hidden text-muted-foreground sm:inline">{fmtDateTime(a.dueDate)}</span>
                    </div>
                  </div>
                  <span className={cn("tabular hidden text-xs sm:inline", hours < 48 ? "font-medium text-destructive" : "text-muted-foreground")}>
                    <Clock className="mr-1 inline size-3" />{formatTimeRemaining(a.dueDate, now)}
                  </span>
                  <StatusBadge status={getEffectiveStatus(a, now)} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function WeeklyWorkloadChart({ className }: { className?: string }) {
  const { data = [], isLoading } = useAssignments();
  const [offset, setOffset] = useState(0);
  const weekOf = addWeeks(new Date(), offset);
  const days = useMemo(() => weeklyWorkload(data, weekOf), [data, offset]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = startOfWeek(weekOf, WEEK_OPTIONS);
  return (
    <Panel className={className} title="Weekly workload"
      description={`${offset === 0 ? "This week" : `Week of ${format(start, "MMM d")}`} · assignments vs. exams & quizzes`}
      action={
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="size-7" onClick={() => setOffset((o) => o - 1)} aria-label="Previous week"><ChevronLeft className="size-4" /></Button>
          {offset !== 0 && <Button size="sm" variant="ghost" className="h-7" onClick={() => setOffset(0)}>Today</Button>}
          <Button size="icon" variant="ghost" className="size-7" onClick={() => setOffset((o) => o + 1)} aria-label="Next week"><ChevronRight className="size-4" /></Button>
        </div>
      }
      bodyClassName="p-4">
      {isLoading ? <Skeleton className="h-60 w-full" /> : (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days} barGap={2}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={24} stroke="var(--muted-foreground)" />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="assignments" name="Assignments" stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="exams" name="Exams & quizzes" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

function SubmissionAlerts({ className }: { className?: string }) {
  const { data = [], isLoading } = useAlerts();
  const { openDetail } = useAssignmentUI();
  return (
    <Panel className={className} title="Submission alerts" description="Overdue, unsubmitted, drafts and resubmissions"
      action={<Button asChild variant="ghost" size="sm"><Link to="/submissions">Guardian <ArrowRight className="size-3.5" /></Link></Button>}>
      {isLoading ? <ListSkeleton rows={4} /> : data.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No alerts" description="Every assignment is on track." />
      ) : (
        <ul className="divide-y">
          {data.slice(0, 6).map((al) => (
            <li key={al.id}>
              <button onClick={() => openDetail(al.assignmentId)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted/40">
                <AlertTriangle className={cn("size-4 shrink-0", al.severity === "critical" ? "text-destructive" : "text-warning")} />
                <span className="flex-1 text-sm">{al.message}</span>
                <StatusBadge status={al.type === "resubmission" ? "resubmission" : al.type === "draft" ? "draft" : al.type === "overdue" ? "overdue" : "not_submitted"} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

const ACTIVITY_ICON: Record<ActivityType, typeof Sparkles> = {
  assignment_discovered: Sparkles,
  deadline_changed: CalendarClock,
  material_added: FileText,
  marked_submitted: CheckCircle2,
  assignment_created: ListTodo,
  assignment_updated: ListTodo,
  assignment_deleted: ListTodo,
  syllabus_imported: FileText,
  event_created: CalendarClock,
};

function RecentActivity({ className }: { className?: string }) {
  const { data = [], isLoading } = useActivity();
  return (
    <Panel className={className} title="Recent activity" description="Demo sync events and your changes">
      {isLoading ? <ListSkeleton rows={4} /> : data.length === 0 ? (
        <EmptyState icon={RefreshCw} title="No activity yet" />
      ) : (
        <ol className="space-y-0 px-5 py-2">
          {data.slice(0, 7).map((it) => {
            const Icon = ACTIVITY_ICON[it.type];
            return (
              <li key={it.id} className="flex gap-3 py-2.5">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                  <Icon className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{it.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{fmtRelative(it.timestamp)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
