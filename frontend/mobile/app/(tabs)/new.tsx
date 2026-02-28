import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Colors } from "@/lib/colors";

const STYLES = [
  { id: "modern", label: "Modern", emoji: "🏙️" },
  { id: "scandinavian", label: "Scandi", emoji: "🌿" },
  { id: "luxury", label: "Luxury", emoji: "✨" },
  { id: "coastal", label: "Coastal", emoji: "🌊" },
  { id: "industrial", label: "Industrial", emoji: "⚙️" },
  { id: "traditional", label: "Classic", emoji: "🏡" },
];

export default function NewStagingScreen() {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.9,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleGenerate = async () => {
    if (!imageUri || !user) return;
    setLoading(true);

    try {
      // Upload image to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "room.jpg",
        type: "image/jpeg",
      } as any);

      const { error: uploadError } = await supabase.storage
        .from("room-images")
        .upload(fileName, formData, { contentType: "multipart/form-data" });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("room-images").getPublicUrl(fileName);

      // Create project
      const { data: project, error: dbError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name:
            projectName || `Room Staging ${new Date().toLocaleDateString()}`,
          original_image_url: publicUrl,
          style: selectedStyle,
          status: "pending",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Trigger AI via API
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      await fetch(`${apiUrl}/staging/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          imageUrl: publicUrl,
          style: selectedStyle,
          userId: user.id,
        }),
      });

      router.push(`/project/${project.id}`);
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Project Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Name</Text>
          <TextInput
            style={styles.input}
            value={projectName}
            onChangeText={setProjectName}
            placeholder="e.g. Living Room — 123 Main St"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Photo</Text>
          {imageUri ? (
            <View>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={pickImage}
              >
                <Text style={styles.changeImageText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.uploadOption} onPress={pickImage}>
                <Ionicons
                  name="images-outline"
                  size={28}
                  color={Colors.brand}
                />
                <Text style={styles.uploadOptionText}>Choose from Library</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
                <Ionicons
                  name="camera-outline"
                  size={28}
                  color={Colors.brand}
                />
                <Text style={styles.uploadOptionText}>Take a Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Style Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Design Style</Text>
          <View style={styles.stylesGrid}>
            {STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  selectedStyle === style.id && styles.styleCardSelected,
                ]}
                onPress={() => setSelectedStyle(style.id)}
              >
                <Text style={styles.styleEmoji}>{style.emoji}</Text>
                <Text
                  style={[
                    styles.styleLabel,
                    selectedStyle === style.id && styles.styleLabelSelected,
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            (!imageUri || loading) && styles.disabled,
          ]}
          onPress={handleGenerate}
          disabled={!imageUri || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles-outline" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>
                Generate Staged Room
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.generateNote}>
          Uses 1 credit · Usually 30–90 seconds
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  uploadOptions: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    flexDirection: "row",
    overflow: "hidden",
  },
  uploadOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 8,
  },
  uploadOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  divider: { width: 1, backgroundColor: "#e2e8f0" },
  previewImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  changeImageButton: {
    marginTop: 8,
    alignItems: "center",
    padding: 10,
  },
  changeImageText: { color: Colors.brand, fontWeight: "600", fontSize: 14 },
  stylesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  styleCard: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  styleCardSelected: {
    borderColor: Colors.brand,
    backgroundColor: "#eff6ff",
  },
  styleEmoji: { fontSize: 24 },
  styleLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  styleLabelSelected: { color: Colors.brand },
  generateButton: {
    backgroundColor: Colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 8,
  },
  disabled: { opacity: 0.5 },
  generateButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  generateNote: { textAlign: "center", fontSize: 12, color: "#94a3b8" },
});
