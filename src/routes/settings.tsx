import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/academic/states";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — UniFlow" }, { name: "description", content: "UniFlow settings" }, { property: "og:title", content: "Settings — UniFlow" }, { property: "og:description", content: "UniFlow settings" }] }),
  component: () => <PageIntro title="Settings" description="This page is not finished yet." />,
});
