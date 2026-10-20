import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  isToday, parseISO, setHours, startOfDay, startOfMonth, startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses, useCreateEvent, useDeleteEvent, useEvents } from "@/hooks/use-academic";
import { WEEK_OPTIONS } from "@/lib/academic-logic";
import { fmtDateTime, fromLocalInput, toLocalInput } from "@/lib/format";
import { PageIntro } from "@/components/academic/states";
import { CourseTag } from "@/components/academic/badges";
import { useAssignmentUI } from "@/components/academic/assignment-detail";
import { cn } from "@/lib/utils";
import type { AcademicEvent, Course } from "@/types/academic";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — UniFlow" },
      { name: "description", content: "Month and week views of every deadline, exam and personal study event." },
      { property: "og:title", content: "Calendar — UniFlow" },
      { property: "og:description", content: "Month and week views of every deadline, exam and personal study event." },
    ],
  }),
  component: CalendarPage,
});

type View = "month" | "week";

function EventChip({ e, course, onClick, compact }: { e: AcademicEvent; course?: Course; onClick: () => void; compact?: boolean }) {
  const exam = e.type === "exam" || e.type === "quiz";
  const personal = e.type === "personal";
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-left text-[11px] leading-tight transition-colors hover:bg-muted",
        exam && "font-medium",
        personal && "border border-dashed",
      )}
      style={{ backgroundColor: course ? `color-mix(in oklab, ${course.color} 13%, transparent)` : undefined }}
      title={e.title}
    >
      <span className={cn("size-1.5 shrink-0", exam ? "rotate-45 rounded-[1px]" : "rounded-full")} style={{ backgroundColor: course?.color ?? "var(--muted-foreground)" }} />
      {!compact && <span className="tabular text-muted-foreground">{format(parseISO(e.date), "HH:mm")}</span>}
      <span className="truncate">{e.title}</span>
    </button>
  );
}

