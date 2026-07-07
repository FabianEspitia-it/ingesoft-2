"use client"
import Link from "next/link";

import { type Comment } from "@/lib/types/comment";
import { formatPublishedDate } from "@/lib/types/entry";
import { deleteComment, deleteCommentById } from "@/lib/api";

type CommentProp = {
  comment: Comment
};

export function CommentCard(  { comment }  : CommentProp) {

  async function handleDeleteComment(){
      await deleteCommentById(comment.id)
      location.reload();
      }

  return (
    <article className="ds-card group p-3 transition hover:border-primary/30">
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-subtle">
        <span>{formatPublishedDate(comment.published_at)}</span>
      </div>
      <p className="mb-2 text-2xl">
        "{comment.content}" 
      </p>
      <div>
      <h2 className=" mb-2 text-2xl">
        <small>{comment.author.full_name}</small>
      </h2>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" className="ds-btn ds-btn-primary ds-btn-pill min-w-0 flex-1" onClick={handleDeleteComment}>
            Borrar
          </button>
        </div>
    </article>
  );
}

