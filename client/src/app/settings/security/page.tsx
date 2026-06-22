"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import styles from "../../../styles/settings.module.css";

export default function SecurityPage() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Password Rotation States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // MFA Orchestration Machine States
  const [mfaStep, setMfaStep] = useState<"idle" | "setup">("idle");
  const [qrUri, setQrUri] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMessage, setMfaMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setIs2FAEnabled(res.data.isTwoFactorSecret))
      .catch(() =>
        console.error("Could not trace authorization profile signatures."),
      );
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    try {
      await api.post("/auth/reset-password-logged-in", {
        currentPassword,
        newPassword,
      });
      setPasswordMessage({
        type: "success",
        text: "Password profile hashes rotated cleanly.",
      });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordMessage({
        type: "error",
        text: err.response?.data?.message || "Password execution dropped.",
      });
    }
  };

  const handleInit2FA = async () => {
    mfaMessage && setMfaMessage(null);
    try {
      const res = await api.post("/auth/mfa/setup");
      setQrUri(res.data.qrCodeUrl);
      setManualKey(res.data.secret);
      setMfaStep("setup");
    } catch {
      setMfaMessage({
        type: "error",
        text: "Failed to initialize cryptographic secret parameters.",
      });
    }
  };

  const handleVerify2FA = async () => {
    setMfaMessage(null);
    try {
      await api.post("/auth/mfa/verify-setup", { code: mfaCode });
      setIs2FAEnabled(true);
      setMfaStep("idle");
      setMfaCode("");
      setMfaMessage({
        type: "success",
        text: "Authenticator validation locked and active.",
      });
    } catch (err: any) {
      setMfaMessage({
        type: "error",
        text: err.response?.data?.message || "Invalid validation key token.",
      });
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Dismantle multi-factor checkpoint verification channels?"))
      return;
    setMfaMessage(null);
    try {
      await api.post("/auth/mfa/disable");
      setIs2FAEnabled(false);
      setMfaMessage({
        type: "success",
        text: "Multi-factor requirements dropped.",
      });
    } catch {
      setMfaMessage({
        type: "error",
        text: "Failed to cleanly disengage 2FA records.",
      });
    }
  };

  return (
    <section className="fade-up">
      <div style={{ marginBottom: "24px" }}>
        <h1 className={styles.sectionHeader}>Security Settings</h1>
        <p className={styles.sectionDescription}>
          Manage access credentials, cryptographic signature logs, and secondary
          authentication layers.
        </p>
      </div>

      {/* Credentials Card */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Rotate Credentials</h3>
        <form onSubmit={handlePasswordReset}>
          <div className={styles.formGroup}>
            <label>Current Security Password</label>
            <input
              type="password"
              className={styles.input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>New Root Password String</label>
            <input
              type="password"
              className={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.buttonPrimary}>
            Update Access String
          </button>
          {passwordMessage && (
            <p
              className={
                passwordMessage.type === "success"
                  ? styles.messageSuccess
                  : styles.messageError
              }
              style={{ marginTop: "12px" }}
            >
              {passwordMessage.text}
            </p>
          )}
        </form>
      </div>

      {/* MFA Management Card */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Multi-Factor Verification (2FA)</h3>
        <p
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            marginBottom: "20px",
          }}
        >
          Enforce time-based token generation challenges alongside system
          credentials to authorize entries.
        </p>

        {mfaMessage && (
          <p
            className={
              mfaMessage.type === "success"
                ? styles.messageSuccess
                : styles.messageError
            }
            style={{ marginBottom: "16px" }}
          >
            {mfaMessage.text}
          </p>
        )}

        {is2FAEnabled ? (
          <div
            style={{
              padding: "16px",
              background: "var(--bg-subtle)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <p
              style={{
                color: "var(--ink)",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "var(--emerald)" }}>✓</span> Authenticator
              authorization parameters are active.
            </p>
            <button onClick={handleDisable2FA} className={styles.buttonDanger}>
              Disable Security Key Verification
            </button>
          </div>
        ) : mfaStep === "idle" ? (
          <button onClick={handleInit2FA} className={styles.buttonPrimary}>
            Configure Device Keys
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginTop: "16px",
              padding: "20px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              background: "#fafafa",
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: "16px",
                borderRadius: "8px",
                display: "inline-block",
              }}
            >
              <img
                src={qrUri}
                alt="MFA Token Setup QR Checkpoint"
                style={{ display: "block" }}
              />
            </div>

            <p
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                fontFamily: "var(--mono)",
              }}
            >
              Secret verification marker string:{" "}
              <span style={{ color: "var(--amber)", fontWeight: "bold" }}>
                {manualKey}
              </span>
            </p>

            <div className={styles.formGroup} style={{ margin: 0 }}>
              <label>Enter 6-Digit Verification Token</label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                className={styles.input}
                style={{
                  letterSpacing: "4px",
                  fontFamily: "var(--mono)",
                  fontSize: "16px",
                  width: "140px",
                  textAlign: "center",
                }}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleVerify2FA}
                className={styles.buttonPrimary}
              >
                Lock Configuration
              </button>
              <button
                onClick={() => setMfaStep("idle")}
                className={styles.buttonDanger}
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                  background: "transparent",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
