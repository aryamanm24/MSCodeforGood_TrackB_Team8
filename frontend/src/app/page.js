"use client";

import dynamic from "next/dynamic";

// Load login page client-only to avoid Lucide SVG hydration mismatch
const LoginPageContent = dynamic(() => import("@/components/LoginPageContent"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: "linear-gradient(135deg, #faf9f6 0%, #f0ebe3 50%, #e8f4f0 100%)",
        color: "#6B645A",
        fontSize: 14,
      }}
    >
      Loading…
    </div>
  ),
});

export default function Page() {
  return <LoginPageContent />;
}
