import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/providers/AuthProvider";
import { Colors } from "@/lib/colors";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro ⚡",
  agency: "Agency 🚀",
  payg: "Pay-as-you-go",
};

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  };

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const menuItems = [
    {
      icon: "card-outline",
      label: "Billing & Credits",
      onPress: () => router.push("/billing"),
    },
    {
      icon: "settings-outline",
      label: "Account Settings",
      onPress: () => router.push("/settings"),
    },
    {
      icon: "help-circle-outline",
      label: "Help & Support",
      onPress: () => router.push("/support"),
    },
    {
      icon: "document-text-outline",
      label: "Terms of Service",
      onPress: () => router.push("/terms"),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{profile?.full_name ?? "User"}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* Plan badge */}
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              {PLAN_LABELS[profile?.plan ?? "free"]}
            </Text>
          </View>
        </View>

        {/* Credits card */}
        <View style={styles.creditsCard}>
          <View style={styles.creditsRow}>
            <View>
              <Text style={styles.creditsLabel}>Credits remaining</Text>
              <Text style={styles.creditsValue}>
                {profile?.credits_remaining ?? 0} stagings
              </Text>
            </View>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push("/billing")}
            >
              <Text style={styles.upgradeButtonText}>Get more</Text>
            </TouchableOpacity>
          </View>
          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    ((profile?.credits_remaining ?? 0) / 50) * 100,
                    100,
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon as any} size={20} color="#64748b" />
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SnapStage v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  profileHeader: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: "#fff" },
  name: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  email: { fontSize: 14, color: "#64748b", marginBottom: 12 },
  planBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  planBadgeText: { fontSize: 13, fontWeight: "700", color: Colors.brand },
  creditsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  creditsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  creditsLabel: { fontSize: 13, color: "#64748b", marginBottom: 4 },
  creditsValue: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  upgradeButton: {
    backgroundColor: Colors.brand,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  upgradeButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  progressBar: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 100,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.brand,
    borderRadius: 100,
  },
  menu: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuItemText: { flex: 1, fontSize: 15, color: "#374151", fontWeight: "500" },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  signOutText: { fontSize: 15, color: "#ef4444", fontWeight: "600" },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#cbd5e1",
    paddingBottom: 32,
  },
});
