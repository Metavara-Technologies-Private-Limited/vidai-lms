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

const templatePreviewList = [
  {
    id: 1,
    title: "IVF Next Steps Form Request",
    subtitle:
      "Requests the patient to fill out a form to share medical and contact details.",
  },
  {
    id: 2,
    title: "IVF Treatment Information",
    subtitle:
      "Provides an overview of IVF process, timelines, and general treatment details.",
  },
  {
    id: 3,
    title: "IVF Follow-Up Reminder",
    subtitle:
      "Gentle reminder for patients who have not responded or taken action.",
  },
  {
    id: 4,
    title: "New Consultation Confirmation",
    subtitle:
      "Confirms appointment date, time, and doctor details.",
  },
  {
    id: 5,
    title: "Welcome Email – Patient Inquiry",
    subtitle:
      "Introduces the clinic and builds trust after the first inquiry.",
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
  const [templateConfirmOpen, setTemplateConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

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
    <Modal
  open={open}
  onClose={onClose}
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
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
              onClick={() => {
                setSelected(template.id);
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
          <button className="cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </Box>
    </Modal>

    {/* TEMPLATE SECOND POPUP */}

<Modal
  open={templateConfirmOpen}
  onClose={() => setTemplateConfirmOpen(false)}
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Box className="email-template-modal">

    {/* HEADER */}
    <div className="template-header">
      <Typography variant="h6">Select Email Template</Typography>
      <IconButton onClick={() => setTemplateConfirmOpen(false)}>
        <CloseIcon />
      </IconButton>
    </div>

    {/* TEMPLATE LIST */}
    <div className="template-list">
      {templatePreviewList.map((template) => (
        <div
          key={template.id}
          className={`template-item ${
            selected === template.id ? "active" : ""
          }`}
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
            <h4>{template.title}</h4>
            <p>{template.subtitle}</p>
          </div>

          <div className="view-icon">
            <img src={viewIcon} alt="View" />
          </div>
        </div>
      ))}
    </div>

    {/* FOOTER */}
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "16px",
        marginTop: "24px",
      }}
    >
      <button
        className="cancel"
        onClick={() => setTemplateConfirmOpen(false)}
      >
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
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}
>
  <Box
    sx={{
      width: 800,
      background: "#fff",
      borderRadius: "16px",
      padding: "24px",
      outline: "none",
      maxHeight: "85vh",
      overflowY: "auto"
    }}
  >

    {/* HEADER */}
    <div className="template-header">
      <Typography variant="h6">
        {previewTemplate?.title}
      </Typography>
      <IconButton onClick={() => setPreviewOpen(false)}>
        <CloseIcon />
      </IconButton>
    </div>

    <div style={{ marginTop: "16px" }}>

      <Typography sx={{ color: "#888", mb: 1 }}>
        Subject
      </Typography>

      <Typography sx={{ fontWeight: 500, mb: 2 }}>
        Thank You for Your IVF Inquiry – Next Steps
      </Typography>

      <Typography sx={{ mb: 2 }}>
        Hi John Smith,
      </Typography>

      <Typography sx={{ mb: 2 }}>
        Thank you for reaching out to Crysta IVF, Bangalore.
        We are honored to be part of your journey toward parenthood.
      </Typography>

      <Typography sx={{ mb: 2 }}>
        👉 Fill the IVF Inquiry Form
        <br />
        https://example.com/ivf-inquiry-form
      </Typography>

      <Typography sx={{ mb: 2 }}>
        Warm regards,
        <br />
        Crysta IVF, Bangalore
      </Typography>

    </div>

    {/* FOOTER */}
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "16px",
        marginTop: "24px",
      }}
    >
      <button
        className="cancel"
        onClick={() => setPreviewOpen(false)}
      >
        Cancel
      </button>

      <button
        className="send-btn"
        onClick={() => {
          setPreviewOpen(false);
          setComposeOpen(true);
        }}
      >
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
              className="cancel"
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