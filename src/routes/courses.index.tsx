import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssignments, useCourses } from "@/hooks/use-academic";
import { aggregateByCourse } from "@/lib/academic-logic";
import { EmptyState, PageIntro } from "@/components/academic/states";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Courses — UniFlow" },
      { name: "description", content: "Your enrolled courses with instructors, assignments and upcoming deadlines." },
      { property: "og:title", content: "Courses — UniFlow" },
      { property: "og:description", content: "Your enrolled courses with instructors, assignments and upcoming deadlines." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const { data: courses, isLoading } = useCourses();
  const { data: assignments = [] } = useAssignments();
  const stats = useMemo(() => aggregateByCourse(courses ?? [], assignments, new Date()), [courses, assignments]);

  return (
    <div>
      <PageIntro title="Courses" description="Fall 2026 · click a course for its overview, materials and exams." />
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : !courses?.length ? (
        <EmptyState icon={BookOpen} title="No courses yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => {
            const s = stats.find((x) => x.courseId === c.id);
            const pct = s && s.total ? Math.round((s.submitted / s.total) * 100) : 0;
            return (
              <Link key={c.id} to="/courses/$courseId" params={{ courseId: c.id }} className="surface group relative overflow-hidden p-5 transition-colors hover:border-foreground/20">
                <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: c.color }} />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{c.code}</p>
                    <h3 className="mt-1 font-semibold tracking-tight">{c.name}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{c.instructor}</p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                  <div><p className="tabular text-lg font-semibold">{s?.total ?? 0}</p><p className="text-xs text-muted-foreground">Assignments</p></div>
                  <div><p className="tabular text-lg font-semibold">{s?.upcoming ?? 0}</p><p className="text-xs text-muted-foreground">Due in 14d</p></div>
                  <div><p className={`tabular text-lg font-semibold ${s?.overdue ? "text-destructive" : ""}`}>{s?.overdue ?? 0}</p><p className="text-xs text-muted-foreground">Overdue</p></div>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Submitted</span><span className="tabular">{pct}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} /></div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
