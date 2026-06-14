"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import FeedCard from "@/components/feed/FeedCard";
import FiltersPanel from "@/components/feed/FiltersPanel";
import SkeletonCard from "@/components/feed/SkeletonCard";
import SocialPostCard from "@/components/feed/SocialPostCard";
import FeedOverlay from "@/components/feed/FeedOverlay";
import Toast, { ToastType } from "@/components/Toast";
import styles from "./feed.module.css";

type TrendingPeriod = "24h" | "7d" | "30d";

interface FeedEntry {
  id: string;
  title: string;
  category: string;
  template_type?: string;
  impact: string;
  tags: string[];
  content?: string;
  fields?: Record<string, string | string[] | boolean | null | undefined>;
  snippet: string;
  readTime: string;
  confidence: string | null;
  createdAt: string;
  relativeDate: string;
  type?: "reflection" | "social_post";
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  project: {
    id: string;
    name: string;
  } | null;
  reactions: {
    useful: { count: number; reacted: boolean };
    critical: { count: number; reacted: boolean };
    applied: { count: number; reacted: boolean };
  };
  vaulted: boolean;
}

interface PersonalizedFeedResponse {
  entries: FeedEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface Project {
  id: string;
  name: string;
}

const SKELETON_COUNT = 3;
const MAX_BODY_LENGTH = 500;
const MAX_TITLE_LENGTH = 80;

export function FeedProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function FeedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [trending, setTrending] = useState<FeedEntry[]>([]);
  const [railLoading, setRailLoading] = useState(true);
  const [railError, setRailError] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<TrendingPeriod>("24h");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [composerTitle, setComposerTitle] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [chatFocus, setChatFocus] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const activeFilters = useMemo(() => {
    return {
      tags: searchParams.get("tags") || "",
      templateType: searchParams.get("template_type") || "",
      impact: searchParams.get("impact") || "",
      confidence: searchParams.get("confidence") || "",
    };
  }, [searchParams]);

  const filterCount = useMemo(() => {
    const tagCount = activeFilters.tags
      ? activeFilters.tags.split(",").filter(Boolean).length
      : 0;
    const templateCount = activeFilters.templateType
      ? activeFilters.templateType.split(",").filter(Boolean).length
      : 0;
    const impactCount = activeFilters.impact
      ? activeFilters.impact.split(",").filter(Boolean).length
      : 0;
    const confidenceCount = activeFilters.confidence ? 1 : 0;

    return tagCount + templateCount + impactCount + confidenceCount;
  }, [activeFilters]);