function CalendarPage() {
  const { data: events, isLoading } = useEvents();
  const { data: courses = [] } = useCourses();
  const { openDetail } = useAssignmentUI();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<AcademicEvent | null>(null);
  const [createAt, setCreateAt] = useState<Date | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const days = useMemo(() => {
    if (view === "week") return eachDayOfInterval({ start: startOfWeek(cursor, WEEK_OPTIONS), end: endOfWeek(cursor, WEEK_OPTIONS) });
    return eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), WEEK_OPTIONS), end: endOfWeek(endOfMonth(cursor), WEEK_OPTIONS) });
  }, [view, cursor]);

  const visible = (events ?? []).filter((e) => !hidden.has(e.courseId ?? "none"));
  const byDay = (d: Date) => visible.filter((e) => isSameDay(parseISO(e.date), d));
  const course = (id: string | null) => courses.find((c) => c.id === id);
  const step = (dir: number) => setCursor((c) => (view === "month" ? addMonths(c, dir) : addWeeks(c, dir)));
  const open = (e: AcademicEvent) => (e.assignmentId ? openDetail(e.assignmentId) : setSelected(e));

  return (
    <div>
      <PageIntro title="Academic calendar" description="Assignments, exams and quizzes appear automatically. Add personal events for study sessions."
        actions={<Button onClick={() => setCreateAt(setHours(startOfDay(new Date()), 18))}><Plus className="size-4" /> New event</Button>} />
      <div className="surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="size-8" onClick={() => step(-1)} aria-label="Previous"><ChevronLeft className="size-4" /></Button>
            <Button size="icon" variant="ghost" className="size-8" onClick={() => step(1)} aria-label="Next"><ChevronRight className="size-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>Today</Button>
          </div>
          <h2 className="ml-2 text-sm font-semibold">
            {view === "month" ? format(cursor, "MMMM yyyy") : `${format(days[0]!, "MMM d")} – ${format(days[6]!, "MMM d, yyyy")}`}
          </h2>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as View)} className="ml-auto" variant="outline" size="sm">
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
            <ToggleGroupItem value="week">Week</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-wrap gap-1.5 border-b px-4 py-2.5">
          {courses.map((c) => {
            const off = hidden.has(c.id);
            return (
              <button key={c.id} onClick={() => setHidden((h) => { const n = new Set(h); off ? n.delete(c.id) : n.add(c.id); return n; })}
                className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-opacity", off && "opacity-40")}>
                <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />{c.name}
              </button>
            );
          })}
          <span className="ml-auto hidden items-center gap-3 text-xs text-muted-foreground md:flex">
            <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-muted-foreground" />Assignment</span>
            <span className="inline-flex items-center gap-1"><span className="size-1.5 rotate-45 bg-muted-foreground" />Exam / quiz</span>
            <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm border border-dashed border-muted-foreground" />Personal</span>
          </span>
        </div>
        <div className="grid grid-cols-7 border-b text-xs font-medium text-muted-foreground">
          {days.slice(0, 7).map((d) => <div key={d.toISOString()} className="px-2 py-2">{format(d, "EEE")}</div>)}
        </div>
        {isLoading ? <Skeleton className="m-4 h-96" /> : (
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const list = byDay(d);
              const max = view === "month" ? 3 : 12;
              return (
                <div key={d.toISOString()}
                  onDoubleClick={() => setCreateAt(setHours(startOfDay(d), 18))}
                  className={cn("group relative border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0",
                    view === "month" ? "min-h-[110px]" : "min-h-[420px]",
                    view === "month" && !isSameMonth(d, cursor) && "bg-muted/30 text-muted-foreground")}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className={cn("tabular flex size-6 items-center justify-center rounded-full text-xs", isToday(d) && "bg-primary font-semibold text-primary-foreground")}>
                      {format(d, "d")}
                    </span>
                    <button onClick={() => setCreateAt(setHours(startOfDay(d), 18))} aria-label="Add event"
                      className="rounded p-0.5 text-muted-foreground opacity-0 hover:bg-muted group-hover:opacity-100">
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {list.slice(0, max).map((e) => <EventChip key={e.id} e={e} course={course(e.courseId)} onClick={() => open(e)} compact={view === "month"} />)}
                    {list.length > max && (
                      <button onClick={() => { setView("week"); setCursor(d); }} className="px-1.5 text-[11px] text-muted-foreground hover:text-foreground">+{list.length - max} more</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <EventDetailDialog event={selected} course={course(selected?.courseId ?? null)} onClose={() => setSelected(null)} />
      <CreateEventDialog at={createAt} onClose={() => setCreateAt(null)} courses={courses} />
    </div>
  );
}

function EventDetailDialog({ event, course, onClose }: { event: AcademicEvent | null; course?: Course; onClose: () => void }) {
  const del = useDeleteEvent();
  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle>{event.title}</DialogTitle>
              <DialogDescription>{fmtDateTime(event.date)} · Personal event</DialogDescription>
            </DialogHeader>
            {course && <CourseTag course={course} />}
            {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
            <DialogFooter>
              <Button variant="ghost" className="text-destructive hover:text-destructive"
                onClick={async () => { await del.mutateAsync(event.id); toast.success("Event deleted"); onClose(); }}>
                <Trash2 className="size-4" /> Delete
              </Button>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateEventDialog({ at, onClose, courses }: { at: Date | null; onClose: () => void; courses: Course[] }) {
  const create = useCreateEvent();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [courseId, setCourseId] = useState("none");
  const [description, setDescription] = useState("");
  const [lastAt, setLastAt] = useState<Date | null>(null);
  if (at !== lastAt) {
    setLastAt(at);
    if (at) { setTitle(""); setDescription(""); setCourseId("none"); setDate(toLocalInput(at.toISOString())); }
  }
  return (
    <Dialog open={!!at} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New personal event</DialogTitle>
          <DialogDescription>Study sessions, office hours, group meetings — saved in this browser.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) { toast.error("Title is required"); return; }
          await create.mutateAsync({ title, date: fromLocalInput(date), courseId: courseId === "none" ? null : courseId, description: description || undefined });
          toast.success("Event added to calendar");
          onClose();
        }}>
          <div className="grid gap-1.5"><Label htmlFor="e-title">Title</Label><Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="e-date">Date & time</Label><Input id="e-date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course</SelectItem>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="e-desc">Notes</Label><Textarea id="e-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>Add event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

