import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/colors";

interface Project {
  id: string;
  name: string;
  original_image_url: string;
  staged_image_url: string | null;
  style: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

const STATUS_CONFIG = {
  completed: { color: "#16a34a", bg: "#dcfce7", label: "Done ✓" },
  processing: { color: "#d97706", bg: "#fef3c7", label: "Processing..." },
  pending: { color: "#64748b", bg: "#f1f5f9", label: "Pending" },
  failed: { color: "#dc2626", bg: "#fee2e2", label: "Failed" },
};

export function ProjectCard({ project }: { project: Project }) {
  const status = STATUS_CONFIG[project.status];
  const displayImage = project.staged_image_url ?? project.original_image_url;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/project/${project.id}`)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: displayImage }}
        style={styles.image}
        contentFit="cover"
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
      />

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {project.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.style}>🎨 {project.style}</Text>
          <Text style={styles.date}>
            {new Date(project.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#e2e8f0",
  },
  info: { padding: 12 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  style: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  date: { fontSize: 12, color: "#94a3b8" },
});
