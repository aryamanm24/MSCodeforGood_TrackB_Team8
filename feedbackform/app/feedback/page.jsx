"use client";

import { useSearchParams } from "next/navigation";
import FeedbackForm from "../components/FeedbackForm";

export default function FeedbackPage() {
  const params = useSearchParams();
  const resourceId = params.get("resourceId") || "";
  const name = params.get("name") || "Food Pantry";

  return (
    <FeedbackForm
      resourceName={decodeURIComponent(name)}
      resourceId={decodeURIComponent(resourceId)}
    />
  );
}
