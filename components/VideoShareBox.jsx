"use client";

import { useEffect, useMemo, useState } from "react";
import { Clipboard, ExternalLink, Share2 } from "lucide-react";

export function VideoShareBox({ selectedVideoId = "" }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const query = useMemo(() => {
    if (!selectedVideoId) {
      return "";
    }

    return `?v=${encodeURIComponent(selectedVideoId)}`;
  }, [selectedVideoId]);
  const pageUrl = useMemo(() => `${origin}/band/video${query}`, [origin, query]);
  const embedUrl = useMemo(() => `${origin}/embed/band/video${query}`, [origin, query]);
  const embedCode = `<iframe width="560" height="315" src="${embedUrl}" title="Route666 video player" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

  async function copy(value, label) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return (
    <div className="border-2 border-newsprint bg-ink p-5">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-radio">
        <Share2 size={17} />
        Share / Embed
      </div>
      <div className="mt-5 grid gap-3">
        <button className="inline-flex w-fit items-center gap-2 border-2 border-bone px-4 py-3 font-mono text-sm uppercase text-bone hover:border-radio hover:text-radio" onClick={() => copy(pageUrl, "Page link copied")} type="button">
          <ExternalLink size={16} />
          Copy Page Link
        </button>
        <button className="inline-flex w-fit items-center gap-2 border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer hover:bg-arcade" onClick={() => copy(embedCode, "Embed code copied")} type="button">
          <Clipboard size={16} />
          Copy Embed Code
        </button>
        <textarea className="min-h-32 border-2 border-newsprint bg-tar p-3 font-mono text-xs text-newsprint outline-none" readOnly value={embedCode} />
        {copied ? <p className="font-mono text-sm text-arcade">{copied}</p> : null}
      </div>
    </div>
  );
}
