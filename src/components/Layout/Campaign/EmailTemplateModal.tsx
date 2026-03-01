/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal, Box, Typography, IconButton, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useRef, useEffect } from "react";
import "../../../styles/Campaign/EmailTemplateModal.css";
import viewIcon from "./Icons/view.png";
import editIcon from "./Icons/edit.png";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import LinkIcon from "@mui/icons-material/Link";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const API_BASE_URL = "http://127.0.0.1:8000/api/templates";

export default function EmailTemplateModal({
  open,
  onClose,
//   onSelect,
}: any) {
  const [selected, setSelected] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const emailEditorRef = useRef<HTMLDivElement>(null);
  const emailFileInputRef = useRef<HTMLInputElement>(null);
  const [templateConfirmOpen, setTemplateConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // API state
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compose fields
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");

  // Fetch templates from API when modal opens
  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/mail/`);
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const focusEmailEditor = () => {
    if (emailEditorRef.current) {
      emailEditorRef.current.focus();
    }
  };

  const handleEmailBold = () => {
    focusEmailEditor();
    document.execCommand("bold");
  };

  const handleEmailLink = () => {
    const url = prompt("Enter URL");
    if (!url) return;
    focusEmailEditor();
    document.execCommand(
      "insertHTML",
      false,
      `<a href="${url}" target="_blank" style="color:#2563eb; text-decoration:underline;">${url}</a>`
    );
  };

  const handleEmailEmoji = () => {
    focusEmailEditor();
    document.execCommand("insertText", false, "😊");
  };

  const handleEmailImage = () => {
    if (!emailFileInputRef.current) return;
    emailFileInputRef.current.accept = "image/*";
    emailFileInputRef.current.click();
  };

  const handleEmailAttachment = () => {
    if (!emailFileInputRef.current) return;
    emailFileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt";
    emailFileInputRef.current.click();
  };

  const handleEmailFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event: any) => {
      focusEmailEditor();
      if (file.type.startsWith("image/")) {
        document.execCommand(
          "insertHTML",
          false,
          `<img src="${event.target.result}" style="max-width:200px; border-radius:8px;" />`
        );
      } else {
        document.execCommand(
          "insertHTML",
          false,
          `<div style="color:#2563eb;">📎 ${file.name}</div>`
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Insert template body into compose editor
  const handleInsertTemplate = () => {
    if (previewTemplate && emailEditorRef.current) {
      emailEditorRef.current.innerHTML = previewTemplate.body || "";
      setComposeSubject(previewTemplate.subject || "");
    }
    setPreviewOpen(false);
    setComposeOpen(true);
  };

  return (
    <>
      {/* FIRST MODAL — select use_case / category */}
      <Modal
        open={open}
        onClose={onClose}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box className="email-template-modal">
          {/* Header */}
          <div className="template-header">
            <Typography variant="h6">New Email</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="compose-box" onClick={() => { onClose(); setComposeOpen(true); }}>
            <img src={editIcon} alt="Compose" />
            <span>Compose New Email</span>
          </div>

          <div className="or-divider">
            <div className="line" />
            <span>OR</span>
            <div className="line" />
          </div>

          <Typography className="select-label">Select Email Template</Typography>

          <div className="template-list">
            {loading && (
              <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
                <CircularProgress size={28} />
              </div>
            )}
            {error && (
              <Typography sx={{ color: "red", textAlign: "center", py: 2 }}>
                {error}
              </Typography>
            )}
            {!loading && !error && templates.length === 0 && (
              <Typography sx={{ textAlign: "center", py: 2, color: "#888" }}>
                No templates found.
              </Typography>
            )}
            {!loading &&
              !error &&
              templates.map((template) => (
                <div
                  key={template.id}
                  className={`template-item ${selected === template.id ? "active" : ""}`}
                  onClick={() => {
                    setSelected(template.id);
                    setPreviewTemplate(template);
                    setTemplateConfirmOpen(true);
                    onClose();
                  }}
                >
                  <input
                    type="radio"
                    checked={selected === template.id}
                    readOnly
                    className="custom-radio"
                  />
                  <div className="template-text">
                    <h4>{template.name}</h4>
                    <p>{template.subject}</p>
                  </div>
                  <div className="view-icon">
                    <img src={viewIcon} alt="View" />
                  </div>
                </div>
              ))}
          </div>

          {/* Footer */}
          <div className="template-actions">
            <button className="cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </Box>
      </Modal>

      {/* TEMPLATE SECOND POPUP — template detail confirm */}
      <Modal
        open={templateConfirmOpen}
        onClose={() => setTemplateConfirmOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box className="email-template-modal">
          <div className="template-header">
            <Typography variant="h6">Select Email Template</Typography>
            <IconButton onClick={() => setTemplateConfirmOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="template-list">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-item ${selected === template.id ? "active" : ""}`}
                onClick={() => {
                  setSelected(template.id);
                  setPreviewTemplate(template);
                  setPreviewOpen(true);
                  setTemplateConfirmOpen(false);
                }}
              >
                <input
                  type="radio"
                  checked={selected === template.id}
                  readOnly
                  className="custom-radio"
                />
                <div className="template-text">
                  <h4>{template.name}</h4>
                  <p>{template.subject}</p>
                </div>
                <div className="view-icon">
                  <img src={viewIcon} alt="View" />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "24px" }}>
            <button className="cancel" onClick={() => setTemplateConfirmOpen(false)}>
              Cancel
            </button>
            <button
              className="send-btn"
              onClick={() => {
                setTemplateConfirmOpen(false);
                setComposeOpen(true);
              }}
            >
              Next
            </button>
          </div>
        </Box>
      </Modal>

      {/* TEMPLATE PREVIEW MODAL */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            width: 800,
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            outline: "none",
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          <div className="template-header">
            <Typography variant="h6">{previewTemplate?.name}</Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>

          <div style={{ marginTop: "16px" }}>
            <Typography sx={{ color: "#888", mb: 1 }}>Subject</Typography>
            <Typography sx={{ fontWeight: 500, mb: 2 }}>
              {previewTemplate?.subject}
            </Typography>

            <Typography
              sx={{ mb: 2, whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{ __html: previewTemplate?.body || "" }}
            />

            {previewTemplate?.use_case && (
              <Typography sx={{ color: "#888", fontSize: "13px", mt: 1 }}>
                Use Case: {previewTemplate.use_case}
              </Typography>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "24px" }}>
            <button className="cancel" onClick={() => setPreviewOpen(false)}>
              Cancel
            </button>
            <button className="send-btn" onClick={handleInsertTemplate}>
              Insert
            </button>
          </div>
        </Box>
      </Modal>

      {/* COMPOSE MODAL */}
      <Modal open={composeOpen} onClose={() => setComposeOpen(false)}>
        <Box className="compose-modal">
          <div className="compose-header">
            <Typography variant="h6">New Email</Typography>
            <IconButton onClick={() => setComposeOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="compose-field">
            <input
              placeholder="To :"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
            />
            <span className="cc-bcc">Cc | Bcc</span>
          </div>

          <div className="compose-field">
            <input
              placeholder="Subject :"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
            />
          </div>

          <div className="compose-body">
            <div
              ref={emailEditorRef}
              className="editor"
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Write your email..."
            />
          </div>

          <div className="compose-footer">
            <div className="social-toolbar-container">
              <div className="social-toolbar">
                <TextFieldsIcon onClick={handleEmailBold} />
                <LinkIcon onClick={handleEmailLink} />
                <EmojiEmotionsIcon onClick={handleEmailEmoji} />
                <PermMediaIcon onClick={handleEmailImage} />
                <AttachFileIcon onClick={handleEmailAttachment} />
                <AccessTimeIcon />
              </div>
            </div>

            <div className="compose-actions">
              <button className="cancel" onClick={() => setComposeOpen(false)}>
                Cancel
              </button>
              <button className="template-btn">Save as Template</button>
              <button className="send-btn">Send</button>
            </div>
          </div>
        </Box>
      </Modal>

      <input
        ref={emailFileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleEmailFileChange}
      />
    </>
  );
}