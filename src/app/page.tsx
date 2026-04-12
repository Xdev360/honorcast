"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function GatePage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [granted, setGranted] = useState(false);

  const submit = useCallback(async () => {
    try {
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });
      const data = (await res.json()) as { valid?: boolean };
      if (data.valid) {
        setError(false);
        setGranted(true);
        window.setTimeout(() => {
          router.push("/home");
        }, 1500);
        return;
      }
    } catch {
      /* fall through to error UI */
    }
    setError(true);
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  }, [value, router]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-white px-6 pt-[min(18vh,120px)]">
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center text-[11px] font-semibold tracking-[0.35em] text-black sm:text-xs"
      >
        HONOR CULTURE
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="mt-16 flex w-full max-w-[280px] flex-col items-center sm:mt-20"
      >
        <input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setError(false);
          }}
          onKeyDown={onKeyDown}
          placeholder="Enter access code"
          autoComplete="off"
          autoCapitalize="characters"
          className={`w-full border-0 border-b border-black bg-transparent py-3 text-center text-sm font-medium uppercase tracking-[0.2em] text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-0 ${
            shake ? "animate-shake" : ""
          }`}
          aria-invalid={error}
        />
        <p className="mt-4 text-center text-[11px] text-neutral-500">
          Press Enter to continue
        </p>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3 text-center text-[11px] text-red-600"
            >
              Invalid code
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {granted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.25em" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center text-xs font-medium uppercase tracking-[0.25em] text-white sm:text-sm"
            >
              Access Granted
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
