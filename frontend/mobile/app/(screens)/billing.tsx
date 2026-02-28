import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/providers/AuthProvider";

interface Plan {
  id: string;
  name: string;
  price: string;
  credits: number;
  features: string[];
  priceId: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    credits: 3,
    priceId: "",
    features: [
      "3 stagings/month",
      "3 styles",
      "Standard quality",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    credits: 50,
    priceId: "price_pro",
    popular: true,
    features: [
      "50 stagings/month",
      "All 6 styles",
      "HD quality",
      "Priority support",
      "Download originals",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "$99",
    credits: 200,
    priceId: "price_agency",
    features: [
      "200 stagings/month",
      "All styles",
      "4K quality",
      "Dedicated support",
      "API access",
      "White-label",
    ],
  },
];

const TOPUP_PACKS = [
  { credits: 5, price: "$10", label: "Starter Pack" },
  { credits: 15, price: "$25", label: "Value Pack" },
  { credits: 40, price: "$60", label: "Pro Pack" },
];

export default function BillingScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const currentPlan = profile?.plan ?? "free";

  const handleUpgrade = async (plan: Plan) => {
    if (!plan.priceId) return;
    setLoading(plan.id);
    // In production, call your API to create a Stripe checkout session
    // then open the URL with Linking.openURL()
    Alert.alert(
      "Upgrade to " + plan.name,
      "You'll be redirected to our secure checkout to complete your upgrade.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            // TODO: Replace with real API call
            Linking.openURL("https://snapstage.io/billing");
          },
        },
      ],
    );
    setLoading(null);
  };

  const handleTopUp = async (pack: (typeof TOPUP_PACKS)[0]) => {
    Alert.alert(
      "Buy Credits",
      `Purchase ${pack.credits} credits for ${pack.price}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy Now",
          onPress: () => Linking.openURL("https://snapstage.io/billing"),
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{ title: "Billing & Credits", headerBackTitle: "Back" }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Current Plan Banner */}
        <View style={styles.currentBanner}>
          <View>
            <Text style={styles.currentLabel}>Current Plan</Text>
            <Text style={styles.currentPlan}>{currentPlan.toUpperCase()}</Text>
          </View>
          <View style={styles.creditsBox}>
            <Ionicons name="flash" size={18} color="#f59e0b" />
            <Text style={styles.creditsText}>
              {profile?.credits_remaining ?? 0} credits
            </Text>
          </View>
        </View>

        {/* Plans */}
        <Text style={styles.sectionTitle}>Choose a Plan</Text>
        {PLANS.map((plan) => (
          <View
            key={plan.id}
            style={[styles.planCard, plan.popular && styles.planCardPopular]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planCredits}>
                  {plan.credits} credits/month
                </Text>
              </View>
              <Text style={styles.planPrice}>
                {plan.price}
                <Text style={styles.planPeriod}>/mo</Text>
              </Text>
            </View>
            <View style={styles.featuresList}>
              {plan.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            {currentPlan === plan.id ? (
              <View style={styles.currentBtn}>
                <Text style={styles.currentBtnText}>Current Plan</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.upgradeBtn,
                  plan.popular && styles.upgradeBtnPrimary,
                ]}
                onPress={() => handleUpgrade(plan)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? (
                  <ActivityIndicator
                    size="small"
                    color={plan.popular ? "#fff" : "#0284c7"}
                  />
                ) : (
                  <Text
                    style={[
                      styles.upgradeBtnText,
                      plan.popular && styles.upgradeBtnTextPrimary,
                    ]}
                  >
                    {plan.id === "free"
                      ? "Downgrade"
                      : "Upgrade to " + plan.name}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Top-up packs */}
        <Text style={styles.sectionTitle}>Buy Extra Credits</Text>
        <View style={styles.topupGrid}>
          {TOPUP_PACKS.map((pack, i) => (
            <TouchableOpacity
              key={i}
              style={styles.topupCard}
              onPress={() => handleTopUp(pack)}
            >
              <Ionicons name="flash" size={24} color="#f59e0b" />
              <Text style={styles.topupCredits}>{pack.credits}</Text>
              <Text style={styles.topupLabel}>{pack.label}</Text>
              <Text style={styles.topupPrice}>{pack.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.note}>
          Billing is managed securely via Stripe. Credits never expire and roll
          over monthly on paid plans.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  currentBanner: {
    margin: 16,
    backgroundColor: "#0284c7",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currentLabel: {
    color: "#bae6fd",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  currentPlan: { color: "#fff", fontSize: 22, fontWeight: "800" },
  creditsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  creditsText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  planCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  planCardPopular: { borderColor: "#0284c7" },
  popularBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  popularText: { color: "#0284c7", fontSize: 11, fontWeight: "700" },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  planName: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  planCredits: { fontSize: 13, color: "#64748b", marginTop: 2 },
  planPrice: { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  planPeriod: { fontSize: 14, fontWeight: "400", color: "#94a3b8" },
  featuresList: { gap: 8, marginBottom: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 14, color: "#475569" },
  currentBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  currentBtnText: { color: "#64748b", fontWeight: "700", fontSize: 15 },
  upgradeBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#0284c7",
    alignItems: "center",
  },
  upgradeBtnPrimary: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  upgradeBtnText: { color: "#0284c7", fontWeight: "700", fontSize: 15 },
  upgradeBtnTextPrimary: { color: "#fff" },
  topupGrid: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  topupCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  topupCredits: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  topupLabel: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  topupPrice: { fontSize: 16, fontWeight: "700", color: "#0284c7" },
  note: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 32,
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
  },
});
