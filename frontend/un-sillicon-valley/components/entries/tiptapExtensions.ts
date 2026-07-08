import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import type { Extensions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";

/**
 * Shared TipTap extension set used by both the editor and the read-only viewer,
 * so writing and reading go through the exact same Markdown engine (markdown-it
 * via tiptap-markdown) and render identically.
 */
export function markdownExtensions(options?: { linkOpenOnClick?: boolean }): Extensions {
  return [
    StarterKit.configure({ link: false }),
    Link.configure({
      openOnClick: options?.linkOpenOnClick ?? false,
      autolink: true,
      HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
    }),
    Image,
    Markdown.configure({ html: false }),
  ];
}
