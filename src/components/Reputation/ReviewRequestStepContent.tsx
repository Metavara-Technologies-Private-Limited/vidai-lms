import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type MouseEvent,
} from "react";
import type { JSX } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
  Typography,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatIndentDecreaseIcon from "@mui/icons-material/FormatIndentDecrease";
import FormatIndentIncreaseIcon from "@mui/icons-material/FormatIndentIncrease";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import LinkIcon from "@mui/icons-material/Link";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AddToDriveIcon from "@mui/icons-material/AddToDrive";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import AddIcon from "@mui/icons-material/Add";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AI_Suggest, { type AiSuggestionItem } from "./AI_Suggest";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Link as TiptapLink } from "@tiptap/extension-link";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import {
  getMessageCharacterCount,
  REVIEW_REQUEST_BODY_MAX_LENGTH,
  REVIEW_REQUEST_SUBJECT_MAX_LENGTH,
  type ReviewRequestFormData,
} from "./reviewRequest.utils";
import ReviewRequestTemplateDialog, {
  type TemplateListItem,
} from "./ReviewRequestTemplateDialog";
import { useSelector } from "react-redux";
import axios from "axios";

// ─── WhatsApp template type ───────────────────────────────────────────────────
type WhatsAppTemplateItem = {
  id: string;
  name: string;
  body: string;
  is_active: boolean;
};

// ─── Extract {{1}}, {{2}} placeholders from template body ────────────────────
const extractPlaceholders = (body: string): number[] => {
  const matches = body.match(/\{\{(\d+)\}\}/g) || [];
  const indices = matches.map((m) => parseInt(m.replace(/[{}]/g, ""), 10));
  return [...new Set(indices)].sort((a, b) => a - b);
};

// ─── Build preview by substituting variable values ───────────────────────────
const buildPreview = (body: string, values: Record<number, string>): string => {
  let result = body;
  Object.entries(values).forEach(([idx, val]) => {
    result = result.replace(
      new RegExp(`\\{\\{${idx}\\}\\}`, "g"),
      val || `{{${idx}}}`,
    );
  });
  return result;
};

type ReviewRequestStepContentProps = {
  formData: ReviewRequestFormData;
  fileName: string;
  attachmentFiles: File[];
  coralRadio: Record<string, unknown>;
  onModeChange: (value: "email" | "sms" | "whatsapp") => void;
  onFromEmailChange: (value: string) => void;
  onCcChange: (value: string[]) => void;
  onBccChange: (value: string[]) => void;
  onSubjectChange: (value: string) => void;
  onSubjectBlur: () => void;
  onMessageChange: (value: string) => void;
  onMessageBlur: () => void;
  onFileSelect: (file: File) => void;
  onFileRemove: (fileName: string) => void;
  // ── NEW optional props for WhatsApp ──────────────────────────────────────
  onWhatsAppTemplateChange?: (templateId: string, templateName: string) => void;
  onWhatsAppVariablesChange?: (variables: string[]) => void;
};

type AttachmentItem = {
  id: string;
  name: string;
  size: number;
  type: string;
};

type InlineImageItem = {
  id: string;
  name: string;
  src: string;
};

const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "zip",
]);

const isValidHexColor = (value: string) =>
  /^#[0-9A-Fa-f]{6}$/.test(value.trim());

