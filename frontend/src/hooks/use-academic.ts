import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAcademicService } from "@/services";
import type {
  AssignmentInput,
  AssignmentPatch,
  ExtractedEvent,
  PersonalEventInput,
  WorkloadFilters,
} from "@/types/academic";

const svc = () => getAcademicService();
const k = (...parts: unknown[]) => ["academic", ...parts];

// Queries only run in the browser (mock data lives in localStorage).
const opts = { enabled: typeof window !== "undefined" };

export const useSummary = () => useQuery({ queryKey: k("summary"), queryFn: () => svc().getDashboardSummary(), ...opts });
export const useCourses = () => useQuery({ queryKey: k("courses"), queryFn: () => svc().getCourses(), ...opts });
export const useCourse = (id: string) => useQuery({ queryKey: k("course", id), queryFn: () => svc().getCourseById(id), ...opts });
export const useAssignments = () => useQuery({ queryKey: k("assignments"), queryFn: () => svc().getAssignments(), ...opts });
export const useMaterials = () => useQuery({ queryKey: k("materials"), queryFn: () => svc().getMaterials(), ...opts });
export const useEvents = () => useQuery({ queryKey: k("events"), queryFn: () => svc().getAcademicEvents(), ...opts });
export const useAlerts = () => useQuery({ queryKey: k("alerts"), queryFn: () => svc().getSubmissionAlerts(), ...opts });
export const useActivity = () => useQuery({ queryKey: k("activity"), queryFn: () => svc().getActivity(), ...opts });
export const useSyncHistory = () => useQuery({ queryKey: k("sync"), queryFn: () => svc().getSyncHistory(), ...opts });
export const useWorkload = (f: WorkloadFilters) =>
  useQuery({ queryKey: k("workload", f), queryFn: () => svc().getWorkloadAnalytics(f), placeholderData: (p) => p, ...opts });

function useInvalidating<TArgs, TRes>(fn: (args: TArgs) => Promise<TRes>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["academic"] }),
  });
}

export const useCreateAssignment = () => useInvalidating((d: AssignmentInput) => svc().createAssignment(d));
export const useUpdateAssignment = () =>
  useInvalidating(({ id, patch }: { id: string; patch: AssignmentPatch }) => svc().updateAssignment(id, patch));
export const useDeleteAssignment = () => useInvalidating((id: string) => svc().deleteAssignment(id));
export const useSyncLMS = () => useInvalidating((_: void) => svc().syncLMS());
export const useCreateEvent = () => useInvalidating((d: PersonalEventInput) => svc().createPersonalEvent(d));
export const useDeleteEvent = () => useInvalidating((id: string) => svc().deletePersonalEvent(id));
export const useImportSyllabus = () =>
  useInvalidating(({ courseId, events }: { courseId: string; events: ExtractedEvent[] }) =>
    svc().importSyllabusEvents(courseId, events),
  );
export const useResetDemo = () => useInvalidating((_: void) => svc().resetDemoData());
