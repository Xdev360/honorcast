"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { submitApplication, uploadApplicationFile } from "@/lib/db";
import {
  type ApplicationFormStep,
  loadApplicationStepsFromStorage,
  serializeExtraAnswers,
} from "@/lib/hc-form-sync";

function InfoTip({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        marginLeft: 6,
        verticalAlign: "middle",
      }}
    >
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "1.5px solid #000",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 700,
          cursor: "pointer",
          userSelect: "none",
          color: "#000",
          flexShrink: 0,
          lineHeight: 1,
          background: "transparent",
          padding: 0,
        }}
        aria-label="More information"
      >
        i
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              left: 0,
              top: 22,
              width: 240,
              background: "#000",
              color: "#fff",
              fontSize: 11,
              lineHeight: 1.6,
              padding: "10px 12px",
              zIndex: 100,
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0,0,0,.15)",
            }}
          >
            {note}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

const FALLBACK_STEPS: ApplicationFormStep[] = [
  {
    category: 1,
    categoryName: "Personal Identity & Contact",
    field: "fullName",
    label: "Full Legal Name",
    note: "Must match the name on your Social Security card for accurate tax reporting and legal contract execution.",
    type: "text",
    placeholder: "Your full legal name",
    required: true,
  },
  {
    category: 1,
    categoryName: "Personal Identity & Contact",
    field: "address",
    label: "Residential Address",
    note: "We require a physical address (no P.O. Boxes) to determine shipping of your model gear via secure carriers (UPS/FedEx).",
    type: "address",
    placeholder: "Street address",
    placeholder2: "City, State, ZIP",
    required: true,
  },
  {
    category: 1,
    categoryName: "Personal Identity & Contact",
    field: "phone",
    label: "Phone Number",
    note: "Primary contact for drop alerts and partnership coordination.",
    type: "tel",
    placeholder: "+1 (000) 000-0000",
    required: true,
  },
  {
    category: 1,
    categoryName: "Personal Identity & Contact",
    field: "email",
    label: "Email Address",
    note: "Primary contact for drop alerts and partnership coordination.",
    type: "email",
    placeholder: "your@email.com",
    required: true,
  },
  {
    category: 1,
    categoryName: "Personal Identity & Contact",
    field: "dob",
    label: "Date of Birth",
    note: "To verify you are 18+ and legally eligible to enter into a Promotional Partnership Agreement.",
    type: "date",
    required: true,
  },
  {
    category: 2,
    categoryName: "Physical Fit & Athletic Specs",
    field: "heightSize",
    label: "Height & Standard Sizing",
    note: "Please provide your standard sizes (e.g., Men's M, Women's 4/6) to ensure our performance fabrics drape correctly on your frame.",
    type: "dual",
    placeholder: `Height (e.g. 6'1")`,
    placeholder2: "Clothing size (e.g. M / L)",
    required: true,
  },
  {
    category: 2,
    categoryName: "Physical Fit & Athletic Specs",
    field: "buildType",
    label: "Athletic Build Type",
    note: "This helps us select the right product variety for our launch campaign.",
    type: "select",
    options: [
      "Select your build type",
      "Lean / Endurance",
      "Muscular / Hypertrophy",
      "Powerlifter / Strength",
      "Calisthenics / Functional",
      "CrossFit / Mixed Modal",
    ],
    required: true,
  },
  {
    category: 2,
    categoryName: "Physical Fit & Athletic Specs",
    field: "inseam",
    label: "Inseam Preference",
    note: 'Do you prefer 5", 7", or 9" lengths for performance shorts? This helps us select the right fit for your shoots.',
    type: "radio",
    options: [
      '5" — Short & athletic',
      '7" — Standard performance',
      '9" — Extended coverage',
    ],
    required: true,
  },
  {
    category: 3,
    categoryName: "Digital Presence & Social Alignment",
    field: "instagram",
    label: "Instagram Handle",
    note: "We review your content to ensure your personal brand aligns with our Elite Lifestyle and Minimalist visual standards.",
    type: "text",
    placeholder: "@yourhandle",
    required: true,
  },
  {
    category: 3,
    categoryName: "Digital Presence & Social Alignment",
    field: "tiktok",
    label: "TikTok Handle",
    note: "Optional but recommended. We review your content to ensure alignment with our brand standards.",
    type: "text",
    placeholder: "@yourhandle (optional)",
    required: false,
  },
  {
    category: 3,
    categoryName: "Digital Presence & Social Alignment",
    field: "youtube",
    label: "YouTube Handle",
    note: "Optional. If you create long-form content, this helps us understand your full creative range.",
    type: "text",
    placeholder: "@yourchannel (optional)",
    required: false,
  },
  {
    category: 3,
    categoryName: "Digital Presence & Social Alignment",
    field: "contentStyle",
    label: "Primary Content Style",
    note: "Understanding your content style helps us plan shoots and campaigns that align with your strengths.",
    type: "radio",
    options: [
      "High-fidelity photographer",
      "Short-form video creator",
      "Both photo and video",
      "Lifestyle / Story-based content",
    ],
    required: true,
  },
  {
    category: 3,
    categoryName: "Digital Presence & Social Alignment",
    field: "photo",
    label: "Upload a Clear Photo",
    note: "A clear front-facing photo helps us assess your look for the campaign. Natural lighting preferred, no filters.",
    type: "photo",
    required: true,
  },
  {
    category: 3,
    categoryName: "Digital Presence & Social Alignment",
    field: "video",
    label: "Upload a Short Video",
    note: "Front and side view. Max 30 seconds. This helps us see how you carry yourself and move. No editing needed.",
    type: "video",
    required: true,
  },
];