const parseEmailList = (value: string): string[] =>
  value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeTemplateContent = (value: string) => {
  const html = value.trim();
  if (!html) return "";

  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, "").trim();
  }

  const container = document.createElement("div");
  container.innerHTML = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr)>/gi, "\n")
    .replace(/<(ul|ol)>/gi, "\n")
    .replace(/<li>/gi, "- ");

  const decoded = container.textContent || container.innerText || "";

  return decoded
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const ReviewRequestStepContent = ({
  formData,
  fileName,
  coralRadio,
  onModeChange,
  onFromEmailChange,
  onCcChange,
  onBccChange,
  onSubjectChange,
  onSubjectBlur,
  onMessageChange,
  onMessageBlur,
  onFileSelect,
  onFileRemove,
  attachmentFiles,
  onWhatsAppTemplateChange,
  onWhatsAppVariablesChange,
}: ReviewRequestStepContentProps): JSX.Element => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [showCc, setShowCc] = useState(formData.cc_emails.length > 0);
  const [showBcc, setShowBcc] = useState(formData.bcc_emails.length > 0);
  const [ccInput, setCcInput] = useState(formData.cc_emails.join(", "));
  const [bccInput, setBccInput] = useState(formData.bcc_emails.join(", "));
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [fontMenuAnchor, setFontMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [styleMenuAnchor, setStyleMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [currentHeading, setCurrentHeading] = useState<
    "Tt" | "H1" | "H2" | "H3" | "H4" | "H5" | "H6"
  >("Tt");

  const [textColorAnchor, setTextColorAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [linkDialogType, setLinkDialogType] = useState<"link" | "drive" | null>(
    null,
  );
  const [linkInputValue, setLinkInputValue] = useState("");
  const [customTextColor, setCustomTextColor] = useState("#2563EB");
  const [colorError, setColorError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [inlineImages, setInlineImages] = useState<InlineImageItem[]>([]);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [aiSuggestOpen, setAiSuggestOpen] = useState(false);
  const [aiSuggestField, setAiSuggestField] = useState<"subject" | "body">(
    "subject",
  );

  // ── NEW: WhatsApp state ───────────────────────────────────────────────────
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplateItem[]>([]);
  const [waTemplatesLoading, setWaTemplatesLoading] = useState(false);
  const [selectedWaTemplate, setSelectedWaTemplate] =
    useState<WhatsAppTemplateItem | null>(null);
  const [waVariableValues, setWaVariableValues] = useState<
    Record<number, string>
  >({});
  const [waPlaceholders, setWaPlaceholders] = useState<number[]>([]);

  // Read clinic id from Redux (same pattern used elsewhere in the app)
  const clinicId = useSelector((state: any) => state.clinic?.id);
  const token = useSelector(
    (state: any) =>
      state.auth?.token || localStorage.getItem("access_token") || "",
  );

  // FIX: Reset templates when clinic changes so the next fetch loads the correct clinic's templates
  useEffect(() => {
    setWaTemplates([]);
    setSelectedWaTemplate(null);
    setWaVariableValues({});
    setWaPlaceholders([]);
  }, [clinicId]);

  // Fetch WhatsApp templates when mode switches to whatsapp
  useEffect(() => {
    if (formData.mode !== "whatsapp") return;
    if (!clinicId) return; // FIX: guard — don't fetch if clinicId not available
    // FIX: removed "if (waTemplates.length > 0) return" — stale cache guard was preventing refetch after clinic switch

    const fetchTemplates = async () => {
      setWaTemplatesLoading(true);
      try {
        const res = await axios.get("/api/templates/whatsapp/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Clinic-Id": clinicId,
          },
        });
        // API returns array of TemplateWhatsApp objects
        const data: WhatsAppTemplateItem[] = (res.data || []).filter(
          (t: WhatsAppTemplateItem) => t.is_active,
        );
        setWaTemplates(data);
      } catch (err) {
        console.error("Failed to fetch WhatsApp templates", err);
      } finally {
        setWaTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, [formData.mode, token, clinicId]); // FIX: removed waTemplates.length from deps

  // When a template is selected — extract placeholders, reset variable values
  const handleWaTemplateSelect = (templateId: string) => {
    const tmpl = waTemplates.find((t) => t.id === templateId) || null;
    setSelectedWaTemplate(tmpl);
    setWaVariableValues({});

    if (tmpl) {
      const placeholders = extractPlaceholders(tmpl.body);
      setWaPlaceholders(placeholders);
      onWhatsAppTemplateChange?.(tmpl.id, tmpl.name);
      // Set message to template body (raw with placeholders) so parent has it
      onMessageChange(tmpl.body);
    } else {
      setWaPlaceholders([]);
      onWhatsAppTemplateChange?.("", "");
      onMessageChange("");
    }
  };

  // When a variable value changes — update parent with ordered array
  const handleWaVariableChange = (idx: number, value: string) => {
    const updated = { ...waVariableValues, [idx]: value };
    setWaVariableValues(updated);

    if (selectedWaTemplate) {
      const placeholders = extractPlaceholders(selectedWaTemplate.body);
      const orderedValues = placeholders.map((i) => updated[i] || "");
      onWhatsAppVariablesChange?.(orderedValues);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      Underline,
      FontFamily,
      BulletList,
      OrderedList,
      ListItem,
      TextAlign.configure({
        types: ["heading", "paragraph", "listItem"],
        alignments: ["left", "center", "right", "justify"],
      }),
      TiptapLink.configure({
        openOnClick: false,
      }),
      TiptapImage,
      TextStyle,
      Color,
    ],
    content: formData.message || "",
    editable: true,
    onUpdate: ({ editor }) => {
      onMessageChange(editor.getHTML());
    },
  });

  const templateTypeLabel =
    formData.mode === "email"
      ? "Email"
      : formData.mode === "sms"
        ? "SMS"
        : "WhatsApp";
  const messageCharacterCount = getMessageCharacterCount(formData.message);
  const attachments = useMemo<AttachmentItem[]>(
    () =>
      attachmentFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    [attachmentFiles],
  );

  const attachmentUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    attachmentFiles.forEach((file) => {
      const id = `${file.name}-${file.size}-${file.lastModified}`;
      urls[id] = URL.createObjectURL(file);
    });
    return urls;
  }, [attachmentFiles]);

  useEffect(() => {
    return () => {
      Object.values(attachmentUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachmentUrls]);

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (formData.message && currentHtml !== formData.message) {
      editor.commands.setContent(formData.message, { emitUpdate: false });
    }
    if (!formData.message && currentHtml !== "<p></p>") {
      editor.commands.setContent("", { emitUpdate: false });
    }
  }, [formData.message, editor]);

  const handleInsertTemplate = (selectedTemplate: TemplateListItem) => {
    const body = normalizeTemplateContent(
      selectedTemplate.body || selectedTemplate.email_body || "",
    );

    if (body) {
      const prefix = (editorRef.current?.textContent || "").trim()
        ? "\n\n"
        : "";

      insertTextAtCursor(`${prefix}${body}`);

      const currentHtml = editorRef.current?.innerHTML || body;
      onMessageChange(currentHtml);
    }

    if (formData.mode === "email" && !formData.subject.trim()) {
      onSubjectChange((selectedTemplate.subject || "").trim());
    }
  };

  const openAiSuggestions = (field: "subject" | "body") => {
    setAiSuggestField(field);
    setAiSuggestOpen(true);
  };

  const handleApplyAiSuggestion = (
    value: string,
    suggestion: AiSuggestionItem,
  ) => {
    if (aiSuggestField === "subject") {
      onSubjectChange(value);
      return;
    }

    onMessageChange(value);

    if (
      formData.mode === "email" &&
      !formData.subject.trim() &&
      suggestion.subject.trim()
    ) {
      onSubjectChange(suggestion.subject);
    }
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const keepSelection = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    saveSelection();
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    if (!savedRangeRef.current) {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      savedRangeRef.current = range;
    }

    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      const ancestor = savedRangeRef.current.commonAncestorContainer;
      if (!editor.contains(ancestor)) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        savedRangeRef.current = range;
      }
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const syncEditorToState = () => {
    if (editor) {
      onMessageChange(editor.getHTML());
      return;
    }
    if (!editorRef.current) return;
    onMessageChange(editorRef.current.innerHTML);
  };

  const runEditorCommand = (command: string, value?: string) => {
    try {
      return document.execCommand(command, false, value);
    } catch {
      return false;
    }
  };

  const isSelectionInsideEditor = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    return editor.contains(range.commonAncestorContainer);
  };

  const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const convertTextToHtml = (text: string) => {
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    return normalized
      .split(/\n{2,}/)
      .map((block) => {
        const content = escapeHtml(block).replace(/\n/g, "<br/>");
        return `<p>${content || "<br/>"}</p>`;
      })
      .join("");
  };

  const selectedTextToHtml = (text: string) =>
    escapeHtml(text).replace(/\r\n/g, "\n").replace(/\n/g, "<br/>");

  const getSelectionTextFromEditor = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return "";
    const text = selection.toString().trim();
    if (text) return text;
    return (editor.textContent || "").trim();
  };

  const insertHtmlUsingRange = (html: string) => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    let range: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      if (editor && !editor.contains(range.commonAncestorContainer)) {
        range = null;
      }
    }

    if (!range && savedRangeRef.current) {
      range = savedRangeRef.current.cloneRange();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    if (!range) return false;

    range.deleteContents();
    const template = document.createElement("template");
    template.innerHTML = html;
    const fragment = template.content;
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);
    if (lastNode && selection) {
      const caret = document.createRange();
      caret.setStartAfter(lastNode);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);
      savedRangeRef.current = caret.cloneRange();
    }
    return true;
  };

  const applyListFallback = (ordered: boolean) => {
    restoreSelection();
    if (!isSelectionInsideEditor()) return;
    const text = getSelectionTextFromEditor();
    const items = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    const listTag = ordered ? "ol" : "ul";
    const html = `<${listTag}>${items
      .map((item) => `<li>${selectedTextToHtml(item)}</li>`)
      .join("")}</${listTag}>`;
    if (insertHtmlUsingRange(html)) {
      syncEditorToState();
      saveSelection();
    }
  };

  const applyQuoteFallback = () => {
    restoreSelection();
    if (!isSelectionInsideEditor()) return;
    const text = getSelectionTextFromEditor();
    const safeText = text ? selectedTextToHtml(text) : "<br/>";
    if (insertHtmlUsingRange(`<blockquote>${safeText}</blockquote>`)) {
      syncEditorToState();
      saveSelection();
    }
  };

  const applyEditorCommand = (command: string, value?: string) => {
    restoreSelection();
    runEditorCommand(command, value);
    syncEditorToState();
    saveSelection();
  };

  const insertTextAtCursor = (text: string) => {
    const html = convertTextToHtml(text);

    if (editor) {
      editor.chain().focus().insertContent(html).run();
      onMessageChange(editor.getHTML());
      return;
    }

    restoreSelection();
    if (!insertHtmlUsingRange(html)) {
      applyEditorCommand("insertHTML", html);
    }
  };

  const handleUndo = () => {
    if (editor) {
      editor.chain().focus().undo().run();
      syncEditorToState();
      return;
    }
    applyEditorCommand("undo");
  };

  const handleRedo = () => {
    if (editor) {
      editor.chain().focus().redo().run();
      syncEditorToState();
      return;
    }
    applyEditorCommand("redo");
  };

  const handleBold = () => {
    if (editor) {
      editor.chain().focus().toggleBold().run();
      syncEditorToState();
      return;
    }
    applyEditorCommand("bold");
  };

  const handleItalic = () => {
    if (editor) {
      editor.chain().focus().toggleItalic().run();
      syncEditorToState();
      return;
    }
    applyEditorCommand("italic");
  };

  const handleUnderline = () => {
    if (editor) {
      editor.chain().focus().toggleUnderline().run();
      syncEditorToState();
      return;
    }
    applyEditorCommand("underline");
  };

  const handleHighlight = () => {
    if (editor) {
      editor.chain().focus().setColor("#fff2a8").run();
      syncEditorToState();
      return;
    }
    applyEditorCommand("hiliteColor", "#fff2a8");
  };
  const TEXT_COLORS = [
    "#111827",
    "#DC2626",
    "#EA580C",
    "#CA8A04",
    "#16A34A",
    "#0D9488",
    "#2563EB",
    "#7C3AED",
    "#DB2777",
  ];
  const handleTextColor = (color: string) => {
    if (editor) {
      editor.chain().focus().setColor(color).run();
      syncEditorToState();
    } else {
      applyEditorCommand("foreColor", color);
    }
    setCustomTextColor(color.toUpperCase());
    setColorError("");
    setTextColorAnchor(null);
  };
  const handleApplyCustomTextColor = () => {
    const normalized = customTextColor.trim().toUpperCase();
    if (!isValidHexColor(normalized)) {
      setColorError("Enter valid HEX color, e.g. #1D4ED8");
      return;
    }
    if (editor) {
      editor.chain().focus().setColor(normalized).run();
      syncEditorToState();
    } else {
      applyEditorCommand("foreColor", normalized);
    }
    setColorError("");
    setTextColorAnchor(null);
  };

