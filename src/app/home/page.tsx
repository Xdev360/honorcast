"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { submitTeamApplication } from "@/lib/db";

type AppRouter = ReturnType<typeof useRouter>;

type HcEvent = {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  date: string;
  price: number;
  spotsTotal: number;
  spotsLeft: number;
  description: string;
  image_url: string | null;
  visible: boolean;
};

const DEFAULT_EVENTS: HcEvent[] = [
  {
    id: 1,
    type: "dinner",
    title: "Private Dinner with Celebrity X",
    subtitle: "Private · Exclusive · 20 Guests Only",
    date: "2026-06-21T19:00",
    price: 500,
    spotsTotal: 20,
    spotsLeft: 20,
    description:
      "An intimate evening curated exclusively for Honor Culture's closest community.",
    image_url: null,
    visible: true,
  },
  {
    id: 2,
    type: "gymtour",
    title: "GymTour 2.0 by Honor Culture",
    subtitle: "3 Days · US · All-Inclusive",
    date: "2026-07-15T09:00",
    price: 3000,
    spotsTotal: 30,
    spotsLeft: 30,
    description:
      "A 3-day all-inclusive fitness experience across the United States.",
    image_url: null,
    visible: true,
  },
];

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

function EventCountdownRow({ iso }: { iso: string }) {
  const c = useCountdown(new Date(iso));
  return (
    <div className="mb-4 flex gap-3 border-y border-gray-100 py-3">
      {Object.entries(c).map(([k, v]) => (
        <div key={k} className="flex-1 text-center">
          <div className="text-xl font-black tabular-nums">
            {String(v).padStart(2, "0")}
          </div>
          <div className="text-[8px] uppercase tracking-[.1em] text-gray-400">
            {k}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventCard({ ev, index, router }: { ev: HcEvent; index: number; router: AppRouter }) {
  const spotsUrgent = ev.spotsLeft <= Math.floor(ev.spotsTotal * 0.3);
  const soldOut = ev.spotsLeft === 0;
  const pctLeft = Math.round((ev.spotsLeft / ev.spotsTotal) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="mb-6 overflow-hidden border border-gray-200 last:mb-0"
    >
      <div className="relative overflow-hidden bg-black" style={{ aspectRatio: "16/7" }}>
        {ev.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ev.image_url}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            alt={ev.title}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[80px] font-black text-white/5">
            HC
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />

        {spotsUrgent && !soldOut ? (
          <div className="absolute right-3 top-3">
            <span className="bg-red-600 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white">
              Only {ev.spotsLeft} {ev.spotsLeft === 1 ? "spot" : "spots"} left
            </span>
          </div>
        ) : null}
        {soldOut ? (
          <div className="absolute right-3 top-3">
            <span className="bg-gray-800 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white">
              Sold Out
            </span>
          </div>
        ) : null}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="mb-1 text-[8px] uppercase tracking-[.3em] text-white/50">{ev.subtitle}</p>
          <p className="text-[18px] font-black uppercase leading-tight text-white">{ev.title}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.1em] text-gray-500">
              {new Date(ev.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              ·{" "}
              {new Date(ev.date).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">{ev.description?.slice(0, 60)}...</p>
          </div>
          <span className="ml-2 flex-shrink-0 bg-black px-3 py-1.5 text-[12px] font-black text-white">${ev.price}</span>
        </div>

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Spots Remaining</span>
            <span className={`text-[10px] font-black ${spotsUrgent ? "text-red-600" : "text-gray-700"}`}>
              {soldOut ? "Sold out" : `${ev.spotsLeft} / ${ev.spotsTotal}`}
            </span>
          </div>
          <div className="h-1 w-full bg-gray-100">
            <div
              className={`h-full transition-all ${spotsUrgent ? "bg-red-600" : "bg-black"}`}
              style={{ width: `${pctLeft}%` }}
            />
          </div>
          {spotsUrgent && !soldOut ? (
            <p className="mt-1 text-[9px] font-bold tracking-wide text-red-600">
              ⚠ Only {ev.spotsLeft} {ev.spotsLeft === 1 ? "spot" : "spots"} remaining — don&apos;t wait
            </p>
          ) : null}
        </div>

        <EventCountdownRow iso={ev.date} />

        <button
          type="button"
          onClick={() => router.push(`/events/${ev.type}`)}
          disabled={soldOut}
          className={`w-full py-3.5 text-[11px] font-black uppercase tracking-[.18em] ${
            soldOut ? "cursor-not-allowed bg-gray-200 text-gray-400" : "bg-black text-white"
          }`}
        >
          {soldOut ? "Sold Out" : "View Details & Book →"}
        </button>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<HcEvent[]>([]);
  const [eventsReady, setEventsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hc_events");
      if (stored) {
        const parsed = JSON.parse(stored) as HcEvent[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvents(parsed);
          setEventsReady(true);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setEvents(DEFAULT_EVENTS);
    setEventsReady(true);
  }, []);

  useEffect(() => {
    const sync = () => {
      try {
        const stored = localStorage.getItem("hc_events");
        if (stored) {
          const parsed = JSON.parse(stored) as HcEvent[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEvents(parsed);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      setEvents(DEFAULT_EVENTS);
    };
    window.addEventListener("honor-local-storage", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("honor-local-storage", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const visibleEvents = events.filter((ev) => ev.visible);
  const [joinForm, setJoinForm] = useState({
    name: "",
    email: "",
    instagram: "",
    city: "",
    role: "",
    why: "",
  });
  const [joinDone, setJoinDone] = useState(false);

  const submitJoin = async () => {
    if (!joinForm.name || !joinForm.email || !joinForm.role) return;
    try {
      const ok = await submitTeamApplication({
        ...joinForm,
        submitted_at: new Date().toISOString(),
      });
      if (ok) setJoinDone(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
        <span className="text-[13px] font-black uppercase tracking-[.2em]">
          Honor Culture
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[.15em] text-gray-400">
          Official
        </span>
      </nav>

      {/* HERO */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center bg-black px-6 py-20 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 text-[9px] uppercase tracking-[.4em] text-white/40"
        >
          Honor Culture — United States
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6 text-5xl font-black uppercase leading-none tracking-tight text-white"
        >
          Wear It.
          <br />
          Own It.
          <br />
          Represent.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-10 max-w-xs text-sm leading-relaxed text-white/50"
        >
          We are looking for real people who train, who live the culture, and
          who carry themselves with honor.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => router.push("/shop")}
            className="bg-white px-8 py-3.5 text-[11px] font-black uppercase tracking-[.15em] text-black"
          >
            Shop & Apply
          </button>
          <button
            type="button"
            onClick={() =>
              document.getElementById("events")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="border border-white/30 px-8 py-3.5 text-[11px] font-black uppercase tracking-[.15em] text-white"
          >
            View Events
          </button>
        </motion.div>
      </section>

      {/* EVENTS */}
      <section id="events" className="mx-auto max-w-lg px-5 py-16">
        <p className="mb-3 text-[9px] uppercase tracking-[.3em] text-gray-400">
          Upcoming
        </p>
        <h2 className="mb-10 text-3xl font-black uppercase leading-tight tracking-tight">
          Events
        </h2>

        {!eventsReady ? (
          <div className="py-12 text-center text-sm uppercase tracking-widest text-gray-200">
            Loading events...
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No events scheduled right now. Check back soon.
          </div>
        ) : (
          visibleEvents.map((ev, i) => <EventCard key={ev.id} ev={ev} index={i} router={router} />)
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-lg px-6 py-16">
        <p className="mb-3 text-[9px] uppercase tracking-[.3em] text-gray-400">
          The Process
        </p>
        <h2 className="mb-10 text-3xl font-black uppercase leading-tight tracking-tight">
          How It Works
        </h2>
        {[
          {
            num: "01",
            title: "Pick Your Pieces",
            desc: "Browse the exclusive model catalog and select up to 2 items that represent you.",
          },
          {
            num: "02",
            title: "Download Your Invoice",
            desc: "After selecting, download your invoice. It contains your unique Order ID.",
          },
          {
            num: "03",
            title: "Apply With Your Order ID",
            desc: "Use the Order ID to unlock the model application form.",
          },
          {
            num: "04",
            title: "We Review & Reach Out",
            desc: "We personally review every application. If selected, we contact you via Instagram.",
          },
        ].map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8 flex gap-5 border-b border-gray-100 pb-8 last:mb-0 last:border-0 last:pb-0"
          >
            <span className="mt-1 w-6 flex-shrink-0 text-[11px] font-black tracking-wide text-gray-200">
              {step.num}
            </span>
            <div>
              <h3 className="mb-1 text-[13px] font-black uppercase tracking-wide">
                {step.title}
              </h3>
              <p className="text-[12px] leading-relaxed text-gray-500">
                {step.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* PRIVACY */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-lg">
          <p className="mb-3 text-[9px] uppercase tracking-[.3em] text-gray-400">
            Your Privacy
          </p>
          <h2 className="mb-6 text-3xl font-black uppercase leading-tight tracking-tight">
            Your Info Is Safe With Us
          </h2>
          <p className="mb-8 text-[13px] leading-relaxed text-gray-500">
            Everything you submit is stored securely and used only for Honor
            Culture&apos;s selection process. We do not sell, share, or
            distribute your data to any third party. Period.
          </p>
          {[
            {
              title: "Encrypted & Secure",
              desc: "All uploads are stored in a private encrypted database. Only the Honor Culture team can access them.",
            },
            {
              title: "Never Shared",
              desc: "Your photos and personal info are never shared with third parties or advertisers.",
            },
            {
              title: "Deletable On Request",
              desc: "DM @h0n0rculture on Instagram anytime to have your data permanently deleted.",
            },
            {
              title: "Used Only For Selection",
              desc: "Your info is used solely for model evaluation and event coordination. Nothing more.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-5 flex gap-4 last:mb-0"
            >
              <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 border-black" />
              <div>
                <h3 className="mb-1 text-[12px] font-black uppercase tracking-wide">
                  {item.title}
                </h3>
                <p className="text-[12px] leading-relaxed text-gray-500">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="mx-auto max-w-lg px-6 py-16">
        <p className="mb-3 text-[9px] uppercase tracking-[.3em] text-gray-400">
          Our Mission
        </p>
        <h2 className="mb-6 text-3xl font-black uppercase leading-tight tracking-tight">
          Why We&apos;re Doing This
        </h2>
        <p className="mb-4 text-[13px] leading-relaxed text-gray-500">
          Honor Culture was built on one belief — the people who actually live
          this lifestyle should be the ones representing it. Not hired models
          who have never touched a barbell. Real gym culture, real people, real
          stories.
        </p>
        <p className="mb-4 text-[13px] leading-relaxed text-gray-500">
          This casting is how we find our community ambassadors. People who wear
          our clothes, train hard, and naturally represent what Honor Culture
          stands for — mind, body, and culture.
        </p>
        <p className="text-[13px] leading-relaxed text-gray-500">
          If you are selected, you receive your chosen pieces and are featured
          across our social channels. This is your opportunity to be part of
          something being built from the ground up.
        </p>
      </section>

      {/* JOIN OUR TEAM */}
      <section className="bg-gray-50 px-6 py-16" id="jointeam">
        <div className="mx-auto max-w-lg">
          <p className="mb-3 text-[9px] uppercase tracking-[.3em] text-gray-400">
            Community
          </p>
          <h2 className="mb-3 text-3xl font-black uppercase leading-tight tracking-tight">
            Do You Want to Join Our Team?
          </h2>
          <p className="mb-8 text-[13px] leading-relaxed text-gray-500">
            Honor Culture is more than a brand — it is a movement. We are
            building a community of dedicated people across multiple roles.
            Whether you want to model, create content, represent us in your
            city, or contribute behind the scenes — there is a place for you
            here.
          </p>

          <div className="mb-8 grid grid-cols-2 gap-2">
            {[
              {
                role: "Brand Ambassador",
                desc: "Represent HC at gyms and events in your city",
              },
              {
                role: "Official Model",
                desc: "Feature in campaigns, shoots, and brand content",
              },
              {
                role: "Content Creator",
                desc: "Photo and video content for our social channels",
              },
              {
                role: "Fitness Coach Partner",
                desc: "Lead workouts at events, tours, and activations",
              },
              {
                role: "Community Builder",
                desc: "Grow and moderate the HC community online",
              },
              {
                role: "Event Volunteer",
                desc: "Help coordinate our private events and tours",
              },
              {
                role: "Brand Stylist",
                desc: "Wardrobe and look coordination for shoots",
              },
              {
                role: "Athlete Partner",
                desc: "Competitive athlete or sport-specific alignment",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                viewport={{ once: true }}
                className="border border-gray-200 bg-white p-3"
              >
                <p className="mb-1 text-[10px] font-black uppercase tracking-wide">
                  {item.role}
                </p>
                <p className="text-[10px] leading-snug text-gray-500">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {joinDone ? (
            <div className="border-2 border-black bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#000"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-black uppercase tracking-tight">
                You&apos;re on the list.
              </h3>
              <p className="text-[12px] leading-relaxed text-gray-500">
                We&apos;ll reach out when your role opens up. Keep showing up.
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 bg-white p-5">
              <p className="mb-5 text-[10px] font-black uppercase tracking-[.15em]">
                Apply for Waitlist
              </p>
              <div className="flex flex-col gap-4">
                {[
                  {
                    label: "Full Name",
                    key: "name",
                    placeholder: "Your full name",
                    type: "text",
                  },
                  {
                    label: "Email Address",
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
                    label: "City & State",
                    key: "city",
                    placeholder: "e.g. Los Angeles, CA",
                    type: "text",
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-gray-400">
                      {f.label}
                    </p>
                    <input
                      type={f.type}
                      value={joinForm[f.key as keyof typeof joinForm]}
                      onChange={(e) =>
                        setJoinForm((j) => ({ ...j, [f.key]: e.target.value }))
                      }
                      placeholder={f.placeholder}
                      className="w-full border-b border-black bg-transparent py-2 text-[13px] outline-none placeholder:text-gray-300"
                    />
                  </div>
                ))}
                <div>
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-gray-400">
                    Which role interests you?
                  </p>
                  <select
                    value={joinForm.role}
                    onChange={(e) =>
                      setJoinForm((j) => ({ ...j, role: e.target.value }))
                    }
                    className="w-full cursor-pointer appearance-none border-b border-black bg-transparent py-2 text-[13px] outline-none"
                  >
                    <option value="">Select a role</option>
                    {[
                      "Brand Ambassador",
                      "Official Model",
                      "Content Creator",
                      "Fitness Coach Partner",
                      "Community Builder",
                      "Event Volunteer",
                      "Brand Stylist",
                      "Athlete Partner",
                    ].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-gray-400">
                    Why do you want to be part of this?
                  </p>
                  <textarea
                    value={joinForm.why}
                    onChange={(e) =>
                      setJoinForm((j) => ({ ...j, why: e.target.value }))
                    }
                    placeholder="Tell us in a few sentences..."
                    rows={3}
                    className="w-full resize-none border-b border-black bg-transparent py-2 text-[13px] outline-none placeholder:text-gray-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void submitJoin()}
                  className="mt-1 w-full bg-black py-4 text-[11px] font-black uppercase tracking-[.18em] text-white"
                >
                  Join the Waitlist →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black px-6 py-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-4 text-3xl font-black uppercase leading-tight tracking-tight text-white"
        >
          Ready To
          <br />
          Join The Culture?
        </motion.h2>
        <p className="mb-8 text-[12px] leading-relaxed text-white/40">
          Pick your pieces. Download your invoice. Apply.
        </p>
        <button
          type="button"
          onClick={() => router.push("/shop")}
          className="bg-white px-10 py-4 text-[11px] font-black uppercase tracking-[.2em] text-black"
        >
          Start Here →
        </button>
      </section>

      {/* FOOTER — fixed, no padlock text */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gray-300">
          Honor Culture
        </p>
        <p className="mt-1 text-[10px] text-gray-300">
          @h0n0rculture · @h0n0rculture.cast
        </p>
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            aria-label="Admin access"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-300 transition-colors hover:border-gray-400 hover:text-gray-500"
          >
            <svg width="12" height="14" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="11"
                width="18"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M7 11V7a5 5 0 0110 0v4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </footer>
    </main>
  );
}