type FormValue = string | string[] | File | undefined;

export default function FormPage() {
  const params = useParams();
  const orderIdParam = params.orderId;
  const orderIdDisplay = Array.isArray(orderIdParam)
    ? orderIdParam[0]
    : orderIdParam ?? "";

  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<Record<string, FormValue>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [steps, setSteps] = useState<ApplicationFormStep[]>(FALLBACK_STEPS);

  useEffect(() => {
    const load = () => {
      setSteps(loadApplicationStepsFromStorage(FALLBACK_STEPS));
    };
    load();
    const onHonorLocal = () => load();
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    window.addEventListener("honor-local-storage", onHonorLocal);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("focus", load);
      window.removeEventListener("honor-local-storage", onHonorLocal);
    };
  }, []);

  useEffect(() => {
    setStep((s) => Math.min(s, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  const photoFieldKey = useMemo(
    () => steps.find((s) => s.type === "photo")?.field ?? "photo",
    [steps],
  );
  const photoFile = data[photoFieldKey] instanceof File ? data[photoFieldKey] : null;
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const current = steps[step];
  const progress = steps.length ? ((step + 1) / steps.length) * 100 : 0;
  const isLast = steps.length > 0 && step === steps.length - 1;

  const update = (key: string, val: FormValue) =>
    setData((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const s = current;
    const val = data[s.field];
    if (!s.required) return true;
    if (
      s.type === "text" ||
      s.type === "email" ||
      s.type === "tel" ||
      s.type === "textarea"
    ) {
      if (!val || String(val).trim() === "") {
        setError("This field is required.");
        return false;
      }
    }
    if (s.type === "number") {
      if (val === undefined || val === null || String(val).trim() === "") {
        setError("This field is required.");
        return false;
      }
    }
    if (s.type === "date") {
      if (!val || typeof val !== "string") {
        setError("Please enter your date of birth.");
        return false;
      }
      const age = Math.floor(
        (Date.now() - new Date(val).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      );
      if (age < 18) {
        setError("You must be 18 or older to apply.");
        return false;
      }
    }
    if (s.type === "address") {
      const a = (Array.isArray(val) ? val : data[s.field]) as string[] | undefined;
      const line0 = a?.[0];
      const line1 = a?.[1];
      if (!line0 || !line1) {
        setError("Please fill in your full address.");
        return false;
      }
    }
    if (s.type === "dual") {
      const a = (Array.isArray(val) ? val : data[s.field]) as string[] | undefined;
      if (!a?.[0] || !a?.[1]) {
        setError("Please fill in both fields.");
        return false;
      }
    }
    if (s.type === "select") {
      const first = s.options![0];
      if (!val || val === first) {
        setError("Please select an option.");
        return false;
      }
    }
    if (s.type === "radio") {
      if (!val) {
        setError("Please select an option.");
        return false;
      }
    }
    if (s.type === "photo" || s.type === "video") {
      if (!val || !(val instanceof File)) {
        setError("Please upload a file to continue.");
        return false;
      }
    }
    return true;
  };

  const next = async () => {
    if (!validate()) return;
    setError("");
    if (isLast) {
      setSubmitting(true);
      setError("");
      const oid = orderIdDisplay;
      if (!oid) {
        setError("Missing order ID.");
        setSubmitting(false);
        return;
      }
      try {
        const photoKey = steps.find((x) => x.type === "photo")?.field ?? "photo";
        const videoKey = steps.find((x) => x.type === "video")?.field ?? "video";
        const photo = data[photoKey] instanceof File ? data[photoKey] : null;
        const video = data[videoKey] instanceof File ? data[videoKey] : null;
        const photoUrl = photo
          ? await uploadApplicationFile(oid, photo, "photo")
          : null;
        const videoUrl = video
          ? await uploadApplicationFile(oid, video, "video")
          : null;
        const hs = Array.isArray(data.heightSize)
          ? data.heightSize
          : ["", ""];
        const addr = data.address;
        const addressPayload = Array.isArray(addr)
          ? JSON.stringify(addr)
          : typeof addr === "string"
            ? addr
            : JSON.stringify(addr ?? []);
        const extras = serializeExtraAnswers(data as Record<string, unknown>);
        const baseContent = String(data.contentStyle ?? "");
        const content_style =
          extras.length > 0 ? baseContent + extras : baseContent;

        const ok = await submitApplication(
          {
            full_name: String(data.fullName ?? ""),
            address: addressPayload,
            phone: String(data.phone ?? ""),
            email: String(data.email ?? ""),
            dob: String(data.dob ?? ""),
            height: String(hs[0] ?? ""),
            sizing: String(hs[1] ?? ""),
            build_type: String(data.buildType ?? ""),
            inseam: String(data.inseam ?? ""),
            instagram: String(data.instagram ?? ""),
            tiktok: String(data.tiktok ?? ""),
            youtube: String(data.youtube ?? ""),
            content_style,
            photo_url: photoUrl,
            video_url: videoUrl,
          },
          oid,
        );
        if (!ok) {
          setError("Could not submit. Check your connection and try again.");
          setSubmitting(false);
          return;
        }
        router.push("/done");
      } catch {
        setError("Something went wrong. Please try again.");
        setSubmitting(false);
      }
      return;
    }
    setDir(1);
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setError("");
    setDir(-1);
    setStep((s) => s - 1);
  };

  const catLabels: Record<number, string> = {
    1: "Category 1 of 3",
    2: "Category 2 of 3",
    3: "Category 3 of 3",
  };

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <div className="h-0.5 w-full bg-gray-100">
        <motion.div
          className="h-full bg-black"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
        <span className="text-[12px] font-black uppercase tracking-[.15em]">
          Honor Culture
        </span>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold tracking-wide text-gray-400">
              {catLabels[current.category]}
            </span>
            <span className="text-[10px] text-gray-300">·</span>
            <span className="text-[10px] font-semibold text-gray-400">
              {step + 1} / {steps.length}
            </span>
          </div>
          {orderIdDisplay ? (
            <span className="max-w-[200px] truncate font-mono text-[9px] text-gray-400">
              {orderIdDisplay}
            </span>
          ) : null}
        </div>
      </nav>

      <div className="px-6 pb-0 pt-6">
        <motion.div
          key={current.category}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-1 inline-flex items-center gap-2"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-black" />
          <span className="text-[9px] font-bold uppercase tracking-[.2em] text-gray-400">
            {current.categoryName}
          </span>
        </motion.div>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden px-6 pb-6 pt-4">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -50 : 50, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-1 flex-col"
          >
            <div className="mb-6 flex items-center">
              <h2 className="text-[26px] font-black uppercase leading-tight tracking-tight">
                {current.label}
              </h2>
              <InfoTip note={current.note} />
              {current.required && (
                <span className="ml-2 mt-1 text-xl leading-none text-black">*</span>
              )}
            </div>

            {(current.type === "text" ||
              current.type === "email" ||
              current.type === "tel") && (
              <input
                type={current.type}
                value={String(data[current.field] ?? "")}
                onChange={(e) => update(current.field, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void next()}
                placeholder={current.placeholder}
                className="w-full border-b-2 border-black bg-transparent py-3 text-base outline-none placeholder:text-gray-300"
              />
            )}

            {current.type === "textarea" && (
              <textarea
                value={String(data[current.field] ?? "")}
                onChange={(e) => update(current.field, e.target.value)}
                placeholder={current.placeholder}
                rows={4}
                className="w-full resize-y border-2 border-black bg-transparent p-3 text-base outline-none placeholder:text-gray-300"
              />
            )}

            {current.type === "number" && (
              <input
                type="number"
                value={String(data[current.field] ?? "")}
                onChange={(e) => update(current.field, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void next()}
                placeholder={current.placeholder}
                className="w-full border-b-2 border-black bg-transparent py-3 text-base outline-none placeholder:text-gray-300"
              />
            )}

            {current.type === "date" && (
              <input
                type="date"
                value={String(data[current.field] ?? "")}
                onChange={(e) => update(current.field, e.target.value)}
                className="w-full border-b-2 border-black bg-transparent py-3 text-base outline-none"
              />
            )}

            {current.type === "address" && (
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder={current.placeholder}
                  value={
                    (Array.isArray(data[current.field])
                      ? (data[current.field] as string[])
                      : ["", ""])[0] ?? ""
                  }
                  onChange={(e) => {
                    const prev = Array.isArray(data[current.field])
                      ? [...(data[current.field] as string[])]
                      : ["", ""];
                    prev[0] = e.target.value;
                    update(current.field, prev);
                  }}
                  className="w-full border-b-2 border-black bg-transparent py-3 text-base outline-none placeholder:text-gray-300"
                />
                <input
                  type="text"
                  placeholder={current.placeholder2}
                  value={
                    (Array.isArray(data[current.field])
                      ? (data[current.field] as string[])
                      : ["", ""])[1] ?? ""
                  }
                  onChange={(e) => {
                    const prev = Array.isArray(data[current.field])
                      ? [...(data[current.field] as string[])]
                      : ["", ""];
                    prev[1] = e.target.value;
                    update(current.field, prev);
                  }}
                  className="w-full border-b-2 border-black bg-transparent py-3 text-base outline-none placeholder:text-gray-300"
                />
              </div>
            )}

            {current.type === "dual" && (
              <div className="flex gap-4">
                {[0, 1].map((i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={
                      i === 0 ? current.placeholder : current.placeholder2
                    }
                    value={
                      (Array.isArray(data[current.field])
                        ? (data[current.field] as string[])
                        : ["", ""])[i] ?? ""
                    }
                    onChange={(e) => {
                      const prev = Array.isArray(data[current.field])
                        ? [...(data[current.field] as string[])]
                        : ["", ""];
                      prev[i] = e.target.value;
                      update(current.field, prev);
                    }}
                    className="flex-1 border-b-2 border-black bg-transparent py-3 text-base outline-none placeholder:text-gray-300"
                  />
                ))}
              </div>
            )}

            {current.type === "select" && (
              <select
                value={String(
                  data[current.field] ?? current.options![0],
                )}
                onChange={(e) => update(current.field, e.target.value)}
                className="w-full cursor-pointer appearance-none border-b-2 border-black bg-transparent py-3 text-base outline-none"
              >
                {current.options!.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}

            {current.type === "radio" && (
              <div className="flex flex-col gap-3">
                {current.options!.map((o) => (
                  <label
                    key={o}
                    className={`flex cursor-pointer items-center gap-3 border-2 p-3 transition-all ${
                      data[current.field] === o
                        ? "border-black bg-black text-white"
                        : "border-gray-200 text-black hover:border-black"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        data[current.field] === o
                          ? "border-white"
                          : "border-gray-400"
                      }`}
                    >
                      {data[current.field] === o && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-[13px] font-semibold">{o}</span>
                    <input
                      type="radio"
                      className="hidden"
                      checked={data[current.field] === o}
                      onChange={() => update(current.field, o)}
                    />
                  </label>
                ))}
              </div>
            )}

            {current.type === "photo" && (
              <label className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-gray-300 py-12 transition-colors hover:border-black">
                {photoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreviewUrl}
                    className="max-h-64 w-full object-cover"
                    alt="preview"
                  />
                ) : (
                  <>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mb-3 text-gray-300"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="8.5"
                        cy="8.5"
                        r="1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M21 15l-5-5L5 21"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-[11px] font-bold uppercase tracking-wide">
                      Tap to upload photo
                    </span>
                    <span className="mt-1 text-[10px] text-gray-400">
                      Images only · Max 5MB
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    update(current.field, e.target.files[0])
                  }
                />
              </label>
            )}

            {current.type === "video" && (
              <label className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-gray-300 py-12 transition-colors hover:border-black">
                {data[current.field] instanceof File ? (
                  <>
                    <div className="mb-2 text-2xl">✓</div>
                    <span className="text-[12px] font-bold">
                      {(data[current.field] as File).name}
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mb-3 text-gray-300"
                    >
                      <path
                        d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[11px] font-bold uppercase tracking-wide">
                      Tap to upload video
                    </span>
                    <span className="mt-1 px-4 text-center text-[10px] text-gray-400">
                      Front & side view · Max 30 sec · Max 50MB
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    update(current.field, e.target.files[0])
                  }
                />
              </label>
            )}

            {!current.required && (
              <p className="mt-2 text-[10px] tracking-wide text-gray-400">
                Optional
              </p>
            )}
            {error && (
              <p className="mt-4 text-[11px] font-medium tracking-wide text-red-500">
                {error}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={() => void next()}
            className="w-full bg-black py-4 text-[11px] font-bold uppercase tracking-[.2em] text-white transition-transform active:scale-[.98]"
          >
            {submitting
              ? "Submitting..."
              : isLast
                ? "Submit Application"
                : "Next →"}
          </button>
          <button
            type="button"
            onClick={back}
            className="mt-3 w-full text-center text-[11px] font-medium tracking-wide text-gray-400"
          >
            ← Back
          </button>
        </div>
      </div>

      {submitting && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-xl font-black uppercase tracking-[.3em] text-white">
            Submitting...
          </p>
        </motion.div>
      )}
    </main>
  );
}