const handleAlignLeft = () => {
  if (!editor) return;

  editor.chain()
  .focus()
  .clearNodes()
  .unsetAllMarks()
  .unsetTextAlign()
  .setParagraph()   
  .run();
};

  const handleAlignCenter = () => {
    if (editor) {
      editor.chain().focus().setTextAlign("center").run();
      syncEditorToState();
      return;
    }
    restoreSelection();
    document.execCommand("justifyCenter", false, undefined);
    syncEditorToState();
    saveSelection();
  };

  const handleAlignRight = () => {
    if (editor) {
      editor.chain().focus().setTextAlign("right").run();
      syncEditorToState();
      return;
    }
    restoreSelection();
    document.execCommand("justifyRight", false, undefined);
    syncEditorToState();
    saveSelection();
  };

  const handleAlignJustify = () => {
    if (editor) {
      editor.chain().focus().setTextAlign("justify").run();
      syncEditorToState();
      return;
    }
    restoreSelection();
    document.execCommand("justifyFull", false, undefined);
    syncEditorToState();
    saveSelection();
  };

  const handleNumberedList = () => {
    if (editor) {
      editor.chain().focus().toggleOrderedList().run();
      syncEditorToState();
      return;
    }

    restoreSelection();
    if (!isSelectionInsideEditor()) {
      editorRef.current?.focus();
    }
    const result = document.execCommand("insertOrderedList", false, undefined);
    if (!result) {
      applyListFallback(true);
      return;
    }
    syncEditorToState();
    saveSelection();
  };

  const handleBulletedList = () => {
    if (editor) {
      editor.chain().focus().toggleBulletList().run();
      syncEditorToState();
      return;
    }

    restoreSelection();
    if (!isSelectionInsideEditor()) {
      editorRef.current?.focus();
    }
    const result = document.execCommand(
      "insertUnorderedList",
      false,
      undefined,
    );
    if (!result) {
      applyListFallback(false);
      return;
    }
    syncEditorToState();
    saveSelection();
  };

  const handleIndent = () => {
    if (editor) {
      if (editor.isActive("listItem")) {
        editor.chain().focus().sinkListItem("listItem").run();
      } else {
        const { $from } = editor.state.selection;
        const node = $from.parent;
        const style = (node.attrs?.style as string) || "";
        const match = /margin-left:\s*(\d+)px/.exec(style);
        const curr = match ? parseInt(match[1], 10) : 0;
        const cleaned = style.replace(/margin-left:\s*\d+px;?/g, "").trim();
        const newStyle = (cleaned ? cleaned + "; " : "") + `margin-left: ${curr + 20}px`;
        const nodeType = editor.isActive("heading") ? "heading" : "paragraph";
        editor.chain().focus().updateAttributes(nodeType, { style: newStyle }).run();
      }
      syncEditorToState();
      return;
    }
    applyEditorCommand("indent");
  };

  const handleOutdent = () => {
    if (editor) {
      if (editor.isActive("listItem")) {
        editor.chain().focus().liftListItem("listItem").run();
      } else {
        const { $from } = editor.state.selection;
        const node = $from.parent;
        const style = (node.attrs?.style as string) || "";
        const match = /margin-left:\s*(\d+)px/.exec(style);
        const curr = match ? parseInt(match[1], 10) : 0;
        const next = Math.max(0, curr - 20);
        const cleaned = style.replace(/margin-left:\s*\d+px;?/g, "").trim();
        const newStyle = (cleaned ? cleaned + "; " : "") + `margin-left: ${next}px`;
        const nodeType = editor.isActive("heading") ? "heading" : "paragraph";
        editor.chain().focus().updateAttributes(nodeType, { style: newStyle }).run();
      }
      syncEditorToState();
      return;
    }
    applyEditorCommand("outdent");
  };

  const handleQuote = () => {
    if (editor) {
      const { from, to, empty } = editor.state.selection;
      if (!empty) {
        const selectedText = editor.state.doc.textBetween(from, to, "");
        editor.chain().focus().insertContent(`"${selectedText}"`).run();
      } else {
        editor.chain().focus().insertContent('""').run();
      }
      syncEditorToState();
      return;
    }

    restoreSelection();
    if (!isSelectionInsideEditor()) {
      editorRef.current?.focus();
    }
    const result = document.execCommand("formatBlock", false, "blockquote");
    if (!result) {
      applyQuoteFallback();
      return;
    }
    syncEditorToState();
    saveSelection();
  };

