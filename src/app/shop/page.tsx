"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getProducts } from "@/lib/db";

const PRODUCTS = [
  {
    id: 1,
    name: "Resolve Tee",
    type: "tops",
    price: 48,
    sizes: ["XS", "S", "M", "L", "XL"],
    new: true,
  },
  {
    id: 2,
    name: "Honor Short",
    type: "bottoms",
    price: 62,
    sizes: ["S", "M", "L", "XL"],
    new: false,
  },
  {
    id: 3,
    name: "Culture Hoodie",
    type: "outerwear",
    price: 95,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    new: true,
  },
  {
    id: 4,
    name: "Mind Jogger",
    type: "bottoms",
    price: 78,
    sizes: ["S", "M", "L", "XL"],
    new: false,
  },
  {
    id: 5,
    name: "Conflict Vest",
    type: "tops",
    price: 52,
    sizes: ["S", "M", "L", "XL"],
    new: true,
  },
  {
    id: 6,
    name: "Legacy Set",
    type: "sets",
    price: 135,
    sizes: ["S", "M", "L"],
    new: false,
  },
  {
    id: 7,
    name: "Spirit Track Top",
    type: "outerwear",
    price: 88,
    sizes: ["S", "M", "L", "XL"],
    new: true,
  },
  {
    id: 8,
    name: "Forge Legging",
    type: "bottoms",
    price: 72,
    sizes: ["XS", "S", "M", "L", "XL"],
    new: false,
  },
];

