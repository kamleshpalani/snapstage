import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/providers/AuthProvider";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/ProjectCard";
import { StatCard } from "@/components/StatCard";
import { Colors } from "@/lib/colors";

export default function HomeScreen() {
  const { profile } = useAuth();
  const { projects, loading, refresh } = useProjects({ limit: 3 });

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>
              Welcome back, {firstName} 👋
            </Text>
            <Text style={styles.greetingSubtext}>
              Ready to stage something?
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => router.push("/(tabs)/new")}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="flash"
            iconColor="#f59e0b"
            iconBg="#fef3c7"
            label="Credits Left"
            value={profile?.credits_remaining ?? 0}
          />
          <StatCard
            icon="images"
            iconColor="#0284c7"
            iconBg="#dbeafe"
            label="Total Projects"
            value={projects?.length ?? 0}
          />
        </View>

        {/* Credits warning */}
        {(profile?.credits_remaining ?? 0) <= 1 && (
          <TouchableOpacity
            style={styles.creditsBanner}
            onPress={() => router.push("/billing")}
          >
            <Ionicons name="warning-outline" size={18} color="#d97706" />
            <Text style={styles.creditsBannerText}>
              {profile?.credits_remaining === 0
                ? "You've used all your credits. Upgrade to continue staging."
                : "Only 1 credit left! Tap to upgrade."}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#d97706" />
          </TouchableOpacity>
        )}

        {/* Recent projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Projects</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/projects")}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {!projects || projects.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={() => router.push("/(tabs)/new")}
            >
              <Ionicons name="camera-outline" size={36} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptySubtext}>
                Tap to stage your first room
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.projectsList}>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingText: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  greetingSubtext: { fontSize: 14, color: "#64748b", marginTop: 2 },
  newButton: {
    width: 42,
    height: 42,
    backgroundColor: Colors.brand,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  creditsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 12,
    padding: 12,
  },
  creditsBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#92400e",
    fontWeight: "500",
  },
  section: { paddingHorizontal: 20, paddingBottom: 32 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  seeAll: { fontSize: 14, color: Colors.brand, fontWeight: "600" },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySubtext: { fontSize: 14, color: "#94a3b8" },
  projectsList: { gap: 12 },
});
