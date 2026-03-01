import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { supabase } from "@/lib/supabase";

interface Project {
  id: string;
  name: string;
  original_image_url: string;
  staged_image_url: string | null;
  style: string;
  status: string;
  created_at: string;
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAfter, setShowAfter] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProject();

    const channel = supabase
      .channel(`project-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${id}`,
        },
        (payload) => setProject(payload.new as Project),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) setProject(data);
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!project?.staged_image_url) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to save images.",
      );
      return;
    }
    setSaving(true);
    try {
      const filename =
        FileSystem.documentDirectory + `snapstage-${project.id}.jpg`;
      await FileSystem.downloadAsync(project.staged_image_url, filename);
      await MediaLibrary.saveToLibraryAsync(filename);
      Alert.alert("Saved!", "Staged image saved to your photo library.");
    } catch {
      Alert.alert("Error", "Failed to save image.");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!project?.staged_image_url) return;
    try {
      await Share.share({
        message: "Check out this AI-staged room by SnapStage!",
        url: project.staged_image_url,
      });
    } catch {}
  };

  const statusColor = (s: string) => {
    if (s === "completed") return "#10b981";
    if (s === "processing") return "#f59e0b";
    if (s === "failed") return "#ef4444";
    return "#94a3b8";
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Project not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayImage = showAfter
    ? (project.staged_image_url ?? project.original_image_url)
    : project.original_image_url;

  return (
    <>
      <Stack.Screen
        options={{
          title: `${(project.style ?? "").replaceAll("_", " ")} Room`,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 4 }}
            >
              <Ionicons name="chevron-back" size={24} color="#0f172a" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Toggle */}
        {project.staged_image_url && (
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, !showAfter && styles.toggleBtnActive]}
              onPress={() => setShowAfter(false)}
            >
              <Text
                style={[
                  styles.toggleText,
                  !showAfter && styles.toggleTextActive,
                ]}
              >
                Before
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, showAfter && styles.toggleBtnActive]}
              onPress={() => setShowAfter(true)}
            >
              <Text
                style={[
                  styles.toggleText,
                  showAfter && styles.toggleTextActive,
                ]}
              >
                After
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: displayImage }}
            style={styles.image}
            resizeMode="cover"
          />
          {project.status === "processing" && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.processingText}>
                AI is staging your room…
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Row
            label="Style"
            value={(project.style ?? "").replaceAll("_", " ").toUpperCase()}
          />
          <Row label="Status">
            <View
              style={[
                styles.badge,
                { backgroundColor: statusColor(project.status) + "22" },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: statusColor(project.status) },
                ]}
              >
                {project.status.toUpperCase()}
              </Text>
            </View>
          </Row>
          <Row
            label="Created"
            value={new Date(project.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          />
        </View>

        {/* Actions */}
        {project.staged_image_url && project.status === "completed" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.downloadBtn]}
              onPress={handleDownload}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Save to Library</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.shareBtn]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color="#0284c7" />
              <Text style={[styles.actionBtnText, { color: "#0284c7" }]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children ?? <Text style={styles.rowValue}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: { fontSize: 16, color: "#64748b", marginBottom: 16 },
  backBtn: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: { color: "#fff", fontWeight: "600" },
  toggle: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
  toggleTextActive: { color: "#0f172a" },
  imageWrapper: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },
  image: { width: "100%", aspectRatio: 4 / 3 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  processingText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  infoCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  rowLabel: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  rowValue: { fontSize: 14, color: "#0f172a", fontWeight: "600" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  downloadBtn: { backgroundColor: "#0284c7" },
  shareBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#0284c7",
  },
  actionBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
