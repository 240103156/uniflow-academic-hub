import { useEffect, useState } from "react";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCourses, useCreateAssignment, useUpdateAssignment } from "@/hooks/use-academic";
import { PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL, fromLocalInput, toLocalInput } from "@/lib/format";
import type { Assignment, AssignmentInput, AssignmentStatus, AssignmentType, Priority } from "@/types/academic";

const STATUSES: AssignmentStatus[] = ["not_submitted", "draft", "submitted", "resubmission", "unknown"];

function blank(courseId: string): AssignmentInput {
  return {
    courseId,
    title: "",
    description: "",
    dueDate: setMinutes(setHours(addDays(startOfDay(new Date()), 7), 23), 59).toISOString(),
    status: "not_submitted",
    priority: "medium",
    type: "assignment",
    estimatedHours: null,
    estimateSource: null,
    source: "manual",
    sourceUrl: null,
  };
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  assignment,
  defaultCourseId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  assignment?: Assignment | null;
  defaultCourseId?: string;
}) {
  const { data: courses = [] } = useCourses();
  const create = useCreateAssignment();
  const update = useUpdateAssignment();
  const [form, setForm] = useState<AssignmentInput>(blank(""));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (assignment) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = assignment;
      setForm(rest);
    } else setForm(blank(defaultCourseId ?? courses[0]?.id ?? ""));
  }, [open, assignment, defaultCourseId, courses]);

  const set = <K extends keyof AssignmentInput>(key: K, v: AssignmentInput[K]) => setForm((f) => ({ ...f, [key]: v }));
  const pending = create.isPending || update.isPending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.courseId) return setError("Choose a course.");
    try {
      if (assignment) {
        await update.mutateAsync({ id: assignment.id, patch: form });
        toast.success("Assignment updated");
      } else {
        await create.mutateAsync(form);
        toast.success("Assignment added");
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{assignment ? "Edit assignment" : "Add assignment"}</DialogTitle>
          <DialogDescription>
            {assignment && assignment.source !== "manual"
              ? "Edits are stored locally in UniFlow and are not sent to your LMS."
              : "Manually added items are stored in this browser."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="a-title">Title</Label>
            <Input id="a-title" value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Course</Label>
              <Select value={form.courseId} onValueChange={(v) => set("courseId", v)}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v as AssignmentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="a-due">Due date</Label>
              <Input id="a-due" type="datetime-local" value={toLocalInput(form.dueDate)}
                onChange={(e) => e.target.value && set("dueDate", fromLocalInput(e.target.value))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="a-hours">Estimated hours</Label>
              <Input id="a-hours" type="number" min={0} step={0.5} placeholder="Optional"
                value={form.estimatedHours ?? ""}
                onChange={(e) => {
                  const v = e.target.value === "" ? null : Number(e.target.value);
                  setForm((f) => ({ ...f, estimatedHours: v, estimateSource: v === null ? null : "user" }));
                }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as AssignmentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="a-desc">Description</Label>
            <Textarea id="a-desc" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="a-url">Original LMS URL</Label>
            <Input id="a-url" type="url" placeholder="https://…" value={form.sourceUrl ?? ""}
              onChange={(e) => set("sourceUrl", e.target.value || null)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : assignment ? "Save changes" : "Add assignment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
