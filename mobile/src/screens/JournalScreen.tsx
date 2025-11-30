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
import { useTheme } from "../contexts/ThemeContext";

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
  const { colors, isDark } = useTheme();
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

  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [mediaMeta, setMediaMeta] = useState<{
    kind: MediaKind;
    fileName: string;
  } | null>(null);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

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

  const changeMediaType = (type: "text" | "audio" | "file") => {
    setSelectedMediaType(type);
    setMediaUrl(undefined);
    setMediaMeta(null);
    setRecording(null);
    setIsRecording(false);
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Write text, record audio or add media. All in one place.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.newEntryButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          onPress={() => setShowNewEntry(!showNewEntry)}
          activeOpacity={0.8}
        >
          <Text style={[styles.newEntryButtonText, { color: colors.text }]}>
            {showNewEntry ? "− Cancel" : "+ New Entry"}
          </Text>
        </TouchableOpacity>

        {showNewEntry && (
          <View style={[styles.newEntryForm, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              placeholder="Entry title"
              placeholderTextColor={colors.inputPlaceholder}
              value={newEntry.title}
              onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
            />

            <Text style={[styles.formLabel, { color: colors.text }]}>Date</Text>
            <View style={[styles.dateDisplay, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Text style={[styles.dateText, { color: colors.inputText }]}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>

            <Text style={[styles.formLabel, { color: colors.text }]}>Tags (comma-separated)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              placeholder="wellness, mindfulness, goals"
              placeholderTextColor={colors.inputPlaceholder}
              value={newEntry.tags}
              onChangeText={(text) => setNewEntry({ ...newEntry, tags: text })}
            />

            <Text style={[styles.formLabel, { color: colors.text }]}>Media / File (optional)</Text>
            <View style={styles.mediaTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.mediaTypeButton,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                  selectedMediaType === "text" && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}
                onPress={() => changeMediaType("text")}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    { color: colors.textSecondary },
                    selectedMediaType === "text" && { color: colors.text, fontWeight: "600" },
                  ]}
                >
                  Text
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mediaTypeButton,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                  selectedMediaType === "audio" && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}
                onPress={() => changeMediaType("audio")}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    { color: colors.textSecondary },
                    selectedMediaType === "audio" && { color: colors.text, fontWeight: "600" },
                  ]}
                >
                  Audio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mediaTypeButton,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                  selectedMediaType === "file" && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}
                onPress={() => changeMediaType("file")}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    { color: colors.textSecondary },
                    selectedMediaType === "file" && { color: colors.text, fontWeight: "600" },
                  ]}
                >
                  Media / File
                </Text>
              </TouchableOpacity>
            </View>

            {selectedMediaType === "text" && (
              <>
                <Text style={[styles.formLabel, { color: colors.text }]}>Content (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholder="Write your thoughts..."
                  placeholderTextColor={colors.inputPlaceholder}
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
                  style={[styles.uploadButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <Text style={styles.uploadButtonIcon}>
                    {isRecording ? "⏹️" : "🎤"}
                  </Text>
                  <Text style={[styles.uploadButtonText, { color: colors.textSecondary }]}>
                    {isRecording
                      ? "Tap to stop & attach"
                      : "Tap to start recording"}
                  </Text>
                </TouchableOpacity>
                {mediaUrl && !isRecording && (
                  <Text style={[styles.attachedText, { color: colors.success }]}>
                    Audio attached ✔ {mediaMeta?.fileName ?? ""}
                  </Text>
                )}
              </View>
            )}

            {selectedMediaType === "file" && (
              <View>
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                  onPress={pickFileFromLibrary}
                >
                  <Text style={styles.uploadButtonIcon}>📎</Text>
                  <Text style={[styles.uploadButtonText, { color: colors.textSecondary }]}>
                    Choose from gallery/files
                  </Text>
                </TouchableOpacity>
                {mediaUrl && (
                  <Text style={[styles.attachedText, { color: colors.success }]}>
                    File attached ✔ {mediaMeta?.fileName ?? ""}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateEntry}
            >
              <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>+ Add</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.entriesSection}>
          <View style={styles.entriesHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Entries</Text>
              <Text style={[styles.entriesCount, { color: colors.textSecondary }]}>
                {filteredEntries.length} shown • {entries.length} total
              </Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={[styles.searchBox, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Image
                source={require("../../assets/search.png")}
                style={styles.searchIcon}
                resizeMode="contain"
              />
              <TextInput
                style={[styles.searchInput, { color: colors.inputText }]}
                placeholder="Search (title, text, tags, file name)"
                placeholderTextColor={colors.inputPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity
              style={[styles.tagsButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleShowTags}
              activeOpacity={0.8}
            >
              <Text style={[styles.tagsButtonText, { color: colors.text }]}>Tags</Text>
              <Text style={[styles.tagsButtonCount, { color: colors.text }]}>{tagCount}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filter by type</Text>
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
                    { borderColor: colors.cardBorder, backgroundColor: colors.cardBackground },
                    selectedFilter === chip.key && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedFilter(chip.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: colors.textSecondary },
                      selectedFilter === chip.key && { color: colors.textInverse, fontWeight: "600" },
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {filteredEntries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surfaceSecondary, borderColor: colors.cardBorder }]}>
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
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
                    { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    isExpanded && { borderColor: colors.primary },
                  ]}
                  activeOpacity={0.9}
                  onPress={() => onPressEntry(entry.id)}
                >
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTitleBlock}>
                      <Text style={[styles.entryTitle, { color: colors.text }]}>{entry.title}</Text>
                      <Text style={[styles.entryMetaType, { color: colors.textSecondary }]}>
                        {entry.mediaType === "audio"
                          ? "Audio"
                          : entry.mediaType === "file"
                            ? "Media"
                            : "Text"}
                      </Text>
                    </View>
                    <Text style={[styles.entryDate, { color: colors.textMuted }]}>
                      {formatDate(entry.date)}
                    </Text>
                  </View>

                  {entry.mediaType === "text" && entry.content && (
                    <Text
                      style={[styles.entryContent, { color: colors.textSecondary }]}
                      numberOfLines={isExpanded ? undefined : 3}
                    >
                      {entry.content}
                    </Text>
                  )}

                  {entry.mediaKind === "audio" && entry.mediaUrl && (
                    <View style={styles.audioPreview}>
                      <Text style={[styles.entrySectionLabel, { color: colors.textSecondary }]}>Media</Text>
                      <View style={styles.audioBarRow}>
                        <TouchableOpacity
                          onPress={() => togglePlayAudio(entry)}
                          style={[styles.audioPlayButton, { backgroundColor: colors.backgroundSecondary }]}
                        >
                          <Text style={[styles.audioPlayIcon, { color: colors.text }]}>
                            {playingEntryId === entry.id ? "⏸" : "▶"}
                          </Text>
                        </TouchableOpacity>
                        <View style={[styles.audioProgressBar, { backgroundColor: colors.backgroundSecondary }]}>
                          <View
                            style={[
                              styles.audioProgressFill,
                              { backgroundColor: colors.border },
                              playingEntryId === entry.id && { backgroundColor: colors.primary },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={[styles.audioFileName, { color: colors.textSecondary }]}>
                        {entry.fileName || "Audio recording"}
                      </Text>
                    </View>
                  )}

                  {entry.mediaType === "file" && entry.mediaUrl && (
                    <View style={styles.filePreview}>
                      <Text style={[styles.entrySectionLabel, { color: colors.textSecondary }]}>Media</Text>
                      {entry.mediaKind === "image" ? (
                        <Image
                          source={{ uri: entry.mediaUrl }}
                          style={[
                            styles.imagePreview,
                            { backgroundColor: colors.backgroundSecondary },
                            isExpanded && styles.imagePreviewExpanded,
                          ]}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.mediaIndicator, { backgroundColor: colors.backgroundSecondary }]}>
                          <Text style={styles.mediaIcon}>
                            {entry.mediaKind === "video" ? "🎬" : "📄"}
                          </Text>
                          <Text style={[styles.mediaText, { color: colors.textSecondary }]}>
                            {entry.fileName || "Attachment"}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {entry.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {entry.tags.map((tag, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={[styles.entryExpandHint, { color: colors.textMuted }]}>
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },

  header: { marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14 },

  newEntryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  newEntryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  newEntryForm: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: { height: 120, paddingTop: 12 },

  dateDisplay: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  dateText: { fontSize: 15 },

  mediaTypeContainer: { flexDirection: "row", gap: 8, marginBottom: 16 },
  mediaTypeButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  mediaTypeButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },

  uploadButton: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 8,
  },
  uploadButtonIcon: { fontSize: 32, marginBottom: 8 },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  attachedText: {
    fontSize: 12,
    marginBottom: 16,
  },

  saveButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
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
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  entriesCount: { fontSize: 12, marginTop: 2 },

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
    borderRadius: 999,
    paddingHorizontal: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  searchIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
  },

  tagsButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagsButtonText: {
    fontSize: 13,
    fontWeight: "500",
    marginRight: 4,
  },
  tagsButtonCount: {
    fontSize: 13,
    fontWeight: "600",
  },

  filterSection: { marginBottom: 16, marginTop: 4 },
  filterLabel: { fontSize: 12, marginBottom: 8 },
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
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
  },

  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 8,
  },
  emptyTitle: { fontSize: 14, textAlign: "center" },

  entryCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  entryCardExpanded: {
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
  },
  entryMetaType: {
    marginTop: 2,
    fontSize: 11,
  },
  entryDate: { fontSize: 12 },

  entryContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    marginTop: 4,
  },

  entrySectionLabel: {
    fontSize: 13,
    fontWeight: "600",
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
    marginRight: 8,
  },
  audioPlayIcon: { fontSize: 16 },
  audioProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  audioProgressFill: {
    width: "30%",
    height: "100%",
  },
  audioFileName: {
    fontSize: 12,
  },

  filePreview: { marginTop: 4 },
  imagePreview: {
    width: "100%",
    height: 160,
    borderRadius: 10,
  },
  imagePreviewExpanded: {
    height: 220,
  },

  mediaIndicator: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  mediaIcon: { fontSize: 16, marginRight: 8 },
  mediaText: { fontSize: 13, fontWeight: "500" },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { fontSize: 11, fontWeight: "500" },

  entryExpandHint: {
    marginTop: 6,
    fontSize: 11,
  },
});
