import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import TitleIcon from "@mui/icons-material/Title";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
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
import AI_Suggest, { type AiSuggestionItem } from "./AI_Suggest";
import { toast } from "react-toastify";
import type { ReviewRequestFormData } from "./reviewRequest.utils";
import ReviewRequestTemplateDialog, {
  type TemplateListItem,
} from "./ReviewRequestTemplateDialog";

type ReviewRequestStepContentProps = {
  formData: ReviewRequestFormData;
  fileName: string;
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
};

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
}: ReviewRequestStepContentProps) => {
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
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [aiSuggestOpen, setAiSuggestOpen] = useState(false);
  const [aiSuggestField, setAiSuggestField] = useState<"subject" | "body">(
    "subject",
  );

  const templateTypeLabel =
    formData.mode === "email"
      ? "Email"
      : formData.mode === "sms"
        ? "SMS"
        : "WhatsApp";

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if ((editor.innerHTML || "") !== (formData.message || "")) {
      editor.innerHTML = formData.message || "";
    }
  }, [formData.message]);

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

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const syncEditorToState = () => {
    if (!editorRef.current) return;
    onMessageChange(editorRef.current.innerHTML);
  };

  const applyEditorCommand = (command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    syncEditorToState();
  };

  const insertTextAtCursor = (text: string) => {
    const html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");

    applyEditorCommand("insertHTML", html);
  };

  const handleUndo = () => applyEditorCommand("undo");
  const handleRedo = () => applyEditorCommand("redo");
  const handleBold = () => applyEditorCommand("bold");
  const handleItalic = () => applyEditorCommand("italic");
  const handleUnderline = () => applyEditorCommand("underline");
  const handleHighlight = () => applyEditorCommand("hiliteColor", "#fff2a8");
  const handleTextColor = () => applyEditorCommand("foreColor", "#2563eb");
  const handleAlignLeft = () => applyEditorCommand("justifyLeft");
  const handleNumberedList = () => applyEditorCommand("insertOrderedList");
  const handleBulletedList = () => applyEditorCommand("insertUnorderedList");
  const handleIndent = () => applyEditorCommand("indent");
  const handleOutdent = () => applyEditorCommand("outdent");
  const handleQuote = () => applyEditorCommand("formatBlock", "blockquote");
  const handleClearFormatting = () => applyEditorCommand("removeFormat");

  const handleInsertLink = () => {
    let inputValue = "";

    toast(
      ({ closeToast }) => (
        <Box>
          <Typography fontSize={13} mb={1}>
            Enter URL
          </Typography>

          <input
            type="text"
            placeholder="https://example.com"
            onChange={(e) => {
              inputValue = e.target.value;
            }}
            style={{
              width: "100%",
              padding: "6px 8px",
              border: "1px solid #E0E0E0",
              borderRadius: "4px",
              marginBottom: "8px",
            }}
          />

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button size="small" onClick={() => closeToast?.()}>
              Cancel
            </Button>

            <Button
              size="small"
              variant="contained"
              onClick={() => {
                const url = inputValue.trim();
                if (url) {
                  restoreSelection();
                  document.execCommand("createLink", false, url);
                  syncEditorToState();
                }
                closeToast?.();
              }}
              sx={{ bgcolor: "#505050", "&:hover": { bgcolor: "#232323" } }}
            >
              Insert
            </Button>
          </Stack>
        </Box>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      },
    );
  };

  const handleAttachFile = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      onFileSelect(file);
      insertTextAtCursor(`\nAttached file: ${file.name}`);
    };
    fileInput.click();
  };

  const handleInsertDriveLink = () => {
    let inputValue = "";

    toast(
      ({ closeToast }) => (
        <Box>
          <Typography fontSize={13} mb={1}>
            Paste Google Drive Link
          </Typography>

          <input
            type="text"
            placeholder="https://drive.google.com/..."
            onChange={(e) => {
              inputValue = e.target.value;
            }}
            style={{
              width: "100%",
              padding: "6px 8px",
              border: "1px solid #E0E0E0",
              borderRadius: "4px",
              marginBottom: "8px",
            }}
          />

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button size="small" onClick={() => closeToast?.()}>
              Cancel
            </Button>

            <Button
              size="small"
              variant="contained"
              onClick={() => {
                if (inputValue.trim()) {
                  insertTextAtCursor(`\nDrive: ${inputValue.trim()}`);
                }
                closeToast?.();
              }}
              sx={{ bgcolor: "#505050", "&:hover": { bgcolor: "#232323" } }}
            >
              Insert
            </Button>
          </Stack>
        </Box>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      },
    );
  };

  const handleInsertImage = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const blobUrl = URL.createObjectURL(file);
      restoreSelection();
      document.execCommand("insertImage", false, blobUrl);
      syncEditorToState();
    };
    fileInput.click();
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
        onMouseDown={(e) => e.preventDefault()}
        sx={{ p: 1, bgcolor: "#FAFAFA" }}
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
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Text Style">
            <Button
              size="small"
              onClick={(e) => setStyleMenuAnchor(e.currentTarget)}
              sx={{ minWidth: "auto", px: 0.5, color: "#232323" }}
            >
              <TitleIcon fontSize="inherit" />
              <KeyboardArrowDownIcon fontSize="inherit" />
            </Button>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Bold">
            <IconButton size="small" onClick={handleBold}>
              <FormatBoldIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton size="small" onClick={handleItalic}>
              <FormatItalicIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton size="small" onClick={handleUnderline}>
              <FormatUnderlinedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Text Color">
            <IconButton size="small" onClick={handleTextColor}>
              <FormatColorTextIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Align Left">
            <IconButton size="small" onClick={handleAlignLeft}>
              <FormatAlignLeftIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton size="small" onClick={handleNumberedList}>
              <FormatListNumberedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bulleted List">
            <IconButton size="small" onClick={handleBulletedList}>
              <FormatListBulletedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Decrease Indent">
            <IconButton size="small" onClick={handleOutdent}>
              <FormatIndentDecreaseIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Increase Indent">
            <IconButton size="small" onClick={handleIndent}>
              <FormatIndentIncreaseIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Quote">
            <IconButton size="small" onClick={handleQuote}>
              <FormatQuoteIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Insert Link">
            <IconButton size="small" onClick={handleInsertLink}>
              <LinkIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear Formatting">
            <IconButton size="small" onClick={handleClearFormatting}>
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
            <IconButton size="small" onClick={handleInsertLink}>
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
            <IconButton size="small" onClick={handleInsertDriveLink}>
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
    </>
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
            contentEditable
            role="textbox"
            aria-label="Type your message here"
            suppressContentEditableWarning
            onInput={syncEditorToState}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            onBlur={() => {
              saveSelection();
              onMessageBlur();
            }}
            sx={{
              px: 1.75,
              pb: 1.5,
              minHeight: formData.mode === "email" ? 180 : 130,
              fontSize: 14,
              lineHeight: 1.7,
              outline: "none",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              "&:empty:before": {
                content: '"Type your message here..."',
                color: "#A0A0A0",
              },
            }}
          />

          {renderEditorToolbar()}
        </Box>

        {(formData.mode === "sms" || formData.mode === "whatsapp") && (
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
