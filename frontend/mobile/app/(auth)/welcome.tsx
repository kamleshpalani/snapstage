import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/lib/colors";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Hero illustration placeholder */}
      <View style={styles.heroContainer}>
        <View style={styles.heroPlaceholder}>
          <Text style={styles.heroEmoji}>🏠✨</Text>
          <Text style={styles.heroSubEmoji}>Before → After</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🤖 AI-Powered</Text>
        </View>

        <Text style={styles.title}>Stage any room{"\n"}in seconds</Text>
        <Text style={styles.subtitle}>
          Transform empty rooms into beautifully staged spaces with AI. Perfect
          for real estate agents & homeowners.
        </Text>

        {/* CTA buttons */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/(auth)/signup")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Get started — it's free</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Sign in</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          3 free stagings · No credit card needed
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },
  heroContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  heroPlaceholder: {
    width: width - 48,
    height: 280,
    backgroundColor: "#fff",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroEmoji: {
    fontSize: 64,
  },
  heroSubEmoji: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 12,
  },
  content: {
    padding: 24,
    paddingBottom: 16,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 16,
  },
  badgeText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "600",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 44,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    lineHeight: 24,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: Colors.brand,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: Colors.brand,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "600",
  },
  footerNote: {
    textAlign: "center",
    fontSize: 13,
    color: "#94a3b8",
  },
});