const handleClearFormatting = () => {
  if (!editor) return;

  editor
    .chain()
    .focus()
    .clearNodes()        // remove headings, lists, quotes
    .unsetAllMarks()     // remove bold, italic, underline
    .unsetTextAlign()    // remove alignment
    .run();
};

  const handleHeadingChange = (
    value: "Tt" | "H1" | "H2" | "H3" | "H4" | "H5" | "H6",
  ) => {
    if (!editor) return;

    setCurrentHeading(value);

    if (value === "Tt") {
      editor.chain().focus().setParagraph().run();
      return;
    }

    const level = Number(value.replace("H", "")) as 1 | 2 | 3 | 4 | 5 | 6;
    editor.chain().focus().setHeading({ level }).run();
  };

  const openLinkDialog = (type: "link" | "drive") => {
    saveSelection();
    setLinkDialogType(type);
    setLinkInputValue("");
  };

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleInsertLinkFromDialog = () => {
    const normalizedUrl = normalizeUrl(linkInputValue);
    if (!normalizedUrl || !linkDialogType) return;
    restoreSelection();
    const selectionText = window.getSelection()?.toString().trim();

    if (editor) {
      if (selectionText) {
        editor
          .chain()
          .focus()
          .setLink({
            href: normalizedUrl,
            target: "_blank",
            rel: "noopener noreferrer",
          })
          .run();
      } else {
        const label = escapeHtml(normalizedUrl);
        const linkHtml = `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        editor.chain().focus().insertContent(linkHtml).run();
      }
      syncEditorToState();
      setLinkDialogType(null);
      setLinkInputValue("");
      return;
    }

    if (linkDialogType === "drive") {
      const driveHtml = `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${
        selectionText || escapeHtml(normalizedUrl)
      }</a>`;
      if (!insertHtmlUsingRange(driveHtml)) {
        runEditorCommand("insertHTML", driveHtml);
      }
    } else {
      if (selectionText) {
        const fallbackHtml = `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${selectedTextToHtml(selectionText)}</a>`;
        if (!insertHtmlUsingRange(fallbackHtml)) {
          runEditorCommand("createLink", normalizedUrl);
        }
      } else {
        const linkHtml = `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(normalizedUrl)}</a>`;
        if (!insertHtmlUsingRange(linkHtml)) {
          runEditorCommand("insertHTML", linkHtml);
        }
      }
    }
    syncEditorToState();
    saveSelection();
    setLinkDialogType(null);
    setLinkInputValue("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File, imageOnly = false) => {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return "File too large. Please select a file under 25MB.";
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const isImageByExt = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "bmp",
      "svg",
    ].includes(extension);
    if (imageOnly && !(file.type.startsWith("image/") || isImageByExt)) {
      return "Please select a valid image file.";
    }

    if (imageOnly) return "";

    if (!ACCEPTED_ATTACHMENT_EXTENSIONS.has(extension)) {
      return `Unsupported file type .${extension || "unknown"}. Allowed: pdf, doc, docx, xls, xlsx, csv, txt, jpg, jpeg, png, gif, webp, bmp, svg, zip`;
    }

    return "";
  };

  const removeAttachment = (id: string) => {
    const item = attachments.find((entry) => entry.id === id);
    if (item) {
      onFileRemove(item.name);
    }
  };

  const handleAttachFile = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.onchange = () => {
      const files = Array.from(fileInput.files || []);
      if (files.length === 0) return;

      const validFiles: File[] = [];
      const errors: string[] = [];

      files.forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
          return;
        }
        validFiles.push(file);
      });

      if (errors.length > 0) {
        setAttachmentError(errors[0]);
      } else {
        setAttachmentError("");
      }

      validFiles.forEach((file) => {
        onFileSelect(file);
        insertTextAtCursor(`\nAttachment: ${file.name}`);
      });

      fileInput.value = "";
    };
    fileInput.click();
  };

  const handleInsertImage = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const validationError = validateFile(file, true);
      if (validationError) {
        setAttachmentError(`Image ${file.name}: ${validationError}`);
        fileInput.value = "";
        return;
      }
      setAttachmentError("");
      const blobUrl = URL.createObjectURL(file);
      const imageId = `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;
      const imageHtml = `<img data-inline-image-id="${imageId}" src="${blobUrl}" alt="${escapeHtml(file.name)}" style="width: 220px; max-width: 100%; height: auto; border-radius: 6px;" />`;
      if (editor) {
        editor.chain().focus().insertContent(imageHtml).run();
      } else {
        restoreSelection();
        const inserted = runEditorCommand("insertHTML", imageHtml);
        if (!inserted) {
          insertHtmlUsingRange(imageHtml);
        }
      }
      setInlineImages((prev) => [
        ...prev,
        { id: imageId, name: file.name, src: blobUrl },
      ]);
      syncEditorToState();
      saveSelection();
      fileInput.value = "";
    };
    fileInput.click();
  };

  const handleRemoveInlineImage = (imageId: string, src: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor
      .querySelectorAll(
        `img[data-inline-image-id="${imageId}"], img[src="${src}"]`,
      )
      .forEach((node) => node.remove());
    setInlineImages((prev) => prev.filter((item) => item.id !== imageId));
    syncEditorToState();
    saveSelection();
    URL.revokeObjectURL(src);
  };

  const handleInsertSchedule = () => {
    insertTextAtCursor(`\nScheduled: ${new Date().toLocaleString()}`);
  };

  const handleInsertSignature = () => {
    const signer = formData.from_email?.trim() || "Clinic Team";
    insertTextAtCursor(`\n\nBest regards,\n${signer}`);
  };

  const applyFontFamily = (font: string) => {
    applyEditorCommand("fontName", font);
    setFontMenuAnchor(null);
  };

  const applyTextStyle = (style: string) => {
    applyEditorCommand("formatBlock", style);
    setStyleMenuAnchor(null);
  };

  const handleInsertEmoji = (emoji: string) => {
    insertTextAtCursor(emoji);
    setShowEmojiPicker(false);
  };

  const renderEditorToolbar = () => (
    <>
      <Divider />
      <Box
        sx={{
          p: 1,
          bgcolor: "#FAFAFA",
          position: "relative",
          zIndex: 10,
          pointerEvents: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.5,
            mb: 1,
          }}
        >
          <Tooltip title="Undo">
            <IconButton size="small" onClick={handleUndo}>
              <UndoIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo">
            <IconButton size="small" onClick={handleRedo}>
              <RedoIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Font Family">
            <Button
              size="small"
              onClick={(e) => setFontMenuAnchor(e.currentTarget)}
              sx={{
                minWidth: "auto",
                px: 0.5,
                color: "#232323",
                textTransform: "none",
              }}
            >
              <Typography variant="caption" sx={{ mx: 0.5, fontWeight: 600 }}>
                Nunito
              </Typography>
              <KeyboardArrowDownIcon fontSize="inherit" />
            </Button>
          </Tooltip>

          <Select
            size="small"
            value={currentHeading}
            onChange={(e) =>
              handleHeadingChange(
                e.target.value as
                  | "Tt"
                  | "H1"
                  | "H2"
                  | "H3"
                  | "H4"
                  | "H5"
                  | "H6",
              )
            }
            sx={{
              width: 70,
              height: 28,
              fontSize: "12px",
              "& fieldset": { border: "none" },
            }}
          >
            <MenuItem value="Tt">
              <span style={{ fontWeight: 600, fontSize: "16px" }}>T</span>
            </MenuItem>
            <MenuItem value="H1">H1</MenuItem>
            <MenuItem value="H2">H2</MenuItem>
            <MenuItem value="H3">H3</MenuItem>
            <MenuItem value="H4">H4</MenuItem>
            <MenuItem value="H5">H5</MenuItem>
            <MenuItem value="H6">H6</MenuItem>
          </Select>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Bold">
            <IconButton
              size="small"
              onMouseDown={keepSelection}
              onClick={handleBold}
            >
              <FormatBoldIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton
              size="small"
              onMouseDown={keepSelection}
              onClick={handleItalic}
            >
              <FormatItalicIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton
              size="small"
              onMouseDown={keepSelection}
              onClick={handleUnderline}
            >
              <FormatUnderlinedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Text Color">
            <IconButton
              size="small"
              onMouseDown={keepSelection}
              onClick={(event) => setTextColorAnchor(event.currentTarget)}
            >
              <FormatColorTextIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Align Left">
            <IconButton size="small" onMouseDown={keepSelection} onClick={handleAlignLeft}
              sx={{ p: 0.5, bgcolor: editor?.isActive({ textAlign: 'left' }) ? '#E5E7EB' : 'transparent' }}>
              <FormatAlignLeftIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align Center">
            <IconButton size="small" onMouseDown={keepSelection} onClick={handleAlignCenter}
              sx={{ p: 0.5, bgcolor: editor?.isActive({ textAlign: 'center' }) ? '#E5E7EB' : 'transparent' }}>
              <FormatAlignCenterIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align Right">
            <IconButton size="small" onMouseDown={keepSelection} onClick={handleAlignRight}
              sx={{ p: 0.5, bgcolor: editor?.isActive({ textAlign: 'right' }) ? '#E5E7EB' : 'transparent' }}>
              <FormatAlignRightIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Justify">
            <IconButton size="small" onMouseDown={keepSelection} onClick={handleAlignJustify}
              sx={{ p: 0.5, bgcolor: editor?.isActive({ textAlign: 'justify' }) ? '#E5E7EB' : 'transparent' }}>
              <FormatAlignJustifyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton
              aria-label="Numbered List"
              size="small"
              onMouseDown={keepSelection}
              onClick={handleNumberedList}
              sx={{
                p: 0.5,
                bgcolor: editor?.isActive("orderedList")
                  ? "#E5E7EB"
                  : "transparent",
              }}
            >
              <FormatListNumberedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bulleted List">
            <IconButton
              aria-label="Bulleted List"
              size="small"
              onMouseDown={keepSelection}
              onClick={handleBulletedList}
              sx={{
                p: 0.5,
                bgcolor: editor?.isActive("bulletList")
                  ? "#E5E7EB"
                  : "transparent",
              }}
            >
              <FormatListBulletedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Decrease Indent">
            <IconButton
              aria-label="Decrease Indent"
              size="small"
              onMouseDown={keepSelection}
              onClick={handleOutdent}
              sx={{ p: 0.5 }}
            >
              <FormatIndentDecreaseIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Increase Indent">
            <IconButton
              aria-label="Increase Indent"
              size="small"
              onMouseDown={keepSelection}
              onClick={handleIndent}
              sx={{ p: 0.5 }}
            >
              <FormatIndentIncreaseIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Quote">
            <IconButton
              aria-label="Quote"
              size="small"
              onMouseDown={keepSelection}
              onClick={handleQuote}
              sx={{
                p: 0.5,
                bgcolor: editor?.isActive("blockquote")
                  ? "#E5E7EB"
                  : "transparent",
              }}
            >
              <FormatQuoteIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Tooltip title="Clear Formatting">
            <IconButton
              aria-label="Clear Formatting"
              size="small"
              onMouseDown={keepSelection}
              onClick={handleClearFormatting}
              sx={{ p: 0.5 }}
            >
              <FormatClearIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Highlight">
            <IconButton size="small" onClick={handleHighlight}>
              <FormatColorFillIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Attach File">
            <IconButton size="small" onClick={handleAttachFile}>
              <AttachFileIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Link">
            <IconButton size="small" onClick={() => openLinkDialog("link")}>
              <LinkIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Emoji">
            <IconButton
              size="small"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            >
              <EmojiEmotionsIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Drive Link">
            <IconButton size="small" onClick={() => openLinkDialog("drive")}>
              <AddToDriveIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Insert Image">
            <IconButton size="small" onClick={handleInsertImage}>
              <InsertPhotoIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Schedule">
            <IconButton size="small" onClick={handleInsertSchedule}>
              <ScheduleIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Signature">
            <IconButton size="small" onClick={handleInsertSignature}>
              <HistoryEduIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Insert ${templateTypeLabel} Template`}>
            <IconButton
              size="small"
              onClick={() => setOpenTemplateDialog(true)}
            >
              <AddIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>

        {showEmojiPicker && (
          <Box
            mt={1}
            p={1}
            border="1px solid #E0E0E0"
            borderRadius={2}
            display="flex"
            gap={1}
            flexWrap="wrap"
            maxWidth="320px"
          >
            {["🙂", "👍", "🙏", "😊", "✔️", "🎉", "📩", "⭐", "🔥", "💯"].map(
              (emoji) => (
                <Typography
                  key={emoji}
                  sx={{ cursor: "pointer", fontSize: 20 }}
                  onClick={() => handleInsertEmoji(emoji)}
                >
                  {emoji}
                </Typography>
              ),
            )}
          </Box>
        )}

        {attachments.length > 0 && (
          <Box mt={1}>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {attachments.map((file) => (
                <Chip
                  key={file.id}
                  size="small"
                  label={`${file.name} (${formatFileSize(file.size)})`}
                  component="a"
                  href={attachmentUrls[file.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                  onDelete={() => removeAttachment(file.id)}
                  sx={{
                    maxWidth: 380,
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        {fileName && attachments.length === 0 && (
          <Box mt={1}>
            <Chip
              size="small"
              label={`Attached: ${fileName}`}
              sx={{ maxWidth: 320 }}
            />
          </Box>
        )}
        {attachmentError && (
          <Typography
            variant="caption"
            sx={{ color: "#DC2626", mt: 0.5, display: "block" }}
          >
            {attachmentError}
          </Typography>
        )}
        {inlineImages.length > 0 && (
          <Box mt={1}>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {inlineImages.map((image) => (
                <Chip
                  key={image.id}
                  size="small"
                  label={`Image: ${image.name}`}
                  onDelete={() => handleRemoveInlineImage(image.id, image.src)}
                  sx={{ maxWidth: 300 }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={fontMenuAnchor}
        open={Boolean(fontMenuAnchor)}
        onClose={() => setFontMenuAnchor(null)}
      >
        <MenuItem onClick={() => applyFontFamily("Nunito")}>Nunito</MenuItem>
        <MenuItem onClick={() => applyFontFamily("Arial")}>Arial</MenuItem>
        <MenuItem onClick={() => applyFontFamily("Georgia")}>Georgia</MenuItem>
        <MenuItem onClick={() => applyFontFamily("Tahoma")}>Tahoma</MenuItem>
      </Menu>

      <Menu
        anchorEl={styleMenuAnchor}
        open={Boolean(styleMenuAnchor)}
        onClose={() => setStyleMenuAnchor(null)}
      >
        <MenuItem onClick={() => applyTextStyle("p")}>Paragraph</MenuItem>
        <MenuItem onClick={() => applyTextStyle("h1")}>Heading 1</MenuItem>
        <MenuItem onClick={() => applyTextStyle("h2")}>Heading 2</MenuItem>
        <MenuItem onClick={() => applyTextStyle("h3")}>Heading 3</MenuItem>
      </Menu>

      <Menu
        anchorEl={textColorAnchor}
        open={Boolean(textColorAnchor)}
        onClose={() => {
          setColorError("");
          setTextColorAnchor(null);
        }}
        PaperProps={{
          sx: {
            width: 180,
            maxHeight: 120,
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: 4,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#C1C1C1",
              borderRadius: 4,
            },
          },
        }}
      >
        {TEXT_COLORS.map((color) => (
          <MenuItem
            key={color}
            onClick={() => handleTextColor(color)}
            sx={{
              py: 0.5,
              minHeight: 32,
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                bgcolor: color,
                border: "1px solid #E5E7EB",
                mr: 1,
              }}
            />
            <Typography variant="body2">{color.toUpperCase()}</Typography>
          </MenuItem>
        ))}
        <Divider />
        <Box sx={{ px: 1.5, py: 1, width: 220 }}>
          <Typography
            variant="caption"
            sx={{ color: "#6B7280", mb: 0.75, display: "block" }}
          >
            Custom HEX Color
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              value={customTextColor}
              onChange={(event) => {
                setCustomTextColor(event.target.value);
                if (colorError) setColorError("");
              }}
              placeholder="#2563EB"
              error={Boolean(colorError)}
              sx={{ flex: 1 }}
            />
            <Button
              size="small"
              variant="contained"
              onClick={handleApplyCustomTextColor}
              sx={{
                minWidth: 62,
                bgcolor: "#505050",
                "&:hover": { bgcolor: "#232323" },
              }}
            >
              Apply
            </Button>
          </Box>
          {colorError && (
            <Typography
              variant="caption"
              sx={{ color: "#DC2626", mt: 0.5, display: "block" }}
            >
              {colorError}
            </Typography>
          )}
        </Box>
      </Menu>

      <Dialog
        open={Boolean(linkDialogType)}
        onClose={() => setLinkDialogType(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          {linkDialogType === "drive" ? "Paste Google Drive Link" : "Enter URL"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            size="small"
            value={linkInputValue}
            onChange={(e) => setLinkInputValue(e.target.value)}
            placeholder={
              linkDialogType === "drive"
                ? "https://drive.google.com/..."
                : "https://example.com"
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleInsertLinkFromDialog();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLinkDialogType(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInsertLinkFromDialog}
            disabled={!linkInputValue.trim()}
            sx={{ bgcolor: "#505050", "&:hover": { bgcolor: "#232323" } }}
          >
            Insert
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  // ── NEW: WhatsApp body section ────────────────────────────────────────────
  const renderWhatsAppBody = () => (
    <Box>
      <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
        WhatsApp Template
      </Typography>

      {/* Template dropdown */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Select Template</InputLabel>
        {waTemplatesLoading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="textSecondary">
              Loading templates...
            </Typography>
          </Box>
        ) : (
          <Select
            label="Select Template"
            value={selectedWaTemplate?.id || ""}
            onChange={(e) => handleWaTemplateSelect(e.target.value)}
          >
            <MenuItem value="">
              <em>— Select a template —</em>
            </MenuItem>
            {waTemplates.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        )}
      </FormControl>

      {/* Variable input fields — auto-detected from {{1}} {{2}} */}
      {selectedWaTemplate && waPlaceholders.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
            Fill in Variables
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {waPlaceholders.map((idx) => (
              <TextField
                key={idx}
                size="small"
                fullWidth
                label={`Variable ${idx}`}
                placeholder={`Enter value for {{${idx}}}`}
                value={waVariableValues[idx] || ""}
                onChange={(e) => handleWaVariableChange(idx, e.target.value)}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Live message preview */}
      {selectedWaTemplate && (
        <Box sx={{ mb: 1 }}>
          <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
            Message Preview
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: "#F0FDF4",
              borderColor: "#BBF7D0",
              borderRadius: "12px",
              position: "relative",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                mb: 1,
              }}
            >
              <WhatsAppIcon sx={{ color: "#25D366", fontSize: 18 }} />
              <Typography
                variant="caption"
                sx={{ color: "#15803D", fontWeight: 600 }}
              >
                WhatsApp Preview
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "#111827",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {buildPreview(selectedWaTemplate.body, waVariableValues)}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* No templates found */}
      {!waTemplatesLoading && waTemplates.length === 0 && (
        <Typography variant="caption" sx={{ color: "#6B7280" }}>
          No WhatsApp templates found. Add templates via Settings → Templates →
          WhatsApp.
        </Typography>
      )}
    </Box>
  );

  return (
    <>
      <Box>
        <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
          Select Mode
        </Typography>
        <RadioGroup
          row
          value={formData.mode}
          onChange={(e) =>
            onModeChange(e.target.value as "email" | "sms" | "whatsapp")
          }
          sx={{ mb: 1.5 }}
        >
          <FormControlLabel
            value="email"
            control={<Radio sx={coralRadio} size="small" />}
            label={<Typography variant="body2">Email</Typography>}
          />
          <FormControlLabel
            value="sms"
            control={<Radio sx={coralRadio} size="small" />}
            label={<Typography variant="body2">SMS</Typography>}
          />
          <FormControlLabel
            value="whatsapp"
            control={<Radio sx={coralRadio} size="small" />}
            label={<Typography variant="body2">WhatsApp</Typography>}
          />
        </RadioGroup>

        {formData.mode === "email" && (
          <TextField
            size="small"
            fullWidth
            label="From"
            placeholder="Enter sender email"
            value={formData.from_email}
            onChange={(e) => onFromEmailChange(e.target.value)}
            sx={{ mb: 1.5 }}
          />
        )}

        {formData.mode === "email" && (
          <TextField
            size="small"
            fullWidth
            label="Subject"
            placeholder="Type Here"
            value={formData.subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            onBlur={onSubjectBlur}
            inputProps={{ maxLength: REVIEW_REQUEST_SUBJECT_MAX_LENGTH }}
            helperText={`${formData.subject.length}/${REVIEW_REQUEST_SUBJECT_MAX_LENGTH}`}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                    onClick={() => openAiSuggestions("subject")}
                    sx={{
                      color: "#A855F7",
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    AI Suggest
                  </Button>
                  <Box
                    sx={{
                      ml: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: showCc ? "#232323" : "#BBBBBB",
                        fontWeight: showCc ? 600 : 400,
                        cursor: "pointer",
                      }}
                      onClick={() => setShowCc((prev) => !prev)}
                    >
                      Cc
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#505050" }}>
                      |
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: showBcc ? "#232323" : "#BBBBBB",
                        fontWeight: showBcc ? 600 : 400,
                        cursor: "pointer",
                      }}
                      onClick={() => setShowBcc((prev) => !prev)}
                    >
                      Bcc
                    </Typography>
                  </Box>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1.25 }}
          />
        )}

        {formData.mode === "email" && showCc && (
          <TextField
            size="small"
            fullWidth
            label="Cc"
            placeholder="Enter CC emails separated by comma"
            value={ccInput}
            onChange={(e) => {
              const value = e.target.value;
              setCcInput(value);
              onCcChange(parseEmailList(value));
            }}
            sx={{ mb: 1.25 }}
          />
        )}

        {formData.mode === "email" && showBcc && (
          <TextField
            size="small"
            fullWidth
            label="Bcc"
            placeholder="Enter BCC emails separated by comma"
            value={bccInput}
            onChange={(e) => {
              const value = e.target.value;
              setBccInput(value);
              onBccChange(parseEmailList(value));
            }}
            sx={{ mb: 1.75 }}
          />
        )}

        {/* ── WhatsApp mode: show template picker instead of rich text editor ── */}
        {formData.mode === "whatsapp" ? (
          renderWhatsAppBody()
        ) : (
          <>
            <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
              Body
            </Typography>
            <Box
              sx={{
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                overflow: "hidden",
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
                <Button
                  startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                  onClick={() => openAiSuggestions("body")}
                  sx={{ color: "#A855F7", textTransform: "none", fontWeight: 700 }}
                >
                  AI Suggest
                </Button>
              </Box>
              <Box
                ref={editorRef}
                sx={{
                  "& .ProseMirror": {
                    minHeight: formData.mode === "email" ? 180 : 130,
                    fontSize: 14,
                    lineHeight: 1.7,
                    padding: "14px 16px",
                    "& [style*='text-align: left']": {
                      textAlign: "left",
                    },
                    "& [style*='text-align: center']": {
                      textAlign: "center",
                    },
                    "& [style*='text-align: right']": {
                      textAlign: "right",
                    },
                    outline: "none",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "#111827",
                    "& p": { margin: "0 0 8px 0" },
                    "& h1": { fontSize: "28px", fontWeight: 700, margin: "8px 0" },
                    "& h2": { fontSize: "24px", fontWeight: 600, margin: "8px 0" },
                    "& h3": { fontSize: "20px", fontWeight: 600, margin: "8px 0" },
                    "& h4": { fontSize: "18px", fontWeight: 600, margin: "8px 0" },
                    "& h5": { fontSize: "16px", fontWeight: 600, margin: "8px 0" },
                    "& h6": { fontSize: "14px", fontWeight: 600, margin: "8px 0" },
                    "& ul": {
                      listStyleType: "disc",
                      paddingLeft: "20px",
                      margin: "8px 0",
                    },
                    "& ol": {
                      listStyleType: "decimal",
                      paddingLeft: "20px",
                      margin: "8px 0",
                    },
                    "& li": { margin: "4px 0" },
                    "& blockquote": {
                      borderLeft: "3px solid #D1D5DB",
                      margin: "8px 0",
                      paddingLeft: "12px",
                      color: "#4B5563",
                    },
                    "& a": { color: "#2563EB", textDecoration: "underline" },
                    "& img": {
                      width: "220px",
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: "6px",
                    },
                  },
                }}
              >
                <EditorContent
                  editor={editor}
                  onPaste={(e: ClipboardEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text/plain");
                    if (editor) {
                      editor.chain().focus().insertContent(text).run();
                    }
                  }}
                  onBlur={() => {
                    onMessageBlur();
                  }}
                />
              </Box>

              <Box
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {renderEditorToolbar()}
              </Box>
            </Box>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "right",
                color:
                  messageCharacterCount > REVIEW_REQUEST_BODY_MAX_LENGTH
                    ? "#DC2626"
                    : "#6B7280",
                mb: 1.5,
              }}
            >
              {messageCharacterCount}/{REVIEW_REQUEST_BODY_MAX_LENGTH}
            </Typography>

            {formData.mode === "sms" && (
              <Box sx={{ mt: 2 }}>
                <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
                  Upload Documents
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    p: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    component="label"
                    sx={{
                      bgcolor: "#9CA3AF",
                      "&:hover": { bgcolor: "#6B7280" },
                      textTransform: "none",
                      fontSize: 12,
                      boxShadow: "none",
                      borderRadius: "4px",
                    }}
                  >
                    Choose File
                    <input
                      type="file"
                      hidden
                      accept="*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        onFileSelect(file);
                        e.target.value = "";
                      }}
                    />
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    {fileName || "No File Chosen"}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  Accepted formats: Any | Max size: 25MB
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      <AI_Suggest
        open={aiSuggestOpen}
        mode={formData.mode}
        field={aiSuggestField}
        onClose={() => setAiSuggestOpen(false)}
        onApply={handleApplyAiSuggestion}
      />

      <ReviewRequestTemplateDialog
        open={openTemplateDialog}
        mode={formData.mode}
        onClose={() => setOpenTemplateDialog(false)}
        onInsert={handleInsertTemplate}
      />
    </>
  );
};

export default ReviewRequestStepContent;