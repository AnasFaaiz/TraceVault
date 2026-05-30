"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  BookmarkPlus,
  Bookmark,
  FolderPlus,
} from "lucide-react";
import api from "@/lib/api";
import Toast, { ToastType } from "@/components/Toast";

interface ReflectionDetail {
  id: string;
  title: string;
  category: string;
  template_type?: string;
  impact: string;
  tags?: string[];
  fields?: Record<string, unknown> | null;
  content?: string | null;
  userId: string;
  projectId: string;
}

interface RelatedReflection {
  id: string;
  title: string;
  category: string;
  template_type?: string;
}

interface ReactionCount {
  type: ReactionType;
  count: number;
}

type ReactionType = "useful" | "felt_this" | "critical" | "noted";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "useful", emoji: "💡", label: "Useful" },
  { type: "felt_this", emoji: "😅", label: "Felt this" },
  { type: "critical", emoji: "🔥", label: "Critical" },
  { type: "noted", emoji: "🔩", label: "Noted" },
];

const TEMPLATE_LABELS: Record<string, string> = {
  design_decision: "Design Decision",
  technical_challenge: "Technical Challenge",
  tradeoff: "Tradeoff",
  lesson_learned: "Lesson Learned",
  bug_autopsy: "Bug Autopsy",
  integration_note: "Integration Note",
};

function getTemplateLabel(category: string, templateType?: string): string {
  return TEMPLATE_LABELS[templateType || category] || category;
}

interface Props {
  reflection: ReflectionDetail;
  /**
   * "actions"       — icon-only Edit + Delete, rendered inline with header badges
   * "bottom-actions"— reactions row + vault/collection buttons, below main content card
   * "sidebar"       — "More from this project" panel
   */
  variant: "actions" | "bottom-actions" | "sidebar";
}

