"use client";

import { useState, useRef } from "react";

const STEPS = ["attendance", "experience", "details", "confirm"];

const STEP_LABELS = {
  attendance: "Did you get help?",
  experience: "Rate your visit",
  details: "Share details",
  confirm: "Review & submit",
};

const NON_ATTEND_REASONS = [
  { value: "closed", label: "Location was closed" },
  { value: "too_late", label: "Arrived too late" },
  { value: "too_far", label: "Too far to travel" },
  { value: "no_food", label: "No food available" },
  { value: "long_wait", label: "Wait was too long" },
  { value: "other", label: "Other reason" },
];

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        margin: "1.5rem 0",
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            transition: "transform 0.15s",
            transform: hovered === star ? "scale(1.2)" : "scale(1)",
          }}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={(hovered || value) >= star ? "#E4A11B" : "none"}
              stroke={(hovered || value) >= star ? "#E4A11B" : "#c0bdb4"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  const pct = ((idx + 1) / STEPS.length) * 100;
  return (
    <div
      style={{
        height: 3,
        background: "#e8e6df",
        borderRadius: 99,
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, #4CAF8F, #2E8B6E)",
          borderRadius: 99,
          transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 24,
        border: selected ? "2px solid #2E8B6E" : "1.5px solid #d0cdc4",
        background: selected ? "#E1F5EE" : "transparent",
        color: selected ? "#0F6E56" : "#5a5955",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: selected ? 500 : 400,
        cursor: "pointer",
        transition: "all 0.15s",
        lineHeight: 1.4,
      }}
    >
      {label}
    </button>
  );
}

