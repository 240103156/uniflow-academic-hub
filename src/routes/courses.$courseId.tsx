import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, FileText, GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssignments, useCourse, useMaterials } from "@/hooks/use-academic";
import { aggregateByCourse, formatTimeRemaining, getEffectiveStatus, sortAssignments } from "@/lib/academic-logic";
import { STATUS_LABEL, fmtBytes, fmtDate, fmtDateTime } from "@/lib/format";
import { PriorityBadge, StatusBadge, TypeBadge } from "@/components/academic/badges";
import { EmptyState, Panel } from "@/components/academic/states";
import { useAssignmentUI } from "@/components/academic/assignment-detail";
import { MaterialIcon } from "@/components/academic/material-icon";
import type { AssignmentStatus } from "@/types/academic";

export const Route = createFileRoute("/courses/$courseId")({
  head: () => ({
    meta: [
      { title: "Course overview — UniFlow" },
      { name: "description", content: "Course assignments, lecture materials, exams and submission status." },
      { property: "og:title", content: "Course overview — UniFlow" },
      { property: "og:description", content: "Course assignments, lecture materials, exams and submission status." },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { courseId } = Route.useParams();
  const { data: course, isLoading } = useCourse(courseId);
  const { data: all = [] } = useAssignments();
  const { data: allMaterials = [] } = useMaterials();
  const { openDetail, openEditor } = useAssignmentUI();
  const now = new Date();
  const assignments = useMemo(() => sortAssignments(all.filter((a) => a.courseId === courseId), "deadline_asc"), [all, courseId]);
  const materials = allMaterials.filter((m) => m.courseId === courseId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const exams = assignments.filter((a) => (a.type === "exam" || a.type === "quiz") && new Date(a.dueDate) > now);
  const stats = course ? aggregateByCourse([course], assignments, now)[0] : null;
  const statusCounts = assignments.reduce<Partial<Record<AssignmentStatus, number>>>((acc, a) => {
    const s = getEffectiveStatus(a, now);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  if (isLoading) return <Skeleton className="h-64" />;
  if (!course) return (
    <EmptyState icon={GraduationCap} title="Course not found" description="It may have been removed."
      action={<Button asChild variant="outline" size="sm"><Link to="/courses">Back to courses</Link></Button>} />
  );

  return (
    <div className="space-y-6">
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Courses</Link>
      <div className="surface relative overflow-hidden p-6">
        <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: course.color }} />
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{course.code} · {course.credits} credits · {course.semester}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{course.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{course.instructor} · {course.schedule}</p>
            <p className="mt-3 max-w-2xl text-sm">{course.description}</p>
          </div>
          <Button variant="outline" onClick={() => openEditor(null, course.id)}><Plus className="size-4" /> Add assignment</Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
          {[["Assignments", stats?.total], ["Pending", stats?.pending], ["Submitted", stats?.submitted], ["Overdue", stats?.overdue]].map(([l, v]) => (
            <div key={l as string}><p className="tabular text-xl font-semibold">{v ?? 0}</p><p className="text-xs text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Coursework">
          <Tabs defaultValue="assignments">
            <TabsList className="mx-5 mt-3">
              <TabsTrigger value="assignments">Assignments ({assignments.length})</TabsTrigger>
              <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="assignments">
              {assignments.length === 0 ? <EmptyState icon={FileText} title="No assignments" /> : (
                <ul className="divide-y">
                  {assignments.map((a) => {
                    const s = getEffectiveStatus(a, now);
                    return (
                      <li key={a.id}>
                        <button onClick={() => openDetail(a.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted/40">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{a.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{fmtDateTime(a.dueDate)} · {s === "submitted" ? "done" : formatTimeRemaining(a.dueDate, now)}</p>
                          </div>
                          <TypeBadge type={a.type} />
                          <span className="hidden sm:inline"><PriorityBadge priority={a.priority} /></span>
                          <StatusBadge status={s} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="materials">
              {materials.length === 0 ? <EmptyState icon={FileText} title="No materials yet" /> : (
                <ul className="divide-y">
                  {materials.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                      <MaterialIcon type={m.type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.topic} · {fmtBytes(m.size)} · {fmtDate(m.uploadedAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t px-5 py-2.5"><Button asChild variant="link" size="sm" className="px-0"><Link to="/materials" search={{ q: "" }}>Open materials library</Link></Button></div>
            </TabsContent>
          </Tabs>
        </Panel>
        <div className="space-y-6">
          <Panel title="Upcoming exams & quizzes">
            {exams.length === 0 ? <p className="px-5 py-6 text-sm text-muted-foreground">No upcoming exams.</p> : (
              <ul className="divide-y">
                {exams.map((e) => (
                  <li key={e.id}>
                    <button onClick={() => openDetail(e.id)} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-muted/40">
                      <div><p className="text-sm font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{fmtDateTime(e.dueDate)}</p></div>
                      <span className="tabular text-xs text-muted-foreground">{formatTimeRemaining(e.dueDate, now)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Submission statuses" bodyClassName="p-5 space-y-2">
            {(Object.keys(statusCounts) as AssignmentStatus[]).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <StatusBadge status={s} /><span className="tabular text-sm">{statusCounts[s]}</span>
              </div>
            ))}
            {assignments.length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
            <p className="pt-2 text-xs text-muted-foreground">{STATUS_LABEL.unknown} = status not reported by the (demo) LMS, typical for exams.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
