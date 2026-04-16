"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notifyHonorLocalStorage } from "@/lib/hc-form-sync";
import { supabase } from "@/lib/supabase";
import {
  getFormCategories,
  createFormCategory,
  updateFormCategory,
  deleteFormCategory,
  createFormField,
  updateFormField,
  deleteFormField,
} from "@/lib/db";
import {
  uploadProductImage,
  parseStoredProduct,
  type Product,
  type ProductColor,
  DEFAULT_PRODUCTS,
} from "@/lib/products";

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "tel"
  | "date"
  | "address"
  | "dual"
  | "photo"
  | "video"
  | "radio"
  | "select";

type FormField = {
  id: number;
  label: string;
  type: FieldType;
  note: string;
  placeholder?: string;
  placeholder2?: string;
  options?: string[];
  required: boolean;
};

type FormCategory = {
  id: number;
  label: string;
  fields: FormField[];
  expanded: boolean;
};

const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "textarea", label: "Long Text" },
  { type: "number", label: "Number" },
  { type: "email", label: "Email" },
  { type: "tel", label: "Phone" },
  { type: "date", label: "Date" },
  { type: "address", label: "Address" },
  { type: "dual", label: "Two Fields" },
  { type: "radio", label: "Choice" },
  { type: "select", label: "Dropdown" },
  { type: "photo", label: "Photo Upload" },
  { type: "video", label: "Video Upload" },
];

const INIT_CATS: FormCategory[] = [
  {
    id: 1,
    label: "Personal Identity & Contact",
    expanded: true,
    fields: [
      {
        id: 1,
        label: "Full Legal Name",
        type: "text",
        note: "Must match the name on your Social Security card for accurate tax reporting.",
        placeholder: "Your full legal name",
        required: true,
      },
      {
        id: 2,
        label: "Residential Address",
        type: "address",
        note: "We require a physical address (no P.O. Boxes) to ship your model gear.",
        placeholder: "Street address",
        placeholder2: "City, State, ZIP",
        required: true,
      },
      {
        id: 3,
        label: "Phone Number",
        type: "tel",
        note: "Primary contact for drop alerts and partnership coordination.",
        placeholder: "+1 (000) 000-0000",
        required: true,
      },
      {
        id: 4,
        label: "Email Address",
        type: "email",
        note: "Primary contact for drop alerts and partnership coordination.",
        placeholder: "your@email.com",
        required: true,
      },
      {
        id: 5,
        label: "Date of Birth",
        type: "date",
        note: "To verify you are 18+ and legally eligible to enter into a Promotional Partnership Agreement.",
        required: true,
      },
    ],
  },
  {
    id: 2,
    label: "Physical Fit & Athletic Specs",
    expanded: false,
    fields: [
      {
        id: 6,
        label: "Height & Sizing",
        type: "dual",
        note: "Please provide your standard US sizes to ensure our fabrics drape correctly.",
        placeholder: `Height (e.g. 6'1")`,
        placeholder2: "Clothing size (e.g. M / L)",
        required: true,
      },
      {
        id: 7,
        label: "Athletic Build Type",
        type: "select",
        note: "This helps us select the right product variety for our launch campaign.",
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
        id: 8,
        label: "Inseam Preference",
        type: "radio",
        note: `Do you prefer 5", 7", or 9" lengths for performance shorts?`,
        options: [
          `5" — Short & athletic`,
          `7" — Standard performance`,
          `9" — Extended coverage`,
        ],
        required: true,
      },
    ],
  },
  {
    id: 3,
    label: "Digital Presence & Social Alignment",
    expanded: false,
    fields: [
      {
        id: 9,
        label: "Instagram Handle",
        type: "text",
        note: "We review your content to ensure alignment with our Elite Lifestyle visual standards.",
        placeholder: "@yourhandle",
        required: true,
      },
      {
        id: 10,
        label: "TikTok Handle",
        type: "text",
        note: "Optional. We review alignment with our brand standards.",
        placeholder: "@yourhandle (optional)",
        required: false,
      },
      {
        id: 11,
        label: "YouTube Handle",
        type: "text",
        note: "Optional. If you create long-form content, this helps us understand your range.",
        placeholder: "@yourchannel (optional)",
        required: false,
      },
      {
        id: 12,
        label: "Primary Content Style",
        type: "radio",
        note: "Understanding your style helps us plan shoots that align with your strengths.",
        options: [
          "High-fidelity photographer",
          "Short-form video creator",
          "Both photo and video",
          "Lifestyle / Story-based content",
        ],
        required: true,
      },
      {
        id: 13,
        label: "Upload Your Photo",
        type: "photo",
        note: "Clear front-facing photo. Natural lighting preferred, no heavy filters.",
        required: true,
      },
      {
        id: 14,
        label: "Upload a Short Video",
        type: "video",
        note: "Front and side view. Max 30 seconds. Shows how you carry yourself.",
        required: true,
      },
    ],
  },
];

const INIT_DINNER_INCLUDES = [
  "Full multi-course dinner with curated seasonal menu",
  "Welcome cocktail reception upon arrival",
  "Seated dinner alongside both celebrity ambassadors",
  "Professional photographer on site — personal shots included",
  "Exclusive Honor Culture gift placed at your seat",
  "Signed memorabilia from both celebrities",
  "Intimate post-dinner mixer — invited guests only",
];

const INIT_GYM_INCLUDES = [
  "Luxury Mercedes-Benz Sprinter fleet throughout",
  "3-night VIP hotel stay (4-star minimum)",
  "All meals every day — breakfast, lunch and dinner",
  "Elite gym access across 3 cities",
  "Train alongside both HC celebrity ambassadors",
  "3-piece HC performance outfit + GymTour hoodie",
  "Branded bag, shaker and accessories",
  "Signed memorabilia from both celebrities",
  "Professional photo and video content delivered post-tour",
];

function parseEventIncludes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) return p.map(String);
    } catch {
      /* ignore */
    }
  }
  return [];
}

const INIT_EVENTS = [
  {
    id: 1,
    type: "dinner",
    title: "Private Dinner with Celebrity X",
    subtitle: "Private · Exclusive · 20 Guests Only",
    date: "2026-06-21T19:00",
    price: 500,
    spotsTotal: 20,
    spotsLeft: 20,
    description:
      "An intimate evening curated exclusively for Honor Culture's closest community. Limited to just 20 guests.",
    image_url: null as string | null,
    visible: true,
    location: "Disclosed on booking",
    dress_code: "Elevated Casual",
    capacity: "",
    description_extra: "",
    includes: [...INIT_DINNER_INCLUDES],
  },
  {
    id: 2,
    type: "gymtour",
    title: "GymTour 2.0 by Honor Culture",
    subtitle: "3 Days · US · All-Inclusive · 30 Spots",
    date: "2026-07-15T09:00",
    price: 3000,
    spotsTotal: 30,
    spotsLeft: 30,
    description:
      "A 3-day all-inclusive fitness and lifestyle experience across the United States. 30 spots only.",
    image_url: null as string | null,
    visible: true,
    location: "Disclosed on booking",
    dress_code: "Athletic / streetwear",
    capacity: "",
    description_extra: "",
    includes: [...INIT_GYM_INCLUDES],
  },
];

type EventRow = (typeof INIT_EVENTS)[number];

type AppStatus = "pending" | "approved" | "rejected";

const S = {
  lbl: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: ".1em",
    textTransform: "uppercase" as const,
    color: "#aaa",
    marginBottom: 5,
    display: "block",
  } satisfies CSSProperties,
  inp: {
    width: "100%",
    border: "none",
    borderBottom: "1.5px solid #000",
    padding: "7px 0",
    fontSize: 13,
    outline: "none",
    background: "transparent",
    fontFamily: "-apple-system,sans-serif",
  } satisfies CSSProperties,
  smBtn: (bg = "#fff", color = "#000", danger = false): CSSProperties => ({
    padding: "5px 10px",
    background: bg,
    color: danger ? "#dc2626" : color,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: ".08em",
    textTransform: "uppercase",
    border: `1.5px solid ${danger ? "#fecaca" : color === "#fff" ? "#000" : "#e0e0e0"}`,
    cursor: "pointer",
    borderRadius: 2,
    whiteSpace: "nowrap",
    flexShrink: 0,
  }),
};

type FieldDraft = {
  label: string;
  type: FieldType;
  note: string;
  placeholder: string;
  placeholder2: string;
  options: string[];
  required: boolean;
};

