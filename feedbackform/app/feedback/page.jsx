"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FeedbackForm from "../components/FeedbackForm";

// useSearchParams() must be inside a Suspense boundary in Next.js App Router
function FeedbackFormWithParams() {
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

export default function FeedbackPage() {
  return (
    <Suspense fallback={null}>
      <FeedbackFormWithParams />
    </Suspense>
  );
}
