"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function DonePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-black">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-black uppercase tracking-tight"
      >
        Application submitted
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 max-w-sm text-sm text-gray-500"
      >
        Thank you. The Honor Culture team will review your submission.
      </motion.p>
      <Link
        href="/home"
        className="mt-8 text-[11px] font-bold uppercase tracking-widest underline"
      >
        Back to portal
      </Link>
    </main>
  );
}
