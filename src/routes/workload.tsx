import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/academic/states";

export const Route = createFileRoute("/workload")({
  head: () => ({ meta: [{ title: "Workload — UniFlow" }, { name: "description", content: "UniFlow workload" }, { property: "og:title", content: "Workload — UniFlow" }, { property: "og:description", content: "UniFlow workload" }] }),
  component: () => <PageIntro title="Workload" description="This page is not finished yet." />,
});
