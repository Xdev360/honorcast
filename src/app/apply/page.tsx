"use client";

import { motion } from "framer-motion";

export default function ApplyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-black">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs font-semibold uppercase tracking-[0.3em]"
      >
        Application
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 max-w-sm text-sm text-black/70"
      >
        Model application flow goes here. Use your order key when prompted.
      </motion.p>
    </div>
  );
}