function FieldEditor({
  field,
  onSave,
  onCancel,
}: {
  field: Partial<FormField> & { type: FieldType };
  onSave: (f: FormField) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<FieldDraft>({
    label: field.label ?? "",
    type: field.type ?? "text",
    note: field.note ?? "",
    placeholder: field.placeholder ?? "",
    placeholder2: field.placeholder2 ?? "",
    options: field.options ? [...field.options] : ["Option 1"],
    required: field.required ?? true,
  });
  const needsPlaceholder = ["text", "textarea", "number", "email", "tel", "date"].includes(d.type);
  const needsDual = ["dual", "address"].includes(d.type);
  const needsOptions = ["radio", "select"].includes(d.type);
  const save = () => {
    if (!d.label.trim()) return;
    onSave({
      id: field.id ?? Date.now(),
      label: d.label,
      type: d.type,
      note: d.note,
      placeholder: d.placeholder,
      placeholder2: d.placeholder2,
      options: needsOptions ? d.options.filter((o) => o.trim()) : undefined,
      required: d.required,
    });
  };
  return (
    <div
      style={{
        background: "#f9f9f9",
        border: "2px solid #000",
        padding: 16,
        marginTop: 8,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: ".15em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        Field Editor
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={S.lbl}>Field Label *</span>
        <input
          value={d.label}
          onChange={(e) => setD({ ...d, label: e.target.value })}
          placeholder="e.g. Full Legal Name"
          style={S.inp}
          autoFocus
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={S.lbl}>Input Type *</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {FIELD_TYPES.map((ft) => (
            <button
              key={ft.type}
              type="button"
              onClick={() => setD({ ...d, type: ft.type })}
              style={{
                padding: "5px 10px",
                fontSize: 9,
                fontWeight: 700,
                border: `1.5px solid ${d.type === ft.type ? "#000" : "#e0e0e0"}`,
                background: d.type === ft.type ? "#000" : "#fff",
                color: d.type === ft.type ? "#fff" : "#666",
                cursor: "pointer",
                borderRadius: 2,
              }}
            >
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={S.lbl}>Info Tooltip (i) — what models see when they tap the info icon</span>
        <textarea
          value={d.note}
          onChange={(e) => setD({ ...d, note: e.target.value })}
          placeholder="Explain why this field is needed..."
          rows={3}
          style={{ ...S.inp, resize: "vertical" }}
        />
      </div>

      {needsPlaceholder ? (
        <div style={{ marginBottom: 12 }}>
          <span style={S.lbl}>Placeholder Text</span>
          <input
            value={d.placeholder}
            onChange={(e) => setD({ ...d, placeholder: e.target.value })}
            placeholder="e.g. Enter your full name..."
            style={S.inp}
          />
        </div>
      ) : null}

      {needsDual ? (
        <div style={{ marginBottom: 12 }}>
          <span style={S.lbl}>Second Field Placeholder</span>
          <input
            value={d.placeholder2}
            onChange={(e) => setD({ ...d, placeholder2: e.target.value })}
            placeholder="e.g. City, State, ZIP"
            style={S.inp}
          />
        </div>
      ) : null}

      {needsOptions ? (
        <div style={{ marginBottom: 12 }}>
          <span style={{ ...S.lbl, marginBottom: 8 }}>Options</span>
          {d.options.map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <input
                value={opt}
                onChange={(e) => {
                  const o = [...d.options];
                  o[i] = e.target.value;
                  setD({ ...d, options: o });
                }}
                placeholder={`Option ${i + 1}`}
                style={{ ...S.inp, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setD({ ...d, options: d.options.filter((_, j) => j !== i) })}
                style={{
                  width: 28,
                  height: 28,
                  border: "1.5px solid #e0e0e0",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#aaa",
                  flexShrink: 0,
                  borderRadius: 2,
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setD({ ...d, options: [...d.options, ""] })}
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              background: "none",
              border: "1.5px dashed #ccc",
              padding: "6px 12px",
              cursor: "pointer",
              color: "#888",
              marginTop: 4,
              borderRadius: 2,
            }}
          >
            + Add Option
          </button>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          background: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 2,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>Required field</div>
          <div style={{ fontSize: 10, color: "#aaa" }}>Models must answer this to continue</div>
        </div>
        <button
          type="button"
          onClick={() => setD({ ...d, required: !d.required })}
          style={{
            padding: "7px 16px",
            background: d.required ? "#000" : "#fff",
            color: d.required ? "#fff" : "#000",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            border: "1.5px solid #000",
            cursor: "pointer",
            borderRadius: 2,
          }}
        >
          {d.required ? "Required" : "Optional"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={save}
          style={{
            flex: 1,
            padding: 11,
            background: "#000",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".15em",
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
          }}
        >
          Save Field
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: 11,
            background: "#fff",
            color: "#000",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".15em",
            textTransform: "uppercase",
            border: "1.5px solid #000",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
function FormBuilderTab() {
  const [cats, setCats] = useState<FormCategory[]>(INIT_CATS);
  const [loading, setLoading] = useState(true);
  const [creatingCat, setCreatingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatLabel, setEditCatLabel] = useState("");
  const [addingFieldTo, setAddingFieldTo] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<{
    catId: number;
    field: Partial<FormField> & { type: FieldType };
  } | null>(null);

  const persist = (updated: FormCategory[]) => {
    setCats(updated);
    notifyHonorLocalStorage();
  };

  const normalizeField = (f: Record<string, unknown>): FormField => ({
    id: Number(f.id),
    label: String(f.label ?? ""),
    type: (String(f.type ?? "text") as FieldType),
    note: String(f.note ?? ""),
    placeholder: typeof f.placeholder === "string" ? f.placeholder : "",
    placeholder2: typeof f.placeholder2 === "string" ? f.placeholder2 : "",
    options: Array.isArray(f.options) ? (f.options as string[]) : undefined,
    required: Boolean(f.required ?? true),
  });

  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getFormCategories();
      if (!rows.length) {
        setCats(INIT_CATS);
        return;
      }
      const normalized: FormCategory[] = (rows as Record<string, unknown>[])
        .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
        .map((c) => {
          const fieldsRaw = Array.isArray(c.form_fields)
            ? (c.form_fields as Record<string, unknown>[])
            : [];
          const fields = fieldsRaw
            .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
            .map(normalizeField);
          return {
            id: Number(c.id),
            label: String(c.label ?? ""),
            fields,
            expanded: true,
          };
        });
      setCats(normalized);
    } catch {
      setCats(INIT_CATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const toggleCat = (id: number) =>
    persist(cats.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c)));
  const saveCatLabel = async (id: number) => {
    if (!editCatLabel.trim()) return;
    await updateFormCategory(id, editCatLabel);
    persist(cats.map((c) => (c.id === id ? { ...c, label: editCatLabel } : c)));
    setEditingCatId(null);
  };
  const addCat = async () => {
    if (!newCatLabel.trim()) return;
    const created = await createFormCategory(newCatLabel, cats.length);
    if (!created) return;
    persist([
      ...cats,
      {
        id: Number(created.id),
        label: String(created.label),
        fields: [],
        expanded: true,
      },
    ]);
    setNewCatLabel("");
    setCreatingCat(false);
  };
  const deleteCat = async (id: number) => {
    if (!confirm("Delete this category and all its fields?")) return;
    await deleteFormCategory(id);
    persist(cats.filter((c) => c.id !== id));
  };

  const saveField = async (catId: number, field: FormField) => {
    const cat = cats.find((c) => c.id === catId);
    if (!cat) return;
    const payload: Record<string, unknown> = {
      label: field.label,
      type: field.type,
      note: field.note,
      placeholder: field.placeholder ?? "",
      placeholder2: field.placeholder2 ?? "",
      options: field.options ?? null,
      required: field.required,
    };
    const exists = cat.fields.find((f) => f.id === field.id);
    if (exists) {
      await updateFormField(field.id, payload);
      persist(
        cats.map((c) =>
          c.id !== catId
            ? c
            : {
                ...c,
                fields: c.fields.map((f) => (f.id === field.id ? field : f)),
              },
        ),
      );
    } else {
      const created = await createFormField(catId, payload, cat.fields.length);
      if (!created) return;
      const savedField = normalizeField(created as Record<string, unknown>);
      persist(
        cats.map((c) =>
          c.id !== catId
            ? c
            : {
                ...c,
                fields: [...c.fields, savedField],
              },
        ),
      );
    }
    setEditingField(null);
    setAddingFieldTo(null);
  };

  const deleteField = async (catId: number, fieldId: number) => {
    await deleteFormField(fieldId);
    persist(
      cats.map((c) =>
        c.id !== catId ? c : { ...c, fields: c.fields.filter((f) => f.id !== fieldId) },
      ),
    );
  };

  const moveField = async (catId: number, fieldId: number, dir: -1 | 1) => {
    let nextFields: FormField[] = [];
    const nextCats = cats.map((c) => {
      if (c.id !== catId) return c;
      const idx = c.fields.findIndex((f) => f.id === fieldId);
      if ((dir === -1 && idx === 0) || (dir === 1 && idx === c.fields.length - 1)) return c;
      const fields = [...c.fields];
      [fields[idx], fields[idx + dir]] = [fields[idx + dir], fields[idx]];
      nextFields = fields;
      return { ...c, fields };
    });
    persist(nextCats);
    await Promise.all(
      nextFields.map((f, i) =>
        updateFormField(f.id, { position: i }),
      ),
    );
  };

  const typeLabel = (t: FieldType) => FIELD_TYPES.find((x) => x.type === t)?.label ?? t;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase" }}>Form Builder</h2>
        <button
          type="button"
          onClick={() => {
            setCreatingCat(true);
            setNewCatLabel("");
          }}
          style={{
            padding: "8px 16px",
            background: "#000",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
          }}
        >
          + New Category
        </button>
      </div>

      {creatingCat ? (
        <div style={{ background: "#fff", border: "2px solid #000", padding: 16, marginBottom: 14 }}>
          <span style={S.lbl}>Category Name</span>
          <input
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCat()}
            placeholder="e.g. Work Experience"
            autoFocus
            style={{ ...S.inp, marginBottom: 14 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={addCat}
              style={{
                flex: 1,
                padding: 10,
                background: "#000",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".15em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
              }}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreatingCat(false)}
              style={{
                flex: 1,
                padding: 10,
                background: "#fff",
                color: "#000",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".15em",
                textTransform: "uppercase",
                border: "1.5px solid #000",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 12 }}>
          Loading form builder...
        </div>
      ) : cats.map((cat) => (
        <div key={cat.id} style={{ background: "#fff", border: "1px solid #e5e5e5", marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 14px",
              borderBottom: cat.expanded ? "1px solid #f0f0f0" : "none",
            }}
          >
            <button
              type="button"
              onClick={() => toggleCat(cat.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                color: "#000",
                padding: 0,
                width: 20,
                flexShrink: 0,
                textAlign: "center",
              }}
            >
              {cat.expanded ? "▼" : "▶"}
            </button>

            {editingCatId === cat.id ? (
              <input
                value={editCatLabel}
                onChange={(e) => setEditCatLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveCatLabel(cat.id)}
                autoFocus
                style={{
                  flex: 1,
                  border: "none",
                  borderBottom: "2px solid #000",
                  padding: "4px 0",
                  fontSize: 14,
                  fontWeight: 900,
                  outline: "none",
                  background: "transparent",
                  textTransform: "uppercase",
                }}
              />
            ) : (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".02em" }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>
                  {cat.fields.length} field{cat.fields.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              {editingCatId === cat.id ? (
                <>
                  <button type="button" onClick={() => saveCatLabel(cat.id)} style={S.smBtn("#000", "#fff")}>
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingCatId(null)} style={S.smBtn()}>
                    ×
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(cat.id);
                      setEditCatLabel(cat.label);
                    }}
                    style={S.smBtn()}
                  >
                    Rename
                  </button>
                  <button type="button" onClick={() => deleteCat(cat.id)} style={S.smBtn("#fff", "#000", true)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {cat.expanded ? (
            <div style={{ padding: "8px 14px 14px" }}>
              {cat.fields.map((field, fi) => (
                <div key={field.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      background: "#fafafa",
                      border: "1px solid #f0f0f0",
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => moveField(cat.id, field.id, -1)}
                        disabled={fi === 0}
                        style={{
                          width: 18,
                          height: 14,
                          border: "none",
                          background: "none",
                          cursor: fi === 0 ? "default" : "pointer",
                          color: fi === 0 ? "#ddd" : "#666",
                          fontSize: 10,
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(cat.id, field.id, 1)}
                        disabled={fi === cat.fields.length - 1}
                        style={{
                          width: 18,
                          height: 14,
                          border: "none",
                          background: "none",
                          cursor: fi === cat.fields.length - 1 ? "default" : "pointer",
                          color: fi === cat.fields.length - 1 ? "#ddd" : "#666",
                          fontSize: 10,
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ▼
                      </button>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#000" }}>{field.label}</span>
                        {field.required ? (
                          <span
                            style={{
                              fontSize: 7,
                              fontWeight: 700,
                              background: "#000",
                              color: "#fff",
                              padding: "1px 5px",
                              borderRadius: 2,
                              letterSpacing: ".06em",
                            }}
                          >
                            REQ
                          </span>
                        ) : null}
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            background: "#f0f0f0",
                            color: "#666",
                            padding: "1px 6px",
                            borderRadius: 2,
                            letterSpacing: ".04em",
                            textTransform: "uppercase",
                          }}
                        >
                          {typeLabel(field.type)}
                        </span>
                      </div>
                      {field.note ? (
                        <div
                          style={{
                            fontSize: 10,
                            color: "#aaa",
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                          }}
                        >
                          ⓘ {field.note}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingField({ catId: cat.id, field: { ...field } });
                          setAddingFieldTo(null);
                        }}
                        style={S.smBtn()}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteField(cat.id, field.id)}
                        style={S.smBtn("#fff", "#000", true)}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {editingField?.catId === cat.id && editingField.field.id === field.id ? (
                    <FieldEditor
                      field={editingField.field}
                      onSave={(f) => saveField(cat.id, f)}
                      onCancel={() => setEditingField(null)}
                    />
                  ) : null}
                </div>
              ))}

              {addingFieldTo === cat.id && !editingField ? (
                <FieldEditor
                  field={{ type: "text" }}
                  onSave={(f) => saveField(cat.id, f)}
                  onCancel={() => setAddingFieldTo(null)}
                />
              ) : !editingField ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddingFieldTo(cat.id);
                    setEditingField(null);
                  }}
                  style={{
                    width: "100%",
                    padding: 9,
                    border: "1.5px dashed #ccc",
                    background: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "#888",
                    cursor: "pointer",
                    marginTop: cat.fields.length > 0 ? 6 : 0,
                    borderRadius: 2,
                  }}
                >
                  + Add Field
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}

      {cats.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 12 }}>
          No categories yet. Click &quot;+ New Category&quot; to start.
        </div>
      ) : null}
    </div>
  );
}
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [tab, setTab] = useState("applications");
  const [apps, setApps] = useState<Record<string, unknown>[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [editingProdId, setEditingProdId] = useState<number | null>(null);
  const [prodEditData, setProdEditData] = useState<Record<string, unknown>>({});
  const [events, setEvents] = useState<EventRow[]>([...INIT_EVENTS]);
  const [editingEvId, setEditingEvId] = useState<number | null>(null);
  const [evEditData, setEvEditData] = useState<Partial<EventRow>>({});
  const [viewApp, setViewApp] = useState<Record<string, unknown> | null>(null);
  const [siteOpen, setSiteOpen] = useState(true);
  const [settings, setSettings] = useState({
    sitePass: "CAST",
    adminPass: "HONOR2025",
    instagram: "@h0n0rculture.cast",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [eventSaved, setEventSaved] = useState<number | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [cryptoSettings, setCryptoSettings] = useState<Record<string, unknown>>({});
  const [cryptoSaved, setCryptoSaved] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);

  useEffect(() => {
    if (!authed) return;
    setProductsLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const next = data
          .map((row: unknown) => parseStoredProduct(row))
          .filter((p): p is Product => p != null);
        if (next.length > 0) setProducts(next);
      })
      .finally(() => setProductsLoading(false));
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    setEventsLoading(true);
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setEvents(
          data.map((raw: Record<string, unknown>) => {
            const inc = parseEventIncludes(raw.includes);
            return {
              id: Number(raw.id),
              type: String(raw.type ?? "dinner"),
              title: String(raw.title ?? ""),
              subtitle: String(raw.subtitle ?? ""),
              date: String(raw.date ?? ""),
              price: Number(raw.price ?? 0),
              spotsTotal: Number(raw.spots_total ?? raw.spotsTotal ?? 30),
              spotsLeft: Number(raw.spots_left ?? raw.spotsLeft ?? 30),
              description: String(raw.description ?? ""),
              image_url: (raw.image_url as string | null) ?? null,
              visible: Boolean(raw.visible ?? true),
              location: String(raw.location ?? "Disclosed on booking"),
              dress_code: String(raw.dress_code ?? ""),
              capacity: String(raw.capacity ?? ""),
              description_extra: String(raw.description_extra ?? ""),
              includes:
                inc.length > 0
                  ? inc
                  : raw.type === "gymtour"
                    ? [...INIT_GYM_INCLUDES]
                    : [...INIT_DINNER_INCLUDES],
            } as EventRow;
          }),
        );
      })
      .finally(() => setEventsLoading(false));
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    setAppsLoading(true);
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => setApps(Array.isArray(data) ? data : []))
      .catch(() => setApps([]))
      .finally(() => setAppsLoading(false));
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    setPaymentsLoading(true);
    fetch("/api/crypto-payments")
      .then((r) => r.json())
      .then((d) => {
        setPayments(Array.isArray(d) ? (d as Record<string, unknown>[]) : []);
        setPaymentsLoading(false);
      })
      .catch(() => {
        setPayments([]);
        setPaymentsLoading(false);
      });
    fetch("/api/crypto-settings")
      .then((r) => r.json())
      .then((d) => setCryptoSettings((d as Record<string, unknown>) ?? {}))
      .catch(() => setCryptoSettings({}));
  }, [authed]);

  const persistEvents = (updated: EventRow[]) => {
    setEvents(updated);
    notifyHonorLocalStorage();
  };
  const login = () => {
    if (pass.trim().toUpperCase() === "HONOR2025") setAuthed(true);
    else {
      setPassErr(true);
      setPass("");
      window.setTimeout(() => setPassErr(false), 900);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (viewApp?.id === id) setViewApp((v) => (v ? { ...v, status } : v));
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  };

  const saveEvent = async (ev: EventRow) => {
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? ev : e)));
    const res = await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ev.id,
        type: ev.type,
        title: ev.title,
        subtitle: ev.subtitle,
        date: ev.date,
        price: ev.price,
        spots_total: ev.spotsTotal,
        spots_left: ev.spotsLeft,
        description: ev.description,
        image_url: ev.image_url,
        visible: ev.visible,
        location: ev.location,
        dress_code: ev.dress_code,
        capacity: ev.capacity,
        description_extra: ev.description_extra,
        includes: ev.includes,
      }),
    });
    const result = (await res.json()) as { ok?: boolean; error?: string };
    if (!result.ok) window.alert("Save failed: " + (result.error ?? "unknown"));
    setEditingEvId(null);
    setEventSaved(ev.id);
    window.setTimeout(() => setEventSaved(null), 2500);
  };

  const ss = (s: string) =>
    (
      {
        pending: { bg: "#f9fafb", color: "#6b7280", border: "#e5e5e5" },
        approved: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
        rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
      } as const
    )[s as AppStatus] ?? { bg: "#f9fafb", color: "#6b7280", border: "#e5e5e5" };

  const formatDate = (s: string) => {
    if (!s) return "Date TBD";
    const d = new Date(s);
    return (
      d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    );
  };

  const openApplicantMedia = (photoUrl: string, videoUrl: string) => {
    if (photoUrl) window.open(photoUrl, "_blank", "noopener,noreferrer");
    if (videoUrl) {
      window.setTimeout(() => {
        window.open(videoUrl, "_blank", "noopener,noreferrer");
      }, 400);
    }
  };

  const downloadApplicationsJson = () => {
    if (apps.length === 0) {
      window.alert("No applications loaded yet.");
      return;
    }
    const name = `honor-applications-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify(apps, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!authed) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            marginBottom: 28,
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "2px solid #000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="20" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#000" strokeWidth="1.8" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "-.02em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Admin
        </h1>
        <p style={{ fontSize: 11, color: "#aaa", marginBottom: 40 }}>Honor Culture</p>
        <motion.input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="Admin password"
          animate={passErr ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{
            width: "100%",
            maxWidth: 320,
            border: "none",
            borderBottom: "2.5px solid #000",
            padding: "12px 0",
            fontSize: 14,
            outline: "none",
            background: "transparent",
            marginBottom: 24,
            display: "block",
          }}
        />
        <button
          type="button"
          onClick={login}
          style={{
            width: "100%",
            maxWidth: 320,
            padding: 14,
            background: "#000",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
          }}
        >
          Enter
        </button>
      </main>
    );
  }

  const TABS: { id: string; label: string; badge?: number }[] = [
    {
      id: "applications",
      label: "Applications",
      badge: apps.filter((a) => String(a.status ?? "pending") === "pending").length,
    },
    { id: "products", label: "Products" },
    { id: "events", label: "Events" },
    { id: "payments", label: "Payments", badge: 0 },
    { id: "formbuilder", label: "Form Builder" },
    { id: "downloads", label: "Downloads" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "-apple-system,sans-serif" }}>
      <header
        style={{
          background: "#000",
          padding: "13px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: ".2em",
            textTransform: "uppercase",
          }}
        >
          Honor Culture — Admin
        </span>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: siteOpen ? "#22c55e" : "#ef4444" }} />
      </header>

      <div
        style={{
          display: "flex",
          overflowX: "auto",
          background: "#fff",
          borderBottom: "1px solid #e5e5e5",
          position: "sticky",
          top: 44,
          zIndex: 30,
          scrollbarWidth: "none",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0,
              padding: "11px 14px",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t.id ? "#000" : "transparent"}`,
              color: tab === t.id ? "#000" : "#aaa",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {t.label}
            {t.badge != null && t.badge > 0 ? (
              <span
                style={{
                  background: "#000",
                  color: "#fff",
                  fontSize: 7,
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: 20,
                }}
              >
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 80px" }}>
        {tab === "applications" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase" }}>Applications</h2>
              <span style={{ fontSize: 10, color: "#aaa" }}>
                {appsLoading
                  ? "Loading..."
                  : `${apps.length} total · ${apps.filter((a) => String(a.status ?? "pending") === "pending").length} pending`}
              </span>
            </div>
            {appsLoading && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: 12 }}>
                Loading applications...
              </div>
            )}
            {!appsLoading && apps.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", border: "1px dashed #e5e5e5", borderRadius: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>No applications yet</p>
                <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.6 }}>
                  Once models complete the application form, their submissions will appear here automatically.
                </p>
              </div>
            )}
            {!appsLoading &&
              apps.map((app) => {
                const status = String(app.status ?? "pending");
                const s = ss(status);
                const id = Number(app.id);
                return (
                  <div key={id} style={{ background: "#fff", border: "1px solid #e5e5e5", marginBottom: 10, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 2 }}>
                          {String(app.full_name ?? app.name ?? "Unknown Applicant")}
                        </div>
                        <div style={{ fontSize: 10, color: "#888" }}>
                          {[app.instagram, app.city, app.country].filter(Boolean).join(" · ")}
                        </div>
                        <div style={{ fontSize: 10, color: "#bbb", marginTop: 1 }}>
                          {app.submitted_at
                            ? new Date(String(app.submitted_at)).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ""}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          background: s.bg,
                          color: s.color,
                          border: `1px solid ${s.border}`,
                          borderRadius: 2,
                        }}
                      >
                        {status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 9,
                        color: "#aaa",
                        background: "#f5f5f5",
                        padding: "5px 8px",
                        marginBottom: 10,
                      }}
                    >
                      {String(app.order_id ?? "—")}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setViewApp(app)}
                        style={{
                          flex: 1,
                          padding: "7px 6px",
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          border: "1.5px solid #000",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                      {status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => void updateStatus(id, "approved")}
                          style={{
                            flex: 1,
                            padding: "7px 6px",
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            border: "1.5px solid #16a34a",
                            background: "#f0fdf4",
                            color: "#16a34a",
                            cursor: "pointer",
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => void updateStatus(id, "rejected")}
                          style={{
                            flex: 1,
                            padding: "7px 6px",
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            border: "1.5px solid #dc2626",
                            background: "#fef2f2",
                            color: "#dc2626",
                            cursor: "pointer",
                          }}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {tab === "products" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", marginBottom: 16 }}>Products</h2>
            {productsLoading ? (
              <p style={{ fontSize: 11, color: "#aaa", marginBottom: 12 }}>Loading products…</p>
            ) : null}
            {products.map((p) => {
              const listThumb =
                p.colors?.flatMap((c) => c.images).find((u) => u != null && u !== "") ?? null;
              return (
              <div key={p.id} style={{ background: "#fff", border: "1px solid #e5e5e5", marginBottom: 10, padding: 14 }}>
                {editingProdId === p.id ? (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      {(
                        [
                          { label: "Product Name", key: "name" as const, type: "text" },
                          { label: "Price ($)", key: "price" as const, type: "number" },
                          { label: "Category", key: "category" as const, type: "text" },
                          { label: "Sizes", key: "sizes" as const, type: "text" },
                        ] as const
                      ).map((f) => (
                        <div key={f.key}>
                          <span style={S.lbl}>{f.label}</span>
                          <input
                            type={f.type}
                            value={String(prodEditData[f.key] ?? "")}
                            onChange={(e) =>
                              setProdEditData((d) => ({
                                ...d,
                                [f.key]: e.target.value,
                              }))
                            }
                            style={S.inp}
                          />
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 10,
                        }}
                      >
                        <span style={S.lbl}>Colors & Images</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newColor: ProductColor = {
                              name: "New Color",
                              hex: "#cccccc",
                              images: [null, null, null, null],
                            };
                            setProdEditData((d) => ({
                              ...d,
                              colors: [...((d.colors as ProductColor[]) ?? []), newColor],
                            }));
                          }}
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            padding: "4px 10px",
                            border: "1.5px solid #000",
                            background: "#fff",
                            cursor: "pointer",
                            borderRadius: 2,
                          }}
                        >
                          + Add Color
                        </button>
                      </div>

                      {((prodEditData.colors as ProductColor[]) ?? []).map((color, ci) => (
                        <div
                          key={ci}
                          style={{
                            border: "1px solid #e5e5e5",
                            marginBottom: 10,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "10px 12px",
                              background: "#fafafa",
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            <div style={{ position: "relative", flexShrink: 0 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  background: color.hex,
                                  border: "2px solid #e0e0e0",
                                  cursor: "pointer",
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                <input
                                  type="color"
                                  value={color.hex}
                                  onChange={(e) => {
                                    const cols = [...((prodEditData.colors as ProductColor[]) ?? [])];
                                    cols[ci] = { ...cols[ci], hex: e.target.value };
                                    setProdEditData((d) => ({ ...d, colors: cols }));
                                  }}
                                  style={{
                                    position: "absolute",
                                    inset: -4,
                                    width: "calc(100% + 8px)",
                                    height: "calc(100% + 8px)",
                                    opacity: 0,
                                    cursor: "pointer",
                                  }}
                                />
                              </div>
                            </div>
                            <input
                              value={color.name}
                              onChange={(e) => {
                                const cols = [...((prodEditData.colors as ProductColor[]) ?? [])];
                                cols[ci] = { ...cols[ci], name: e.target.value };
                                setProdEditData((d) => ({ ...d, colors: cols }));
                              }}
                              placeholder="Color name"
                              style={{
                                flex: 1,
                                border: "none",
                                borderBottom: "1px solid #e0e0e0",
                                padding: "4px 0",
                                fontSize: 12,
                                fontWeight: 700,
                                outline: "none",
                                background: "transparent",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const cols = ((prodEditData.colors as ProductColor[]) ?? []).filter(
                                  (_, i) => i !== ci,
                                );
                                setProdEditData((d) => ({ ...d, colors: cols }));
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#dc2626",
                                cursor: "pointer",
                                fontSize: 16,
                                lineHeight: 1,
                                padding: 2,
                              }}
                            >
                              ×
                            </button>
                          </div>

                          <div style={{ padding: "10px 12px" }}>
                            <p style={{ ...S.lbl, marginBottom: 8 }}>
                              Images for {color.name} (up to 4 — swipeable in shop)
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                              {([0, 1, 2, 3] as const).map((imgIdx) => (
                                <div key={imgIdx} style={{ position: "relative" }}>
                                  <label
                                    style={{
                                      display: "block",
                                      aspectRatio: "3/4",
                                      border: "1.5px dashed #e0e0e0",
                                      cursor: "pointer",
                                      overflow: "hidden",
                                      borderRadius: 2,
                                      background: "#fafafa",
                                    }}
                                  >
                                    {color.images?.[imgIdx] ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={color.images[imgIdx]!}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        alt={`${color.name} ${imgIdx + 1}`}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 3,
                                        }}
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="#ccc" strokeWidth="1.5" />
                                          <circle cx="8.5" cy="8.5" r="1.5" stroke="#ccc" strokeWidth="1.5" />
                                          <path
                                            d="M21 15l-5-5L5 21"
                                            stroke="#ccc"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                        <span style={{ fontSize: 8, color: "#ccc", fontWeight: 700 }}>
                                          {imgIdx + 1}
                                        </span>
                                      </div>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: "none" }}
                                      onChange={async (e) => {
                                        if (!e.target.files?.[0]) return;
                                        const file = e.target.files[0];

                                        // Show a temporary local preview immediately
                                        const localUrl = URL.createObjectURL(file);
                                        const colsPreview = ((prodEditData.colors as ProductColor[]) ?? []).map(
                                          (c, i) => {
                                            if (i !== ci) return c;
                                            const imgs = [...(c.images ?? [null, null, null, null])];
                                            imgs[imgIdx] = localUrl;
                                            return { ...c, images: imgs };
                                          },
                                        );
                                        setProdEditData((d) => ({ ...d, colors: colsPreview }));

                                        // Upload to Supabase Storage
                                        const productId = Number(prodEditData.id);
                                        const color = (prodEditData.colors as ProductColor[])?.[ci];
                                        if (!Number.isFinite(productId) || !color) return;
                                        const publicUrl = await uploadProductImage(
                                          productId,
                                          color.name,
                                          imgIdx,
                                          file,
                                        );

                                        if (publicUrl) {
                                          // Replace temp blob URL with permanent Supabase URL
                                          const colsFinal = ((prodEditData.colors as ProductColor[]) ?? []).map(
                                            (c, i) => {
                                              if (i !== ci) return c;
                                              const imgs = [...(c.images ?? [null, null, null, null])];
                                              imgs[imgIdx] = publicUrl;
                                              return { ...c, images: imgs };
                                            },
                                          );
                                          setProdEditData((d) => ({ ...d, colors: colsFinal }));
                                        }
                                      }}
                                    />
                                  </label>
                                  {color.images?.[imgIdx] ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cols = ((prodEditData.colors as ProductColor[]) ?? []).map(
                                          (c, i) => {
                                            if (i !== ci) return c;
                                            const imgs = [...(c.images ?? [null, null, null, null])];
                                            imgs[imgIdx] = null;
                                            return { ...c, images: imgs };
                                          },
                                        );
                                        setProdEditData((d) => ({ ...d, colors: cols }));
                                      }}
                                      style={{
                                        position: "absolute",
                                        top: 2,
                                        right: 2,
                                        width: 16,
                                        height: 16,
                                        borderRadius: "50%",
                                        background: "rgba(0,0,0,0.6)",
                                        border: "none",
                                        color: "#fff",
                                        fontSize: 10,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        lineHeight: 1,
                                      }}
                                    >
                                      ×
                                    </button>
                                  ) : null}
                                  {imgIdx === 0 ? (
                                    <div
                                      style={{
                                        position: "absolute",
                                        bottom: 2,
                                        left: 2,
                                        background: "rgba(0,0,0,0.5)",
                                        color: "#fff",
                                        fontSize: 7,
                                        padding: "1px 4px",
                                        letterSpacing: ".04em",
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      Main
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (editingProdId == null) return;
                          const updates = {
                            id: editingProdId,
                            name: prodEditData.name,
                            price: Number(prodEditData.price),
                            category: prodEditData.category,
                            sizes:
                              typeof prodEditData.sizes === "string"
                                ? prodEditData.sizes
                                : Array.isArray(prodEditData.sizes)
                                  ? prodEditData.sizes.join(",")
                                  : "",
                            colors: prodEditData.colors,
                            is_new: Boolean(
                              prodEditData.is_new ?? prodEditData.isNew ?? false,
                            ),
                          };
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === editingProdId
                                ? {
                                    ...p,
                                    name: String(updates.name ?? p.name),
                                    price: Number(updates.price),
                                    type: String(updates.category ?? p.type),
                                    sizes:
                                      typeof prodEditData.sizes === "string"
                                        ? prodEditData.sizes
                                            .split(",")
                                            .map((s: string) => s.trim())
                                            .filter(Boolean)
                                        : Array.isArray(prodEditData.sizes)
                                          ? prodEditData.sizes.map((s) => String(s))
                                          : p.sizes,
                                    colors:
                                      (prodEditData.colors as ProductColor[]) ?? p.colors,
                                    isNew: updates.is_new,
                                  }
                                : p,
                            ),
                          );
                          const res = await fetch("/api/products", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(updates),
                          });
                          const result = (await res.json()) as { ok?: boolean; error?: string };
                          if (!result.ok) window.alert("Save failed: " + (result.error ?? "unknown"));
                          setEditingProdId(null);
                        }}
                        style={{
                          flex: 1,
                          padding: 11,
                          background: "#000",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: ".15em",
                          textTransform: "uppercase",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProdId(null)}
                        style={{
                          flex: 1,
                          padding: 11,
                          background: "#fff",
                          color: "#000",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: ".15em",
                          textTransform: "uppercase",
                          border: "1.5px solid #000",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 48,
                        height: 56,
                        background: "#f5f5f5",
                        flexShrink: 0,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {listThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listThumb}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          alt={p.name}
                        />
                      ) : (
                        <span style={{ fontSize: 9, color: "#ccc", fontWeight: 700 }}>HC</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "#aaa" }}>
                        ${p.price} · {p.type} · {p.sizes.join(",")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProdId(p.id);
                        setProdEditData({
                          ...p,
                          category: p.type,
                          sizes: p.sizes.join(","),
                        });
                      }}
                      style={{
                        padding: "7px 14px",
                        border: "1.5px solid #000",
                        background: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {tab === "events" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase" }}>Events</h2>
              <span style={{ fontSize: 10, color: "#aaa" }}>{events.filter((e) => e.visible).length} active</span>
            </div>
            {eventsLoading ? (
              <p style={{ fontSize: 11, color: "#aaa", marginBottom: 12 }}>Loading events…</p>
            ) : null}
            {events.map((ev) => (
              <div key={ev.id} style={{ background: "#fff", border: "1px solid #e5e5e5", marginBottom: 16, overflow: "hidden" }}>
                <div
                  style={{
                    background: "#000",
                    minHeight: 100,
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-end",
                    overflow: "hidden",
                  }}
                >
                  {ev.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ev.image_url}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
                      alt={ev.title}
                    />
                  ) : null}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top,rgba(0,0,0,.9),transparent)",
                    }}
                  />
                  <div style={{ position: "relative", padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, background: "#fff", color: "#000", padding: "2px 8px" }}>
                        ${ev.price}
                      </span>
                      {ev.spotsLeft <= Math.floor(ev.spotsTotal * 0.3) && ev.spotsLeft > 0 ? (
                        <span style={{ fontSize: 8, fontWeight: 900, background: "#dc2626", color: "#fff", padding: "2px 7px" }}>
                          Only {ev.spotsLeft} left
                        </span>
                      ) : null}
                      {!ev.visible ? (
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            background: "rgba(255,255,255,.15)",
                            color: "rgba(255,255,255,.6)",
                            padding: "2px 7px",
                          }}
                        >
                          HIDDEN
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", textTransform: "uppercase", lineHeight: 1.1 }}>
                      {ev.title}
                    </div>
                  </div>
                </div>

                {editingEvId === ev.id ? (
                  <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 14 }}>
                      <span style={S.lbl}>Event Image</span>
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px dashed #ddd",
                          padding: 16,
                          cursor: "pointer",
                          gap: 6,
                          minHeight: 80,
                        }}
                      >
                        {evEditData.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={evEditData.image_url}
                            style={{ width: "100%", maxHeight: 120, objectFit: "cover" }}
                            alt="event"
                          />
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#ccc" strokeWidth="1.5" />
                              <circle cx="8.5" cy="8.5" r="1.5" stroke="#ccc" strokeWidth="1.5" />
                              <path d="M21 15l-5-5L5 21" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#aaa",
                                textTransform: "uppercase",
                                letterSpacing: ".08em",
                              }}
                            >
                              Upload Image
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            const file = e.target.files[0];
                            const ext = file.name.split(".").pop();
                            const path = `events/${evEditData.id}-${Date.now()}.${ext}`;

                            // Show local preview immediately
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            setEvEditData((d: any) => ({
                              ...d,
                              image_url: URL.createObjectURL(file),
                            }));

                            // Upload to Supabase
                            const { error } = await supabase.storage
                              .from("honorculture")
                              .upload(path, file, { upsert: true });

                            if (!error) {
                              const { data } = supabase.storage
                                .from("honorculture")
                                .getPublicUrl(path);

                              const updated = events.map((ev) =>
                                ev.id === evEditData.id
                                  ? { ...ev, image_url: data.publicUrl }
                                  : ev,
                              );
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              setEvEditData((d: any) => ({ ...d, image_url: data.publicUrl }));
                              persistEvents(updated);
                              const evSaved = updated.find((e) => e.id === evEditData.id);
                              if (evSaved) {
                                void fetch("/api/events", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    id: evSaved.id,
                                    type: evSaved.type,
                                    title: evSaved.title,
                                    subtitle: evSaved.subtitle,
                                    date: evSaved.date,
                                    price: evSaved.price,
                                    spots_total: evSaved.spotsTotal,
                                    spots_left: evSaved.spotsLeft,
                                    description: evSaved.description,
                                    image_url: evSaved.image_url,
                                    visible: evSaved.visible,
                                    location: evSaved.location,
                                    dress_code: evSaved.dress_code,
                                    capacity: evSaved.capacity,
                                    description_extra: evSaved.description_extra,
                                    includes: evSaved.includes,
                                  }),
                                }).then(async (r) => {
                                  const result = (await r.json()) as { ok?: boolean; error?: string };
                                  if (!result.ok)
                                    window.alert("Save failed: " + (result.error ?? "unknown"));
                                });
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={S.lbl}>Event Title</span>
                      <input
                        value={evEditData.title ?? ""}
                        onChange={(e) => setEvEditData((d) => ({ ...d, title: e.target.value }))}
                        style={S.inp}
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={S.lbl}>Subtitle / Tags</span>
                      <input
                        value={evEditData.subtitle ?? ""}
                        onChange={(e) => setEvEditData((d) => ({ ...d, subtitle: e.target.value }))}
                        style={S.inp}
                        placeholder="e.g. Private · Exclusive · 20 Guests Only"
                      />
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <span style={S.lbl}>Date & Time — drives the live countdown</span>
                      <input
                        type="datetime-local"
                        value={evEditData.date ?? ""}
                        onChange={(e) => setEvEditData((d) => ({ ...d, date: e.target.value }))}
                        style={{ ...S.inp, cursor: "pointer" }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 12, lineHeight: 1.5 }}>
                      {evEditData.date ? `Countdown targets: ${formatDate(evEditData.date)}` : "Select a date to preview countdown target"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 4 }}>
                      <div>
                        <span style={S.lbl}>Price ($)</span>
                        <input
                          type="number"
                          value={evEditData.price ?? ""}
                          onChange={(e) => setEvEditData((d) => ({ ...d, price: Number(e.target.value) }))}
                          style={S.inp}
                          placeholder="500"
                        />
                      </div>
                      <div>
                        <span style={S.lbl}>Total Spots</span>
                        <input
                          type="number"
                          value={evEditData.spotsTotal ?? ""}
                          onChange={(e) => setEvEditData((d) => ({ ...d, spotsTotal: Number(e.target.value) }))}
                          style={S.inp}
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <span style={S.lbl}>Spots Left</span>
                        <input
                          type="number"
                          value={evEditData.spotsLeft ?? ""}
                          onChange={(e) => setEvEditData((d) => ({ ...d, spotsLeft: Number(e.target.value) }))}
                          style={S.inp}
                          placeholder="7"
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        padding: "8px 10px",
                        background:
                          (evEditData.spotsLeft ?? 0) <= (evEditData.spotsTotal ?? 0) * 0.3 ? "#fef2f2" : "#f5f5f5",
                        color:
                          (evEditData.spotsLeft ?? 0) <= (evEditData.spotsTotal ?? 0) * 0.3 ? "#dc2626" : "#888",
                        marginBottom: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {evEditData.spotsLeft === 0
                        ? "Sold out badge shows"
                        : (evEditData.spotsLeft ?? 0) <= (evEditData.spotsTotal ?? 0) * 0.3
                          ? `⚠ "Only ${evEditData.spotsLeft ?? 0} spots left" badge will show on the event card`
                          : `Urgency badge shows when spots drop to ${Math.floor((evEditData.spotsTotal ?? 0) * 0.3)} or below`}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={S.lbl}>Description</span>
                      <textarea
                        value={evEditData.description ?? ""}
                        onChange={(e) => setEvEditData((d) => ({ ...d, description: e.target.value }))}
                        rows={2}
                        style={{ ...S.inp, resize: "vertical" }}
                        placeholder="Brief description shown on the event card"
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        background: "#f9f9f9",
                        border: "1px solid #e5e5e5",
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>Visible on homepage</div>
                        <div style={{ fontSize: 10, color: "#aaa" }}>Toggle to show or hide</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEvEditData((d) => ({ ...d, visible: !d.visible }))}
                        style={{
                          padding: "7px 16px",
                          background: evEditData.visible ? "#000" : "#fff",
                          color: evEditData.visible ? "#fff" : "#000",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                          border: "1.5px solid #000",
                          cursor: "pointer",
                        }}
                      >
                        {evEditData.visible ? "Visible" : "Hidden"}
                      </button>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={S.lbl}>Location (shown on detail page)</span>
                      <input
                        value={evEditData.location ?? ""}
                        onChange={(e) =>
                          setEvEditData((d: Partial<EventRow>) => ({ ...d, location: e.target.value }))
                        }
                        style={S.inp}
                        placeholder="e.g. Disclosed on booking"
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={S.lbl}>Dress Code</span>
                      <input
                        value={evEditData.dress_code ?? ""}
                        onChange={(e) =>
                          setEvEditData((d: Partial<EventRow>) => ({ ...d, dress_code: e.target.value }))
                        }
                        style={S.inp}
                        placeholder="e.g. Elevated Casual"
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={S.lbl}>Capacity Label</span>
                      <input
                        value={evEditData.capacity ?? ""}
                        onChange={(e) =>
                          setEvEditData((d: Partial<EventRow>) => ({ ...d, capacity: e.target.value }))
                        }
                        style={S.inp}
                        placeholder="e.g. 20 guests only"
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={S.lbl}>Additional Description (optional second paragraph)</span>
                      <textarea
                        value={evEditData.description_extra ?? ""}
                        onChange={(e) =>
                          setEvEditData((d: Partial<EventRow>) => ({
                            ...d,
                            description_extra: e.target.value,
                          }))
                        }
                        rows={2}
                        style={{ ...S.inp, resize: "vertical" } as CSSProperties}
                        placeholder="Extra context shown below main description"
                      />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span style={S.lbl}>What&apos;s Included (one item per line)</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEvEditData((d: Partial<EventRow>) => ({
                              ...d,
                              includes: [...(d.includes ?? []), ""],
                            }))
                          }
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            padding: "3px 8px",
                            border: "1.5px solid #000",
                            background: "#fff",
                            cursor: "pointer",
                            borderRadius: 2,
                          }}
                        >
                          + Add Item
                        </button>
                      </div>
                      {(evEditData.includes ?? []).map((item: string, i: number) => (
                        <div
                          key={i}
                          style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}
                        >
                          <input
                            value={item}
                            onChange={(e) => {
                              const arr = [...(evEditData.includes ?? [])];
                              arr[i] = e.target.value;
                              setEvEditData((d: Partial<EventRow>) => ({ ...d, includes: arr }));
                            }}
                            style={{ ...S.inp, flex: 1 }}
                            placeholder={`Included item ${i + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEvEditData((d: Partial<EventRow>) => ({
                                ...d,
                                includes: (d.includes ?? []).filter((_, j) => j !== i),
                              }))
                            }
                            style={{
                              width: 26,
                              height: 26,
                              border: "1.5px solid #e0e0e0",
                              background: "#fff",
                              cursor: "pointer",
                              fontSize: 14,
                              color: "#aaa",
                              flexShrink: 0,
                              borderRadius: 2,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => void saveEvent({ ...ev, ...evEditData } as EventRow)}
                        style={{
                          flex: 1,
                          padding: 12,
                          background: "#000",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: ".15em",
                          textTransform: "uppercase",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Save & Go Live
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingEvId(null)}
                        style={{
                          flex: 1,
                          padding: 12,
                          background: "#fff",
                          color: "#000",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: ".15em",
                          textTransform: "uppercase",
                          border: "1.5px solid #000",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "12px 14px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1,
                        background: "#e5e5e5",
                        marginBottom: 12,
                      }}
                    >
                      {(
                        [
                          ["Date", formatDate(ev.date)],
                          ["Price", `$${ev.price}`],
                          ["Total Spots", String(ev.spotsTotal)],
                          ["Spots Left", String(ev.spotsLeft)],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k} style={{ background: "#fff", padding: "8px 10px" }}>
                          <div
                            style={{
                              fontSize: 8,
                              fontWeight: 700,
                              letterSpacing: ".1em",
                              textTransform: "uppercase",
                              color: "#aaa",
                              marginBottom: 2,
                            }}
                          >
                            {k}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: k === "Spots Left" && Number(v) <= 3 ? "#dc2626" : "#000",
                            }}
                          >
                            {v}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvId(ev.id);
                          setEvEditData({ ...ev });
                        }}
                        style={{
                          flex: 1,
                          padding: 9,
                          border: "1.5px solid #000",
                          background: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                        }}
                      >
                        Edit Event
                      </button>
                      {eventSaved === ev.id ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a" }}>Saved ✓</span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "payments" && (
          <div>
            <div style={{ background: "#fff", border: "1px solid #e5e5e5", padding: 20, marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                  paddingBottom: 10,
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                Crypto Wallet Settings
              </div>

              <div style={{ marginBottom: 14 }}>
                <span style={S.lbl}>Wallet Label (e.g. Bitcoin (BTC))</span>
                <input
                  value={String(cryptoSettings.wallet_label ?? "")}
                  onChange={(e) => setCryptoSettings((s) => ({ ...s, wallet_label: e.target.value }))}
                  style={S.inp}
                  placeholder="Bitcoin (BTC)"
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <span style={S.lbl}>Wallet Address</span>
                <input
                  value={String(cryptoSettings.wallet_address ?? "")}
                  onChange={(e) => setCryptoSettings((s) => ({ ...s, wallet_address: e.target.value }))}
                  style={S.inp}
                  placeholder="bc1q..."
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <span style={S.lbl}>Payment Note (shown to customers before payment)</span>
                <textarea
                  value={String(cryptoSettings.payment_note ?? "")}
                  onChange={(e) => setCryptoSettings((s) => ({ ...s, payment_note: e.target.value }))}
                  rows={4}
                  style={{ ...S.inp, resize: "vertical" } as CSSProperties}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={S.lbl}>QR Code Image</span>
                {cryptoSettings.qr_code_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={String(cryptoSettings.qr_code_url)}
                    alt="QR"
                    style={{ width: 100, height: 100, objectFit: "cover", marginBottom: 8, border: "1px solid #e5e5e5" }}
                  />
                ) : null}
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #ddd",
                    padding: 14,
                    cursor: "pointer",
                    gap: 6,
                    minHeight: 60,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#aaa",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    {qrUploading
                      ? "Uploading..."
                      : cryptoSettings.qr_code_url
                        ? "Replace QR Code"
                        : "Upload QR Code"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      if (!e.target.files?.[0]) return;
                      setQrUploading(true);
                      const file = e.target.files[0];
                      const ext = file.name.split(".").pop();
                      const path = `qr/wallet-qr.${ext}`;
                      const { supabase: sb } = await import("@/lib/supabase");
                      const { error } = await sb.storage.from("honorculture").upload(path, file, { upsert: true });
                      if (!error) {
                        const { data } = sb.storage.from("honorculture").getPublicUrl(path);
                        setCryptoSettings((s) => ({ ...s, qr_code_url: data.publicUrl }));
                      }
                      setQrUploading(false);
                    }}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/crypto-settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(cryptoSettings),
                  });
                  setCryptoSaved(true);
                  window.setTimeout(() => setCryptoSaved(false), 2000);
                }}
                style={{
                  width: "100%",
                  padding: 12,
                  background: cryptoSaved ? "#16a34a" : "#000",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".15em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                  transition: "background .3s",
                }}
              >
                {cryptoSaved ? "Saved ✓" : "Save Wallet Settings"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, textTransform: "uppercase" }}>Payment Requests</h2>
              <span style={{ fontSize: 10, color: "#aaa" }}>
                {payments.filter((p) => p.status === "awaiting_confirmation").length} pending
              </span>
            </div>

            {paymentsLoading ? (
              <div style={{ textAlign: "center", padding: "30px 20px", color: "#aaa", fontSize: 12 }}>Loading...</div>
            ) : null}

            {!paymentsLoading && payments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 20px", border: "1px dashed #e5e5e5" }}>
                <p style={{ fontSize: 12, color: "#aaa" }}>No payment requests yet.</p>
              </div>
            ) : null}

            {!paymentsLoading &&
              payments.map((pmt) => {
                const isPending = pmt.status === "awaiting_confirmation";
                const isConfirmed = pmt.status === "confirmed";
                const isRejected = pmt.status === "rejected";
                const statusColor = isConfirmed ? "#16a34a" : isRejected ? "#dc2626" : "#d97706";
                const statusBg = isConfirmed ? "#f0fdf4" : isRejected ? "#fef2f2" : "#fffbeb";

                return (
                  <div key={String(pmt.id)} style={{ background: "#fff", border: "1px solid #e5e5e5", marginBottom: 12, overflow: "hidden" }}>
                    <div
                      style={{
                        padding: "12px 14px",
                        borderBottom: "1px solid #f0f0f0",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 2 }}>
                          {String(pmt.customer_name || "Unknown")}
                        </div>
                        <div style={{ fontSize: 10, color: "#888" }}>
                          {String(pmt.customer_email ?? "")} · {String(pmt.customer_instagram ?? "")}
                        </div>
                        <div style={{ fontSize: 10, color: "#bbb", marginTop: 1 }}>
                          {pmt.submitted_at
                            ? new Date(String(pmt.submitted_at)).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : ""}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          background: statusBg,
                          color: statusColor,
                          border: `1px solid ${statusColor}30`,
                          borderRadius: 2,
                        }}
                      >
                        {String(pmt.status ?? "")}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#e5e5e5" }}>
                      {(
                        [
                          ["Amount", `$${String(pmt.amount_usd ?? "")}`],
                          ["Type", String(pmt.type ?? "")],
                          ["Item", String(pmt.item_label ?? "")],
                          ["Gmail", String(pmt.customer_gmail ?? "—")],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k} style={{ background: "#fff", padding: "8px 10px" }}>
                          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#aaa", marginBottom: 1 }}>
                            {k}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        padding: "6px 14px",
                        fontFamily: "monospace",
                        fontSize: 9,
                        color: "#aaa",
                        background: "#f9f9f9",
                        borderTop: "1px solid #f0f0f0",
                      }}
                    >
                      {String(pmt.reference ?? "")}
                    </div>

                    {isPending ? (
                      <div style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch("/api/crypto-payments", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ reference: pmt.reference, status: "confirmed" }),
                            });
                            setPayments((prev) =>
                              prev.map((p) =>
                                p.reference === pmt.reference ? { ...p, status: "confirmed" } : p,
                              ),
                            );
                          }}
                          style={{
                            flex: 1,
                            padding: "9px",
                            border: "1.5px solid #16a34a",
                            background: "#f0fdf4",
                            color: "#16a34a",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: ".1em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                        >
                          ✓ Confirm Payment
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch("/api/crypto-payments", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ reference: pmt.reference, status: "rejected" }),
                            });
                            setPayments((prev) =>
                              prev.map((p) =>
                                p.reference === pmt.reference ? { ...p, status: "rejected" } : p,
                              ),
                            );
                          }}
                          style={{
                            flex: 1,
                            padding: "9px",
                            border: "1.5px solid #dc2626",
                            background: "#fef2f2",
                            color: "#dc2626",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: ".1em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    ) : null}

                    {isConfirmed ? (
                      <div style={{ padding: "8px 14px", fontSize: 10, color: "#16a34a", fontWeight: 700, background: "#f0fdf4" }}>
                        Payment confirmed
                        {pmt.confirmed_at ? ` · ${new Date(String(pmt.confirmed_at)).toLocaleString()}` : ""}
                      </div>
                    ) : null}

                    {isRejected ? (
                      <div style={{ padding: "8px 14px", fontSize: 10, color: "#dc2626", fontWeight: 700, background: "#fef2f2" }}>
                        Payment rejected
                        {pmt.rejected_at ? ` · ${new Date(String(pmt.rejected_at)).toLocaleString()}` : ""}
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </div>
        )}

        {tab === "formbuilder" && <FormBuilderTab />}

        {tab === "downloads" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>Downloads</h2>
            <p style={{ fontSize: 11, color: "#aaa", marginBottom: 20 }}>
              Photo / Video open the file in a new tab (same as Applications). &quot;All Files&quot; opens both.
              &quot;Download everything&quot; saves all application records as JSON (includes media URLs).
            </p>
            {apps.map((app) => {
              const aid = Number(app.id);
              const displayName = String(app.full_name ?? app.name ?? "Applicant");
              const oid = String(app.order_id ?? "");
              const photoUrl = app.photo_url != null ? String(app.photo_url) : "";
              const videoUrl = app.video_url != null ? String(app.video_url) : "";
              const hasPhoto = Boolean(photoUrl);
              const hasVideo = Boolean(videoUrl);
              return (
              <div key={aid} style={{ background: "#fff", border: "1px solid #e5e5e5", marginBottom: 10, padding: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 2 }}>{displayName}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>
                    {String(app.instagram ?? "")} · {oid || "—"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(
                    [
                      {
                        label: "Photo",
                        has: hasPhoto,
                        onClick: () => {
                          if (hasPhoto) window.open(photoUrl, "_blank", "noopener,noreferrer");
                        },
                      },
                      {
                        label: "Video",
                        has: hasVideo,
                        onClick: () => {
                          if (hasVideo) window.open(videoUrl, "_blank", "noopener,noreferrer");
                        },
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.label}
                      type="button"
                      disabled={!f.has}
                      onClick={f.onClick}
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        border: `1.5px solid ${f.has ? "#000" : "#e5e5e5"}`,
                        background: "#fff",
                        color: f.has ? "#000" : "#ccc",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        cursor: f.has ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                      }}
                    >
                      ↓ {f.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={!hasPhoto && !hasVideo}
                    onClick={() => openApplicantMedia(photoUrl, videoUrl)}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      border: `1.5px solid ${hasPhoto || hasVideo ? "#000" : "#e5e5e5"}`,
                      background: hasPhoto || hasVideo ? "#000" : "#f5f5f5",
                      color: hasPhoto || hasVideo ? "#fff" : "#ccc",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      cursor: hasPhoto || hasVideo ? "pointer" : "default",
                    }}
                  >
                    All Files
                  </button>
                </div>
              </div>
              );
            })}
            <button
              type="button"
              disabled={apps.length === 0}
              onClick={() => downloadApplicationsJson()}
              style={{
                width: "100%",
                padding: 13,
                background: apps.length === 0 ? "#e5e5e5" : "#000",
                color: apps.length === 0 ? "#999" : "#fff",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                border: "none",
                cursor: apps.length === 0 ? "default" : "pointer",
                marginTop: 8,
              }}
            >
              ↓ Download Everything (JSON)
            </button>
          </div>
        )}

        {tab === "settings" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", marginBottom: 16 }}>Settings</h2>
            <div style={{ background: "#fff", border: "1px solid #e5e5e5", padding: 20, marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "#aaa",
                  paddingBottom: 10,
                  borderBottom: "1px solid #f0f0f0",
                  marginBottom: 16,
                }}
              >
                Access & Passwords
              </div>
              {(
                [
                  { label: "Site Password (what models enter)", key: "sitePass" as const },
                  { label: "Admin Password", key: "adminPass" as const },
                  { label: "Instagram Handle", key: "instagram" as const },
                ] as const
              ).map((f) => (
                <div key={f.key} style={{ marginBottom: 18 }}>
                  <span style={S.lbl}>{f.label}</span>
                  <input
                    type="text"
                    value={settings[f.key]}
                    onChange={(e) => setSettings((s) => ({ ...s, [f.key]: e.target.value }))}
                    style={S.inp}
                  />
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", border: "1px solid #e5e5e5", padding: 20, marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "#aaa",
                  paddingBottom: 10,
                  borderBottom: "1px solid #f0f0f0",
                  marginBottom: 16,
                }}
              >
                Site Status
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    {siteOpen ? "Portal Open" : "Portal Closed"}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>
                    {siteOpen ? "Models can access and apply" : "Applications are paused"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSiteOpen((o) => !o)}
                  style={{
                    padding: "9px 18px",
                    background: siteOpen ? "#000" : "#fff",
                    color: siteOpen ? "#fff" : "#000",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    border: "1.5px solid #000",
                    cursor: "pointer",
                  }}
                >
                  {siteOpen ? "Close Portal" : "Open Portal"}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSettingsSaved(true);
                window.setTimeout(() => setSettingsSaved(false), 2000);
              }}
              style={{
                width: "100%",
                padding: 13,
                background: settingsSaved ? "#16a34a" : "#000",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                transition: "background .3s",
              }}
            >
              {settingsSaved ? "Saved ✓" : "Save Settings"}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewApp ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 50, overflowY: "auto" }}
          >
            <div
              style={{
                background: "#000",
                padding: "13px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: ".15em",
                  textTransform: "uppercase",
                }}
              >
                Application
              </span>
              <button
                type="button"
                onClick={() => setViewApp(null)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "24px 20px", maxWidth: 600, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", marginBottom: 4 }}>
                    {String(viewApp.full_name ?? viewApp.name ?? "Applicant")}
                  </h2>
                  <p style={{ fontSize: 11, color: "#888" }}>
                    {[viewApp.instagram, viewApp.city, viewApp.country].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    background: ss(String(viewApp.status ?? "pending")).bg,
                    color: ss(String(viewApp.status ?? "pending")).color,
                    border: `1px solid ${ss(String(viewApp.status ?? "pending")).border}`,
                    borderRadius: 2,
                  }}
                >
                  {String(viewApp.status ?? "pending")}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#e5e5e5", marginBottom: 20 }}>
                {(
                  [
                    ["Date of Birth", viewApp.dob],
                    ["Height", viewApp.height],
                    ["Sizing", viewApp.sizing],
                    ["Build", viewApp.build_type],
                    ["Inseam", viewApp.inseam],
                    ["Content Style", viewApp.content_style],
                    ["Phone", viewApp.phone],
                    ["Email", viewApp.email],
                  ] as const
                )
                  .filter(([, v]) => v != null && String(v).trim() !== "")
                  .map(([k, v]) => (
                  <div key={k} style={{ background: "#fff", padding: "10px 12px" }}>
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        color: "#aaa",
                        marginBottom: 2,
                      }}
                    >
                      {k}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{String(v)}</div>
                  </div>
                ))}
              </div>
              {viewApp.address ? (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "#aaa",
                      marginBottom: 4,
                    }}
                  >
                    Address
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.5, wordBreak: "break-word" }}>
                    {String(viewApp.address)}
                  </div>
                </div>
              ) : null}
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  color: "#aaa",
                  background: "#f5f5f5",
                  padding: "8px 12px",
                  marginBottom: 20,
                }}
              >
                {String(viewApp.order_id ?? "—")}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {String(viewApp.status ?? "pending") !== "approved" ? (
                  <button
                    type="button"
                    onClick={() => void updateStatus(Number(viewApp.id), "approved")}
                    style={{
                      flex: 1,
                      padding: 12,
                      border: "1.5px solid #16a34a",
                      background: "#f0fdf4",
                      color: "#16a34a",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    Approve
                  </button>
                ) : null}
                {String(viewApp.status ?? "pending") !== "rejected" ? (
                  <button
                    type="button"
                    onClick={() => void updateStatus(Number(viewApp.id), "rejected")}
                    style={{
                      flex: 1,
                      padding: 12,
                      border: "1.5px solid #dc2626",
                      background: "#fef2f2",
                      color: "#dc2626",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    Reject
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
