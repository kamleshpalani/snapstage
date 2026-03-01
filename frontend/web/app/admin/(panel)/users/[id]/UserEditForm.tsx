"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  plan: string;
  credits_remaining: number;
  is_admin: boolean;
  full_name?: string | null;
}

export function UserEditForm({ user }: Readonly<{ user: UserProfile }>) {
  const router = useRouter();
  const [plan, setPlan] = useState(user.plan);
  const [credits, setCredits] = useState(String(user.credits_remaining));
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`${apiUrl}/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "",
        },
        body: JSON.stringify({
          plan,
          credits_remaining: Number(credits),
          is_admin: isAdmin,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      setMessage("✓ Saved");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label
          htmlFor="plan"
          className="block text-xs font-medium text-zinc-400 mb-1.5"
        >
          Plan
        </label>
        <select
          id="plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none"
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="agency">Agency</option>
          <option value="payg">Pay-as-you-go</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="credits"
          className="block text-xs font-medium text-zinc-400 mb-1.5"
        >
          Credits remaining
        </label>
        <input
          id="credits"
          type="number"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          min="0"
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          id="is_admin"
          checked={isAdmin}
          onChange={(e) => setIsAdmin(e.target.checked)}
          className="w-4 h-4 rounded accent-white"
        />
        <label htmlFor="is_admin" className="text-sm text-zinc-300">
          Admin access
        </label>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.startsWith("✓") ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 rounded-lg bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
