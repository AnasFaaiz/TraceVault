"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import ReflectionContent from "@/components/reflections/ReflectionContent";
import ThreadPanel, { ThreadMessage } from "@/components/feed/ThreadPanel";
import { disconnectThreadSocket, getThreadSocket } from "@/lib/thread-socket";
import styles from "./FeedOverlay.module.css";

interface FeedEntryDetail {
  id: string;
  title: string;
  category: string;
  template_type?: string;
  impact: string;
  tags: string[];
  content?: string;
  fields?: Record<string, string | string[] | boolean | null | undefined>;
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
}

interface ThreadResponse {
  threadId: string;
  reflectionId: string;
  messages: ThreadMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

interface FeedOverlayProps {
  entryId: string | null;
  isOpen: boolean;
  focusChat?: boolean;
  onFocusHandled?: () => void;
  onClose: () => void;
}

export default function FeedOverlay({
  entryId,
  isOpen,
  focusChat,
  onFocusHandled,
  onClose,
}: FeedOverlayProps) {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [entry, setEntry] = useState<FeedEntryDetail | null>(null);
  const [entryLoading, setEntryLoading] = useState(false);
  const [thread, setThread] = useState<ThreadResponse | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const canSend = !!user && !!token;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !entryId) return;
    let isActive = true;

    const fetchEntry = async () => {
      setEntryLoading(true);
      try {
        const response = await api.get<FeedEntryDetail>(`/reflections/${entryId}`);
        if (isActive) setEntry(response.data || null);
      } catch (error) {
        console.error("Failed to load reflection", error);
        if (isActive) setEntry(null);
      } finally {
        if (isActive) setEntryLoading(false);
      }
    };

    fetchEntry();

    return () => {
      isActive = false;
    };
  }, [entryId, isOpen]);

  useEffect(() => {
    if (!isOpen || !entryId) return;
    let isActive = true;

    const fetchThread = async () => {
      setThreadLoading(true);
      try {
        const response = await api.get<ThreadResponse>(
          `/reflections/${entryId}/thread`,
        );
        if (isActive) setThread(response.data || null);
      } catch (error) {
        console.error("Failed to load thread", error);
        if (isActive) setThread(null);
      } finally {
        if (isActive) setThreadLoading(false);
      }
    };

    fetchThread();

    return () => {
      isActive = false;
    };
  }, [entryId, isOpen]);

  useEffect(() => {
    if (!isOpen || !entryId || !token) return;

    const socket = getThreadSocket(token);
    socket.connect();
    socket.emit("thread:join", { reflectionId: entryId });

    const handleMessage = (message: ThreadMessage) => {
      if (message.reflectionId !== entryId) return;
      setThread((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((item) => item.id === message.id)) return prev;
        return { ...prev, messages: [...prev.messages, message] };
      });
    };

    socket.on("thread:message", handleMessage);

    return () => {
      socket.off("thread:message", handleMessage);
      socket.emit("thread:leave", { reflectionId: entryId });
      disconnectThreadSocket();
    };
  }, [entryId, isOpen, token]);

  const handleSend = async (body: string) => {
    if (!entryId || !canSend || isSending) return;

    setIsSending(true);

    const optimistic: ThreadMessage = {
      id: `temp-${Date.now()}`,
      reflectionId: entryId,
      body,
      createdAt: new Date().toISOString(),
      author: {
        id: user?.id || "",
        username: user?.username || "You",
        avatarUrl: user?.avatarUrl || null,
      },
    };

    setThread((prev) =>
      prev
        ? { ...prev, messages: [...prev.messages, optimistic] }
        : {
            threadId: "",
            reflectionId: entryId,
            messages: [optimistic],
            hasMore: false,
            nextCursor: null,
          },
    );

    try {
      const response = await api.post<ThreadMessage>(
        `/reflections/${entryId}/thread/messages`,
        { body },
      );

      setThread((prev) => {
        if (!prev) return prev;
        const filtered = prev.messages.filter((msg) => msg.id !== optimistic.id);
        return { ...prev, messages: [...filtered, response.data] };
      });
    } catch (error) {
      console.error("Failed to send message", error);
      setThread((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== optimistic.id),
        };
      });
    } finally {
      setIsSending(false);
    }
  };

  const messages = useMemo(() => thread?.messages || [], [thread]);

  if (!isOpen || !entryId) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.panel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className={styles.content}>
          <div className={styles.detailPanel}>
            {entryLoading && <p className={styles.stateText}>Loading...</p>}
            {!entryLoading && !entry && (
              <p className={styles.stateText}>Unable to load reflection.</p>
            )}
            {!entryLoading && entry && (
              <>
                <div className={styles.header}>
                  <p className={styles.meta}>
                    <span>@{entry.author.username}</span>
                    <span className={styles.dot}>•</span>
                    <span>{entry.project.name}</span>
                  </p>
                  <h2 className={styles.title}>{entry.title}</h2>
                  <div className={styles.badges}>
                    {entry.impact && (
                      <span className={styles.badge}>
                        {entry.impact.replace(/_/g, " ")}
                      </span>
                    )}
                    {entry.template_type && (
                      <span className={styles.badgeAlt}>
                        {entry.template_type.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.body}>
                  <ReflectionContent
                    category={entry.category}
                    templateType={entry.template_type}
                    fields={entry.fields}
                    content={entry.content}
                  />
                </div>
              </>
            )}
          </div>

          <ThreadPanel
            messages={messages}
            isLoading={threadLoading}
            isSending={isSending}
            canSend={canSend}
            focusInput={focusChat}
            onFocusHandled={onFocusHandled}
            onSend={handleSend}
            onRequireAuth={() => router.push("/login")}
          />
        </div>
      </div>
    </div>
  );
}
