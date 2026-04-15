import { supabase } from "./supabase";

export type ProductColor = {
  name: string;
  hex: string;
  images: (string | null)[]; // always 4 slots
};

export type Product = {
  id: number;
  name: string;
  type: string;
  price: number;
  sizes: string[];
  isNew: boolean;
  colors: ProductColor[];
};

export const DEFAULT_COLORS: ProductColor[] = [
  { name: "Black", hex: "#1a1a1a", images: [null, null, null, null] },
  { name: "White", hex: "#f5f5f5", images: [null, null, null, null] },
  { name: "Gray", hex: "#888888", images: [null, null, null, null] },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Resolve Tee",
    type: "tops",
    price: 48,
    sizes: ["XS", "S", "M", "L", "XL"],
    isNew: true,
    colors: DEFAULT_COLORS.slice(0, 3).map((c) => ({
      ...c,
      images: [null, null, null, null],
    })),
  },
  {
    id: 2,
    name: "Honor Short",
    type: "bottoms",
    price: 62,
    sizes: ["S", "M", "L", "XL"],
    isNew: false,
    colors: DEFAULT_COLORS.slice(0, 3).map((c) => ({
      ...c,
      images: [null, null, null, null],
    })),
  },
  {
    id: 3,
    name: "Culture Hoodie",
    type: "outerwear",
    price: 95,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    isNew: true,
    colors: DEFAULT_COLORS.slice(0, 3).map((c) => ({
      ...c,
      images: [null, null, null, null],
    })),
  },
  {
    id: 4,
    name: "Mind Jogger",
    type: "bottoms",
    price: 78,
    sizes: ["S", "M", "L", "XL"],
    isNew: false,
    colors: DEFAULT_COLORS.slice(0, 3).map((c) => ({
      ...c,
      images: [null, null, null, null],
    })),
  },
  {
    id: 5,
    name: "Conflict Vest",
    type: "tops",
    price: 52,
    sizes: ["S", "M", "L", "XL"],
    isNew: true,
    colors: DEFAULT_COLORS.slice(0, 3).map((c) => ({
      ...c,
      images: [null, null, null, null],
    })),
  },
  {
    id: 6,
    name: "Legacy Set",
    type: "sets",
    price: 135,
    sizes: ["S", "M", "L"],
    isNew: false,
    colors: DEFAULT_COLORS.slice(0, 3).map((c) => ({
      ...c,
      images: [null, null, null, null],
    })),
  },
  {
    id: 7,
    name: "Spirit Track Top",
    type: "outerwear",
    price: 88,
    sizes: ["S", "M", "L", "XL"],
    isNew: true,
    colors: DEFAULT_COLORS.slice(0, 3).map((c) => ({
      ...c,
      images: [null, null, null, null],
    })),
  },
  {
    id: 8,
    name: "Forge Legging",
    type: "bottoms",
    price: 72,
    sizes: ["XS", "S", "M", "L", "XL"],
    isNew: false,
    colors: DEFAULT_COLORS.slice(0, 3).map((c) => ({
      ...c,
      images: [null, null, null, null],
    })),
  },
];

function normalizeImages(images: unknown): (string | null)[] {
  const arr = Array.isArray(images) ? images : [];
  const out: (string | null)[] = [null, null, null, null];
  for (let i = 0; i < 4; i++) out[i] = (arr[i] as string | null) ?? null;
  return out;
}

function normalizeColors(colors: unknown): ProductColor[] {
  if (!Array.isArray(colors) || colors.length === 0) {
    return DEFAULT_COLORS.slice(0, 3).map((c) => ({
      ...c,
      images: [null, null, null, null],
    }));
  }
  return colors.map((c: unknown) => {
    const o = c as Record<string, unknown>;
    return {
      name: String(o.name ?? "Color"),
      hex: String(o.hex ?? "#cccccc"),
      images: normalizeImages(o.images),
    };
  });
}

