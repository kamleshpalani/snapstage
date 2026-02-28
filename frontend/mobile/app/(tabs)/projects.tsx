import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/ProjectCard";
import { Colors } from "@/lib/colors";

export default function ProjectsScreen() {
  const { projects, loading, refresh } = useProjects();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {!projects || projects.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No projects yet</Text>
          <Text style={styles.emptySubtext}>
            Upload a room photo and let AI do the magic.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/(tabs)/new")}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.emptyButtonText}>Create First Project</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProjectCard project={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  list: { padding: 20, paddingBottom: 40 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#374151" },
  emptySubtext: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
