import { createContext, useContext, useState, type ReactNode } from "react";
import { ExternalLink, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAssignments, useCourses, useDeleteAssignment, useUpdateAssignment } from "@/hooks/use-academic";
import { formatTimeRemaining, getEffectiveStatus } from "@/lib/academic-logic";
import { SOURCE_LABEL, TYPE_LABEL, fmtDateTime, fmtRelative } from "@/lib/format";
import { CourseTag, PriorityBadge, StatusBadge, TypeBadge } from "./badges";
import { AssignmentFormDialog } from "./assignment-form-dialog";
import type { Assignment } from "@/types/academic";

interface Ctx {
  openDetail: (id: string) => void;
  openEditor: (a?: Assignment | null, courseId?: string) => void;
}
const DetailCtx = createContext<Ctx>({ openDetail: () => {}, openEditor: () => {} });
export const useAssignmentUI = () => useContext(DetailCtx);

export function AssignmentUIProvider({ children }: { children: ReactNode }) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; a: Assignment | null; courseId?: string }>({ open: false, a: null });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: assignments = [] } = useAssignments();
  const { data: courses = [] } = useCourses();
  const update = useUpdateAssignment();
  const del = useDeleteAssignment();

  const a = assignments.find((x) => x.id === detailId) ?? null;
  const course = courses.find((c) => c.id === a?.courseId);
  const now = new Date();
  const status = a ? getEffectiveStatus(a, now) : "unknown";
  const deletable = a?.source === "manual" || a?.source === "syllabus";

  return (
    <DetailCtx.Provider
      value={{
        openDetail: setDetailId,
        openEditor: (x, courseId) => setEditor({ open: true, a: x ?? null, courseId }),
      }}
    >
      {children}
      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {a ? (
            <>
              <SheetHeader className="space-y-2 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={status} />
                  <TypeBadge type={a.type} />
                </div>
                <SheetTitle className="text-lg leading-snug">{a.title}</SheetTitle>
                <SheetDescription asChild><div><CourseTag course={course} /></div></SheetDescription>
              </SheetHeader>
              <dl className="mt-6 grid grid-cols-[120px_1fr] gap-y-3 text-sm">
                <dt className="text-muted-foreground">Due</dt>
                <dd>
                  {fmtDateTime(a.dueDate)}
                  <span className={status === "overdue" ? "ml-2 text-destructive" : "ml-2 text-muted-foreground"}>
                    {formatTimeRemaining(a.dueDate, now)}
                  </span>
                </dd>
                <dt className="text-muted-foreground">Priority</dt>
                <dd><PriorityBadge priority={a.priority} /></dd>
                <dt className="text-muted-foreground">Type</dt>
                <dd>{TYPE_LABEL[a.type]}</dd>
                <dt className="text-muted-foreground">Estimate</dt>
                <dd>
                  {a.estimatedHours != null ? `${a.estimatedHours} h` : "Not set"}
                  {a.estimateSource === "sample" && <span className="ml-2 text-xs text-muted-foreground">(sample estimate)</span>}
                </dd>
                <dt className="text-muted-foreground">Source</dt>
                <dd>{SOURCE_LABEL[a.source]}</dd>
                <dt className="text-muted-foreground">ID</dt>
                <dd className="font-mono text-xs text-muted-foreground">{a.id}</dd>
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="text-muted-foreground">{fmtRelative(a.updatedAt)}</dd>
              </dl>
              {a.description && <p className="mt-6 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">{a.description}</p>}
              {a.sourceUrl && (
                <div className="mt-4 text-sm">
                  <a href={a.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    Open original LMS page <ExternalLink className="size-3.5" />
                  </a>
                  {a.source !== "manual" && <p className="mt-1 text-xs text-muted-foreground">Demo link — points to a placeholder, not a live LMS.</p>}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditor({ open: true, a })}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                {a.status !== "submitted" && a.type !== "exam" && (
                  <Button size="sm" variant="outline" disabled={update.isPending}
                    onClick={async () => {
                      await update.mutateAsync({ id: a.id, patch: { status: "submitted" } });
                      toast.success("Marked as submitted in UniFlow", { description: "This does not submit anything to your LMS." });
                    }}>
                    <CheckCircle2 className="size-3.5" /> Mark as submitted
                  </Button>
                )}
                {deletable && (
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                )}
              </div>
              {!deletable && <p className="mt-3 text-xs text-muted-foreground">Synced items can't be deleted — only manually created or syllabus-imported ones.</p>}
            </>
          ) : (
            <SheetHeader><SheetTitle>Assignment not found</SheetTitle></SheetHeader>
          )}
        </SheetContent>
      </Sheet>
      <AssignmentFormDialog
        open={editor.open}
        onOpenChange={(o) => setEditor((s) => ({ ...s, open: o }))}
        assignment={editor.a}
        defaultCourseId={editor.courseId}
      />
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this assignment?</AlertDialogTitle>
            <AlertDialogDescription>"{a?.title}" will be removed from UniFlow. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!a) return;
                try {
                  await del.mutateAsync(a.id);
                  setDetailId(null);
                  toast.success("Assignment deleted");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Delete failed");
                }
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DetailCtx.Provider>
  );
}
