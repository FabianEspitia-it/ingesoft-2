"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/api";

type EntryEditButtonProps = {
  entryId: number;
  authorId: number;
};

export function EntryEditButton({ entryId, authorId }: EntryEditButtonProps) {
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((user) => {
      if (cancelled || !user) return;
      setCanManage(user.id === authorId || user.role === "administrator");
    });
    return () => {
      cancelled = true;
    };
  }, [authorId]);

  if (!canManage) return null;

  return (
    <Link
      href={`/entries/${entryId}/edit`}
      className="ds-btn ds-btn-ghost ds-btn-pill px-4 py-2 text-sm"
    >
      ✏️ Editar entrada
    </Link>
  );
}
