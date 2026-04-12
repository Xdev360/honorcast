"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

export default function GymTourPage() {
  const router = useRouter();
  const t = useCountdown(new Date("2026-07-15T09:00:00"));
  const [tier, setTier] = useState<"standard" | "vip">("standard");
  const [booked, setBooked] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    instagram: "",
    city: "",
  });

  const price = tier === "vip" ? 4500 : 3000;

  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-bold"
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
        style={{ minHeight: "52vw", maxHeight: 360 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="select-none text-[100px] font-black text-white/5">
            HC
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="mb-2 text-[8px] uppercase tracking-[.4em] text-white/50">
            3 Days · United States · 30 Spots Only
          </p>
          <h1 className="text-[28px] font-black uppercase leading-tight tracking-tight text-white">
            GymTour 2.0
            <br />
            by Honor Culture
          </h1>
          <p className="mt-1.5 text-[10px] text-white/60">
            July 15 – 17, 2026 · All-Inclusive
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6">
        {/* COUNTDOWN + PRICE */}
        <div className="border-b border-gray-100 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[.2em] text-gray-400">
              Spots Filling Fast
            </p>
            <p className="text-[14px] font-black">
              From $3,000{" "}
              <span className="text-[10px] font-normal text-gray-400">
                all-inclusive
              </span>
            </p>
          </div>
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

        {/* ABOUT */}
        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-4 text-[17px] font-black uppercase tracking-tight">
            What Is GymTour 2.0?
          </h2>
          <p className="mb-3 text-[13px] leading-relaxed text-gray-500">
            Honor Culture is hitting the road. GymTour 2.0 is a 3-day, fully
            immersive fitness and lifestyle experience where 30 selected
            participants travel across the United States alongside our two
            celebrity ambassadors — training at elite gyms, living the Honor
            Culture lifestyle, and building real community.
          </p>
          <p className="text-[13px] leading-relaxed text-gray-500">
            Travel in our fleet of luxury Mercedes-Benz Sprinter vans. Stay in
            VIP hotels. Train hard. Eat well. Meet people who get it. This
            experience is worth every dollar — and then some.
          </p>
        </div>

        {/* EVERYTHING INCLUDED */}
        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-5 text-[17px] font-black uppercase tracking-tight">
            Everything Included
          </h2>
          {(
            [
              {
                icon: "🚐",
                cat: "Transportation",
                items: [
                  "Luxury Mercedes-Benz Sprinter fleet — travel in style",
                  "Airport pickup on Day 1 and drop-off on Day 3",
                  "All inter-city travel fully covered — zero logistics on your end",
                ],
              },
              {
                icon: "🏨",
                cat: "3-Night Hotel Stay",
                items: [
                  "VIP-selected hotels (4-star minimum per city)",
                  "Standard: shared room (2 guests) · VIP: private room",
                  "All hotel fees, taxes, and incidentals covered",
                ],
              },
              {
                icon: "🍽️",
                cat: "All Meals — Every Day",
                items: [
                  "Daily hotel breakfast before each gym session",
                  "Curated team lunch at local restaurants each day",
                  "Group dinner every evening in a private setting",
                  "Snacks, protein shakes, and hydration throughout",
                ],
              },
              {
                icon: "🏋️",
                cat: "Elite Gym Access",
                items: [
                  "VIP access to 3 top-tier gyms across 3 cities",
                  "Exclusive group training with both celebrity ambassadors",
                  "Professional coaching and programming each session",
                ],
              },
              {
                icon: "⭐",
                cat: "Celebrity Experience",
                items: [
                  "Train alongside both HC celebrity ambassadors (male & female)",
                  "Private group dinners with celebrities every evening",
                  "Dedicated Q&A and mentorship sessions on tour",
                  "Candid, unfiltered moments — no PR layers",
                ],
              },
              {
                icon: "📦",
                cat: "Honor Culture Package",
                items: [
                  "3-piece HC performance outfit worn during the tour",
                  "Exclusive GymTour 2.0 limited-edition hoodie (not for public sale)",
                  "Branded tour bag, shaker, socks, and accessories",
                  "Signed memorabilia from both celebrity ambassadors",
                  "Professional photo + video content captured throughout — delivered post-tour",
                  "HC GymTour 2.0 ID card and certificate of participation",
                ],
              },
              {
                icon: "🎯",
                cat: "Activities & Culture",
                items: [
                  "Evening social events and group activities nightly",
                  "Community challenges with prizes throughout the tour",
                  "City exploration time built into the daily schedule",
                  "Official GymTour 2.0 group shoot — used in brand campaigns",
                ],
              },
            ] as const
          ).map((cat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              viewport={{ once: true }}
              className="mb-5 last:mb-0"
            >
              <div className="mb-2 flex items-center gap-2">
                <span style={{ fontSize: 14 }}>{cat.icon}</span>
                <h3 className="text-[11px] font-black uppercase tracking-wide">
                  {cat.cat}
                </h3>
              </div>
              {cat.items.map((item, j) => (
                <div key={j} className="mb-1.5 ml-5 flex gap-3 last:mb-0">
                  <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-black" />
                  <p className="text-[12px] leading-relaxed text-gray-500">
                    {item}
                  </p>
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* 3-DAY ITINERARY */}
        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-5 text-[17px] font-black uppercase tracking-tight">
            3-Day Itinerary
          </h2>
          {(
            [
              {
                day: "Day 1",
                title: "Arrival & First Hit",
                schedule: [
                  { time: "9 AM", act: "Airport pickup — full group gathered" },
                  {
                    time: "11 AM",
                    act: "Hotel check-in · Welcome packages distributed",
                  },
                  { time: "1 PM", act: "Team lunch — first meal together" },
                  {
                    time: "3 PM",
                    act: "City 1 gym session — training with celebrity ambassadors",
                  },
                  {
                    time: "7 PM",
                    act: "Free time — settle in, explore, rest",
                  },
                  {
                    time: "8 PM",
                    act: "Private team dinner — 30 participants + both celebrities",
                  },
                ],
              },
              {
                day: "Day 2",
                title: "Full Send",
                schedule: [
                  { time: "8 AM", act: "Hotel breakfast" },
                  {
                    time: "10 AM",
                    act: "City 2 travel — Sprinter fleet departs",
                  },
                  {
                    time: "12 PM",
                    act: "Lunch stop at curated local restaurant",
                  },
                  {
                    time: "2 PM",
                    act: "City 2 gym session — group training + celebrity workout",
                  },
                  {
                    time: "5 PM",
                    act: "Community challenge — group competition with prizes",
                  },
                  {
                    time: "7 PM",
                    act: "Group dinner + celebrity Q&A session",
                  },
                  {
                    time: "9 PM",
                    act: "Social evening — team bonding, content creation",
                  },
                ],
              },
              {
                day: "Day 3",
                title: "Last Rep & Send Off",
                schedule: [
                  { time: "8 AM", act: "Final hotel breakfast" },
                  {
                    time: "10 AM",
                    act: "City 3 final gym session — last training together",
                  },
                  {
                    time: "1 PM",
                    act: "Official GymTour 2.0 group photo shoot",
                  },
                  {
                    time: "2:30 PM",
                    act: "Final team lunch — closing ceremony",
                  },
                  {
                    time: "4 PM",
                    act: "Package distribution — all gear and souvenirs",
                  },
                  { time: "6 PM", act: "Airport drop-off · Tour closes" },
                ],
              },
            ] as const
          ).map((day, i) => (
            <div key={i} className="mb-6 last:mb-0">
              <div className="mb-3 flex items-center gap-3">
                <span className="bg-black px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white">
                  {day.day}
                </span>
                <h3 className="text-[11px] font-black uppercase tracking-wide">
                  {day.title}
                </h3>
              </div>
              {day.schedule.map((s, j) => (
                <div key={j} className="mb-2 flex gap-3 last:mb-0">
                  <span className="w-12 flex-shrink-0 pt-0.5 font-mono text-[9px] text-gray-400">
                    {s.time}
                  </span>
                  <div className="mx-1 w-px flex-shrink-0 bg-gray-200" />
                  <p className="text-[12px] leading-relaxed text-gray-600">
                    {s.act}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* PRICING TIERS */}
        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-4 text-[17px] font-black uppercase tracking-tight">
            Select Your Tier
          </h2>
          <div className="mb-2 flex flex-col gap-3">
            {(
              [
                {
                  id: "standard" as const,
                  label: "Standard",
                  price: "$3,000",
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
                  price: "$4,500",
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
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setTier(p.id)}
                className={`border-2 p-4 text-left transition-all ${
                  tier === p.id ? "border-black" : "border-gray-200"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-black uppercase tracking-wide">
                      {p.label}
                    </p>
                    {"best" in p && p.best ? (
                      <span className="bg-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                        Best
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-black">{p.price}</p>
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        tier === p.id ? "border-black" : "border-gray-300"
                      }`}
                    >
                      {tier === p.id ? (
                        <div className="h-2 w-2 rounded-full bg-black" />
                      ) : null}
                    </div>
                  </div>
                </div>
                {p.features.map((f, j) => (
                  <div key={j} className="mb-1 flex gap-2 last:mb-0">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="mt-0.5 flex-shrink-0"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="#000"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-[11px] text-gray-600">{f}</p>
                  </div>
                ))}
              </button>
            ))}
          </div>
        </div>

        {/* HOW TO BOOK */}
        <div className="border-b border-gray-100 py-6">
          <h2 className="mb-5 text-[17px] font-black uppercase tracking-tight">
            How to Book
          </h2>
          {(
            [
              {
                num: "01",
                title: "Select Your Tier Above",
                desc: "Choose Standard ($3,000) or VIP ($4,500) based on the experience level you want.",
              },
              {
                num: "02",
                title: "Submit Your Info",
                desc: "Name, email, Instagram handle, and city. Every participant is verified before confirmation.",
              },
              {
                num: "03",
                title: "Pay Your Deposit",
                desc: "A $500 non-refundable deposit secures your spot. Full balance due 30 days before the tour starts.",
              },
              {
                num: "04",
                title: "Receive Confirmation",
                desc: "We confirm via email and Instagram DM within 48 hours. Hotel details and city reveal shared 2 weeks prior.",
              },
              {
                num: "05",
                title: "Show Up & Go",
                desc: "Pack light. We handle every single thing else. All you need is yourself and your energy.",
              },
            ] as const
          ).map((s, i) => (
            <div key={i} className="mb-5 flex gap-4 last:mb-0">
              <span className="mt-0.5 w-5 flex-shrink-0 text-[11px] font-black text-gray-200">
                {s.num}
              </span>
              <div>
                <h3 className="mb-1 text-[12px] font-black uppercase tracking-wide">
                  {s.title}
                </h3>
                <p className="text-[12px] leading-relaxed text-gray-500">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* BOOKING FORM */}
        <div className="mb-10 py-6">
          <h2 className="mb-6 text-[17px] font-black uppercase tracking-tight">
            Secure Your Spot — {tier === "vip" ? "VIP" : "Standard"}
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
                Spot Request Received
              </h3>
              <p className="text-[12px] leading-relaxed text-gray-500">
                We&apos;ll confirm within 48 hours via email and Instagram DM.
                Get ready. See you on the road.
              </p>
            </div>
          ) : (
            <div>
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
                  {
                    label: "Home City & State",
                    key: "city",
                    placeholder: "e.g. Atlanta, GA",
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
              <label className="mb-6 flex cursor-pointer items-start gap-3 border border-gray-200 bg-gray-50 p-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 flex-shrink-0"
                />
                <p className="text-[11px] leading-relaxed text-gray-600">
                  I understand a{" "}
                  <span className="font-black">$500 non-refundable deposit</span>{" "}
                  confirms my spot, and the full ${price.toLocaleString()}{" "}
                  balance is due 30 days before the tour.
                </p>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!form.name || !form.email || !agreed) return;
                  setBooked(true);
                }}
                className="w-full bg-black py-4 text-[11px] font-black uppercase tracking-[.18em] text-white"
              >
                Request My Spot — ${price.toLocaleString()} →
              </button>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-gray-400">
                Only 30 spots total. First confirmed, first in.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
