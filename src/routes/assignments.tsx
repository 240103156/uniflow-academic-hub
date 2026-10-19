import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, ExternalLink, Inbox, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAssignments, useCourses, useSyncHistory, useSyncLMS } from "@/hooks/use-academic";
import { filterAssignments, formatTimeRemaining, getEffectiveStatus, sortAssignments, type AssignmentSort } from "@/lib/academic-logic";
import { SOURCE_LABEL, STATUS_LABEL, fmtDateTime, fmtRelative } from "@/lib/format";
import { CourseTag, DemoBadge, PriorityBadge, StatusBadge, TypeBadge } from "@/components/academic/badges";
import { EmptyState, ErrorState, ListSkeleton, PageIntro, Panel } from "@/components/academic/states";
import { useAssignmentUI } from "@/components/academic/assignment-detail";
import { cn } from "@/lib/utils";
import type { AssignmentStatus } from "@/types/academic";

export const Route = createFileRoute("/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — UniFlow" },
      { name: "description", content: "Every assignment, quiz and exam across your courses, searchable and sortable." },
      { property: "og:title", content: "Assignments — UniFlow" },
      { property: "og:description", content: "Every assignment, quiz and exam across your courses, searchable and sortable." },
    ],
  }),
  component: AssignmentsPage,
});

const STATUSES: AssignmentStatus[] = ["not_submitted", "draft", "submitted", "resubmission", "overdue", "unknown"];

function AssignmentsPage() {
  const { data, isLoading, error, refetch } = useAssignments();
  const { data: courses = [] } = useCourses();
  const { data: history = [] } = useSyncHistory();
  const sync = useSyncLMS();
  const { openDetail, openEditor } = useAssignmentUI();
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [status, setStatus] = useState<AssignmentStatus | "all">("all");
  const [sort, setSort] = useState<AssignmentSort>("deadline_asc");
  const now = new Date();

  const rows = useMemo(
    () => sortAssignments(filterAssignments(data ?? [], { query, courseId, status }, now), sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, query, courseId, status, sort],
  );

  async function runSync() {
    try {
      const r = await sync.mutateAsync();
      toast.success("Demo sync complete", {
        description: `${r.record.itemsDiscovered} sample assignments discovered, ${r.record.itemsUpdated} deadline updated. No real LMS was contacted.`,
      });
    } catch {
      toast.error("Demo sync failed");
    }
  }

  const toggleDeadlineSort = () => setSort((s) => (s === "deadline_asc" ? "deadline_desc" : "deadline_asc"));

  return (
    <div>
      <PageIntro
        title="Deadline Extractor"
        description={`${data?.length ?? "—"} items across ${courses.length} courses${history[0] ? ` · last demo sync ${fmtRelative(history[0].timestamp)}` : ""}`}
        actions={
          <>
            <Button variant="outline" onClick={runSync} disabled={sync.isPending}>
              <RefreshCw className={cn("size-4", sync.isPending && "animate-spin")} />
              {sync.isPending ? "Syncing…" : "Sync with LMS"}
              <DemoBadge className="ml-1 py-0 text-[10px]" />
            </Button>
            <Button onClick={() => openEditor(null)}><Plus className="size-4" /> Add assignment</Button>
          </>
        }
      />
      <Panel>
        <div className="flex flex-col gap-2 border-b p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by title…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
          <div className="grid grid-cols-3 gap-2 md:flex">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as AssignmentStatus | "all")}>
              <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as AssignmentSort)}>
              <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline_asc">Deadline · soonest</SelectItem>
                <SelectItem value="deadline_desc">Deadline · latest</SelectItem>
                <SelectItem value="priority">Priority · highest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? <ListSkeleton rows={8} /> : rows.length === 0 ? (
          <EmptyState icon={Inbox} title="No assignments match" description="Try clearing filters or add one manually."
            action={<Button size="sm" variant="outline" onClick={() => { setQuery(""); setCourseId("all"); setStatus("all"); }}>Clear filters</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Assignment</TableHead>
                <TableHead className="hidden lg:table-cell">Course</TableHead>
                <TableHead>
                  <button onClick={toggleDeadlineSort} className="inline-flex items-center gap-1 hover:text-foreground">Due <ArrowUpDown className="size-3" /></button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  <button onClick={() => setSort("priority")} className="inline-flex items-center gap-1 hover:text-foreground">Priority <ArrowUpDown className="size-3" /></button>
                </TableHead>
                <TableHead className="hidden xl:table-cell">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => {
                const s = getEffectiveStatus(a, now);
                const soon = s !== "submitted" && new Date(a.dueDate) > now && new Date(a.dueDate).getTime() - now.getTime() < 72 * 36e5;
                return (
                  <TableRow key={a.id} className={cn("cursor-pointer", s === "overdue" && "bg-destructive/[0.03]")} onClick={() => openDetail(a.id)}>
                    <TableCell className="max-w-[340px] pl-5">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-8 w-0.5 shrink-0 rounded-full", s === "overdue" ? "bg-destructive" : soon ? "bg-warning" : "bg-transparent")} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{a.title}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <TypeBadge type={a.type} />
                            <span className="truncate text-xs text-muted-foreground lg:hidden">{courses.find((c) => c.id === a.courseId)?.code}</span>
                            <span className="hidden truncate text-xs text-muted-foreground 2xl:inline">{a.description}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell"><CourseTag course={courses.find((c) => c.id === a.courseId)} /></TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p className="tabular text-sm">{fmtDateTime(a.dueDate)}</p>
                      <p className={cn("text-xs", s === "overdue" ? "text-destructive" : soon ? "font-medium text-warning" : "text-muted-foreground")}>
                        {s === "submitted" ? "Done" : formatTimeRemaining(a.dueDate, now)}
                      </p>
                    </TableCell>
                    <TableCell><StatusBadge status={s} /></TableCell>
                    <TableCell className="hidden md:table-cell"><PriorityBadge priority={a.priority} /></TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {SOURCE_LABEL[a.source]}
                        {a.sourceUrl && (
                          <a href={a.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Open original LMS URL" className="hover:text-foreground">
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <p className="border-t px-5 py-2.5 text-xs text-muted-foreground">
          Showing {rows.length} of {data?.length ?? 0}. "Sync with LMS" is a demo that adds sample items — no Moodle or Canvas account is connected.
        </p>
      </Panel>
    </div>
  );
}
