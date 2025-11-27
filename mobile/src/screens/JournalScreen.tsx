import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";

type MediaKind = "image" | "video" | "audio" | "other";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  mediaType?: "text" | "audio" | "file";
  mediaUrl?: string;
  mediaKind?: MediaKind;
  fileName?: string;
}

type FilterType = "all" | "text" | "audio" | "media";

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<
    "text" | "audio" | "file"
  >("text");
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    tags: "",
  });

  // media upload / record için
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [mediaMeta, setMediaMeta] = useState<{
    kind: MediaKind;
    fileName: string;
  } | null>(null);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // audio playback için
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);

  // liste filtreleme ve detay açma
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // ARAMA (başlık, metin, etiket, dosya adı)
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleCreateEntry = () => {
    if (!newEntry.title.trim()) {
      Alert.alert("Error", "Please fill in title");
      return;
    }
    if (selectedMediaType === "text" && !newEntry.content.trim()) {
      Alert.alert("Error", "Please fill in content");
      return;
    }

    const entry: JournalEntry = {
      id: Date.now().toString(),
      title: newEntry.title,
      content: newEntry.content,
      date: new Date().toISOString(),
      tags: newEntry.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      mediaType: selectedMediaType,
      mediaUrl,
      mediaKind: mediaMeta?.kind,
      fileName: mediaMeta?.fileName,
    };

    setEntries([entry, ...entries]);
    setNewEntry({ title: "", content: "", tags: "" });
    setShowNewEntry(false);
    setSelectedMediaType("text");
    setMediaUrl(undefined);
    setMediaMeta(null);
    setRecording(null);
    setIsRecording(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ---------- AUDIO KAYIT ----------
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please enable microphone access in settings.",
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setMediaUrl(uri || undefined);
      setMediaMeta({
        kind: "audio",
        fileName: "Audio recording",
      });
      setRecording(null);
      setIsRecording(false);
      Alert.alert("Audio attached", "Your recording has been attached.");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Error", "Could not stop recording.");
    }
  };

  // ---------- DOSYA / GALERİ SEÇİMİ ----------
  const pickFileFromLibrary = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to your media library.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let kind: MediaKind = "other";
        if (asset.type === "image") kind = "image";
        else if (asset.type === "video") kind = "video";

        setMediaUrl(asset.uri);
        setMediaMeta({
          kind,
          fileName: asset.fileName || "Selected file",
        });
        Alert.alert("File attached", "Media has been attached to this entry.");
      }
    } catch (error) {
      console.error("Failed to pick file:", error);
      Alert.alert("Error", "Could not open media library.");
    }
  };

  // media tipini değiştirirken eski uri'ı temizle
  const changeMediaType = (type: "text" | "audio" | "file") => {
    setSelectedMediaType(type);
    setMediaUrl(undefined);
    setMediaMeta(null);
    setRecording(null);
    setIsRecording(false);
  };

  // ---------- AUDIO PLAYBACK ----------
  const togglePlayAudio = async (entry: JournalEntry) => {
    if (!entry.mediaUrl) return;

    try {
      if (playingEntryId === entry.id && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingEntryId(null);
        return;
      }

      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: entry.mediaUrl },
        { shouldPlay: true },
      );
      setSound(newSound);
      setPlayingEntryId(entry.id);
    } catch (error) {
      console.error("Error playing audio", error);
      Alert.alert("Error", "Could not play audio.");
    }
  };

  // TÜM ETİKETLER (Etiketler butonu için)
  const allTags = Array.from(
    new Set(
      entries.flatMap((e) => e.tags.map((t) => t.trim()).filter(Boolean)),
    ),
  );
  const tagCount = allTags.length;

  const handleShowTags = () => {
    if (tagCount === 0) {
      Alert.alert("Tags", "No tags yet.");
      return;
    }
    Alert.alert("Tags", allTags.join(", "));
  };

  // ---------- LİSTE FİLTRESİ + ARAMA ----------
  const getFilteredEntries = () => {
    let list = entries;

    switch (selectedFilter) {
      case "text":
        list = list.filter((e) => e.mediaType === "text");
        break;
      case "audio":
        list = list.filter(
          (e) => e.mediaType === "audio" || e.mediaKind === "audio",
        );
        break;
      case "media":
        list = list.filter((e) => e.mediaType === "file");
        break;
      default:
        break;
    }

    if (searchQuery.trim().length === 0) {
      return list;
    }

    const q = searchQuery.toLowerCase();
    return list.filter((e) => {
      const inTitle = e.title.toLowerCase().includes(q);
      const inContent = (e.content || "").toLowerCase().includes(q);
      const inTags = e.tags.join(" ").toLowerCase().includes(q);
      const inFileName = (e.fileName || "").toLowerCase().includes(q);
      return inTitle || inContent || inTags || inFileName;
    });
  };

  const filteredEntries = getFilteredEntries();

  const onPressEntry = (entryId: string) => {
    setExpandedEntryId((prev) => (prev === entryId ? null : entryId));
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            Write text, record audio or add media. All in one place.
          </Text>
        </View>

        {/* YENİ GİRİŞ BUTONU */}
        <TouchableOpacity
          style={styles.newEntryButton}
          onPress={() => setShowNewEntry(!showNewEntry)}
          activeOpacity={0.8}
        >
          <Text style={styles.newEntryButtonText}>
            {showNewEntry ? "− Cancel" : "+ New Entry"}
          </Text>
        </TouchableOpacity>

        {/* YENİ GİRİŞ FORMU */}
        {showNewEntry && (
          <View style={styles.newEntryForm}>
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Entry title"
              placeholderTextColor="#94a3b8"
              value={newEntry.title}
              onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
            />

            <Text style={styles.formLabel}>Date</Text>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>

            <Text style={styles.formLabel}>Tags (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="wellness, mindfulness, goals"
              placeholderTextColor="#94a3b8"
              value={newEntry.tags}
              onChangeText={(text) => setNewEntry({ ...newEntry, tags: text })}
            />

            <Text style={styles.formLabel}>Media / File (optional)</Text>
            <View style={styles.mediaTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.mediaTypeButton,
                  selectedMediaType === "text" && styles.mediaTypeButtonActive,
                ]}
                onPress={() => changeMediaType("text")}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    selectedMediaType === "text" &&
                      styles.mediaTypeButtonTextActive,
                  ]}
                >
                  Text
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mediaTypeButton,
                  selectedMediaType === "audio" && styles.mediaTypeButtonActive,
                ]}
                onPress={() => changeMediaType("audio")}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    selectedMediaType === "audio" &&
                      styles.mediaTypeButtonTextActive,
                  ]}
                >
                  Audio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mediaTypeButton,
                  selectedMediaType === "file" && styles.mediaTypeButtonActive,
                ]}
                onPress={() => changeMediaType("file")}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    selectedMediaType === "file" &&
                      styles.mediaTypeButtonTextActive,
                  ]}
                >
                  Media / File
                </Text>
              </TouchableOpacity>
            </View>

            {selectedMediaType === "text" && (
              <>
                <Text style={styles.formLabel}>Content (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write your thoughts..."
                  placeholderTextColor="#94a3b8"
                  value={newEntry.content}
                  onChangeText={(text) =>
                    setNewEntry({ ...newEntry, content: text })
                  }
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </>
            )}

            {selectedMediaType === "audio" && (
              <View>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <Text style={styles.uploadButtonIcon}>
                    {isRecording ? "⏹️" : "🎤"}
                  </Text>
                  <Text style={styles.uploadButtonText}>
                    {isRecording
                      ? "Tap to stop & attach"
                      : "Tap to start recording"}
                  </Text>
                </TouchableOpacity>
                {mediaUrl && !isRecording && (
                  <Text style={styles.attachedText}>
                    Audio attached ✔ {mediaMeta?.fileName ?? ""}
                  </Text>
                )}
              </View>
            )}

            {selectedMediaType === "file" && (
              <View>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickFileFromLibrary}
                >
                  <Text style={styles.uploadButtonIcon}>📎</Text>
                  <Text style={styles.uploadButtonText}>
                    Choose from gallery/files
                  </Text>
                </TouchableOpacity>
                {mediaUrl && (
                  <Text style={styles.attachedText}>
                    File attached ✔ {mediaMeta?.fileName ?? ""}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleCreateEntry}
            >
              <Text style={styles.saveButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ENTRIES BAŞLIĞI */}
        <View style={styles.entriesSection}>
          <View style={styles.entriesHeader}>
            <View>
              <Text style={styles.sectionTitle}>Entries</Text>
              <Text style={styles.entriesCount}>
                {filteredEntries.length} shown • {entries.length} total
              </Text>
            </View>
          </View>

          {/* ARAMA + ETİKETLER (webdeki gibi satır) */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search (title, text, tags, file name)"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity
              style={styles.tagsButton}
              onPress={handleShowTags}
              activeOpacity={0.8}
            >
              <Text style={styles.tagsButtonText}>Tags</Text>
              <Text style={styles.tagsButtonCount}>{tagCount}</Text>
            </TouchableOpacity>
          </View>

          {/* TÜR FİLTRESİ */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter by type</Text>
            <View style={styles.filterChipsRow}>
              {(
                [
                  { key: "all", label: "All entries" },
                  { key: "text", label: "Text" },
                  { key: "audio", label: "Audio" },
                  { key: "media", label: "Media" },
                ] as { key: FilterType; label: string }[]
              ).map((chip) => (
                <TouchableOpacity
                  key={chip.key}
                  style={[
                    styles.filterChip,
                    selectedFilter === chip.key && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter(chip.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === chip.key &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ENTRIES LİSTESİ */}
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                No entries found for this filter.
              </Text>
            </View>
          ) : (
            filteredEntries.map((entry) => {
              const isExpanded = expandedEntryId === entry.id;

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.entryCard,
                    isExpanded && styles.entryCardExpanded,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => onPressEntry(entry.id)}
                >
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTitleBlock}>
                      <Text style={styles.entryTitle}>{entry.title}</Text>
                      <Text style={styles.entryMetaType}>
                        {entry.mediaType === "audio"
                          ? "Audio"
                          : entry.mediaType === "file"
                            ? "Media"
                            : "Text"}
                      </Text>
                    </View>
                    <Text style={styles.entryDate}>
                      {formatDate(entry.date)}
                    </Text>
                  </View>

                  {/* TEXT ÖN İZLEME / DETAY */}
                  {entry.mediaType === "text" && entry.content && (
                    <Text
                      style={styles.entryContent}
                      numberOfLines={isExpanded ? undefined : 3}
                    >
                      {entry.content}
                    </Text>
                  )}

                  {/* AUDIO PREVIEW */}
                  {entry.mediaKind === "audio" && entry.mediaUrl && (
                    <View style={styles.audioPreview}>
                      <Text style={styles.entrySectionLabel}>Media</Text>
                      <View style={styles.audioBarRow}>
                        <TouchableOpacity
                          onPress={() => togglePlayAudio(entry)}
                          style={styles.audioPlayButton}
                        >
                          <Text style={styles.audioPlayIcon}>
                            {playingEntryId === entry.id ? "⏸" : "▶"}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.audioProgressBar}>
                          <View
                            style={[
                              styles.audioProgressFill,
                              playingEntryId === entry.id &&
                                styles.audioProgressFillActive,
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.audioFileName}>
                        {entry.fileName || "Audio recording"}
                      </Text>
                    </View>
                  )}

                  {/* RESİM / DİĞER MEDYA PREVIEW */}
                  {entry.mediaType === "file" && entry.mediaUrl && (
                    <View style={styles.filePreview}>
                      <Text style={styles.entrySectionLabel}>Media</Text>
                      {entry.mediaKind === "image" ? (
                        <Image
                          source={{ uri: entry.mediaUrl }}
                          style={[
                            styles.imagePreview,
                            isExpanded && styles.imagePreviewExpanded,
                          ]}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.mediaIndicator}>
                          <Text style={styles.mediaIcon}>
                            {entry.mediaKind === "video" ? "🎬" : "📄"}
                          </Text>
                          <Text style={styles.mediaText}>
                            {entry.fileName || "Attachment"}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* TAGLER */}
                  {entry.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {entry.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.entryExpandHint}>
                    {isExpanded ? "Tap to collapse" : "Tap to view details"}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },

  header: { marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: "#6b7280" },

  newEntryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  newEntryButtonText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },

  newEntryForm: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1f2937",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: { height: 120, paddingTop: 12 },

  dateDisplay: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dateText: { fontSize: 15, color: "#1f2937" },

  mediaTypeContainer: { flexDirection: "row", gap: 8, marginBottom: 16 },
  mediaTypeButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mediaTypeButtonActive: {
    backgroundColor: "#e0e7ff",
    borderColor: "#4f46e5",
  },
  mediaTypeButtonText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  mediaTypeButtonTextActive: { color: "#111827", fontWeight: "600" },

  uploadButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    marginBottom: 8,
  },
  uploadButtonIcon: { fontSize: 32, marginBottom: 8 },
  uploadButtonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  attachedText: {
    fontSize: 12,
    color: "#16a34a",
    marginBottom: 16,
  },

  saveButton: {
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },

  entriesSection: { marginTop: 4 },
  entriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  entriesCount: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  /* Search + Tags row */
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
  },
  searchIcon: { fontSize: 16, color: "#9ca3af", marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
    color: "#111827",
  },
  tagsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagsButtonText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
    marginRight: 4,
  },
  tagsButtonCount: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },

  filterSection: { marginBottom: 16, marginTop: 4 },
  filterLabel: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  filterChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  filterChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  filterChipText: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },

  emptyState: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 8,
  },
  emptyTitle: { fontSize: 14, color: "#6b7280", textAlign: "center" },

  entryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  entryCardExpanded: {
    borderColor: "#4f46e5",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  entryTitleBlock: { flexDirection: "column", flex: 1 },
  entryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  entryMetaType: {
    marginTop: 2,
    fontSize: 11,
    color: "#6b7280",
  },
  entryDate: { fontSize: 12, color: "#9ca3af" },

  entryContent: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 8,
    marginTop: 4,
  },

  entrySectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 8,
    marginTop: 4,
  },

  audioPreview: { marginTop: 4, marginBottom: 8 },
  audioBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  audioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
    marginRight: 8,
  },
  audioPlayIcon: { fontSize: 16, color: "#111827" },
  audioProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  audioProgressFill: {
    width: "30%",
    height: "100%",
    backgroundColor: "#cbd5e1",
  },
  audioProgressFillActive: {
    backgroundColor: "#4f46e5",
  },
  audioFileName: {
    fontSize: 12,
    color: "#6b7280",
  },

  filePreview: { marginTop: 4 },
  imagePreview: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
  },
  imagePreviewExpanded: {
    height: 220,
  },

  mediaIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  mediaIcon: { fontSize: 16, marginRight: 8 },
  mediaText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { fontSize: 11, color: "#1d4ed8", fontWeight: "500" },

  entryExpandHint: {
    marginTop: 6,
    fontSize: 11,
    color: "#9ca3af",
  },
});
