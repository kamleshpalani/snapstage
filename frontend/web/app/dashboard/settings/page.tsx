"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [nameMsg, setNameMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pwMsg, setPwMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profile) setFullName(profile.full_name ?? "");
    };
    load();
  }, []);

  const handleSaveName = async () => {
    setSavingName(true);
    setNameMsg(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", user!.id);
    setSavingName(false);
    setNameMsg(
      error
        ? { type: "error", text: "Failed to update name." }
        : { type: "success", text: "Name saved!" },
    );
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "Passwords don't match." });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) setPwMsg({ type: "error", text: error.message });
    else {
      setPwMsg({ type: "success", text: "Password updated!" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
      <p className="text-slate-500 text-sm mb-8">
        Manage your account preferences.
      </p>

      {/* Account Info */}
      <section className="card mb-6">
        <h2 className="section-label mb-4">Account Info</h2>
        <div className="mb-4">
          <p className="label">Email Address</p>
          <p className="input bg-slate-50 text-slate-500 cursor-not-allowed">
            {email}
          </p>
        </div>
        <div className="mb-4">
          <label className="label" htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input w-full"
            placeholder="Your full name"
          />
        </div>
        {nameMsg && (
          <p
            className={`text-sm mb-3 ${nameMsg.type === "success" ? "text-green-600" : "text-red-500"}`}
          >
            {nameMsg.text}
          </p>
        )}
        <button
          onClick={handleSaveName}
          disabled={savingName}
          className="btn-primary"
        >
          {savingName ? "Saving…" : "Save Changes"}
        </button>
      </section>

      {/* Change Password */}
      <section className="card mb-6">
        <h2 className="section-label mb-4">Change Password</h2>
        <div className="mb-4">
          <label className="label" htmlFor="newPassword">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input w-full"
            placeholder="At least 8 characters"
          />
        </div>
        <div className="mb-4">
          <label className="label" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input w-full"
            placeholder="Repeat new password"
          />
        </div>
        {pwMsg && (
          <p
            className={`text-sm mb-3 ${pwMsg.type === "success" ? "text-green-600" : "text-red-500"}`}
          >
            {pwMsg.text}
          </p>
        )}
        <button
          onClick={handleChangePassword}
          disabled={savingPassword}
          className="btn-primary"
        >
          {savingPassword ? "Updating…" : "Update Password"}
        </button>
      </section>

      {/* Danger Zone */}
      <section className="card border-red-100">
        <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-4">
          Danger Zone
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <button
          className="px-4 py-2 rounded-lg border-2 border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
          onClick={() =>
            alert("Please email support@snapstage.io to delete your account.")
          }
        >
          Delete My Account
        </button>
      </section>
    </div>
  );
}
