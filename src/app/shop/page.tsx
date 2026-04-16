"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { CryptoPayment } from "@/components/CryptoPayment";
import {
  parseStoredProduct,
  DEFAULT_COLORS,
  type Product,
} from "@/lib/products";

const FALLBACK_PRODUCTS: Record<string, unknown>[] = [
  { id: 1, name: "Resolve Tee", category: "tops", price: 48, sizes: "XS,S,M,L,XL", is_new: true, colors: [] },
  { id: 2, name: "Honor Short", category: "bottoms", price: 62, sizes: "S,M,L,XL", is_new: false, colors: [] },
  { id: 3, name: "Culture Hoodie", category: "outerwear", price: 95, sizes: "XS,S,M,L,XL,XXL", is_new: true, colors: [] },
  { id: 4, name: "Mind Jogger", category: "bottoms", price: 78, sizes: "S,M,L,XL", is_new: false, colors: [] },
  { id: 5, name: "Conflict Vest", category: "tops", price: 52, sizes: "S,M,L,XL", is_new: true, colors: [] },
  { id: 6, name: "Legacy Set", category: "sets", price: 135, sizes: "S,M,L", is_new: false, colors: [] },
  { id: 7, name: "Spirit Track Top", category: "outerwear", price: 88, sizes: "S,M,L,XL", is_new: true, colors: [] },
  { id: 8, name: "Forge Legging", category: "bottoms", price: 72, sizes: "XS,S,M,L,XL", is_new: false, colors: [] },
];

function normalizeProduct(raw: Record<string, unknown>): Product {
  const parsed = parseStoredProduct(raw);
  if (parsed) return parsed;
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    type: String(raw.category ?? raw.type ?? "tops"),
    price: Number(raw.price ?? 0),
    sizes:
      typeof raw.sizes === "string"
        ? raw.sizes.split(",").map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(raw.sizes)
          ? (raw.sizes as unknown[]).map(String)
          : [],
    colors: DEFAULT_COLORS.slice(0, 3).map((c) => ({
      ...c,
      images: [null, null, null, null] as (string | null)[],
    })),
    isNew: Boolean(raw.is_new ?? raw.isNew ?? false),
  };
}

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 40,
            }}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: 280,
              background: "#fff",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 20px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: ".2em",
                  textTransform: "uppercase",
                }}
              >
                Honor Culture
              </span>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1 }}>
              {[
                { label: "Home", action: () => go("/home") },
                { label: "Shop", action: () => onClose() },
                { label: "Apply to be a Model", action: () => go("/apply") },
                { label: "Events", action: () => go("/home#events") },
                { label: "Join Our Team", action: () => go("/home#jointeam") },
              ].map((link, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={link.action}
                  style={{
                    width: "100%",
                    padding: "18px 20px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid #f5f5f5",
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    color: "#000",
                  }}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div style={{ padding: "20px", borderTop: "1px solid #f0f0f0" }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".2em",
                  textTransform: "uppercase",
                  color: "#ccc",
                  marginBottom: 3,
                }}
              >
                Honor Culture
              </p>
              <p style={{ fontSize: 10, color: "#ccc" }}>@h0n0rculture.cast</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function generateOrderId() {
  const s = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HC-${s()}-${s()}-${s()}`;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [cart, setCart] = useState<{ id: number; size: string }[]>([]);
  const [sizes, setSizes] = useState<Record<number, string>>({});
  const [category, setCategory] = useState("all");
  const [orderId, setOrderId] = useState(() => generateOrderId());
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cryptoOpen, setCryptoOpen] = useState(false);
  const [cryptoItems, setCryptoItems] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      fetch("/api/products")
        .then((r) => r.json())
        .then((data) => {
          if (!mounted) return;
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data as Record<string, unknown>[]);
          }
        })
        .catch(() => {
          if (mounted) setProducts(FALLBACK_PRODUCTS);
        });
    };
    refresh();
    const onFocus = () => {
      refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const productList = useMemo(
    () => products.map((raw) => normalizeProduct(raw)),
    [products],
  );

  const filtered =
    category === "all"
      ? productList
      : productList.filter((p) => p.type === category);
  const inCart = (id: number) => !!cart.find((c) => c.id === id);
  const maxed = cart.length >= 2;

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
    setCryptoItems(
      cart.map((c) => {
        const p = products.find((x) => Number(x.id) === c.id);
        return { name: p?.name, price: p?.price, size: c.size };
      }),
    );
  };

  return (
    <main className="min-h-screen bg-white">
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="bg-black px-4 py-2 text-center text-[10px] uppercase tracking-[.12em] text-white">
        Model Portal — Select Up To 2 Pieces
      </div>

      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="p-0.5"
        >
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
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            inCart={inCart(product.id)}
            maxed={maxed}
            selectedSize={sizes[product.id]}
            onSizeSelect={(s) =>
              setSizes((p) => ({ ...p, [product.id]: s }))
            }
            onToggleCart={() => {
              if (inCart(product.id)) {
                setCart((c) => c.filter((x) => x.id !== product.id));
              } else {
                if (maxed || !sizes[product.id]) return;
                setCart((c) => [
                  ...c,
                  { id: product.id, size: sizes[product.id] },
                ]);
              }
            }}
          />
        ))}
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
              onClick={() => {
                setShowModal(false);
                setCryptoOpen(true);
              }}
              className="mb-3 w-full bg-black py-3.5 text-[11px] font-bold uppercase tracking-[.2em] text-white"
            >
              Pay with Crypto & Apply →
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
      <CryptoPayment
        open={cryptoOpen}
        onClose={() => setCryptoOpen(false)}
        amountUsd={cryptoItems.reduce((s, i) => s + Number(i.price ?? 0), 0)}
        itemLabel={cryptoItems.map((i) => String(i.name ?? "")).join(" + ")}
        type="shop"
        orderDetails={cryptoItems}
        customerName=""
        customerEmail=""
        customerInstagram=""
      />
    </main>
  );
}
