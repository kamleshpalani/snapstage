import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const LAST_UPDATED = "January 15, 2025";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: `By downloading, installing, or using the SnapStage mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not use the App.`,
  },
  {
    title: "2. Description of Service",
    content: `SnapStage provides AI-powered virtual staging for real estate photos. You upload room photographs and our system generates digitally furnished versions using artificial intelligence. Results are for visualization purposes only and do not represent actual physical spaces.`,
  },
  {
    title: "3. Account Registration",
    content: `You must create an account to use most features. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. You must be at least 18 years old to create an account.`,
  },
  {
    title: "4. Credits & Payments",
    content: `- Free plan includes 3 credits per month.\n- Paid plans are billed monthly via Stripe.\n- Credits are non-refundable unless required by law.\n- Credits expire at the end of each billing cycle (except Agency plan).\n- We reserve the right to change pricing with 30 days' notice.`,
  },
  {
    title: "5. Intellectual Property",
    content: `You retain ownership of your original uploaded images. SnapStage retains rights to the AI-generated outputs. You are granted a non-exclusive license to use generated images for commercial real estate purposes. You may not resell or sublicense the generated images as AI training data.`,
  },
  {
    title: "6. Prohibited Uses",
    content: `You agree not to:\n- Upload images containing people, nudity, or illegal content\n- Use the service to generate misleading or fraudulent listings\n- Attempt to reverse-engineer or copy the AI models\n- Use automated scripts to abuse the credits system\n- Violate any applicable laws or regulations`,
  },
  {
    title: "7. Privacy & Data",
    content: `We process your images solely to provide the staging service. Images may be stored temporarily for processing and result delivery. We do not sell your data or use your images to train AI models without explicit consent. See our Privacy Policy for full details.`,
  },
  {
    title: "8. Disclaimer of Warranties",
    content: `The service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, quality, or availability of AI-generated images. Virtual staging results may vary.`,
  },
  {
    title: "9. Limitation of Liability",
    content: `SnapStage shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.`,
  },
  {
    title: "10. Termination",
    content: `We may suspend or terminate your account for violation of these Terms. You may cancel your subscription at any time. Termination does not entitle you to a refund of unused credits.`,
  },
  {
    title: "11. Changes to Terms",
    content: `We may update these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms. We will notify you of significant changes via email.`,
  },
  {
    title: "12. Contact",
    content: `For questions about these Terms, contact us at legal@snapstage.io`,
  },
];

export default function TermsScreen() {
  return (
    <>
      <Stack.Screen
        options={{ title: "Terms of Service", headerBackTitle: "Back" }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="document-text" size={40} color="#0284c7" />
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            By using SnapStage, you agree to these terms. We've written them in
            plain language where possible.
          </Text>
        </View>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Questions? Email us at</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:legal@snapstage.io")}
          >
            <Text style={styles.footerLink}>legal@snapstage.io</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { alignItems: "center", paddingVertical: 28, gap: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  updated: { fontSize: 13, color: "#94a3b8" },
  summary: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#dbeafe",
    borderRadius: 14,
    padding: 16,
  },
  summaryText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 22,
    fontWeight: "500",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  sectionContent: { fontSize: 14, color: "#475569", lineHeight: 22 },
  footer: { alignItems: "center", gap: 4, marginTop: 8 },
  footerText: { fontSize: 14, color: "#94a3b8" },
  footerLink: { fontSize: 14, color: "#0284c7", fontWeight: "600" },
});