/** Map legacy admin/shop rows (category, sizes string, single image) to Product. */
export function migrateLegacyProductRow(row: Record<string, unknown>): Product {
  const sizesStr = String(row.sizes ?? "");
  const sizeList = sizesStr
    .split(/[,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const img = row.image ?? row.image_url;
  const colors = DEFAULT_COLORS.slice(0, 3).map((c) => ({
    ...c,
    images: [null, null, null, null] as (string | null)[],
  }));
  if (typeof img === "string" && img.length > 0) {
    colors[0] = {
      ...colors[0],
      images: [img, null, null, null],
    };
  }
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    type: String(row.category ?? row.type ?? "tops"),
    price: Number(row.price ?? 0),
    sizes: sizeList.length ? sizeList : ["S", "M", "L"],
    isNew: Boolean(row.new ?? row.isNew ?? false),
    colors,
  };
}

function parseStoredProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "number" && typeof r.id !== "string") return null;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  const hasColors = Array.isArray(r.colors) && r.colors.length > 0;
  if (hasColors) {
    return {
      id,
      name: String(r.name ?? ""),
      type: String(r.type ?? r.category ?? "tops"),
      price: Number(r.price ?? 0),
      sizes: Array.isArray(r.sizes)
        ? (r.sizes as unknown[]).map(String)
        : migrateLegacyProductRow(r).sizes,
      isNew: Boolean(r.isNew ?? r.new ?? false),
      colors: normalizeColors(r.colors),
    };
  }
  return migrateLegacyProductRow(r);
}

function readLocalProducts(): Product[] {
  if (typeof window === "undefined") return DEFAULT_PRODUCTS;
  try {
    const s = localStorage.getItem("hc_products");
    if (s) {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const out: Product[] = [];
        for (const item of parsed) {
          const p = parseStoredProduct(item);
          if (p) out.push(p);
        }
        if (out.length) return out;
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PRODUCTS;
}

export async function loadProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id");
    if (!error && Array.isArray(data) && data.length > 0) {
      const normalized = data
        .map((row) => parseStoredProduct(row as Record<string, unknown>))
        .filter((p): p is Product => p != null);
      if (normalized.length === 0) return readLocalProducts();
      if (typeof window !== "undefined") {
        localStorage.setItem("hc_products", JSON.stringify(normalized));
      }
      return normalized;
    }
  } catch {
    /* ignore */
  }
  return readLocalProducts();
}

export async function saveProducts(products: Product[]): Promise<boolean> {
  if (typeof window !== "undefined") {
    localStorage.setItem("hc_products", JSON.stringify(products));
  }

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.type,
    price: p.price,
    sizes: p.sizes.join(","),
    new: p.isNew,
    colors: p.colors,
    image_url:
      p.colors.flatMap((c) => c.images).find((u) => typeof u === "string") ??
      null,
  }));

  try {
    // Backward compatibility: some environments may still be missing newer
    // columns (e.g. colors/new). Retry by removing unsupported columns one by one.
    let candidateRows: Record<string, unknown>[] = rows.map((r) => ({ ...r }));
    for (let attempt = 0; attempt < 6; attempt++) {
      const { error } = await supabase
        .from("products")
        .upsert(candidateRows, { onConflict: "id" });
      if (!error) return true;

      const match = error.message.match(/Could not find the '([^']+)' column/);
      if (!match) {
        console.error("Failed to save products:", error.message);
        return false;
      }
      const missingColumn = match[1];
      candidateRows = candidateRows.map((row) => {
        const next = { ...row };
        delete next[missingColumn];
        return next;
      });
    }
    console.error(
      "Failed to save products:",
      "Exceeded retry attempts while adapting to schema columns.",
    );
    return false;
  } catch (e) {
    console.error("Failed to save products:", e);
    return false;
  }
}

export function cacheProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("hc_products", JSON.stringify(products));
}

export async function uploadProductImage(
  productId: number,
  colorName: string,
  slot: number,
  file: File,
): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `products/${productId}/${colorName.toLowerCase()}-${slot}.${ext}`;

  const { error } = await supabase.storage
    .from("honorculture")
    .upload(path, file, { upsert: true });

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("honorculture").getPublicUrl(path);

  return data.publicUrl;
}