  const fetchFeed = useCallback(async () => {
    if (!_hasHydrated) return;

    setLoading(true);
    setError(null);

    try {
      if (user) {
        const response = await api.get<PersonalizedFeedResponse>(
          "/reflections/feed/personalized",
          {
            params: {
              view: "for_you",
              tags: activeFilters.tags || undefined,
              template_type: activeFilters.templateType || undefined,
              impact: activeFilters.impact || undefined,
              confidence: activeFilters.confidence || undefined,
              page: 1,
              limit: 20,
            },
          },
        );
        setEntries(response.data?.entries || []);
      } else {
        const response = await api.get<FeedEntry[]>("/reflections/feed", {
          params: { limit: 20 },
        });
        setEntries(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
      setError("Unable to load the feed right now.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, _hasHydrated, user]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    if (!_hasHydrated) return;

    let isActive = true;

    const fetchRail = async () => {
      setRailLoading(true);
      setRailError(false);

      try {
        const trendingResponse = await api.get<FeedEntry[]>(
          "/reflections/trending",
          {
            params: { period: trendPeriod, limit: 5 },
          },
        );

        if (!isActive) return;

        setTrending(trendingResponse.data || []);
      } catch (error) {
        console.error("Failed to load feed rail", error);
        if (!isActive) return;
        setRailError(true);
        setTrending([]);
      } finally {
        if (isActive) setRailLoading(false);
      }
    };

    fetchRail();

    return () => {
      isActive = false;
    };
  }, [_hasHydrated, trendPeriod]);

  useEffect(() => {
    if (!_hasHydrated || !user) {
      setProjects([]);
      setSelectedProjectId("");
      return;
    }

    let isActive = true;

    const fetchProjects = async () => {
      try {
        const response = await api.get<any>("/projects");
        if (!isActive) return;
        const projectList = Array.isArray(response.data)
          ? response.data
          : response.data?.projects || [];
        setProjects(projectList);
      } catch (error) {
        console.error("Failed to fetch projects", error);
        if (!isActive) return;
        setProjects([]);
      }
    };

    fetchProjects();

    return () => {
      isActive = false;
    };
  }, [_hasHydrated, user]);

  const composerDisabled = !user;
  const hasComposerContent =
    composerTitle.trim().length > 0 || composerBody.trim().length > 0;

  const publishDisabled =
    isPublishing || !user || composerBody.trim().length === 0;

  const handlePublish = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!hasComposerContent || composerBody.trim().length === 0) {
      setToast({
        message: "Add a title or a short update before publishing.",
        type: "error",
      });
      return;
    }

    setIsPublishing(true);

    try {
      await api.post("/reflections", {
        projectId: selectedProjectId || undefined,
        title: composerTitle.trim() || "Quick update",
        entryType: "social_post",
        content: composerBody.trim(),
      });

      setComposerTitle("");
      setComposerBody("");
      setToast({ message: "Your update is live.", type: "success" });
      fetchFeed();
    } catch (error) {
      console.error("Failed to publish update", error);
      setToast({
        message: "Could not publish your update. Try again.",
        type: "error",
      });
    } finally {
      setIsPublishing(true); // Matches original state handler behavior toggles
      setIsPublishing(false);
    }
  };

  const openOverlay = (entryId: string, focusChatPanel = false) => {
    setActiveEntryId(entryId);
    setChatFocus(focusChatPanel);
  };

  const closeOverlay = () => {
    setActiveEntryId(null);
    setChatFocus(false);
  };

  return (
    <div className={styles.feedLayout}>
      <div className={styles.feedMainColumn}>
        <div className={styles.composerCard}>
          <div className={styles.composerHeader}>
            <div className={styles.composerAvatar}>
              {user?.avatarUrl ? (
                <span
                  className={styles.composerAvatarImage}
                  style={{
                    backgroundImage: `url(${user.avatarUrl})`,
                  }}
                />
              ) : (
                <span className={styles.composerAvatarFallback}>
                  {user?.username?.[0]?.toUpperCase() || "T"}
                </span>
              )}
            </div>
            <div className={styles.composerHeaderText}>
              <h3 className={styles.composerTitle}>Feed Updates</h3>
              <p className={styles.composerSubtitle}>
                {user
                  ? `Share a quick technical update, @${user.username}`
                  : "Sign in to share updates with the community."}
              </p>
            </div>
            <div className={styles.composerHeaderActions}>
              <button
                type="button"
                className={styles.filterInlineButton}
                onClick={() => setIsFiltersOpen(true)}
                title="Filter feed"
              >
                <SlidersHorizontal size={14} />
                {filterCount > 0 && (
                  <span className={styles.filterBadge}>{filterCount}</span>
                )}
              </button>
            </div>
          </div>

          <div className={styles.composerForm}>
            <div className={styles.composerRow}>
              <input
                id="feed-title"
                type="text"
                className={styles.composerInput}
                placeholder="Give it a headline (optional)"
                value={composerTitle}
                maxLength={MAX_TITLE_LENGTH}
                onChange={(event) => setComposerTitle(event.target.value)}
                disabled={composerDisabled}
              />

              <div className={styles.composerSelectWrapper}>
                <select
                  id="feed-project"
                  className={styles.composerSelect}
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  disabled={composerDisabled}
                >
                  <option value="">No Project (Standalone)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {user && projects.length === 0 && (
                  <Link
                    className={styles.composerProjectCTA}
                    href="/projects/new"
                  >
                    + Create Project
                  </Link>
                )}
              </div>
            </div>

            <textarea
              id="feed-body"
              className={styles.composerTextarea}
              placeholder="What did you learn today? (Short updates publish as social posts)"
              value={composerBody}
              maxLength={MAX_BODY_LENGTH}
              onChange={(event) => setComposerBody(event.target.value)}
              disabled={composerDisabled}
            />

            <div className={styles.composerFooter}>
              <div className={styles.composerShortcuts}>
                <span className={styles.composerCharCount}>
                  {composerBody.length}/{MAX_BODY_LENGTH}
                </span>
              </div>
              <div className={styles.composerActions}>
                <button
                  type="button"
                  className={styles.composerButton}
                  onClick={handlePublish}
                  disabled={publishDisabled}
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>

            {!user && (
              <div className={styles.composerOverlay}>
                <button
                  type="button"
                  className={styles.composerLoginButton}
                  onClick={() => router.push("/login")}
                >
                  Sign in to post
                </button>
              </div>
            )}
          </div>
        </div>

        <FiltersPanel
          isOpen={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          activeView="for_you"
          var-view-modifier="global"
        />

        <div className={styles.feedGrid}>
          {loading && (
            <div className={styles.skeletonRow}>
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>!</div>
              <h3 className={styles.emptyTitle}>Feed unavailable</h3>
              <p className={styles.emptySubtitle}>{error}</p>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>?</div>
              <h3 className={styles.emptyTitle}>No reflections yet</h3>
              <p className={styles.emptySubtitle}>
                Try adjusting your filters or check back soon.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            entries.length > 0 &&
            entries.map((entry) =>
              entry.type === "social_post" ? (
                <SocialPostCard
                  key={entry.id}
                  entry={entry}
                  onOpen={() => openOverlay(entry.id, false)}
                  onOpenChat={() => openOverlay(entry.id, true)}
                />
              ) : (
                <FeedCard
                  key={entry.id}
                  entry={entry}
                  onOpen={() => openOverlay(entry.id, false)}
                  onOpenChat={() => openOverlay(entry.id, true)}
                />
              ),
            )}
        </div>
      </div>

      <aside className={styles.rightRail}>
        <section className={styles.railSection}>
          <div className={styles.railHeader}>
            <h3 className={styles.railTitle}>Trending Now</h3>
            <div className={styles.periodSwitch}>
              {(["24h", "7d", "30d"] as TrendingPeriod[]).map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`${styles.periodButton} ${
                    trendPeriod === period ? styles.periodButtonActive : ""
                  }`}
                  onClick={() => setTrendPeriod(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {railLoading && (
            <ul className={styles.rankedSkeletonList}>
              {Array.from({ length: 3 }).map((_, index) => (
                <li
                  key={`trend-skeleton-${index}`}
                  className={styles.rankedSkeletonItem}
                >
                  <div className={styles.rankSkeletonTitle} />
                  <div className={styles.rankSkeletonMeta} />
                  <div className={styles.rankSkeletonHighlightRow}>
                    <div className={styles.rankSkeletonBadge} />
                    <div className={styles.rankSkeletonTime} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!railLoading && railError && (
            <p className={styles.railEmpty}>Unable to load trending entries.</p>
          )}

          {!railLoading && !railError && trending.length === 0 && (
            <p className={styles.railEmpty}>No trending reflections yet.</p>
          )}

          {!railLoading && !railError && trending.length > 0 && (
            <ul className={styles.rankedList}>
              {trending.map((entry, index) => (
                <li
                  key={entry.id}
                  className={styles.trendingItem}
                  onClick={() => openOverlay(entry.id, false)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openOverlay(entry.id, false);
                    }
                  }}
                >
                  <div className={styles.trendingTitleRow}>
                    <span className={styles.rankNumber}>{index + 1}</span>
                    <span className={styles.rankedText}>
                      {entry.title || "Untitled"}
                    </span>
                  </div>
                  <div className={styles.trendingHighlightRow}>
                    {entry.impact && (
                      <span className={styles.trendingBadge}>
                        {entry.impact.replace(/_/g, " ")}
                      </span>
                    )}
                    {entry.template_type && (
                      <span
                        className={`${styles.trendingBadge} ${styles.insightBadge}`}
                      >
                        {entry.template_type.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className={styles.trendingTimeInline}>
                      {entry.relativeDate}
                    </span>
                  </div>
                  <p className={styles.trendingMetric}>
                    <strong>
                      {entry.reactions.useful.count +
                        entry.reactions.applied.count}
                    </strong>{" "}
                    reactions
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <FeedOverlay
        entryId={activeEntryId}
        isOpen={Boolean(activeEntryId)}
        focusChat={chatFocus}
        onFocusHandled={() => setChatFocus(false)}
        onClose={closeOverlay}
      />
    </div>
  );
}
