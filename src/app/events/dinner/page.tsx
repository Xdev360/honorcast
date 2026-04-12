"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function useCountdown(target: Date) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const targetMs = target.getTime();
  useEffect(() => {
    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) return;
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return t;
}

export default function DinnerPage() {
  const router = useRouter();
  const t = useCountdown(new Date("2026-06-21T19:00:00"));
  const [qty, setQty] = useState(1);
  const [booked, setBooked] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", instagram: "" });

  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-bold tracking-wide"
        >
          ← Back
        </button>
        <span className="text-[12px] font-black uppercase tracking-[.2em]">
          Honor Culture
        </span>
        <div className="w-10" />
      </nav>

      {/* HERO */}
      <div
        className="relative overflow-hidden bg-black"
        style={{ minHeight: "52vw", maxHeight: 340 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="select-none text-[100px] font-black text-white/5">
            HC
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="mb-2 text-[8px] uppercase tracking-[.4em] text-white/50">
            Private · Exclusive · 20 Guests Only
          </p>
          <h1 className="text-[28px] font-black uppercase leading-tight tracking-tight text-white">
            Private Dinner
            <br />
            with Celebrity X
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6">
        {/* COUNTDOWN */}
        <div className="border-b border-gray-100 py-5">
          <p className="mb-3 text-[9px] uppercase tracking-[.2em] text-gray-400">
            Time Until Event
          </p>
          <div className="flex gap-2">
            {(
              [
                ["Days", t.d],
                ["Hours", t.h],
                ["Mins", t.m],
                ["Secs", t.s],
              ] as const
            ).map(([l, v]) => (
              <div
                key={l}
                className="flex-1 border border-gray-100 py-3 text-center"
              >
                <div className="text-2xl font-black tabular-nums">
                  {String(v).padStart(2, "0")}
                </div>
                <div className="text-[8px] uppercase tracking-[.1em] text-gray-400">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EVENT DETAILS GRID */}
        <div className="border-b border-gray-100 py-5">
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            {(
              [
                ["Date", "June 21, 2026"],
                ["Time", "7:00 PM EST"],
                ["Location", "Disclosed on booking"],
                ["Dress Code", "Elevated Casual"],
                ["Capacity", "20 guests only"],
                ["Price", "$500 / ticket"],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="bg-white p-3">
                <p className="mb-1 text-[8px] font-bold uppercase tracking-[.1em] text-gray-400">
                  {k}
                </p>
                <p className="text-[12px] font-bold text-black">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ABOUT */}
        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-4 text-[17px] font-black uppercase tracking-tight">
            About This Evening
          </h2>
          <p className="mb-3 text-[13px] leading-relaxed text-gray-500">
            An intimate evening curated exclusively for Honor Culture&apos;s most
            committed community members. Limited to just 20 guests, this private
            dinner brings together the culture&apos;s most dedicated supporters
            for an unforgettable evening of genuine connection, conversation, and
            world-class cuisine.
          </p>
          <p className="mb-3 text-[13px] leading-relaxed text-gray-500">
            Sit across from Celebrity X in an atmosphere that is deliberately
            small, deliberately personal, and unlike anything a public event can
            offer. This is not a meet-and-greet. This is a real dinner. An
            intimate one.
          </p>
          <p className="text-[13px] leading-relaxed text-gray-500">
            Full venue details, city, and evening schedule are shared exclusively
            with confirmed ticket holders. The location is selected for privacy
            and atmosphere.
          </p>
        </div>

        {/* INCLUDED */}
        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-5 text-[17px] font-black uppercase tracking-tight">
            What&apos;s Included
          </h2>
          {[
            "Full multi-course dinner with curated seasonal menu",
            "Welcome cocktail reception upon arrival",
            "Seated dinner alongside Celebrity X (male & female ambassadors)",
            "Professional photographer on site — personal shots included",
            "Exclusive Honor Culture gift placed at your seat",
            "Signed memorabilia from both celebrities",
            "Intimate post-dinner mixer — invited guests only",
          ].map((item, i) => (
            <div key={i} className="mb-3 flex gap-3 last:mb-0">
              <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 border-black">
                <div className="h-1.5 w-1.5 rounded-full bg-black" />
              </div>
              <p className="text-[12px] leading-relaxed text-gray-600">{item}</p>
            </div>
          ))}
        </div>

        {/* TICKET */}
        <div className="mb-10 py-6">
          <h2 className="mb-6 text-[17px] font-black uppercase tracking-tight">
            Secure Your Seat
          </h2>
          {booked ? (
            <div className="border-2 border-black p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#000"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-[16px] font-black uppercase tracking-tight">
                Booking Request Received
              </h3>
              <p className="text-[12px] leading-relaxed text-gray-500">
                We will reach out within 24 hours to confirm your seat and send
                payment details. Check your DMs @h0n0rculture.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between border border-gray-200 p-4">
                <div>
                  <p className="text-[12px] font-black uppercase">
                    Private Dinner Ticket
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    June 21, 2026 · 1 seat per ticket
                  </p>
                </div>
                <p className="text-[16px] font-black">$500</p>
              </div>
              {(
                [
                  {
                    label: "Full Name",
                    key: "name",
                    placeholder: "Your full name",
                    type: "text",
                  },
                  {
                    label: "Email",
                    key: "email",
                    placeholder: "your@email.com",
                    type: "email",
                  },
                  {
                    label: "Instagram Handle",
                    key: "instagram",
                    placeholder: "@yourhandle",
                    type: "text",
                  },
                ] as const
              ).map((f) => (
                <div key={f.key} className="mb-4">
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-gray-400">
                    {f.label}
                  </p>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm((d) => ({ ...d, [f.key]: e.target.value }))
                    }
                    placeholder={f.placeholder}
                    className="w-full border-b border-black bg-transparent py-2 text-[13px] outline-none placeholder:text-gray-300"
                  />
                </div>
              ))}
              <div className="mb-4 flex items-center gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[.08em] text-gray-500">
                  Qty
                </p>
                <div className="flex items-center gap-3 border border-gray-200 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="text-lg font-bold leading-none"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-[13px] font-bold">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(4, qty + 1))}
                    className="text-lg font-bold leading-none"
                  >
                    +
                  </button>
                </div>
                <p className="ml-auto text-[13px] font-black">
                  Total: ${(500 * qty).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!form.name || !form.email) return;
                  setBooked(true);
                }}
                className="w-full bg-black py-4 text-[11px] font-black uppercase tracking-[.18em] text-white"
              >
                Request My Seat →
              </button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-gray-400">
                Requesting a seat places you in the confirmation queue. Payment
                details sent after we confirm availability.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
