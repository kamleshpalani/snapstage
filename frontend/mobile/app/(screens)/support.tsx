import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const FAQ = [
  {
    q: "How many stagings do I get per month?",
    a: "Free plan: 3, Pro: 50, Agency: 200. Credits reset monthly on your billing date.",
  },
  {
    q: "How long does staging take?",
    a: "Typically 20–60 seconds depending on image size and server load. You'll be notified when done.",
  },
  {
    q: "What image formats are supported?",
    a: "JPEG, PNG, and HEIC images up to 20MB. For best results, use well-lit photos at 1024×768 or higher.",
  },
  {
    q: "Can I undo or redo a staging?",
    a: "You can view the original and staged side-by-side. Each staging uses 1 credit, so re-generating costs another credit.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Visit the Billing page and select the Free plan, or email us at support@snapstage.io.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your images are stored securely and never shared or used to train AI models without your consent.",
  },
];

export default function SupportScreen() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    // In production: POST to support API or email service
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setMessage("");
    Alert.alert("Message Sent", "We'll get back to you within 24 hours.");
  };

  return (
    <>
      <Stack.Screen
        options={{ title: "Help & Support", headerBackTitle: "Back" }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.quickLinks}>
          <QuickLink
            icon="mail-outline"
            label="Email Support"
            sub="support@snapstage.io"
            onPress={() => Linking.openURL("mailto:support@snapstage.io")}
          />
          <QuickLink
            icon="chatbubble-outline"
            label="Live Chat"
            sub="Available 9am–6pm UTC"
            onPress={() => Linking.openURL("https://snapstage.io/chat")}
          />
          <QuickLink
            icon="document-text-outline"
            label="Documentation"
            sub="Guides & tutorials"
            onPress={() => Linking.openURL("https://snapstage.io/docs")}
          />
        </View>

        {/* Send Message */}
        <Text style={styles.sectionTitle}>Send a Message</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue or question…"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSend}
            disabled={sending || !message.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.sendBtnText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqItem}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ}>{item.q}</Text>
              <Ionicons
                name={expanded === i ? "chevron-up" : "chevron-down"}
                size={18}
                color="#94a3b8"
              />
            </View>
            {expanded === i && <Text style={styles.faqA}>{item.a}</Text>}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

function QuickLink({
  icon,
  label,
  sub,
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quickLinkItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickLinkIcon}>
        <Ionicons name={icon as any} size={22} color="#0284c7" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.quickLinkLabel}>{label}</Text>
        <Text style={styles.quickLinkSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  quickLinks: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  quickLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#dbeafe",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLinkLabel: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  quickLinkSub: { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  card: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  messageInput: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 12,
    backgroundColor: "#f8fafc",
  },
  sendBtn: {
    backgroundColor: "#0284c7",
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  faqItem: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 22,
  },
  faqA: { marginTop: 10, fontSize: 14, color: "#475569", lineHeight: 22 },
});
