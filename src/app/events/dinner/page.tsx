"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ApiEvent = {
  id?: number;
  type?: string;
  date?: string;
  title?: string;
  subtitle?: string;
  image_url?: string | null;
  location?: string | null;
  dress_code?: string | null;
  capacity?: string | null;
  description?: string | null;
  description_extra?: string | null;
  includes?: unknown;
  spots_left?: number;
  spots_total?: number;
  price?: number;
};

const DEFAULT_INCLUDES = [
  "Full multi-course dinner with curated seasonal menu",
  "Welcome cocktail reception upon arrival",
  "Seated dinner alongside both celebrity ambassadors",
  "Professional photographer on site — personal shots included",
  "Exclusive Honor Culture gift placed at your seat",
  "Signed memorabilia from both celebrities",
  "Intimate post-dinner mixer — invited guests only",
];

function includesList(ev: ApiEvent | null): string[] {
  const inc = ev?.includes;
  if (Array.isArray(inc)) return inc.map(String);
  if (typeof inc === "string") {
    try {
      const p = JSON.parse(inc) as unknown;
      if (Array.isArray(p)) return p.map(String);
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_INCLUDES;
}

function useCountdown(dateStr: string) {
  const [t, setT] = useState({ d: "00", h: "00", m: "00", s: "00" });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(dateStr).getTime() - Date.now();
      if (diff <= 0) return;
      const pad = (n: number) => String(n).padStart(2, "0");
      setT({
        d: pad(Math.floor(diff / 86400000)),
        h: pad(Math.floor((diff % 86400000) / 3600000)),
        m: pad(Math.floor((diff % 3600000) / 60000)),
        s: pad(Math.floor((diff % 60000) / 1000)),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr]);
  return t;
}

export default function DinnerPage() {
  const router = useRouter();
  const [ev, setEv] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [booked, setBooked] = useState(false);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", instagram: "" });
  const t = useCountdown(ev?.date ?? "2026-06-21T19:00");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!Array.isArray(data)) return;
        const dinner = data.find(
          (e: Record<string, unknown>) => e.type === "dinner",
        ) as ApiEvent | undefined;
        if (dinner) setEv(dinner);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (s: string) => {
    if (!s) return "";
    const d = new Date(s);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };
  const formatTime = (s: string) => {
    if (!s) return "";
    const d = new Date(s);
    return (
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) + " EST"
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm uppercase tracking-widest text-gray-400">Loading...</p>
      </main>
    );
  }

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
        <span className="text-[12px] font-black uppercase tracking-[.2em]">Honor Culture</span>
        <div className="w-10" />
      </nav>

      <div className="relative overflow-hidden bg-black" style={{ minHeight: "52vw", maxHeight: 420 }}>
        {ev?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ev.image_url}
            alt={ev.title ?? ""}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="select-none font-black text-white/5" style={{ fontSize: 120 }}>
              HC
            </span>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.1) 60%,transparent 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="mb-2 text-[8px] uppercase tracking-[.4em] text-white/50">
            {ev?.subtitle ?? "Private · Exclusive · 20 Guests Only"}
          </p>
          <h1 className="text-[28px] font-black uppercase leading-tight tracking-tight text-white">
            {ev?.title ?? "Private Dinner with Celebrity X"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6">
        <div className="border-b border-gray-100 py-5">
          <p className="mb-3 text-[9px] uppercase tracking-[.2em] text-gray-400">Time Until Event</p>
          <div className="flex gap-2">
            {(
              [
                ["Days", t.d],
                ["Hours", t.h],
                ["Mins", t.m],
                ["Secs", t.s],
              ] as const
            ).map(([l, v]) => (
              <div key={l} className="flex-1 border border-gray-100 py-3 text-center">
                <div className="text-2xl font-black tabular-nums">{v}</div>
                <div className="text-[8px] uppercase tracking-[.1em] text-gray-400">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-100 py-5">
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            {(
              [
                ["Date", formatDate(ev?.date ?? "")],
                ["Time", formatTime(ev?.date ?? "")],
                ["Location", ev?.location ?? "Disclosed on booking"],
                ["Dress Code", ev?.dress_code ?? "Elevated Casual"],
                [
                  "Capacity",
                  ev?.capacity ?? `${ev?.spots_total ?? 20} guests only`,
                ],
                ["Price", `$${ev?.price ?? 500} / ticket`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="bg-white p-3">
                <p className="mb-1 text-[8px] font-bold uppercase tracking-[.1em] text-gray-400">{k}</p>
                <p className="text-[12px] font-bold text-black">{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-4 text-[17px] font-black uppercase tracking-tight">About This Evening</h2>
          <p className="text-[13px] leading-relaxed text-gray-500">
            {ev?.description ??
              "An intimate evening curated exclusively for Honor Culture's closest community. Limited to just 20 guests — this is not a meet-and-greet. This is a real dinner."}
          </p>
          {ev?.description_extra ? (
            <p className="mt-3 text-[13px] leading-relaxed text-gray-500">{ev.description_extra}</p>
          ) : null}
        </div>

        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-5 text-[17px] font-black uppercase tracking-tight">What&apos;s Included</h2>
          {includesList(ev).map((item, i) => (
            <div key={i} className="mb-3 flex gap-3 last:mb-0">
              <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 border-black">
                <div className="h-1.5 w-1.5 rounded-full bg-black" />
              </div>
              <p className="text-[12px] leading-relaxed text-gray-600">{item}</p>
            </div>
          ))}
        </div>

        <div className="mb-10 py-6">
          <h2 className="mb-6 text-[17px] font-black uppercase tracking-tight">Secure Your Seat</h2>
          {ev?.spots_left === 0 ? (
            <div className="border-2 border-gray-200 p-6 text-center">
              <p className="text-[14px] font-black uppercase">Sold Out</p>
              <p className="mt-2 text-[12px] text-gray-400">All seats have been claimed.</p>
            </div>
          ) : booked ? (
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
                We will reach out within 24 hours to confirm your seat. Check your DMs @h0n0rculture.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between border border-gray-200 p-4">
                <div>
                  <p className="text-[12px] font-black uppercase">Private Dinner Ticket</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {formatDate(ev?.date ?? "")} · 1 seat per ticket
                  </p>
                </div>
                <p className="text-[16px] font-black">${ev?.price ?? 500}</p>
              </div>
              {(
                [
                  { label: "Full Name", key: "name" as const, type: "text" },
                  { label: "Email", key: "email" as const, type: "email" },
                  { label: "Instagram Handle", key: "instagram" as const, type: "text" },
                ] as const
              ).map((f) => (
                <div key={f.key} className="mb-4">
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-gray-400">
                    {f.label}
                  </p>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={(e) => setForm((d) => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.label}
                    className="w-full border-b border-black bg-transparent py-2 text-[13px] outline-none placeholder:text-gray-300"
                  />
                </div>
              ))}
              <div className="mb-5 flex items-center gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[.08em] text-gray-500">Qty</p>
                <div className="flex items-center gap-3 border border-gray-200 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="text-lg font-bold leading-none"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-[13px] font-bold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(4, qty + 1))}
                    className="text-lg font-bold leading-none"
                  >
                    +
                  </button>
                </div>
                <p className="ml-auto text-[13px] font-black">
                  Total: ${((ev?.price ?? 500) * qty).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!form.name || !form.email) return;
                  await fetch("/api/event-bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      event_type: "dinner",
                      ...form,
                      qty,
                      event_id: ev?.id,
                    }),
                  });
                  setBooked(true);
                }}
                className="w-full bg-black py-4 text-[11px] font-black uppercase tracking-[.18em] text-white"
              >
                Request My Seat →
              </button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-gray-400">
                Requesting places you in the confirmation queue. Payment details sent after we confirm.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
