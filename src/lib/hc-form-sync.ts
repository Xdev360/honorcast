/** Mirrors admin Form Builder types (persisted under `hc_form_cats`). */

export type AdminFieldType =
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

export type AdminFormField = {
  id: number;
  label: string;
  type: AdminFieldType;
  note: string;
  placeholder?: string;
  placeholder2?: string;
  options?: string[];
  required: boolean;
};

export type AdminFormCategory = {
  id: number;
  label: string;
  fields: AdminFormField[];
  expanded: boolean;
};

/** Stable `data` keys + Supabase mapping (default Cast form field ids 1–14). */
const FIELD_ID_TO_KEY: Record<number, string> = {
  1: "fullName",
  2: "address",
  3: "phone",
  4: "email",
  5: "dob",
  6: "heightSize",
  7: "buildType",
  8: "inseam",
  9: "instagram",
  10: "tiktok",
  11: "youtube",
  12: "contentStyle",
  13: "photo",
  14: "video",
};

export type ApplicationStepFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "tel"
  | "date"
  | "select"
  | "radio"
  | "dual"
  | "photo"
  | "video"
  | "address";

export type ApplicationFormStep = {
  category: number;
  categoryName: string;
  field: string;
  label: string;
  note: string;
  type: ApplicationStepFieldType;
  placeholder?: string;
  placeholder2?: string;
  options?: string[];
  required?: boolean;
};

function mapFieldType(t: AdminFieldType): ApplicationStepFieldType {
  if (t === "textarea") return "textarea";
  if (t === "number") return "number";
  return t as ApplicationStepFieldType;
}

export function categoriesToSteps(cats: AdminFormCategory[]): ApplicationFormStep[] {
  const sorted = [...cats].sort((a, b) => a.id - b.id);
  const steps: ApplicationFormStep[] = [];
  let catIndex = 0;
  for (const cat of sorted) {
    catIndex += 1;
    const fields = [...cat.fields];
    for (const f of fields) {
      const fieldKey = FIELD_ID_TO_KEY[f.id] ?? `hc_${f.id}`;
      steps.push({
        category: catIndex,
        categoryName: cat.label,
        field: fieldKey,
        label: f.label,
        note: f.note,
        type: mapFieldType(f.type),
        placeholder: f.placeholder,
        placeholder2: f.placeholder2,
        options: f.options,
        required: f.required,
      });
    }
  }
  return steps;
}

/** Same-tab sync: `storage` only fires in other documents. */
export function notifyHonorLocalStorage() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("honor-local-storage"));
}

export function loadApplicationStepsFromStorage(
  fallback: ApplicationFormStep[],
): ApplicationFormStep[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem("hc_form_cats");
    if (!raw) return fallback;
    const cats = JSON.parse(raw) as AdminFormCategory[];
    if (!Array.isArray(cats) || cats.length === 0) return fallback;
    const steps = categoriesToSteps(cats);
    return steps.length > 0 ? steps : fallback;
  } catch {
    return fallback;
  }
}

export function serializeExtraAnswers(data: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (!k.startsWith("hc_")) continue;
    if (v === undefined || v === null) continue;
    if (v instanceof File) continue;
    if (Array.isArray(v)) {
      lines.push(`${k}: ${v.join(" | ")}`);
    } else {
      lines.push(`${k}: ${String(v)}`);
    }
  }
  if (lines.length === 0) return "";
  return "\n\n[Additional fields]\n" + lines.join("\n");
}
