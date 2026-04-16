"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CryptoPayment } from "@/components/CryptoPayment";

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

export default function GymTourPage() {
  const router = useRouter();
  const [ev, setEv] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"standard" | "vip">("standard");
  const [cryptoOpen, setCryptoOpen] = useState(false);
  const [form] = useState({ name: "", email: "", instagram: "", city: "" });
  const t = useCountdown(String(ev?.date ?? "2026-07-15T09:00"));

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data: Record<string, unknown>[]) => {
        const tour = data.find((e) => e.type === "gymtour");
        if (tour) setEv(tour);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (s: string) => {
    if (!s) return "";
    return new Date(s).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const price =
    tier === "vip"
      ? Number(ev?.tier_vip_price ?? 4500)
      : Number(ev?.tier_standard_price ?? 3000);

  const spotsLeft = Number(ev?.spots_left ?? ev?.spotsLeft ?? 30);
  const spotsTotal = Number(ev?.spots_total ?? ev?.spotsTotal ?? 30);
  const soldOut = spotsLeft === 0;

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
        <button type="button" onClick={() => router.back()} className="text-sm font-bold">
          ← Back
        </button>
        <span className="text-[12px] font-black uppercase tracking-[.2em]">Honor Culture</span>
        <div className="w-10" />
      </nav>

      <div className="relative overflow-hidden bg-black" style={{ minHeight: "52vw", maxHeight: 420 }}>
        {ev?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={String(ev.image_url)}
            alt={String(ev.title ?? "")}
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
          style={{ background: "linear-gradient(to top,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.1) 60%,transparent 100%)" }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="mb-2 text-[8px] uppercase tracking-[.4em] text-white/50">
            {String(ev?.subtitle ?? "3 Days · United States · 30 Spots Only")}
          </p>
          <h1 className="text-[28px] font-black uppercase tracking-tight text-white leading-tight">
            {String(ev?.title ?? "GymTour 2.0 by Honor Culture")}
          </h1>
          <p className="mt-2 text-[10px] text-white/50">
            {formatDate(String(ev?.date ?? ""))} · All-Inclusive
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6">
        <div className="border-b border-gray-100 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[.2em] text-gray-400">Spots Filling Fast</p>
            <p className="text-[14px] font-black">
              From ${Number(ev?.tier_standard_price ?? 3000).toLocaleString()}
              <span className="text-[10px] font-normal text-gray-400"> all-inclusive</span>
            </p>
          </div>
          <div className="flex gap-2">
            {[["Days", t.d], ["Hours", t.h], ["Mins", t.m], ["Secs", t.s]].map(([l, v]) => (
              <div key={l} className="flex-1 border border-gray-100 py-3 text-center">
                <div className="text-2xl font-black tabular-nums">{v}</div>
                <div className="text-[8px] uppercase tracking-[.1em] text-gray-400">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                Spots Remaining
              </span>
              <span
                className={`text-[10px] font-black ${spotsLeft <= Math.floor(spotsTotal * 0.3) ? "text-red-600" : "text-gray-700"}`}
              >
                {soldOut ? "Sold out" : `${spotsLeft} / ${spotsTotal}`}
              </span>
            </div>
            <div className="h-1 w-full bg-gray-100">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.round((spotsLeft / spotsTotal) * 100)}%`,
                  background: spotsLeft <= Math.floor(spotsTotal * 0.3) ? "#dc2626" : "#000",
                }}
              />
            </div>
            {spotsLeft <= Math.floor(spotsTotal * 0.3) && !soldOut ? (
              <p className="mt-1 text-[9px] font-bold text-red-600">
                Only {spotsLeft} spots remaining — book now
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-4 text-[17px] font-black uppercase tracking-tight">What Is GymTour 2.0?</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-gray-500">
            {String(
              ev?.description ??
                "Honor Culture is hitting the road. GymTour 2.0 is a 3-day, fully immersive fitness and lifestyle experience where 30 selected participants travel across the United States alongside our two celebrity ambassadors — training at elite gyms, living the Honor Culture lifestyle, and building real community.",
            )}
          </p>
          {ev?.description_extra ? (
            <p className="text-[13px] leading-relaxed text-gray-500">{String(ev.description_extra)}</p>
          ) : null}
        </div>

        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-5 text-[17px] font-black uppercase tracking-tight">Everything Included</h2>
          {(
            Array.isArray(ev?.includes)
              ? (ev.includes as string[])
              : [
                  "Luxury Mercedes-Benz Sprinter fleet — travel in style",
                  "3-night VIP hotel stay (4-star minimum per city)",
                  "All meals every day — breakfast, lunch, and dinner",
                  "Snacks, protein shakes, and hydration throughout",
                  "Elite gym access across 3 US cities",
                  "Train alongside both HC celebrity ambassadors",
                  "Private group dinners with celebrities every evening",
                  "3-piece HC performance outfit + GymTour 2.0 hoodie",
                  "Branded tour bag, shaker, socks, and accessories",
                  "Signed memorabilia from both celebrity ambassadors",
                  "Professional photo + video content delivered post-tour",
                  "HC GymTour 2.0 ID card and certificate of participation",
                ]
          ).map((item: string, i: number) => (
            <div key={i} className="mb-3 flex gap-3 last:mb-0">
              <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 border-black">
                <div className="h-1.5 w-1.5 rounded-full bg-black" />
              </div>
              <p className="text-[12px] leading-relaxed text-gray-600">{item}</p>
            </div>
          ))}
        </div>

        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-5 text-[17px] font-black uppercase tracking-tight">3-Day Itinerary</h2>
          {[
            {
              day: "Day 1",
              title: "Arrival & First Hit",
              schedule: [
                { time: "9 AM", act: "Airport pickup — full group gathered" },
                { time: "11 AM", act: "Hotel check-in · Welcome packages distributed" },
                { time: "1 PM", act: "Team lunch — first meal together" },
                { time: "3 PM", act: "City 1 gym session with celebrity ambassadors" },
                { time: "8 PM", act: "Private team dinner — all participants + celebrities" },
              ],
            },
            {
              day: "Day 2",
              title: "Full Send",
              schedule: [
                { time: "8 AM", act: "Hotel breakfast" },
                { time: "10 AM", act: "City 2 travel — Sprinter fleet departs" },
                { time: "12 PM", act: "Lunch at curated local restaurant" },
                { time: "2 PM", act: "City 2 gym session + celebrity workout" },
                { time: "5 PM", act: "Community challenge with prizes" },
                { time: "7 PM", act: "Group dinner + celebrity Q&A session" },
              ],
            },
            {
              day: "Day 3",
              title: "Last Rep & Send Off",
              schedule: [
                { time: "8 AM", act: "Final hotel breakfast" },
                { time: "10 AM", act: "City 3 final gym session" },
                { time: "1 PM", act: "Official GymTour 2.0 group photo shoot" },
                { time: "2:30 PM", act: "Final team lunch + closing ceremony" },
                { time: "4 PM", act: "Package distribution — all gear and souvenirs" },
                { time: "6 PM", act: "Airport drop-off · Tour closes" },
              ],
            },
          ].map((day, i) => (
            <div key={i} className="mb-6 last:mb-0">
              <div className="mb-3 flex items-center gap-3">
                <span className="bg-black px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white">
                  {day.day}
                </span>
                <h3 className="text-[11px] font-black uppercase tracking-wide">{day.title}</h3>
              </div>
              {day.schedule.map((s, j) => (
                <div key={j} className="mb-2 flex gap-3 last:mb-0">
                  <span className="w-14 flex-shrink-0 pt-0.5 font-mono text-[9px] text-gray-400">
                    {s.time}
                  </span>
                  <div className="mx-1 w-px flex-shrink-0 bg-gray-200" />
                  <p className="text-[12px] leading-relaxed text-gray-600">{s.act}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-4 text-[17px] font-black uppercase tracking-tight">Select Your Tier</h2>
          <div className="flex flex-col gap-3">
            {[
              {
                id: "standard" as const,
                label: "Standard",
                price: Number(ev?.tier_standard_price ?? 3000),
                features: [
                  "Shared room (2 guests per room)",
                  "All meals, transport & gym access",
                  "Full welcome package & branded outfit",
                  "Celebrity experience & group content",
                ],
              },
              {
                id: "vip" as const,
                label: "VIP",
                price: Number(ev?.tier_vip_price ?? 4500),
                best: true,
                features: [
                  "Private hotel room",
                  "Priority seating at all dinners",
                  "1-on-1 content session with celebrities",
                  "Extended Q&A access throughout tour",
                  "Early boarding all transport",
                  "Exclusive VIP gift bag (value $500+)",
                ],
              },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setTier(p.id)}
                className={`border-2 p-4 text-left transition-all ${tier === p.id ? "border-black" : "border-gray-200"}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-black uppercase tracking-wide">{p.label}</p>
                    {p.best ? (
                      <span className="bg-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                        Best
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-black">${p.price.toLocaleString()}</p>
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${tier === p.id ? "border-black" : "border-gray-300"}`}>
                      {tier === p.id ? <div className="h-2 w-2 rounded-full bg-black" /> : null}
                    </div>
                  </div>
                </div>
                {p.features.map((f, j) => (
                  <div key={j} className="mb-1 flex gap-2 last:mb-0">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="mt-0.5 flex-shrink-0">
                      <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-[11px] text-gray-600">{f}</p>
                  </div>
                ))}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-5 text-[17px] font-black uppercase tracking-tight">How to Book</h2>
          {[
            { num: "01", title: "Select Your Tier", desc: "Choose Standard or VIP based on the experience level you want." },
            { num: "02", title: "Fill Your Info", desc: "Name, email, Instagram, and city. Every participant is verified." },
            { num: "03", title: "Pay with Crypto", desc: "Send payment to our Bitcoin wallet. Fast, private, no bank delays." },
            { num: "04", title: "Receive Confirmation", desc: "Confirmed via email within 48 hours once payment is verified." },
            { num: "05", title: "Show Up & Go", desc: "Pack light. We handle everything else." },
          ].map((s, i) => (
            <div key={i} className="mb-5 flex gap-4 last:mb-0">
              <span className="mt-0.5 w-5 flex-shrink-0 text-[11px] font-black text-gray-200">{s.num}</span>
              <div>
                <h3 className="mb-1 text-[12px] font-black uppercase tracking-wide">{s.title}</h3>
                <p className="text-[12px] leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-10 py-6">
          <h2 className="mb-6 text-[17px] font-black uppercase tracking-tight">
            Secure Your Spot — {tier === "vip" ? "VIP" : "Standard"}
          </h2>

          {soldOut ? (
            <div className="border-2 border-gray-200 p-6 text-center">
              <p className="text-[14px] font-black uppercase">Sold Out</p>
              <p className="mt-2 text-[12px] text-gray-400">All spots have been filled.</p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCryptoOpen(true)}
                className="w-full bg-black py-4 text-[11px] font-black uppercase tracking-[.18em] text-white"
              >
                Proceed to Payment — ${price.toLocaleString()} →
              </button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-gray-400">
                Only {spotsLeft} of {spotsTotal} spots remaining. First confirmed, first in.
              </p>
            </>
          )}
        </div>
      </div>

      <CryptoPayment
        open={cryptoOpen}
        onClose={() => setCryptoOpen(false)}
        amountUsd={price}
        itemLabel={`GymTour 2.0 — ${tier === "vip" ? "VIP" : "Standard"} Ticket`}
        type="gymtour"
        orderDetails={{ event_id: ev?.id, tier, date: ev?.date }}
        customerName={form.name}
        customerEmail={form.email}
        customerInstagram={form.instagram}
      />
    </main>
  );
}
