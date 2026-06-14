"use client";

import {
  MoreHorizontal,
  Link,
  ArrowUp,
  ArrowDown,
  Check,
  MessageSquare,
} from "lucide-react";
import { useCallback, useState } from "react";
import React from "react";
import { ALL_TEMPLATES, getTemplate, TemplateType } from "@/lib/templateDefinitions";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import styles from "./FeedCard.module.css";

interface FeedEntry {
  id: string;
  title: string;
  category: string;
  template_type?: string;
  snippet: string;
  readTime: string;
  confidence: string | null;
  createdAt: string;
  relativeDate: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  project: {
    id: string;
    name: string;
  };
  reactions: {
    useful: { count: number; reacted: boolean };
    critical: { count: number; reacted: boolean };
    applied?: { count: number; reacted: boolean };
  };
  vaulted: boolean;
}

interface FeedCardProps {
  entry: FeedEntry;
  onOpen: () => void;
  onOpenChat: () => void;
}

// Dynamic color generator for tags/badges
const getBadgeStyle = (text: string) => {
  const normalizedText = text.toUpperCase();
  switch (normalizedText) {
    case "MINOR":
      return { backgroundColor: "#fef3c7", color: "#b45309" };
    case "MAJOR":
      return { backgroundColor: "#fee2e2", color: "#b91c1c" };
    case "LESSON_LEARNED":
    case "LESSON LEARNED":
      return { backgroundColor: "#dcfce7", color: "#15803d" };
    case "BUG":
      return { backgroundColor: "#e0e7ff", color: "#4338ca" };
    case "FEATURE":
      return { backgroundColor: "#e1effe", color: "#1d4ed8" };
    default:
      return { backgroundColor: "#f3f4f6", color: "#4b5563" };
  }
};