function BigChoice({ icon, label, sublabel, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        padding: "20px 24px",
        borderRadius: 16,
        border: selected ? "2px solid #2E8B6E" : "1.5px solid #d0cdc4",
        background: selected ? "#E1F5EE" : "transparent",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        textAlign: "left",
        marginBottom: 12,
        transition: "all 0.15s",
      }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div
          style={{
            fontFamily: "inherit",
            fontSize: 16,
            fontWeight: 500,
            color: selected ? "#085041" : "#2c2c2a",
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontFamily: "inherit",
              fontSize: 13,
              color: selected ? "#0F6E56" : "#888780",
              marginTop: 2,
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
      <div style={{ marginLeft: "auto" }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: selected ? "2px solid #2E8B6E" : "1.5px solid #c0bdb4",
            background: selected ? "#2E8B6E" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

function WaitTimePicker({ value, onChange }) {
  const buckets = [
    { label: "No wait", value: 0 },
    { label: "< 5 min", value: 4 },
    { label: "5–15 min", value: 10 },
    { label: "15–30 min", value: 22 },
    { label: "30–60 min", value: 45 },
    { label: "1hr+", value: 75 },
  ];
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}
    >
      {buckets.map((b) => (
        <Chip
          key={b.value}
          label={b.label}
          selected={value === b.value}
          onClick={() => onChange(b.value)}
        />
      ))}
    </div>
  );
}

const STAR_LABELS = ["", "Poor", "Fair", "Okay", "Good", "Great!"];

export default function FeedbackForm({
  resourceName = "Food Pantry",
  resourceId = "",
  onSubmit = null,
}) {
  const [step, setStep] = useState("attendance");
  const [form, setForm] = useState({
    attended: null,
    didNotAttendReason: "",
    rating: 0,
    waitTimeMinutes: null,
    informationAccurate: null,
    text: "",
    shareTextWithResource: false,
    photoUrl: null,
    photoPublic: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const canAdvance = () => {
    if (step === "attendance") return form.attended !== null;
    if (step === "experience") {
      if (form.attended === false) return !!form.didNotAttendReason;
      return form.rating > 0;
    }
    if (step === "details") return form.informationAccurate !== null;
    return true;
  };

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      ...form,
      resourceId,
      createdAt: new Date().toISOString(),
    };
    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    set("photoUrl", url);
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
          background: "#f7f6f2",
          fontFamily: "'Georgia', serif",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#E1F5EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="#2E8B6E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 24,
            fontWeight: 400,
            color: "#085041",
            margin: "0 0 0.75rem",
            textAlign: "center",
          }}
        >
          Thank you!
        </h2>
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 15,
            color: "#5a5955",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 280,
          }}
        >
          Your feedback helps {resourceName} and other community members. You've
          earned a raffle entry!
        </p>
        <div
          style={{
            marginTop: "2rem",
            padding: "16px 24px",
            background: "white",
            borderRadius: 14,
            border: "1px solid #d8d5ce",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#888780",
              marginBottom: 4,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Your rating
          </div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={form.rating >= s ? "#E4A11B" : "#e0ddd6"}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f6f2",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #eae8e2",
          padding: "16px 20px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <img
            src="https://www.foodhelpline.org/_next/static/media/logo.b8e851d7.svg"
            alt="Lemontree logo"
            width={28}
            height={28}
            style={{
              flexShrink: 0,
              borderRadius: "50%",
              background: "#f7f6f2",
              padding: 4,
            }}
          />
          {STEPS.indexOf(step) > 0 && (
            <button
              type="button"
              onClick={back}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "#5a5955",
                display: "flex",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: "#888780",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 500,
              }}
            >
              {resourceName}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: "#2c2c2a",
                lineHeight: 1.3,
              }}
            >
              {STEP_LABELS[step]}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#888780" }}>
            {STEPS.indexOf(step) + 1}/{STEPS.length}
          </div>
        </div>
        <ProgressBar step={step} />
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: "1.5rem 1.25rem",
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* STEP 1: Attendance */}
        {step === "attendance" && (
          <div>
            <p
              style={{
                fontSize: 15,
                color: "#5a5955",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              Did you receive food or assistance during your visit?
            </p>
            <BigChoice
              icon="✅"
              label="Yes, I got help"
              sublabel="I received food or assistance"
              selected={form.attended === true}
              onClick={() => set("attended", true)}
            />
            <BigChoice
              icon="❌"
              label="No, I didn't get help"
              sublabel="Something prevented me from getting assistance"
              selected={form.attended === false}
              onClick={() => set("attended", false)}
            />
          </div>
        )}

        {/* STEP 2: Experience */}
        {step === "experience" && form.attended === true && (
          <div>
            <p
              style={{
                fontSize: 15,
                color: "#5a5955",
                marginBottom: 0,
                lineHeight: 1.6,
              }}
            >
              How would you rate your overall experience?
            </p>
            <StarRating
              value={form.rating}
              onChange={(v) => set("rating", v)}
            />
            {form.rating > 0 && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: 16,
                  color: "#2E8B6E",
                  fontWeight: 500,
                  margin: "-0.5rem 0 1rem",
                }}
              >
                {STAR_LABELS[form.rating]}
              </p>
            )}
          </div>
        )}

        {step === "experience" && form.attended === false && (
          <div>
            <p
              style={{
                fontSize: 15,
                color: "#5a5955",
                marginBottom: "1.25rem",
                lineHeight: 1.6,
              }}
            >
              What prevented you from getting help?
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {NON_ATTEND_REASONS.map((r) => (
                <Chip
                  key={r.value}
                  label={r.label}
                  selected={form.didNotAttendReason === r.value}
                  onClick={() => set("didNotAttendReason", r.value)}
                />
              ))}
            </div>
            {form.didNotAttendReason === "other" && (
              <textarea
                placeholder="Please describe what happened..."
                value={form.text}
                onChange={(e) => set("text", e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #d0cdc4",
                  fontFamily: "inherit",
                  fontSize: 15,
                  resize: "none",
                  minHeight: 100,
                  boxSizing: "border-box",
                  background: "white",
                  color: "#2c2c2a",
                }}
              />
            )}
          </div>
        )}

        {/* STEP 3: Details */}
        {step === "details" && (
          <div>
            {form.attended === true && (
              <>
                <div style={{ marginBottom: "1.75rem" }}>
                  <label
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#2c2c2a",
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    How long did you wait?
                  </label>
                  <WaitTimePicker
                    value={form.waitTimeMinutes}
                    onChange={(v) => set("waitTimeMinutes", v)}
                  />
                </div>
                <div style={{ marginBottom: "1.75rem" }}>
                  <label
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#2c2c2a",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Share a photo?{" "}
                    <span style={{ fontWeight: 400, color: "#888780" }}>
                      (optional)
                    </span>
                  </label>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#888780",
                      marginBottom: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    Help others see what's available. You can choose whether
                    it's shown publicly.
                  </p>
                  {form.photoUrl ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={form.photoUrl}
                        alt="Review photo"
                        style={{
                          width: "100%",
                          borderRadius: 12,
                          objectFit: "cover",
                          maxHeight: 180,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => set("photoUrl", null)}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "rgba(0,0,0,0.5)",
                          border: "none",
                          color: "white",
                          borderRadius: "50%",
                          width: 28,
                          height: 28,
                          cursor: "pointer",
                          fontSize: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                      <div style={{ marginTop: 10 }}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.photoPublic}
                            onChange={(e) =>
                              set("photoPublic", e.target.checked)
                            }
                            style={{
                              width: 18,
                              height: 18,
                              accentColor: "#2E8B6E",
                            }}
                          />
                          <span style={{ fontSize: 14, color: "#5a5955" }}>
                            Show this photo publicly on Lemontree
                          </span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileRef}
                        onChange={handlePhoto}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{
                          width: "100%",
                          padding: "20px",
                          borderRadius: 12,
                          border: "1.5px dashed #c0bdb4",
                          background: "#faf9f7",
                          cursor: "pointer",
                          color: "#888780",
                          fontFamily: "inherit",
                          fontSize: 14,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#b0ada6"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        Tap to add a photo
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            <div style={{ marginBottom: "1.75rem" }}>
              <label
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#2c2c2a",
                  display: "block",
                  marginBottom: 12,
                }}
              >
                Was the listing information accurate?
              </label>
              <p
                style={{
                  fontSize: 13,
                  color: "#888780",
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                Hours, location, food types, and other details
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <Chip
                  label="Yes, accurate"
                  selected={form.informationAccurate === true}
                  onClick={() => set("informationAccurate", true)}
                />
                <Chip
                  label="No, something was wrong"
                  selected={form.informationAccurate === false}
                  onClick={() => set("informationAccurate", false)}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <label
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#2c2c2a",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Written comments{" "}
                <span style={{ fontWeight: 400, color: "#888780" }}>
                  (optional)
                </span>
              </label>
              <textarea
                placeholder="Anything else you'd like to share about your visit..."
                value={form.text}
                onChange={(e) => set("text", e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #d0cdc4",
                  fontFamily: "inherit",
                  fontSize: 15,
                  resize: "none",
                  minHeight: 100,
                  boxSizing: "border-box",
                  background: "white",
                  color: "#2c2c2a",
                  lineHeight: 1.6,
                }}
              />
              {form.text.length > 0 && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginTop: 12,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.shareTextWithResource}
                    onChange={(e) =>
                      set("shareTextWithResource", e.target.checked)
                    }
                    style={{
                      width: 18,
                      height: 18,
                      marginTop: 2,
                      accentColor: "#2E8B6E",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: 13, color: "#5a5955", lineHeight: 1.5 }}
                  >
                    Share my written comments with {resourceName} so they can
                    improve their service
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Confirm */}
        {step === "confirm" && (
          <div>
            <p
              style={{
                fontSize: 15,
                color: "#5a5955",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              Review your feedback before submitting.
            </p>

            {[
              {
                label: "Got help",
                value:
                  form.attended === true
                    ? "Yes"
                    : form.attended === false
                      ? "No"
                      : "—",
                accent: form.attended === true,
              },
              form.attended === false &&
                form.didNotAttendReason && {
                  label: "Reason",
                  value:
                    NON_ATTEND_REASONS.find(
                      (r) => r.value === form.didNotAttendReason,
                    )?.label || form.didNotAttendReason,
                },
              form.rating > 0 && {
                label: "Rating",
                value: `${form.rating}/5 — ${STAR_LABELS[form.rating]}`,
              },
              form.waitTimeMinutes !== null && {
                label: "Wait time",
                value:
                  form.waitTimeMinutes === 0
                    ? "No wait"
                    : form.waitTimeMinutes < 5
                      ? "Under 5 min"
                      : form.waitTimeMinutes < 15
                        ? "5–15 min"
                        : form.waitTimeMinutes < 30
                          ? "15–30 min"
                          : form.waitTimeMinutes < 60
                            ? "30–60 min"
                            : "Over 1 hour",
              },
              form.informationAccurate !== null && {
                label: "Info accurate",
                value: form.informationAccurate ? "Yes" : "No",
              },
              form.text && {
                label: "Comments",
                value:
                  form.text.length > 80
                    ? form.text.slice(0, 80) + "…"
                    : form.text,
              },
              form.shareTextWithResource && {
                label: "Shared with pantry",
                value: "Yes",
              },
            ]
              .filter(Boolean)
              .map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    padding: "12px 0",
                    borderBottom: "1px solid #eae8e2",
                  }}
                >
                  <span
                    style={{ fontSize: 14, color: "#888780", minWidth: 130 }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: row.accent ? "#0F6E56" : "#2c2c2a",
                      fontWeight: row.accent ? 500 : 400,
                      flex: 1,
                      lineHeight: 1.5,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}

            <div
              style={{
                marginTop: "1.5rem",
                padding: "14px 16px",
                background: "#E1F5EE",
                borderRadius: 12,
                border: "1px solid #9FE1CB",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "#0F6E56",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Your feedback is anonymous. Written comments are only shared
                with the food pantry if you checked the sharing option above.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div
        style={{
          background: "white",
          borderTop: "1px solid #eae8e2",
          padding: "1rem 1.25rem",
          position: "sticky",
          bottom: 0,
        }}
      >
        <button
          type="button"
          disabled={!canAdvance() || submitting}
          onClick={step === "confirm" ? handleSubmit : next}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            border: "none",
            background: canAdvance()
              ? "linear-gradient(135deg, #2E8B6E, #1D9E75)"
              : "#d0cdc4",
            color: canAdvance() ? "white" : "#888780",
            fontFamily: "inherit",
            fontSize: 16,
            fontWeight: 500,
            cursor: canAdvance() ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            letterSpacing: "0.01em",
          }}
        >
          {submitting
            ? "Submitting…"
            : step === "confirm"
              ? "Submit feedback"
              : "Continue →"}
        </button>
      </div>
    </div>
  );
}
