import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertOctagon, AlertTriangle, ExternalLink, FileWarning, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlerts, useAssignments, useCourses } from "@/hooks/use-academic";
import { getEffectiveStatus, sortAssignments } from "@/lib/academic-logic";
import { STATUS_LABEL, fmtDateTime } from "@/lib/format";
import { CourseTag, StatusBadge } from "@/components/academic/badges";
import { EmptyState, ListSkeleton, PageIntro, Panel } from "@/components/academic/states";
import { useAssignmentUI } from "@/components/academic/assignment-detail";
import { cn } from "@/lib/utils";
import type { AssignmentStatus } from "@/types/academic";

export const Route = createFileRoute("/submissions")({
  head: () => ({
    meta: [
      { title: "Submission Guardian — UniFlow" },
      { name: "description", content: "Catch drafts, missing submissions and resubmission requests before they cost you." },
      { property: "og:title", content: "Submission Guardian — UniFlow" },
      { property: "og:description", content: "Catch drafts, missing submissions and resubmission requests before they cost you." },
    ],
  }),
  component: SubmissionsPage,
});

const ORDER: AssignmentStatus[] = ["overdue", "resubmission", "draft", "not_submitted", "unknown", "submitted"];

function SubmissionsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const { data: assignments = [] } = useAssignments();
  const { data: courses = [] } = useCourses();
  const { openDetail } = useAssignmentUI();
  const [status, setStatus] = useState<AssignmentStatus | "all">("all");
  const now = new Date();
  const counts = ORDER.map((s) => ({ s, n: assignments.filter((a) => getEffectiveStatus(a, now) === s).length }));
  const rows = useMemo(
    () => sortAssignments(assignments.filter((a) => status === "all" || getEffectiveStatus(a, now) === status), "deadline_asc"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assignments, status],
  );
  const byId = (id: string) => assignments.find((a) => a.id === id);

  return (
    <div className="space-y-6">
      <PageIntro title="Submission Guardian" description="Statuses come from the demo data service. UniFlow never submits anything to Moodle or Canvas." />
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {counts.map(({ s, n }) => (
          <button key={s} onClick={() => setStatus(status === s ? "all" : s)}
            className={cn("surface p-3 text-left transition-colors hover:border-foreground/20", status === s && "border-primary ring-1 ring-primary")}>
            <StatusBadge status={s} />
            <p className="tabular mt-2 text-2xl font-semibold">{n}</p>
          </button>
        ))}
      </div>

      <Panel title="Assignments requiring attention" description={`${alerts.length} items need action`}>
        {isLoading ? <ListSkeleton rows={3} /> : alerts.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="All clear" description="No overdue work, drafts or resubmission requests." />
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {alerts.map((al) => {
              const a = byId(al.assignmentId);
              const Icon = al.type === "overdue" ? AlertOctagon : al.type === "resubmission" ? FileWarning : AlertTriangle;
              return (
                <div key={al.id} className={cn("flex flex-col rounded-lg border p-4", al.severity === "critical" ? "tone-danger" : "tone-warning")}>
                  <div className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 size-4 shrink-0" />
                    <p className="text-sm font-medium text-foreground">{al.message}</p>
                  </div>
                  {a && <p className="mt-2 pl-6 text-xs text-muted-foreground">Due {fmtDateTime(a.dueDate)}</p>}
                  <div className="mt-3 flex gap-2 pl-6">
                    <Button size="sm" variant="outline" className="h-7 bg-background" onClick={() => openDetail(al.assignmentId)}>Details</Button>
                    {a?.sourceUrl && (
                      <Button size="sm" variant="ghost" className="h-7" asChild>
                        <a href={a.sourceUrl} target="_blank" rel="noreferrer">Open in LMS (demo) <ExternalLink className="size-3" /></a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="All submission statuses" description={status === "all" ? "Every assignment" : `Filtered: ${STATUS_LABEL[status]}`}
        action={status !== "all" && <Button size="sm" variant="ghost" onClick={() => setStatus("all")}>Clear filter</Button>}>
        <Table>
          <TableHeader><TableRow><TableHead className="pl-5">Assignment</TableHead><TableHead className="hidden md:table-cell">Course</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id} className="cursor-pointer" onClick={() => openDetail(a.id)}>
                <TableCell className="pl-5 font-medium">{a.title}</TableCell>
                <TableCell className="hidden md:table-cell"><CourseTag course={courses.find((c) => c.id === a.courseId)} /></TableCell>
                <TableCell className="tabular whitespace-nowrap text-muted-foreground">{fmtDateTime(a.dueDate)}</TableCell>
                <TableCell><StatusBadge status={getEffectiveStatus(a, now)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}
