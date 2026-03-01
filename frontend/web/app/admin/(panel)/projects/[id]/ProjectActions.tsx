"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["pending", "processing", "completed", "failed"] as const;

export function ProjectActions({
  projectId,
  currentStatus,
}: Readonly<{
  projectId: string;
  currentStatus: string;
}>) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET || "";

  async function updateStatus(status: string) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`${apiUrl}/admin/projects/${projectId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": adminSecret,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setMsg(`✓ Status set to ${status}`);
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`${apiUrl}/admin/projects/${projectId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": adminSecret,
        },
        body: JSON.stringify({ content: note }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setNote("");
      setMsg("✓ Note added");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status buttons */}
      <div>
        <p className="text-xs font-medium text-zinc-400 mb-2">Set status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={saving || s === currentStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                s === currentStatus
                  ? "bg-white text-zinc-950 cursor-default"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Add note */}
      <form onSubmit={addNote}>
        <p className="text-xs font-medium text-zinc-400 mb-2">Add note</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Internal note…"
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving || !note.trim()}
          className="mt-2 px-4 py-1.5 rounded-lg bg-zinc-700 text-white text-xs font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add note"}
        </button>
      </form>

      {msg && (
        <p
          className={`text-xs ${msg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