export default function FeedCard({ entry, onOpen, onOpenChat }: FeedCardProps) {
  const user = useAuthStore((state) => state.user);
  const [upCount, setUpCount] = useState(entry.reactions.useful.count);
  const [downCount, setDownCount] = useState(entry.reactions.critical.count);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(
    entry.reactions.useful.reacted
      ? "up"
      : entry.reactions.critical.reacted
        ? "down"
        : null,
  );
  const [isVaulted, setIsVaulted] = useState(entry.vaulted);
  const [copied, setCopied] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isVaultUpdating, setIsVaultUpdating] = useState(false);

  const applyVote = useCallback(
    async (nextVote: "up" | "down" | null) => {
      if (!user || isVoting) return;

      const previous = {
        upCount,
        downCount,
        userVote,
      };

      let nextUp = previous.upCount;
      let nextDown = previous.downCount;

      if (previous.userVote === "up") {
        nextUp = Math.max(0, nextUp - 1);
      }
      if (previous.userVote === "down") {
        nextDown = Math.max(0, nextDown - 1);
      }
      if (nextVote === "up") {
        nextUp += 1;
      }
      if (nextVote === "down") {
        nextDown += 1;
      }

      setUserVote(nextVote);
      setUpCount(nextUp);
      setDownCount(nextDown);
      setIsVoting(true);

      try {
        if (previous.userVote && previous.userVote !== nextVote) {
          await api.post(`/reflections/${entry.id}/reactions`, {
            type: previous.userVote === "up" ? "useful" : "critical",
          });
        }

        if (nextVote && nextVote !== previous.userVote) {
          await api.post(`/reflections/${entry.id}/reactions`, {
            type: nextVote === "up" ? "useful" : "critical",
          });
        }
      } catch (error) {
        console.error("Failed to update reaction", error);
        setUserVote(previous.userVote);
        setUpCount(previous.upCount);
        setDownCount(previous.downCount);
      } finally {
        setIsVoting(false);
      }
    },
    [downCount, entry.id, isVoting, upCount, user, userVote],
  );

  const handleUpvote = () => {
    const nextVote = userVote === "up" ? null : "up";
    void applyVote(nextVote);
  };

  const handleDownvote = () => {
    const nextVote = userVote === "down" ? null : "down";
    void applyVote(nextVote);
  };

  const handleVaultToggle = async () => {
    if (!user || isVaultUpdating) return;

    const previous = isVaulted;
    const next = !previous;
    setIsVaulted(next);
    setIsVaultUpdating(true);

    try {
      await api.post(`/reflections/${entry.id}/vault`);
    } catch (error) {
      console.error("Failed to toggle vault", error);
      setIsVaulted(previous);
    } finally {
      setIsVaultUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/reflections/${entry.id}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  const handleCardKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      className={`${styles.feedCard} ${styles.clickableCard}`}
      onClick={onOpen}
      onKeyDown={handleCardKey}
      role="button"
      tabIndex={0}
    >
      <button
        type="button"
        className={styles.moreButton}
        aria-label="More options"
        onClick={(event) => event.stopPropagation()}
      >
        <MoreHorizontal size={16} />
      </button>

      <div className={styles.cardHeader}>
        <div className={styles.metaInfo}>
          <span className={styles.authorName}>@{entry.author.username}</span>
          <span className={styles.divider}>•</span>
          <span className={styles.projectName}>{entry.project.name}</span>
        </div>

        <div className={styles.badgeRow}>
          {entry.impact && (
            <span
              className={styles.statusBadge}
              style={getBadgeStyle(entry.impact)}
            >
              {entry.impact.replace(/_/g, " ")}
            </span>
          )}
          {entry.template_type && (
            <span
              className={styles.statusBadge}
              style={getBadgeStyle(entry.template_type)}
            >
              {entry.template_type.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{entry.title}</h3>
        {renderTemplatePreview(entry.template_type, entry.fields) ??
          renderSnippetAsPoints(entry.content ?? entry.snippet ?? "")}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.actionGroup}>
          <div className={styles.voteItem}>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.btnUp} ${userVote === "up" ? styles.activeUp : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                handleUpvote();
              }}
              aria-label="Upvote"
              disabled={!user || isVoting}
            >
              <ArrowUp size={18} strokeWidth={2.2} />
            </button>
            <span
              className={`${styles.voteCount} ${userVote === "up" ? styles.activeUpText : ""}`}
            >
              {upCount}
            </span>
          </div>

          <div className={styles.voteItem}>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.btnDown} ${userVote === "down" ? styles.activeDown : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                handleDownvote();
              }}
              aria-label="Downvote"
              disabled={!user || isVoting}
            >
              <ArrowDown size={18} strokeWidth={2.2} />
            </button>
            <span
              className={`${styles.voteCount} ${userVote === "down" ? styles.activeDownText : ""}`}
            >
              {downCount}
            </span>
          </div>
        </div>

        <div className={styles.actionGroup}>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.btnChat}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpenChat();
            }}
            aria-label="Open chat"
          >
            <MessageSquare size={18} />
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.btnVault} ${isVaulted ? styles.activeVault : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              void handleVaultToggle();
            }}
            aria-label={isVaulted ? "Remove from vault" : "Add to vault"}
            disabled={!user || isVaultUpdating}
          >
            {isVaulted ? <Check size={18} /> : <Check size={18} />}
          </button>

          <button
            type="button"
            className={`${styles.iconButton} ${styles.btnLink}`}
            onClick={(event) => {
              event.stopPropagation();
              void handleCopyLink();
            }}
            aria-label={copied ? "Link copied" : "Copy link"}
          >
            {copied ? (
              <Check
                size={18}
                strokeWidth={2.2}
                className={styles.copiedIcon || ""}
              />
            ) : (
              <Link size={18} strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderTemplatePreview(
  templateType?: string,
  fields?: Record<string, string | string[] | boolean | null | undefined>,
) {
  if (!templateType || !fields) return null;
  if (!(templateType in ALL_TEMPLATES)) return null;

  const template = getTemplate(templateType as TemplateType);
  const rows = template.fields
    .map((field) => {
      const raw = fields[field.name];
      const valueText = toText(raw).trim();
      if (!valueText) return null;
      return {
        label: field.label,
        value: truncate(valueText, 140),
      };
    })
    .filter(Boolean)
    .slice(0, 3) as { label: string; value: string }[];

  if (rows.length === 0) return null;

  return (
    <div className={styles.previewList}>
      {rows.map((row) => (
        <div key={row.label} className={styles.previewRow}>
          <span className={styles.previewLabel}>{row.label}</span>
          <span className={styles.previewValue}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function toText(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "";
  return String(value);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

function renderSnippetAsPoints(snippet: string) {
  if (!snippet || snippet.trim().length === 0) return null;

  // Heuristics: if it contains newlines or list markers, render as points
  const looksLikeList = /\n|^\s*[-*+]\s|^\s*\d+\./m.test(snippet) || /#{1,6}\s/.test(snippet);

  if (!looksLikeList) {
    return <p className={styles.cardSnippet}>{snippet}</p>;
  }

  // Split into meaningful lines
  const rawLines = snippet.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const items: string[] = [];

  rawLines.forEach((line) => {
    // Remove markdown heading markers
    const headingMatch = line.replace(/^#{1,6}\s+/, "");
    // Remove list markers like '- ', '* ', '1. '
    const cleaned = headingMatch.replace(/^[-*+\s]*\d*\.?\s*/, "").trim();
    if (cleaned.length > 0) items.push(cleaned);
  });

  if (items.length <= 1) {
    return <p className={styles.cardSnippet}>{snippet}</p>;
  }

  return (
    <ul className={styles.pointsList}>
      {items.map((it, idx) => (
        <li key={idx} className={styles.pointItem}>{it}</li>
      ))}
    </ul>
  );
}
