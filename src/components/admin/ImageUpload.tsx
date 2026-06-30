"use client";

import { useEffect, useState } from "react";
import { Upload } from "lucide-react";

type ImageUploadProps = {
  name: string;
  defaultValue?: string;
  label?: string;
};

export function ImageUpload({ name, defaultValue = "", label = "Image" }: ImageUploadProps) {
  const [url, setUrl] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setUrl(defaultValue);
  }, [defaultValue]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Upload failed. Please try again.");
      }
      const data = await res.json();
      setUrl(data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-metallic">{label}</label>
      <input type="hidden" name={name} value={url ?? ""} />
      <div className="flex items-center gap-3">
        <label className="btn-secondary cursor-pointer text-xs">
          <Upload className="h-4 w-4" />
          {loading ? "Uploading..." : "Upload"}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={loading} />
        </label>
        {url ? (
          <div className="flex items-center gap-3">
            <img src={url} alt={label} className="h-10 w-10 rounded object-cover" />
            <span className="truncate text-xs text-metallic">{url}</span>
          </div>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}