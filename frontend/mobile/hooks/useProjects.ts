import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

interface Project {
  id: string;
  name: string;
  original_image_url: string;
  staged_image_url: string | null;
  style: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

interface UseProjectsOptions {
  limit?: number;
}

export function useProjects({ limit }: UseProjectsOptions = {}) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) setError(error.message);
    else setProjects(data ?? []);

    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    fetchProjects();

    // Realtime subscription for status updates
    const channel = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === payload.new.id ? { ...p, ...payload.new } : p,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProjects, user?.id]);

  return { projects, loading, error, refresh: fetchProjects };
}
