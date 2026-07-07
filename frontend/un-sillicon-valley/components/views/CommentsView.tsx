"use client";

import { useEffect, useState } from "react";
import { CommentCard } from "../comments/CommentCard";
import { CommentListResponse } from "@/lib/types/comment";
import { getAllComments } from "@/lib/api";

export default function CommentsView() {
 let loadError: string | null = null;
  const [results, setResults] = useState<CommentListResponse | null>(null);

  useEffect(() =>{
      async function fetchCommentsData() {
        try{
          const comments = await getAllComments();
          setResults(comments);
        } catch (error){
          console.log("error")

        }
      }

    fetchCommentsData()
      }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Comentarios Admin</h1>
      <p className="text-muted">
      </p>
      <section className="space-y-6">
          {results && results.items.length > 0 ? (
            <div className="grid gap-4">
              {results.items.map((comment) => (
                <CommentCard key={comment.id} comment = {comment}/>
              ))}
            </div>
          ) : (
            !loadError && (
              <div className="ds-card border-dashed px-6 py-12 text-center">
                <p className="text-muted">
                  No se encontraron comentarios.
                </p>
              </div>
            )
          )}
        </section>
    </div>    
  );
}