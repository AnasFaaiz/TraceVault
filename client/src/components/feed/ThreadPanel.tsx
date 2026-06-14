"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import styles from "./ThreadPanel.module.css";

export interface ThreadMessage {
  id: string;
  reflectionId: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface ThreadPanelProps {
  messages: ThreadMessage[];
  isLoading: boolean;
  isSending: boolean;
  canSend: boolean;
  focusInput?: boolean;
  onFocusHandled?: () => void;
  onSend: (body: string) => void;
  onRequireAuth: () => void;
}

export default function ThreadPanel({
  messages,
  isLoading,
  isSending,
  canSend,
  focusInput,
  onFocusHandled,
  onSend,
  onRequireAuth,
}: ThreadPanelProps) {
  const [value, setValue] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!focusInput || !inputRef.current) return;
    inputRef.current.focus();
    onFocusHandled?.();
  }, [focusInput, onFocusHandled]);

  const handleSend = () => {
    if (!canSend) {
      onRequireAuth();
      return;
    }

    const trimmed = value.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Conversation</p>
          <p className={styles.subtitle}>Share context, questions, and follow ups.</p>
        </div>
      </div>

      <div className={styles.messages} ref={listRef}>
        {isLoading && <p className={styles.stateText}>Loading thread...</p>}
        {!isLoading && messages.length === 0 && (
          <p className={styles.stateText}>No messages yet. Start the thread.</p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={styles.messageRow}>
            <div className={styles.avatar}>
              {message.author.avatarUrl ? (
                <img
                  src={message.author.avatarUrl}
                  alt={message.author.username}
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarFallback}>
                  {message.author.username?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className={styles.messageBody}>
              <div className={styles.messageMeta}>
                <span className={styles.authorName}>
                  {message.author.username}
                </span>
                <span className={styles.timestamp}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className={styles.messageText}>{message.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.composer}>
        <textarea
          ref={inputRef}
          className={styles.input}
          placeholder={canSend ? "Write a reply..." : "Sign in to reply"}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={3}
          disabled={!canSend || isSending}
        />
        {!canSend && (
          <button
            type="button"
            className={styles.loginButton}
            onClick={onRequireAuth}
          >
            Sign in to reply
          </button>
        )}
        <button
          type="button"
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!canSend || !value.trim() || isSending}
        >
          <Send size={16} />
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
