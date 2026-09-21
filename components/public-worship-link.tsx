"use client";

import { useEffect, useState } from "react";

export function PublicWorshipLink({ slug }: { slug: string }) {
  const [url, setUrl] = useState(`/culto/${slug}`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/culto/${slug}`);
  }, [slug]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="worshipPublicLink">
      <div>
        <small>LINK PÚBLICO DO CULTO</small>
        <strong>{url}</strong>
      </div>
      <button type="button" onClick={copy}>{copied ? "Copiado" : "Copiar link"}</button>
    </div>
  );
}
