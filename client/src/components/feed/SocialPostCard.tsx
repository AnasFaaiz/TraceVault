"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Check,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import styles from "./FeedCard.module.css"; // Inheriting baseline card wrappers to keep styling dry

interface SocialPostCardProps {
  entry: {
    id: string;
    title: string;
    content?: string;
    relativeDate: string;
    tags: string[];
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
      applied: { count: number; reacted: boolean };
    };
    vaulted: boolean;
  };
  onOpen: () => void;
  onOpenChat: () => void;
}

export default function SocialPostCard({
  entry,
  onOpen,
  onOpenChat,
}: SocialPostCardProps) {
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
      className={`${styles.feedCard} ${styles.socialPostCard} ${styles.clickableCard}`}
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
      {/* Upper Content Frame */}
      <div className={styles.cardHeader}>
        <div className={styles.authorMeta}>
          {entry.author.avatarUrl ? (
            <img
              src={entry.author.avatarUrl}
              alt={entry.author.username}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder} aria-hidden="true" />
          )}
          <div className={styles.authorLine}>
            <span className={styles.authorName}>{entry.author.username}</span>
            <span className={styles.postDivider}>shared a quick update in</span>
            <Link
              href={`/projects/${entry.project.id}`}
              className={styles.projectLink}
              onClick={(event) => event.stopPropagation()}
            >
              {entry.project.name}
            </Link>
          </div>
        </div>

        {/* header actions (progressive actions are in footer) */}
        <div />
      </div>

      {/* Simplified, high-readability body block layout */}
      <div className={styles.cardBody}>
        {entry.title && <h3 className={styles.socialTitle}>{entry.title}</h3>}
        <p className={styles.socialText}>{entry.content}</p>

        {entry.tags.length > 0 && (
          <div className={styles.tagContainer}>
            {entry.tags.map((tag) => (
              <span key={tag} className={styles.tagBadge}>
                #{tag}
              </span>
            ))}
          </div>
        )}
        <span className={styles.timestampInline}>{entry.relativeDate}</span>
      </div>

      {/* Action tray */}
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
            <span className={`${styles.voteCount} ${userVote === "up" ? styles.activeUpText : ""}`}>
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
            <span className={`${styles.voteCount} ${userVote === "down" ? styles.activeDownText : ""}`}>
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
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
              <Check size={18} strokeWidth={2.2} className={styles.copiedIcon || ""} />
            ) : (
              <LinkIcon size={18} strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
