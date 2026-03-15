import dynamic from "next/dynamic";

const ReportBuilder = dynamic(() => import("@/components/ReportBuilder"), {
  ssr: false,
});

export default function ReportBuilderPage() {
  return <ReportBuilder />;
}