function generateOrderId() {
  const s = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HC-${s()}-${s()}-${s()}`;
}

type ShopProduct = {
  id: number;
  name: string;
  type: string;
  price: number;
  sizes: string[];
  new: boolean;
  image: string | null;
};

function rowToShopProduct(r: Record<string, unknown>): ShopProduct {
  const sizesStr = String(r.sizes ?? "");
  const sizeList = sizesStr
    .split(/[,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const img = r.image ?? r.image_url;
  return {
    id: Number(r.id),
    name: String(r.name ?? ""),
    type: String(r.category ?? "tops"),
    price: Number(r.price ?? 0),
    sizes: sizeList.length ? sizeList : ["S", "M", "L"],
    new: Boolean(r.new ?? false),
    image:
      typeof img === "string" && img.length > 0 ? img : null,
  };
}

export default function ShopPage() {
  const [productList, setProductList] = useState<ShopProduct[]>(() =>
    PRODUCTS.map((p) => ({ ...p, image: null as string | null })),
  );
  const [cart, setCart] = useState<{ id: number; size: string }[]>([]);
  const [sizes, setSizes] = useState<Record<number, string>>({});
  const [open, setOpen] = useState<number | null>(null);
  const [category, setCategory] = useState("all");
  const [orderId, setOrderId] = useState(() => generateOrderId());
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const applyLocal = () => {
      try {
        const raw = localStorage.getItem("hc_products");
        if (!raw) return false;
        const arr = JSON.parse(raw) as unknown;
        if (!Array.isArray(arr) || arr.length === 0) return false;
        setProductList(arr.map((r) => rowToShopProduct(r as Record<string, unknown>)));
        return true;
      } catch {
        return false;
      }
    };

    const load = async () => {
      if (applyLocal()) return;
      try {
        const rows = await getProducts();
        if (cancelled || !rows.length) return;
        setProductList(
          rows.map((r) => rowToShopProduct(r as Record<string, unknown>)),
        );
      } catch (e) {
        console.error(e);
      }
    };

    void load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "hc_products" || e.key === null) void load();
    };
    const onHonorLocal = () => void load();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", load);
    window.addEventListener("honor-local-storage", onHonorLocal);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", load);
      window.removeEventListener("honor-local-storage", onHonorLocal);
    };
  }, []);

  const filtered =
    category === "all"
      ? productList
      : productList.filter((p) => p.type === category);
  const inCart = (id: number) => !!cart.find((c) => c.id === id);
  const maxed = cart.length >= 2;

  const toggleCart = (id: number) => {
    if (inCart(id)) {
      setCart(cart.filter((c) => c.id !== id));
      return;
    }
    if (maxed || !sizes[id]) return;
    setCart([...cart, { id, size: sizes[id] }]);
    setOpen(null);
  };

  const downloadInvoice = async () => {
    setDownloading(true);
    const cartItems = cart.map((c) => {
      const p = productList.find((pr) => pr.id === c.id)!;
      return { ...p, selectedSize: c.size };
    });
    let finalOrderId = orderId;
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            name: item.name,
            price: item.price,
            size: item.selectedSize,
          })),
        }),
      });
      const data = (await res.json()) as { orderId?: string };
      if (data.orderId) finalOrderId = String(data.orderId);
    } catch (e) {
      console.error(e);
    }
    setOrderId(finalOrderId);

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const total = cartItems.reduce((sum, p) => sum + p.price, 0);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, "F");

    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("HONOR CULTURE", 20, 18);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text("CAST PORTAL — MODEL INVOICE", 20, 26);
    doc.text("@h0n0rculture.cast", 20, 32);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 20, 60);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Date: ${new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      20,
      70,
    );
    doc.text(`Invoice: ${finalOrderId}`, 20, 76);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 82, 190, 82);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("ITEM", 20, 92);
    doc.text("SIZE", 120, 92);
    doc.text("PRICE", 170, 92);

    doc.setLineWidth(0.2);
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 95, 190, 95);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    cartItems.forEach((item, i) => {
      const y = 104 + i * 12;
      doc.text(item.name, 20, y);
      doc.text(item.selectedSize, 120, y);
      doc.text(`$${item.price}`, 170, y);
      doc.setDrawColor(240, 240, 240);
      doc.line(20, y + 4, 190, y + 4);
    });

    const totalY = 104 + cartItems.length * 12 + 8;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, totalY, 190, totalY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL", 20, totalY + 10);
    doc.text(`$${total}`, 170, totalY + 10);

    const boxY = totalY + 28;
    doc.setFillColor(0, 0, 0);
    doc.rect(20, boxY, 170, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("YOUR ORDER ID — USE THIS TO ACCESS YOUR MODEL APPLICATION", 35, boxY + 10);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(finalOrderId, 35, boxY + 24);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(
      "Screenshot or save this invoice. Go to the Cast Portal and enter this ID to apply.",
      35,
      boxY + 33,
    );

    const instrY = boxY + 52;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("HOW TO APPLY:", 20, instrY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("1. Save this invoice and copy your Order ID above", 20, instrY + 8);
    doc.text("2. Visit the Honor Culture Cast Portal", 20, instrY + 15);
    doc.text('3. Click "Apply to be a Model"', 20, instrY + 22);
    doc.text("4. Enter your Order ID to unlock the application form", 20, instrY + 29);
    doc.text("5. Complete all steps and submit", 20, instrY + 36);

    doc.setFillColor(0, 0, 0);
    doc.rect(0, 272, 210, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("HONOR CULTURE", 20, 282);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(
      "honorculture.com  ·  @h0n0rculture  ·  @h0n0rculture.cast",
      20,
      289,
    );

    doc.save(`HonorCulture-Invoice-${finalOrderId}.pdf`);
    setDownloading(false);
    setShowModal(true);
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-black px-4 py-2 text-center text-[10px] uppercase tracking-[.12em] text-white">
        Model Portal — Select Up To 2 Pieces
      </div>

      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <button type="button" onClick={() => router.back()} className="p-0.5">
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
            <rect width="20" height="1.5" rx=".75" fill="#000" />
            <rect y="6" width="14" height="1.5" rx=".75" fill="#000" />
            <rect y="12" width="20" height="1.5" rx=".75" fill="#000" />
          </svg>
        </button>
        <span className="text-[13px] font-bold uppercase tracking-wide">
          Honor Culture
        </span>
        <div className="relative">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6L18 2z"
              stroke="#000"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="3"
              y1="6"
              x2="21"
              y2="6"
              stroke="#000"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M16 10a4 4 0 01-8 0"
              stroke="#000"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <AnimatePresence>
            {cart.length > 0 && (
              <motion.span
                className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[8px] font-bold text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {cart.length}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <div
        className="relative flex flex-col items-center justify-center bg-black px-6 py-16 text-center"
        style={{ minHeight: "50vh" }}
      >
        <p className="mb-3 text-[9px] uppercase tracking-[.3em] text-white/50">
          Honor Culture — Cast Selection
        </p>
        <h1 className="mb-4 text-[32px] font-black uppercase leading-none tracking-tight text-white">
          The Collection
        </h1>
        <button
          type="button"
          className="mt-2 bg-white px-8 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-black"
        >
          Shop Now
        </button>
      </div>

      <div
        className="overflow-x-auto border-b border-gray-100"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex whitespace-nowrap px-4">
          {["all", "tops", "bottoms", "outerwear", "sets"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 border-b-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                category === cat
                  ? "border-black text-black"
                  : "border-transparent text-gray-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <button
          type="button"
          className="flex items-center gap-1.5 border border-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide"
        >
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <line
              x1="0"
              y1="1.5"
              x2="12"
              y2="1.5"
              stroke="#000"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="2"
              y1="5"
              x2="10"
              y2="5"
              stroke="#000"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="4"
              y1="8.5"
              x2="8"
              y2="8.5"
              stroke="#000"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Filter + Sort
        </button>
        <span className="text-[10px] text-gray-400">{filtered.length} Items</span>
        <span className="text-[10px] font-bold uppercase tracking-wide">
          {cart.length > 0 ? `${cart.length} / 2 Selected` : "Select 2"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-gray-100 pb-32">
        {filtered.map((product: ShopProduct) => {
          const picked = inCart(product.id);
          const disabled = maxed && !picked;
          return (
            <div
              key={product.id}
              className={`relative bg-white ${disabled ? "pointer-events-none opacity-40" : ""}`}
            >
              <div
                role="button"
                tabIndex={0}
                className="relative flex aspect-[3/4] cursor-pointer items-center justify-center bg-gray-50"
                onClick={() => setOpen(open === product.id ? null : product.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpen(open === product.id ? null : product.id);
                  }
                }}
              >
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[56px] font-black tracking-tighter text-gray-100">
                    HC
                  </span>
                )}
                {product.new && !picked && (
                  <span className="absolute right-2 top-2 bg-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                    New
                  </span>
                )}
                {picked && (
                  <motion.span
                    className="absolute left-2 top-2 bg-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Selected
                  </motion.span>
                )}
              </div>
              <div
                role="button"
                tabIndex={0}
                className="cursor-pointer px-2.5 pb-1 pt-2"
                onClick={() => setOpen(open === product.id ? null : product.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpen(open === product.id ? null : product.id);
                  }
                }}
              >
                <p className="text-[12px] font-semibold leading-tight text-black">
                  {product.name}
                </p>
                <p className="mt-0.5 text-[12px] text-black">${product.price}</p>
              </div>
              <AnimatePresence>
                {open === product.id && (
                  <motion.div
                    className="px-2.5 pb-3"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="mb-1.5 text-[9px] uppercase tracking-[.1em] text-gray-400">
                      Select Size
                    </p>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setSizes((p) => ({ ...p, [product.id]: s }))
                          }
                          className={`border px-2 py-1 text-[10px] font-semibold transition-all ${
                            sizes[product.id] === s
                              ? "border-black bg-black text-white"
                              : "border-gray-200 text-gray-500 hover:border-black"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCart(product.id)}
                      disabled={!sizes[product.id] && !picked}
                      className={`w-full py-2.5 text-[10px] font-bold uppercase tracking-[.15em] transition-all ${
                        picked
                          ? "border-2 border-black bg-white text-black"
                          : "bg-black text-white disabled:bg-gray-200 disabled:text-gray-400"
                      }`}
                    >
                      {picked ? "Remove" : "Add to Bag"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent px-4 pb-6 pt-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <button
              type="button"
              onClick={downloadInvoice}
              className="flex w-full items-center justify-center gap-2 bg-black py-3.5 text-[11px] font-bold uppercase tracking-[.18em] text-white transition-transform active:scale-[.99]"
            >
              {downloading ? (
                "Generating Invoice..."
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download Invoice & Get Order ID
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-white px-7 pb-8 pt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-black">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  stroke="#000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-black uppercase tracking-tight">
              Invoice Downloaded
            </h2>
            <p className="mb-6 text-[12px] leading-relaxed text-gray-500">
              Your invoice has been saved to your downloads. It contains your
              Order ID — you need it to apply.
            </p>
            <div className="mb-3 border-2 border-black p-5">
              <p className="mb-2 text-[9px] uppercase tracking-[.25em] text-gray-400">
                Your Order ID
              </p>
              <p className="break-all font-mono text-sm font-bold leading-relaxed tracking-wider text-black">
                {orderId}
              </p>
            </div>
            <p className="mb-8 text-[11px] leading-relaxed text-gray-400">
              Save this ID. Open your invoice PDF and go to the Apply section to
              use it.
            </p>
            <button
              type="button"
              onClick={() => router.push(`/form/${encodeURIComponent(orderId)}`)}
              className="mb-3 w-full bg-black py-3.5 text-[11px] font-bold uppercase tracking-[.2em] text-white"
            >
              Apply to be a Model →
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full border-2 border-black py-3 text-[11px] font-bold uppercase tracking-[.15em]"
            >
              Back to Shop
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
