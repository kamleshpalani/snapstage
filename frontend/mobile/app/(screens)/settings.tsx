import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleSaveName = async () => {
    if (!fullName.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", user!.id);
    setSavingName(false);
    if (error) Alert.alert("Error", "Failed to update name.");
    else Alert.alert("Saved", "Your name has been updated.");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert("Too Short", "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) Alert.alert("Error", error.message);
    else {
      Alert.alert("Success", "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is irreversible. All your projects and data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Contact Support",
              "Please email support@snapstage.io to delete your account.",
            ),
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Settings", headerBackTitle: "Back" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Info */}
          <SectionHeader title="Account Info" />
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.staticValue}>{user?.email}</Text>
          </View>

          {/* Display Name */}
          <SectionHeader title="Display Name" />
          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveName}
              disabled={savingName}
            >
              {savingName ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Name</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Change Password */}
          <SectionHeader title="Change Password" />
          <View style={styles.card}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min 8 characters"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />
            <Text style={[styles.label, { marginTop: 12 }]}>
              Confirm Password
            </Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Notifications (placeholder) */}
          <SectionHeader title="Notifications" />
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingTitle}>Staging Complete</Text>
                <Text style={styles.settingSubtitle}>
                  Get notified when your room is ready
                </Text>
              </View>
              <Ionicons name="toggle" size={32} color="#0284c7" />
            </View>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View>
                <Text style={styles.settingTitle}>Low Credits Alert</Text>
                <Text style={styles.settingSubtitle}>
                  Reminder when credits fall below 3
                </Text>
              </View>
              <Ionicons name="toggle" size={32} color="#0284c7" />
            </View>
          </View>

          {/* Danger Zone */}
          <SectionHeader title="Danger Zone" />
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={styles.deleteBtnText}>Delete My Account</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  label: { fontSize: 13, color: "#64748b", fontWeight: "600", marginBottom: 6 },
  staticValue: { fontSize: 15, color: "#0f172a", fontWeight: "500" },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  saveBtn: {
    marginTop: 14,
    backgroundColor: "#0284c7",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  settingTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  settingSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  deleteBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 15 },
});
