"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield, User, Webhook, History as HistoryIcon } from "lucide-react";
import AppLayout from "../../components/dashboard/AppLayout";
import styles from "../../styles/settings.module.css";

const TABS = [
  {
    label: "History Log",
    path: "/settings/history",
    icon: <HistoryIcon size={14} />,
  },
  { label: "Security", path: "/settings/security", icon: <Shield size={14} /> },
  { label: "Profile", path: "/settings/profile", icon: <User size={14} /> },
  {
    label: "Integrations",
    path: "/settings/integrations",
    icon: <Webhook size={14} />,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const subNavTabs = (
    <div
      style={{
        display: "flex",
        gap: "8px",
        fontFamily: "var(--mono)",
        overflowX: "auto",
      }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderRadius: "6px",
              border: isActive
                ? "1px solid var(--border)"
                : "1px solid transparent",
              background: isActive ? "#fff" : "transparent",
              color: isActive ? "var(--ink)" : "var(--muted)",
              cursor: "pointer",
              transition: "all 0.15s ease-in-out",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <AppLayout
      title="Settings"
      subtitle="Manage your core environment access parameters and profile state contexts."
      headerActions={subNavTabs}
    >
      <div
        className={styles.container}
        style={{ maxWidth: "800px", margin: "0 auto" }}
      >
        <main className={styles.contentArea}>{children}</main>
      </div>
    </AppLayout>
  );
}
