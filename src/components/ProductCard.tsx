"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/lib/products";

export function ProductCard({
  product,
  inCart,
  maxed,
  selectedSize,
  onSizeSelect,
  onToggleCart,
}: {
  product: Product;
  inCart: boolean;
  maxed: boolean;
  selectedSize?: string;
  onSizeSelect: (size: string) => void;
  onToggleCart: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);
  const [imageIdx, setImageIdx] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const color = product.colors[colorIdx];
  const images = color?.images ?? [null, null, null, null];
  const uploadedImages = images.filter(
    (img): img is string => typeof img === "string" && img.length > 0,
  );
  const hasAnyImage = uploadedImages.length > 0;
  const currentImage = hasAnyImage
    ? uploadedImages[imageIdx % uploadedImages.length]
    : null;

  const goImg = (dir: 1 | -1) => {
    if (uploadedImages.length <= 1) return;
    setImageIdx((i) => {
      const next = i + dir;
      if (next < 0) return uploadedImages.length - 1;
      if (next >= uploadedImages.length) return 0;
      return next;
    });
  };

  const handleColorChange = (idx: number) => {
    setColorIdx(idx);
    setImageIdx(0);
  };

  return (
    <div
      className={`relative bg-white ${maxed && !inCart ? "pointer-events-none opacity-40" : ""}`}
    >
      {/* ── IMAGE AREA ── */}
      <div
        role="button"
        tabIndex={0}
        className="relative aspect-[3/4] cursor-pointer select-none overflow-hidden bg-gray-50"
        onClick={() => !open && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!open) setOpen(true);
          }
        }}
        onMouseDown={(e) => setDragStart(e.clientX)}
        onMouseUp={(e) => {
          if (dragStart !== null && Math.abs(e.clientX - dragStart) > 30) {
            goImg(e.clientX < dragStart ? 1 : -1);
          }
          setDragStart(null);
        }}
        onTouchStart={(e) => setDragStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (dragStart !== null) {
            const dx = e.changedTouches[0].clientX - dragStart;
            if (Math.abs(dx) > 30) goImg(dx < 0 ? 1 : -1);
          }
          setDragStart(null);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${colorIdx}-${imageIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            {currentImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full flex-col items-center justify-center gap-2"
                style={{
                  background:
                    colorIdx === 0 ? "#f5f5f5" : colorIdx === 1 ? "#fafafa" : "#efefef",
                }}
              >
                <span
                  className="select-none text-[40px] font-black tracking-tighter"
                  style={{ color: `${color?.hex}22` }}
                >
                  HC
                </span>
                <span
                  className="text-[8px] uppercase tracking-[.15em]"
                  style={{ color: `${color?.hex}55` }}
                >
                  {color?.name}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {hasAnyImage && (
          <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {uploadedImages.map((_, i) => (
              <div
                key={i}
                className="h-1 w-1 rounded-full transition-all"
                style={{
                  background: i === imageIdx ? "#000" : "rgba(0,0,0,0.25)",
                }}
              />
            ))}
          </div>
        )}

        {hasAnyImage && uploadedImages.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-1 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center bg-white/80 text-xs font-bold"
              onClick={(e) => {
                e.stopPropagation();
                goImg(-1);
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-1 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center bg-white/80 text-xs font-bold"
              onClick={(e) => {
                e.stopPropagation();
                goImg(1);
              }}
            >
              ›
            </button>
          </>
        )}

        {product.isNew && !inCart && (
          <span className="absolute right-2 top-2 bg-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
            New
          </span>
        )}
        {inCart && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-2 top-2 bg-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white"
          >
            Selected
          </motion.span>
        )}
      </div>

      {/* ── INFO ── */}
      <div
        role="button"
        tabIndex={0}
        className="cursor-pointer px-2.5 pb-1 pt-2"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <p className="text-[12px] font-semibold leading-tight text-black">{product.name}</p>
        <p className="mt-0.5 text-[12px] text-black">${product.price}</p>

        <div className="mt-1.5 flex gap-1.5">
          {product.colors.map((c, i) => (
            <button
              key={i}
              type="button"
              title={c.name}
              onClick={(e) => {
                e.stopPropagation();
                handleColorChange(i);
              }}
              className="h-4 w-4 flex-shrink-0 rounded-full border-2 transition-all"
              style={{
                background: c.hex,
                borderColor: colorIdx === i ? "#000" : "transparent",
                boxShadow: colorIdx === i ? "0 0 0 1px #000" : "0 0 0 1px #ddd",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── SIZE + ADD ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="px-2.5 pb-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="mb-1 mt-1 text-[9px] uppercase tracking-[.1em] text-gray-400">
              Color: <span className="font-bold text-black">{color?.name}</span>
            </p>
            <p className="mb-1.5 text-[9px] uppercase tracking-[.1em] text-gray-400">
              Select Size
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSizeSelect(s)}
                  className={`border px-2 py-1 text-[10px] font-semibold transition-all ${
                    selectedSize === s
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
              onClick={onToggleCart}
              disabled={!selectedSize && !inCart}
              className={`w-full py-2.5 text-[10px] font-bold uppercase tracking-[.15em] transition-all ${
                inCart
                  ? "border-2 border-black bg-white text-black"
                  : "bg-black text-white disabled:bg-gray-200 disabled:text-gray-400"
              }`}
            >
              {inCart ? "Remove" : "Add to Bag"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
