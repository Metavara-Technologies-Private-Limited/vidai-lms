/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useRef } from "react";
import "../../../styles/Campaign/EmailTemplateModal.css";
import viewIcon from "./Icons/view.png";
import editIcon from "./Icons/edit.png";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import LinkIcon from "@mui/icons-material/Link";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
const templates = [
  {
    id: 1,
    title: "Appointment Confirmation",
    subtitle: "Your Consultation is Confirmed – {appointment_date}",
  },
  {
    id: 2,
    title: "IVF Consultation Follow-Up",
    subtitle: "Reminder: Your Consultation Is Tomorrow",
  },
  {
    id: 3,
    title: "Consultation Reminder – 24 Hrs",
    subtitle: "Continuing Your Care Journey Together",
  },
  {
    id: 4,
    title: "Welcome Back – Returning Patient",
    subtitle: "Your Consultation is Set for – March 15, 2023",
  },
  {
    id: 5,
    title: "Appointment Booking",
    subtitle: "Checking In on Your Fertility Inquiry",
  },
];

export default function EmailTemplateModal({
  open,
  onClose,
//   onSelect,
}: any) {
  const [selected, setSelected] = useState<number | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const emailEditorRef = useRef<HTMLDivElement>(null);
const emailFileInputRef = useRef<HTMLInputElement>(null);

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
  emailFileInputRef.current.accept =
    ".pdf,.doc,.docx,.xls,.xlsx,.txt";
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

  return (
    <>
    <Modal open={open} onClose={onClose}>
      <Box className="email-template-modal">
        {/* Header */}
        <div className="template-header">
          <Typography variant="h6">New Email</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>

        <div
        className="compose-box"
        onClick={() => setComposeOpen(true)}
        >
        <img src={editIcon} alt="Compose" />
        <span>Compose New Email</span>
        </div>

        <div className="or-divider">
          <div className="line" />
          <span>OR</span>
          <div className="line" />
        </div>

        <Typography className="select-label">
          Select Email Template
        </Typography>

        <div className="template-list">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`template-item ${
                selected === template.id ? "active" : ""
              }`}
              onClick={() => setSelected(template.id)}
            >
              <input
                type="radio"
                checked={selected === template.id}
                readOnly
                className="custom-radio"
                />

              <div className="template-text">
                <h4>{template.title}</h4>
                <p>{template.subtitle}</p>
              </div>

              <div className="view-icon">
                <img src={viewIcon} alt="View" />
            </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="template-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
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
          <input placeholder="To :" />
          <span className="cc-bcc">Cc | Bcc</span>
        </div>

        <div className="compose-field">
          <input placeholder="Subject :" />
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
            <button
              className="cancel-btn"
              onClick={() => setComposeOpen(false)}
            >
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