"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Step =
  | "note"
  | "pay"
  | "submitted"
  | "gmail"
  | "waiting"
  | "confirmed"
  | "rejected";

const TIMER_SECONDS = 15 * 60;

export function CryptoPayment({
  open,
  onClose,
  amountUsd,
  itemLabel,
  type,
  orderDetails,
  customerName,
  customerEmail,
  customerInstagram,
}: {
  open: boolean;
  onClose: () => void;
  amountUsd: number;
  itemLabel: string;
  type: "shop" | "dinner" | "gymtour";
  orderDetails?: unknown;
  customerName?: string;
  customerEmail?: string;
  customerInstagram?: string;
}) {
  const [step, setStep] = useState<Step>("note");
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [reference, setReference] = useState("");
  const [gmail, setGmail] = useState("");
  const [gmailErr, setGmailErr] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pollErr, setPollErr] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/crypto-settings")
        .then((r) => r.json())
        .then((data) => setSettings(data as Record<string, unknown>))
        .catch(() => setSettings(null));
      setStep("note");
      setTimeLeft(TIMER_SECONDS);
      setReference("");
      setGmail("");
      setGmailErr("");
      setPollErr("");
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (step === "pay") {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  useEffect(() => {
    if (step === "waiting" && reference) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/crypto-payments?ref=${reference}`);
          const data = (await res.json()) as { status?: string } | null;
          if (data?.status === "confirmed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setStep("confirmed");
          }
          if (data?.status === "rejected") {
            if (pollRef.current) clearInterval(pollRef.current);
            setStep("rejected");
          }
        } catch {
          setPollErr("Unable to refresh payment status right now.");
        }
      }, 8000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, reference]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct = (timeLeft / TIMER_SECONDS) * 100;

  const copyAddress = () => {
    navigator.clipboard.writeText(String(settings?.wallet_address ?? ""));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const submitTransfer = async () => {
    setLoading(true);
    const res = await fetch("/api/crypto-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        item_label: itemLabel,
        amount_usd: amountUsd,
        wallet_address: settings?.wallet_address,
        customer_name: customerName ?? "",
        customer_email: customerEmail ?? "",
        customer_instagram: customerInstagram ?? "",
        order_details: orderDetails ?? {},
        status: "awaiting_confirmation",
      }),
    });
    const data = (await res.json()) as { ok?: boolean; reference?: string };
    if (data.ok && data.reference) {
      setReference(data.reference);
      setStep("gmail");
    }
    setLoading(false);
  };

  const submitGmail = async () => {
    if (!gmail.includes("@")) {
      setGmailErr("Please enter a valid Gmail address");
      return;
    }
    setGmailErr("");
    await fetch("/api/crypto-payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference,
        status: "awaiting_confirmation",
        customer_gmail: gmail,
      }),
    });
    setStep("waiting");
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "tween", duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          background: "#fff",
          width: "100%",
          maxWidth: 540,
          borderRadius: "16px 16px 0 0",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "0 0 40px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e0e0e0" }} />
        </div>

        <div style={{ padding: "16px 24px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: ".15em",
                textTransform: "uppercase",
              }}
            >
              {step === "confirmed"
                ? "Payment Confirmed"
                : step === "rejected"
                  ? "Payment Declined"
                  : "Pay with Crypto"}
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {step === "note" && (
            <div>
              <div
                style={{
                  background: "#000",
                  padding: "16px 20px",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: ".15em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,.5)",
                      marginBottom: 4,
                    }}
                  >
                    Total Due
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                    ${amountUsd.toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                    For
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", maxWidth: 160, textAlign: "right", lineHeight: 1.4 }}>
                    {itemLabel}
                  </p>
                </div>
              </div>

              <div style={{ border: "1px solid #e5e5e5", padding: "16px 18px", marginBottom: 20, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      background: "#000",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>
                    Why We Use Crypto
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#555", lineHeight: 1.75 }}>
                  {String(
                    settings?.payment_note ??
                      "Traditional international wire transfers and card processors can be slow and expensive for our global clients. Bitcoin allows you to shop with us instantly from anywhere — without predatory exchange rates or 3–5 working day bank delays. For your security, this method also ensures your sensitive card info is never required or stored on our servers. Providing a private, leak-proof way to complete your purchase.",
                  )}
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#aaa", marginBottom: 12 }}>
                  How This Works
                </p>
                {[
                  { n: "01", t: "Copy our wallet address or scan QR code", d: "Send the exact amount shown above to our crypto wallet." },
                  { n: "02", t: "Click \"Transfer Completed\"", d: "Come back here and confirm you've made the transfer." },
                  { n: "03", t: "Enter your Gmail", d: "So we can confirm your order and reach you for next steps." },
                  { n: "04", t: "Wait up to 2 minutes", d: "Our team verifies and confirms your payment manually." },
                  { n: "05", t: "You're in", d: "Ticket confirmation or shipping details sent to your Gmail." },
                ].map((s) => (
                  <div
                    key={s.n}
                    style={{
                      display: "flex",
                      gap: 12,
                      marginBottom: 12,
                      paddingBottom: 12,
                      borderBottom: "1px solid #f5f5f5",
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 900, color: "#ddd", flexShrink: 0, width: 20, marginTop: 1 }}>
                      {s.n}
                    </span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{s.t}</p>
                      <p style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep("pay")}
                style={{
                  width: "100%",
                  padding: 14,
                  background: "#000",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {step === "pay" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#aaa" }}>
                    Time Remaining to Send
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      fontVariantNumeric: "tabular-nums",
                      color: timeLeft < 120 ? "#dc2626" : "#000",
                    }}
                  >
                    {pad(mins)}:{pad(secs)}
                  </span>
                </div>
                <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
                  <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                    style={{ height: "100%", background: timeLeft < 120 ? "#dc2626" : "#000", borderRadius: 2 }}
                  />
                </div>
                {timeLeft < 120 ? (
                  <p style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, marginTop: 4 }}>
                    Less than 2 minutes remaining
                  </p>
                ) : null}
              </div>

              <div
                style={{
                  background: "#f9f9f9",
                  border: "1px solid #e5e5e5",
                  padding: "12px 16px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <p style={{ fontSize: 11, color: "#aaa", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  Send Exactly
                </p>
                <p style={{ fontSize: 20, fontWeight: 900 }}>
                  ${amountUsd.toLocaleString()} <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400 }}>USD equiv.</span>
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#aaa", marginBottom: 8 }}>
                  {String(settings?.wallet_label ?? "Bitcoin (BTC)")} Wallet Address
                </p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div
                    style={{
                      flex: 1,
                      background: "#f5f5f5",
                      border: "1px solid #e5e5e5",
                      padding: "10px 12px",
                      fontFamily: "monospace",
                      fontSize: 11,
                      wordBreak: "break-all",
                      lineHeight: 1.6,
                      color: "#000",
                    }}
                  >
                    {String(settings?.wallet_address ?? "Loading...")}
                  </div>
                  <button
                    type="button"
                    onClick={copyAddress}
                    style={{
                      flexShrink: 0,
                      padding: "10px 14px",
                      background: copied ? "#000" : "#fff",
                      color: copied ? "#fff" : "#000",
                      border: "1.5px solid #000",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>

              {settings?.qr_code_url ? (
                <div style={{ marginBottom: 16, textAlign: "center" }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#aaa", marginBottom: 10 }}>
                    Or Scan QR Code
                  </p>
                  <div style={{ display: "inline-block", padding: 12, border: "1px solid #e5e5e5", background: "#fff" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={String(settings.qr_code_url)}
                      alt="Wallet QR Code"
                      style={{ width: 160, height: 160, display: "block" }}
                    />
                  </div>
                </div>
              ) : null}

              <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", padding: "12px 14px", marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: "#92400e", lineHeight: 1.7 }}>
                  Send <strong>only {String(settings?.wallet_label ?? "Bitcoin (BTC)")}</strong> to this address. Sending any other coin will result in permanent loss. Double-check the address before confirming your transaction.
                </p>
              </div>

              {timeLeft === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Session Expired</p>
                  <p style={{ fontSize: 11, color: "#aaa", marginBottom: 16 }}>The payment window has closed. Please restart.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeLeft(TIMER_SECONDS);
                      setStep("note");
                    }}
                    style={{
                      padding: "10px 24px",
                      background: "#000",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".15em",
                      textTransform: "uppercase",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Start Over
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={submitTransfer}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: 14,
                    background: "#000",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: ".18em",
                    textTransform: "uppercase",
                    border: "none",
                    cursor: loading ? "default" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Submitting..." : "Transfer Completed — Verify Now →"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setStep("note")}
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: 10,
                  background: "none",
                  border: "none",
                  fontSize: 11,
                  color: "#aaa",
                  cursor: "pointer",
                  letterSpacing: ".06em",
                }}
              >
                ← Back
              </button>
            </div>
          )}

          {step === "gmail" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: "2px solid #000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2m20 0v12c0 1.1-.9 2-2 2H4c-1.1 0-2-2V6m20 0l-10 7L2 6"
                      stroke="#000"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.01em", marginBottom: 6 }}>
                  Almost Done
                </h3>
                <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7 }}>
                  Enter your Gmail so we can confirm your order and send your ticket or shipping details once payment is verified.
                </p>
              </div>

              <div style={{ background: "#f5f5f5", padding: "10px 14px", fontFamily: "monospace", fontSize: 10, color: "#aaa", marginBottom: 20, wordBreak: "break-all" }}>
                Reference: {reference}
              </div>

              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#aaa", marginBottom: 6 }}>
                  Your Gmail Address
                </p>
                <input
                  type="email"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void submitGmail()}
                  placeholder="yourname@gmail.com"
                  style={{ width: "100%", border: "none", borderBottom: "2px solid #000", padding: "10px 0", fontSize: 14, outline: "none", background: "transparent" }}
                />
                {gmailErr ? <p style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>{gmailErr}</p> : null}
              </div>

              <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.6, marginBottom: 20 }}>
                We will use this email to send your ticket number, confirmation, and any follow-up from the Honor Culture team.
              </p>

              <button
                type="button"
                onClick={() => void submitGmail()}
                style={{
                  width: "100%",
                  padding: 14,
                  background: "#000",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Submit & Wait for Confirmation →
              </button>
            </div>
          )}

          {step === "waiting" && (
            <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                style={{ width: 48, height: 48, border: "3px solid #f0f0f0", borderTopColor: "#000", borderRadius: "50%", margin: "0 auto 20px" }}
              />
              <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>
                Verifying Payment
              </h3>
              <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7, maxWidth: 300, margin: "0 auto 20px" }}>
                Our team is reviewing your transfer. This takes a maximum of 2 minutes. Do not close this window.
              </p>
              <div style={{ background: "#f5f5f5", padding: "10px 14px", fontFamily: "monospace", fontSize: 10, color: "#aaa", marginBottom: 12, wordBreak: "break-all" }}>
                Ref: {reference}
              </div>
              <div style={{ background: "#f5f5f5", padding: "10px 14px", fontFamily: "monospace", fontSize: 10, color: "#aaa" }}>
                Gmail: {gmail}
              </div>
              {pollErr ? <p style={{ fontSize: 11, color: "#dc2626", marginTop: 12 }}>{pollErr}</p> : null}
            </div>
          )}

          {step === "confirmed" && (
            <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: "2.5px solid #000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#000"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
              <h3 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.01em", marginBottom: 8 }}>
                Payment Confirmed
              </h3>
              <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7, maxWidth: 300, margin: "0 auto 16px" }}>
                Your payment has been verified by the Honor Culture team. A confirmation with your ticket number and next steps has been sent to:
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 20 }}>{gmail}</p>
              <div style={{ background: "#f5f5f5", padding: "12px 14px", marginBottom: 20, textAlign: "left" }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#aaa", marginBottom: 4 }}>
                  Reference Number
                </p>
                <p style={{ fontFamily: "monospace", fontSize: 11, color: "#000", wordBreak: "break-all" }}>
                  {reference}
                </p>
              </div>
              <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.7, marginBottom: 20 }}>
                Keep this reference number safe. We will reach out via Gmail for shipping details or ticket collection instructions.
              </p>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: 13,
                  background: "#000",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".15em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Done — Close
              </button>
            </div>
          )}

          {step === "rejected" && (
            <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "2px solid #dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: "uppercase", marginBottom: 8, color: "#dc2626" }}>
                Payment Not Verified
              </h3>
              <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7, maxWidth: 300, margin: "0 auto 20px" }}>
                We were unable to verify your transfer. This could mean the amount was incorrect, the transaction is still pending on the blockchain, or the transfer was not received. Please DM us @h0n0rculture with your reference number.
              </p>
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", marginBottom: 20, fontFamily: "monospace", fontSize: 10, color: "#991b1b", wordBreak: "break-all" }}>
                Ref: {reference}
              </div>
              <button
                type="button"
                onClick={() => setStep("pay")}
                style={{
                  width: "100%",
                  padding: 13,
                  background: "#000",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".15em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                  marginBottom: 8,
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: 12,
                  background: "#fff",
                  color: "#000",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".15em",
                  textTransform: "uppercase",
                  border: "1.5px solid #000",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
