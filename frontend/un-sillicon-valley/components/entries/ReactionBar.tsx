"use client";

import { useEffect, useState } from "react";

import { getCurrentUser, getReactions, toggleReaction } from "@/lib/api";
import type { ReactionSummary } from "@/lib/types/entry";
import type { User } from "@/lib/types/user";

type ReactionBarProps = {
  entryId: number;
};

export function ReactionBar({ entryId }: ReactionBarProps) {
  const [summary, setSummary] = useState<ReactionSummary | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [currentUser, reactions] = await Promise.all([
        getCurrentUser(),
        getReactions(entryId).catch(() => null),
      ]);
      if (cancelled) return;
      setUser(currentUser);
      setSummary(reactions);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  async function handleReaction(type: "like" | "dislike") {
    if (!user || isToggling) return;
    setIsToggling(true);
    try {
      const updated = await toggleReaction(entryId, type);
      setSummary(updated);
    } catch {
      // silently fail
    } finally {
      setIsToggling(false);
    }
  }

  if (!summary) return null;

  const likeActive = summary.user_reaction === "like";
  const dislikeActive = summary.user_reaction === "dislike";

  return (
    <div className="mt-6 flex items-center gap-4">
      <button
        type="button"
        onClick={() => handleReaction("like")}
        disabled={!user || isToggling}
        className={`reaction-btn ${likeActive ? "reaction-btn--active reaction-btn--like" : ""}`}
        title={user ? "Me gusta" : "Inicia sesión para reaccionar"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={likeActive ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
          />
        </svg>
        <span className="text-sm font-medium">{summary.likes}</span>
      </button>

      <button
        type="button"
        onClick={() => handleReaction("dislike")}
        disabled={!user || isToggling}
        className={`reaction-btn ${dislikeActive ? "reaction-btn--active reaction-btn--dislike" : ""}`}
        title={user ? "No me gusta" : "Inicia sesión para reaccionar"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={dislikeActive ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 0 1 2.25 12c0-2.848.992-5.464 2.649-7.521C5.287 3.997 5.886 3.75 6.504 3.75h4.016c.483 0 .964.078 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.31-.287 2.553-.8 3.67a1.063 1.063 0 0 0 .475 1.35 1.007 1.007 0 0 0 1.368-.475 12.07 12.07 0 0 0 .95-4.545c0-1.553-.295-3.036-.831-4.398C19.614 4.046 18.833 3.5 18 3.5h-1.053c-.472 0-.745.556-.5.96a8.958 8.958 0 0 1 .076.165"
          />
        </svg>
        <span className="text-sm font-medium">{summary.dislikes}</span>
      </button>

      {!user && (
        <span className="text-xs text-subtle">Inicia sesión para reaccionar</span>
      )}
    </div>
  );
}