export default function ReflectionDetailClient({ reflection, variant }: Props) {
  const router = useRouter();
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  // ── Edit / Delete ─────────────────────────────────────────────────────────
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Vault ─────────────────────────────────────────────────────────────────
  const [isVaulted, setIsVaulted] = useState(false);
  const [isVaulting, setIsVaulting] = useState(false);

  // ── Add to collection ─────────────────────────────────────────────────────
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);

  // ── Reactions ─────────────────────────────────────────────────────────────
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [reactionCounts, setReactionCounts] = useState<
    Record<ReactionType, number>
  >({
    useful: 0,
    felt_this: 0,
    critical: 0,
    noted: 0,
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // ── Related ───────────────────────────────────────────────────────────────
  const [related, setRelated] = useState<RelatedReflection[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (variant !== "bottom-actions") return;
    let isActive = true;

    const fetchBottomData = async () => {
      // Vault status
      try {
        const res = await api.get<{ vaulted: boolean }>(
          `/vault/status/${reflection.id}`,
        );
        if (isActive) setIsVaulted(res.data?.vaulted ?? false);
      } catch {
        /* not vaulted */
      }

      // Reaction counts + my reaction
      try {
        const res = await api.get<{
          counts: ReactionCount[];
          myReaction: ReactionType | null;
        }>(`/reflections/${reflection.id}/reactions`);
        if (isActive) {
          const counts: Record<ReactionType, number> = {
            useful: 0,
            felt_this: 0,
            critical: 0,
            noted: 0,
          };
          res.data?.counts?.forEach(({ type, count }) => {
            counts[type] = count;
          });
          setReactionCounts(counts);
          setMyReaction(res.data?.myReaction ?? null);
        }
      } catch {
        /* no reactions yet */
      }
    };

    fetchBottomData();
    return () => {
      isActive = false;
    };
  }, [variant, reflection.id]);

  useEffect(() => {
    if (variant !== "sidebar" || !reflection.projectId) return;
    let isActive = true;
    setLoadingRelated(true);

    const fetchRelated = async () => {
      try {
        const res = await api.get<RelatedReflection[]>(
          `/projects/${reflection.projectId}/reflections?exclude=${reflection.id}&limit=5`,
        );
        if (isActive) setRelated(res.data || []);
      } catch {
        /* ignore */
      } finally {
        if (isActive) setLoadingRelated(false);
      }
    };

    fetchRelated();
    return () => {
      isActive = false;
    };
  }, [variant, reflection.projectId, reflection.id]);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEdit = () => router.push(`/reflections/${reflection.id}/edit`);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this reflection? This action cannot be undone.",
    );
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await api.delete(`/reflections/${reflection.id}`);
      router.push(`/projects/${reflection.projectId}`);
    } catch {
      setToast({
        message: "Failed to delete this reflection. Please try again.",
        type: "error",
      });
      setIsDeleting(false);
    }
  };

  const handleReact = async (type: ReactionType) => {
    if (isReacting) return;
    setPickerOpen(false);
    setIsReacting(true);

    const prev = myReaction;
    const prevCounts = { ...reactionCounts };

    // Optimistic update
    const updated = { ...reactionCounts };
    if (prev === type) {
      // toggle off
      updated[type] = Math.max(0, updated[type] - 1);
      setMyReaction(null);
    } else {
      if (prev) updated[prev] = Math.max(0, updated[prev] - 1);
      updated[type] += 1;
      setMyReaction(type);
    }
    setReactionCounts(updated);

    try {
      if (prev === type) {
        await api.delete(`/reflections/${reflection.id}/reactions`);
      } else {
        await api.post(`/reflections/${reflection.id}/reactions`, { type });
      }
    } catch {
      // Revert on failure
      setReactionCounts(prevCounts);
      setMyReaction(prev);
      setToast({
        message: "Could not save reaction. Try again.",
        type: "error",
      });
    } finally {
      setIsReacting(false);
    }
  };

  const handleVault = async () => {
    setIsVaulting(true);
    try {
      if (isVaulted) {
        await api.delete(`/vault/${reflection.id}`);
        setIsVaulted(false);
        setToast({ message: "Removed from vault.", type: "success" });
      } else {
        await api.post(`/vault`, { reflectionId: reflection.id });
        setIsVaulted(true);
        setToast({ message: "Saved to vault!", type: "success" });
      }
    } catch {
      setToast({
        message: "Could not update vault. Try again.",
        type: "error",
      });
    } finally {
      setIsVaulting(false);
    }
  };

  const handleAddToCollection = async () => {
    // Replace this prompt with your real collection picker modal if you have one
    const collectionId = window.prompt("Enter collection ID:");
    if (!collectionId?.trim()) return;
    setIsAddingToCollection(true);
    try {
      await api.post(`/collections/${collectionId}/reflections`, {
        reflectionId: reflection.id,
      });
      setToast({ message: "Added to collection!", type: "success" });
    } catch {
      setToast({
        message: "Could not add to collection. Try again.",
        type: "error",
      });
    } finally {
      setIsAddingToCollection(false);
    }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────

  const iconBtnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "transparent",
    cursor: "pointer",
    transition: "background 0.15s",
    flexShrink: 0,
  };

  const outlineBtnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 13,
    fontFamily: "var(--sans, sans-serif)",
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--ink)",
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
    whiteSpace: "nowrap" as const,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Variant: icon-only Edit + Delete
  // ─────────────────────────────────────────────────────────────────────────
  if (variant === "actions") {
    return (
      <>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleEdit}
            title="Edit reflection"
            style={{
              ...iconBtnBase,
              border: "1px solid var(--border)",
              color: "var(--ink)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--surface, #f5f5f5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete reflection"
            style={{
              ...iconBtnBase,
              border: "1px solid #fecaca",
              color: "#dc2626",
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#fef2f2";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Variant: bottom-actions — reactions + vault + add to collection
  // ─────────────────────────────────────────────────────────────────────────
  if (variant === "bottom-actions") {
    const totalReactions = Object.values(reactionCounts).reduce(
      (a, b) => a + b,
      0,
    );
    const activeReaction = REACTIONS.find((r) => r.type === myReaction);

    return (
      <>
        <div
          style={{
            marginTop: 2,
            background: "#fff",
            borderRadius: "0 0 16px 16px",
            borderTop: "1px dashed var(--border)",
            padding: "16px 28px",
            boxShadow: "0 10px 30px #0001",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {/* ── Reaction picker ── */}
          <div ref={pickerRef} style={{ position: "relative" }}>
            {/* Trigger button — shows active reaction or neutral face */}
            <button
              onClick={() => setPickerOpen((v) => !v)}
              title="React to this reflection"
              style={{
                ...outlineBtnBase,
                background: myReaction ? "#f3f0ff" : "transparent",
                borderColor: myReaction ? "#e2dcff" : "var(--border)",
                color: myReaction ? "#3b2f63" : "var(--ink)",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                if (!myReaction)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--surface, #fafafa)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  myReaction ? "#f3f0ff" : "transparent";
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>
                {activeReaction ? activeReaction.emoji : "🫥"}
              </span>
              <span style={{ fontSize: 13 }}>
                {activeReaction ? activeReaction.label : "React"}
              </span>
              {totalReactions > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                    color: "var(--muted)",
                    marginLeft: 2,
                  }}
                >
                  {totalReactions}
                </span>
              )}
            </button>

            {/* Hover picker popup */}
            {pickerOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: 0,
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "6px 8px",
                  display: "flex",
                  gap: 4,
                  boxShadow: "0 8px 24px #0002",
                  zIndex: 50,
                  whiteSpace: "nowrap",
                }}
              >
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => handleReact(r.type)}
                    title={r.label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "none",
                      background:
                        myReaction === r.type ? "#f3f0ff" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.12s, transform 0.12s",
                      outline:
                        myReaction === r.type ? "1.5px solid #c4b8f5" : "none",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background =
                        myReaction === r.type
                          ? "#ece8ff"
                          : "var(--surface, #f5f5f5)";
                      el.style.transform = "scale(1.15)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background =
                        myReaction === r.type ? "#f3f0ff" : "transparent";
                      el.style.transform = "scale(1)";
                    }}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>
                      {r.emoji}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--muted)",
                        fontFamily: "var(--mono)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {r.label}
                    </span>
                    {reactionCounts[r.type] > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--muted)",
                          fontFamily: "var(--mono)",
                        }}
                      >
                        {reactionCounts[r.type]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 20,
              background: "var(--border)",
              flexShrink: 0,
            }}
          />

          {/* ── Vault it ── */}
          <button
            onClick={handleVault}
            disabled={isVaulting}
            style={{
              ...outlineBtnBase,
              background: isVaulted ? "#f3f0ff" : "transparent",
              borderColor: isVaulted ? "#e2dcff" : "var(--border)",
              color: isVaulted ? "#3b2f63" : "var(--ink)",
              opacity: isVaulting ? 0.6 : 1,
              cursor: isVaulting ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isVaulting)
                (e.currentTarget as HTMLButtonElement).style.background =
                  isVaulted ? "#ece8ff" : "var(--surface, #fafafa)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                isVaulted ? "#f3f0ff" : "transparent";
            }}
          >
            {isVaulted ? (
              <Bookmark size={14} style={{ flexShrink: 0, color: "#3b2f63" }} />
            ) : (
              <BookmarkPlus size={14} style={{ flexShrink: 0 }} />
            )}
            {isVaulted ? "Vaulted" : "Vault it"}
          </button>

          {/* ── Add to collection ── */}
          <button
            onClick={handleAddToCollection}
            disabled={isAddingToCollection}
            style={{
              ...outlineBtnBase,
              opacity: isAddingToCollection ? 0.6 : 1,
              cursor: isAddingToCollection ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isAddingToCollection)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--surface, #fafafa)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <FolderPlus size={14} style={{ flexShrink: 0 }} />
            {isAddingToCollection ? "Adding…" : "Add to collection"}
          </button>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Variant: sidebar — "More from this project" only
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "18px 18px",
          boxShadow: "0 10px 30px #0001",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontFamily: "var(--mono)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 14,
            marginTop: 0,
          }}
        >
          More from this project
        </p>

        {loadingRelated ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "24px 0",
            }}
          >
            <svg
              style={{
                animation: "spin 1s linear infinite",
                width: 18,
                height: 18,
                color: "var(--muted)",
              }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="32"
                strokeDashoffset="12"
              />
            </svg>
          </div>
        ) : related.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              padding: "8px 0",
              margin: 0,
            }}
          >
            No other reflections in this project yet.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {related.map((item) => (
              <li key={item.id}>
                <a
                  href={`/reflections/${item.id}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    transition: "background 0.15s, border-color 0.15s",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "var(--surface, #fafafa)";
                    el.style.borderColor = "var(--border-hover, #d1d5db)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "transparent";
                    el.style.borderColor = "var(--border)";
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontFamily: "var(--serif)",
                      color: "var(--ink)",
                      lineHeight: 1.4,
                      fontWeight: 500,
                    }}
                  >
                    {item.title}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--mono)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    {getTemplateLabel(item.category, item.template_type)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
