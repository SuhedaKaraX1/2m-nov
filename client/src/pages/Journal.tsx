"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Mic,
  Square,
  Upload,
  Image as ImageIcon,
  Video,
  Music2,
  FileText,
  Download,
  Trash2,
  Edit3,
  Search,
  Tag,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EntryType = "text" | "image" | "video" | "audio" | "file";

type JournalEntry = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  type: EntryType;
  text?: string;
  mediaDataUrl?: string; // data:...;base64,
  mediaMime?: string;
  filename?: string;
  createdAt: number;
  updatedAt: number;
};

const LS_KEY = "journal.media.entries.v1";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [tagsInput, setTagsInput] = useState("");
  const [text, setText] = useState("");

  // File / Media state
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  // Recorder state
  const [recState, setRecState] = useState<"idle" | "recording" | "recorded">(
    "idle",
  );
  const [recPreview, setRecPreview] = useState<string | null>(null); // dataURL
  const [recMime, setRecMime] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<BlobPart[]>([]);
  const recTimerRef = useRef<number | null>(null);
  const [recSeconds, setRecSeconds] = useState(0);

  // -------- Persist --------
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        setEntries(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  }, [entries]);

  // -------- Derived --------
  const allTags = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "tr"));
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) =>
        q
          ? [e.title, e.text ?? "", e.tags.join(" "), e.filename ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true,
      )
      .filter((e) =>
        activeTags.length ? e.tags.some((t) => activeTags.includes(t)) : true,
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [entries, query, activeTags]);

  // -------- File helpers --------
  async function fileToDataURL(file: File): Promise<string> {
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes)
      throw new Error("Dosya 10MB sınırını aşıyor. (Demo depolama)");
    return new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(file);
    });
  }

  function onPickFile(f: File | null) {
    setPickedFile(f);
    if (!f) {
      setPreviewUrl(null);
      setPreviewMime(null);
      setFilename(null);
      return;
    }
    setFilename(f.name);
    setPreviewMime(f.type || "application/octet-stream");

    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  // -------- Recorder --------
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    recChunksRef.current = [];
    setRecSeconds(0);
    setRecPreview(null);
    setRecMime(null);

    mr.ondataavailable = (e) => recChunksRef.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(recChunksRef.current, { type: mr.mimeType });
      const reader = new FileReader();
      reader.onload = () => {
        setRecPreview(reader.result as string);
        setRecMime(mr.mimeType || "audio/webm");
        setRecState("recorded");
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach((t) => t.stop());
      if (recTimerRef.current) {
        window.clearInterval(recTimerRef.current);
        recTimerRef.current = null;
      }
    };

    mr.start();
    setRecState("recording");
    recTimerRef.current = window.setInterval(
      () => setRecSeconds((s) => s + 1),
      1000,
    );
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  // -------- CRUD --------
  function resetForm() {
    setTitle("");
    setDate(new Date().toISOString().slice(0, 10));
    setTagsInput("");
    setText("");
    onPickFile(null);
    setRecState("idle");
    setRecPreview(null);
    setRecMime(null);
    setEditingId(null);
  }

  async function saveEntry() {
    let type: EntryType = "text";
    let mediaDataUrl: string | undefined;
    let mediaMime: string | undefined;
    let fname: string | undefined;

    // Öncelik: kayıtlı ses > seçilen dosya > sadece metin
    if (recState === "recorded" && recPreview) {
      type = "audio";
      mediaDataUrl = recPreview;
      mediaMime = recMime ?? "audio/webm";
      fname = "recording.webm";
    } else if (pickedFile) {
      const mime = previewMime || pickedFile.type || "application/octet-stream";
      mediaMime = mime;
      fname = filename ?? pickedFile.name;

      // MIME'dan tür çıkar
      if (mime.startsWith("image/")) type = "image";
      else if (mime.startsWith("video/")) type = "video";
      else if (mime.startsWith("audio/")) type = "audio";
      else type = "file";

      // Küçük/orta boy dosyaları dataURL olarak sakla (demo)
      mediaDataUrl = await fileToDataURL(pickedFile);
    } else {
      type = "text";
    }

    const base: JournalEntry = {
      id: editingId ?? uid(),
      title: title || (type === "text" ? "Not" : "Medya"),
      date,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      type,
      text: text || undefined,
      mediaDataUrl,
      mediaMime,
      filename: fname,
      createdAt: editingId
        ? entries.find((e) => e.id === editingId)!.createdAt
        : Date.now(),
      updatedAt: Date.now(),
    };

    if (editingId) {
      setEntries((prev) => prev.map((e) => (e.id === editingId ? base : e)));
    } else {
      setEntries((prev) => [base, ...prev]);
    }
    resetForm();
  }

  function editEntry(e: JournalEntry) {
    setEditingId(e.id);
    setTitle(e.title);
    setDate(e.date);
    setTagsInput(e.tags.join(", "));
    setText(e.text ?? "");
    // medya önizlemeyi tekrar doldur
    setPreviewUrl(null);
    setPreviewMime(e.mediaMime ?? null);
    setFilename(e.filename ?? null);
    setRecPreview(e.type === "audio" ? (e.mediaDataUrl ?? null) : null);
    setRecMime(e.type === "audio" ? (e.mediaMime ?? null) : null);
    setRecState(e.type === "audio" ? "recorded" : "idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) resetForm();
  }

  // -------- UI --------
  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#0B0D12] text-white">
      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
            <p className="text-sm text-zinc-400">
              Metin yazın, ses kaydedin veya medya ekleyin. Hepsi tek yerde.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Ara (başlık, metin, etiket, dosya adı)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-72 border-zinc-800 bg-[#0F1218] pl-9 text-sm placeholder:text-zinc-500"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  className="border-zinc-800 bg-[#11141b]"
                >
                  Etiketler
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                {allTags.length ? (
                  allTags.map((t) => (
                    <DropdownMenuItem
                      key={t}
                      onClick={() =>
                        setActiveTags((prev) =>
                          prev.includes(t)
                            ? prev.filter((x) => x !== t)
                            : [...prev, t],
                        )
                      }
                    >
                      <Badge
                        className={`mr-2 border ${
                          activeTags.includes(t)
                            ? "border-teal-400/40 bg-teal-500/10 text-teal-200"
                            : "border-zinc-700 bg-zinc-900 text-zinc-300"
                        }`}
                      >
                        <Tag className="mr-1 h-3 w-3" /> {t}
                      </Badge>
                      {activeTags.includes(t) ? "Filtreleniyor" : "Filtrele"}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-zinc-500">
                    Etiket yok
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {(query || activeTags.length) && (
              <Button
                variant="ghost"
                className="text-zinc-400 hover:text-zinc-100"
                onClick={() => {
                  setQuery("");
                  setActiveTags([]);
                }}
              >
                Sıfırla
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Entries list */}
          <Card className="border-zinc-800 bg-[#0F1218]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-zinc-300">Girdiler</CardTitle>
              <span className="text-xs text-zinc-500">
                {filtered.length} kayıt
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[720px]">
                <div className="divide-y divide-zinc-800">
                  {filtered.length ? (
                    filtered.map((e) => (
                      <article key={e.id} className="p-4 hover:bg-[#0d1117]">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="truncate text-base font-medium">
                            {e.title}
                          </h3>
                          <span className="text-xs text-zinc-500">
                            {new Date(e.date).toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {/* Content preview */}
                        <div className="space-y-3">
                          {e.type === "text" && e.text && (
                            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                              {e.text}
                            </p>
                          )}
                          {e.type === "image" && e.mediaDataUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={e.mediaDataUrl}
                              alt={e.filename ?? "image"}
                              className="max-h-72 w-full rounded-lg object-contain ring-1 ring-zinc-800"
                            />
                          )}
                          {e.type === "video" && e.mediaDataUrl && (
                            <video
                              controls
                              className="max-h-80 w-full rounded-lg ring-1 ring-zinc-800"
                              src={e.mediaDataUrl}
                            />
                          )}
                          {e.type === "audio" && e.mediaDataUrl && (
                            <audio
                              controls
                              className="w-full"
                              src={e.mediaDataUrl}
                            />
                          )}
                          {e.type === "file" && e.mediaDataUrl && (
                            <a
                              download={e.filename ?? "file"}
                              href={e.mediaDataUrl}
                              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                            >
                              <Download className="h-4 w-4" />
                              {e.filename ?? "Dosyayı indir"}
                            </a>
                          )}

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {e.tags.map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="cursor-pointer border border-zinc-700 bg-zinc-900 text-zinc-300"
                                onClick={() =>
                                  setActiveTags((prev) =>
                                    prev.includes(t) ? prev : [...prev, t],
                                  )
                                }
                              >
                                <Tag className="mr-1 h-3 w-3" /> {t}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-zinc-100"
                            onClick={() => editEntry(e)}
                            aria-label="Düzenle"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-200"
                            onClick={() => removeEntry(e.id)}
                            aria-label="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="p-10 text-center text-sm text-zinc-500">
                      Henüz kayıt yok.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Composer */}
          <Card className="border-zinc-800 bg-[#0F1218]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-300">
                <Plus className="h-4 w-4" />
                {editingId ? "Girdiyi Düzenle" : "Yeni Girdi"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Başlık"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-zinc-800 bg-[#0F1218] placeholder:text-zinc-500"
              />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-zinc-800 bg-[#0F1218] text-sm"
              />
              <Input
                placeholder="Etiketler (virgülle ayır)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="border-zinc-800 bg-[#0F1218] placeholder:text-zinc-500"
              />

              {/* TEXT */}
              <Textarea
                placeholder="Metin notunuzu yazın (opsiyonel)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="border-zinc-800 bg-[#0F1218] placeholder:text-zinc-500"
              />

              {/* FILE PICKER */}
              <div className="rounded-lg border border-dashed border-zinc-700 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
                  <Upload className="h-4 w-4" />
                  Medya / Dosya (opsiyonel)
                </div>
                <Input
                  type="file"
                  accept="image/*,video/*,audio/*,application/pdf"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  className="border-zinc-800 bg-[#0F1218] file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:text-white"
                />
                {/* Quick type hints */}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> Görsel
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" /> Video
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Music2 className="h-3.5 w-3.5" /> Ses
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> PDF / Dosya
                  </span>
                </div>

                {/* FILE PREVIEW */}
                {(previewUrl || recPreview) && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-zinc-400">
                      Önizleme {filename ? `- ${filename}` : ""}
                    </div>
                    {recPreview ? (
                      <audio controls src={recPreview} className="w-full" />
                    ) : previewMime?.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl!}
                        alt={filename ?? "preview"}
                        className="max-h-60 w-full rounded-lg object-contain ring-1 ring-zinc-800"
                      />
                    ) : previewMime?.startsWith("video/") ? (
                      <video
                        controls
                        className="max-h-64 w-full rounded-lg ring-1 ring-zinc-800"
                        src={previewUrl!}
                      />
                    ) : previewMime?.startsWith("audio/") ? (
                      <audio controls className="w-full" src={previewUrl!} />
                    ) : previewUrl ? (
                      <a
                        href={previewUrl}
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                      >
                        <Download className="h-4 w-4" />
                        {filename ?? "Dosyayı aç"}
                      </a>
                    ) : null}
                  </div>
                )}
              </div>

              {/* AUDIO RECORDER */}
              <div className="rounded-lg border border-zinc-800 bg-[#0F1218] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Music2 className="h-4 w-4" />
                    Ses Kaydı (opsiyonel)
                  </div>
                  <div className="text-xs tabular-nums text-zinc-500">
                    {recState === "recording" ? `${recSeconds}s` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {recState !== "recording" ? (
                    <Button
                      type="button"
                      onClick={startRecording}
                      variant="secondary"
                      className="gap-2 border-zinc-700 bg-[#11141b]"
                    >
                      <Mic className="h-4 w-4" />
                      Kayda başla
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={stopRecording}
                      className="gap-2 bg-red-600 hover:bg-red-500"
                    >
                      <Square className="h-4 w-4" />
                      Durdur
                    </Button>
                  )}
                  {recPreview && (
                    <audio controls className="ml-2 w-full" src={recPreview} />
                  )}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                  İpucu: Yüklenen veya kaydedilen ses/video/görseller demoda{" "}
                  <b>data URL</b> olarak saklanır (≈10MB sınırı). Üretimde
                  dosyaları sunucuya veya IndexedDB’ye koymanız önerilir.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {editingId && (
                  <Button
                    variant="ghost"
                    onClick={resetForm}
                    className="text-zinc-300 hover:text-zinc-100"
                  >
                    İptal
                  </Button>
                )}
                <Button
                  onClick={saveEntry}
                  className="gap-2 bg-sky-600 hover:bg-sky-500"
                >
                  <Plus className="h-4 w-4" />
                  {editingId ? "Kaydet" : "Ekle"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
