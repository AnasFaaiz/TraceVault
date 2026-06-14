"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifyMfaPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!sessionStorage.getItem("mfa_session_token")) {
      router.push("/login");
    }
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionToken = sessionStorage.getItem("mfa_session_token");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mfaSessionToken: sessionToken,
          code,
          method: "email",
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "MFA validation failed");

      sessionStorage.removeItem("mfa_session_token");

      router.push("/feed");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerEmailResend = async () => {
    const sessionToken = sessionStorage.getItem("mfa_session_token");
    await fetch("/api/auth/mfa/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mfaSessionToken: sessionToken }),
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto p-6">
      <h2 className="text-xl font-bold">Security Checkpoint</h2>
      <p className="text-sm text-gray-400">
        Enter the 6-digit authentication code sent to your email.
      </p>

      <form onSubmit={handleVerify} className="flex flex-col gap-3">
        <input
          type="text"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="tracking-widest text-center text-lg font-mono p-2 border rounded bg-zinc-800 border-zinc-700"
        />
        <button
          type="submit"
          disabled={loading}
          className="p-2 bg-blue-600 rounded text-white"
        >
          {loading ? "Verifying..." : "Verify Identity"}
        </button>
      </form>

      <button
        onClick={triggerEmailResend}
        className="text-xs text-blue-400 hover:underline mt-2"
      >
        Didn't receive a code? Click to resend
      </button>
    </div>
  );
}
