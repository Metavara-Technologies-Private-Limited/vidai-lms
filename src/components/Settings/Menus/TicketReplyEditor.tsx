import {
  Box,
  Typography,
  Avatar,
  Stack,
  Popover,
  InputBase,
  Divider,
  Button,
  Checkbox,
  TextField,
  IconButton,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
// import type { Employee } from "../../../services/leads.api";
import type { SxProps, Theme } from "@mui/material/styles";
import DeleteMail from "../../../assets/icons/Delete_icon.svg";
export interface TicketReplyEditorProps {
  openReply: boolean;
  setOpenReply: (v: boolean) => void;

  fromEmail: string;
  setFromEmail: (v: string) => void;

  replyTo: string[];
  setReplyTo: (v: string[]) => void;

  replyCc: string[];
  setReplyCc: (v: string[]) => void;

  replyBcc: string[];
  setReplyBcc: (v: string[]) => void;

  replySubject: string;
  setReplySubject: (v: string) => void;

  replyMessage: string;
  setReplyMessage: (v: string) => void;
  replyAttachments?: ReplyAttachment[];
  onViewAttachment?: (file: string) => void;
  onRemoveAttachment?: (id: string) => void;

  recipients?: LeadRecipient[];
  employees?: unknown[];
  anchorEl: HTMLElement | null;
  setAnchorEl: (v: HTMLElement | null) => void;

  showEmoji: boolean;
  setShowEmoji: (v: boolean) => void;

  handleSendReply: () => void;
  handleCancelReply: () => void;

  handleAttachClick: () => void;
  handleInsertLink: () => void;
  handleInsertDriveLink: () => void;
  handleImageClick: () => void;
  handleEmojiInsert: (e: string) => void;

  setOpenTemplateDialog: (v: boolean) => void;

  iconSx: SxProps<Theme>;
}

interface LeadRecipient {
  id: string;
  name: string;
  email: string;
}

interface ReplyAttachment {
  id: string;
  name: string;
  file: string;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const MAX_REPLY_SUBJECT_LENGTH = 150;
const MAX_REPLY_MESSAGE_LENGTH = 500;

const getPlainTextLength = (html: string): number => {
  if (!html) return 0;
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return (temp.textContent || "").trim().length;
};

const TicketReplyEditor = ({
  openReply,
  fromEmail,
  setFromEmail,
  replyTo,
  setReplyTo,
  replyCc,
  setReplyCc,
  replyBcc,
  setReplyBcc,
  replySubject,
  setReplySubject,
  replyMessage,
  setReplyMessage,
  replyAttachments = [],
  onViewAttachment,
  onRemoveAttachment,
  recipients = [],
  anchorEl,
  setAnchorEl,
  showEmoji,
  setShowEmoji,
  handleSendReply,
  handleCancelReply,
  handleAttachClick,
  handleInsertLink,
  handleInsertDriveLink,
  handleImageClick,
  handleEmojiInsert,
  setOpenTemplateDialog,
  iconSx,
}: TicketReplyEditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const toRowRef = useRef<HTMLDivElement | null>(null);
  const pickerPaperRef = useRef<HTMLDivElement | null>(null);
  const ccFieldRef = useRef<HTMLDivElement | null>(null);
  const bccFieldRef = useRef<HTMLDivElement | null>(null);
  const ccPickerPaperRef = useRef<HTMLDivElement | null>(null);
  const bccPickerPaperRef = useRef<HTMLDivElement | null>(null);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [toInput, setToInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [ccAnchorEl, setCcAnchorEl] = useState<HTMLElement | null>(null);
  const [bccAnchorEl, setBccAnchorEl] = useState<HTMLElement | null>(null);
  const replyMessageLength = getPlainTextLength(replyMessage);

  useEffect(() => {
    if (!editorRef.current) return;

    if (replyMessage && editorRef.current.innerHTML !== replyMessage) {
      editorRef.current.innerHTML = replyMessage;
    }
  }, [replyMessage]);

  const openPicker = Boolean(anchorEl);
  const openCcPicker = Boolean(ccAnchorEl);
  const openBccPicker = Boolean(bccAnchorEl);

  useEffect(() => {
    if (!openPicker && !openCcPicker && !openBccPicker) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      const clickedInToPicker = pickerPaperRef.current?.contains(target);
      const clickedInCcField = ccFieldRef.current?.contains(target);
      const clickedInCcPicker = ccPickerPaperRef.current?.contains(target);
      const clickedInBccField = bccFieldRef.current?.contains(target);
      const clickedInBccPicker = bccPickerPaperRef.current?.contains(target);

      if (!clickedInToPicker) {
        setAnchorEl(null);
      }
      if (!clickedInCcField && !clickedInCcPicker) {
        setCcAnchorEl(null);
      }
      if (!clickedInBccField && !clickedInBccPicker) {
        setBccAnchorEl(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [openPicker, openCcPicker, openBccPicker, setAnchorEl]);

  if (!openReply) return null;

  const addUniqueEmail = (
    list: string[],
    setList: (value: string[]) => void,
    email: string,
  ) => {
    const cleaned = email.trim();
    if (!cleaned || !isValidEmail(cleaned)) return;

    const exists = list.some(
      (item) => normalizeEmail(item) === normalizeEmail(cleaned),
    );
    if (exists) return;

    setList([...list, cleaned]);
  };

  const addEmailsFromInput = (
    value: string,
    list: string[],
    setList: (value: string[]) => void,
  ) => {
    const chunks = value
      .split(/[;,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (chunks.length === 0) return;

    const next = [...list];
    chunks.forEach((mail) => {
      if (!isValidEmail(mail)) return;
      const exists = next.some(
        (item) => normalizeEmail(item) === normalizeEmail(mail),
      );
      if (!exists) {
        next.push(mail);
      }
    });
    setList(next);
  };

  const toggleToRecipient = (email: string) => {
    const exists = replyTo.some(
      (mail) => normalizeEmail(mail) === normalizeEmail(email),
    );
    if (exists) {
      setReplyTo(
        replyTo.filter(
          (mail) => normalizeEmail(mail) !== normalizeEmail(email),
        ),
      );
      return;
    }
    addUniqueEmail(replyTo, setReplyTo, email);
  };

  const toggleRecipient = (
    email: string,
    list: string[],
    setList: (value: string[]) => void,
  ) => {
    const exists = list.some(
      (mail) => normalizeEmail(mail) === normalizeEmail(email),
    );
    if (exists) {
      setList(
        list.filter((mail) => normalizeEmail(mail) !== normalizeEmail(email)),
      );
      return;
    }
    addUniqueEmail(list, setList, email);
  };

  const getFilteredRecipients = (query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return recipients;

    return recipients.filter((lead) => {
      const name = (lead.name || "").toLowerCase();
      const email = (lead.email || "").toLowerCase();
      return name.includes(normalized) || email.includes(normalized);
    });
  };

  const filteredToRecipients = getFilteredRecipients(toInput);
  const filteredCcRecipients = getFilteredRecipients(ccInput);
  const filteredBccRecipients = getFilteredRecipients(bccInput);

  const handleBold = () => {
    editorRef.current?.focus();
    document.execCommand("bold");
  };

  const handleItalic = () => {
    editorRef.current?.focus();
    document.execCommand("italic");
  };

  const handleUnderline = () => {
    editorRef.current?.focus();
    document.execCommand("underline");
  };

  const handleEditorClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const anchor = target.closest("a");

    if (!anchor?.href) return;

    event.preventDefault();
    window.open(anchor.href, "_blank", "noopener,noreferrer");
  };

  const commitPendingRecipientInputs = () => {
    addEmailsFromInput(toInput, replyTo, setReplyTo);
    addEmailsFromInput(ccInput, replyCc, setReplyCc);
    addEmailsFromInput(bccInput, replyBcc, setReplyBcc);
    setToInput("");
    setCcInput("");
    setBccInput("");
  };

  return (
    <Box mt={3} p={3} borderRadius={2} bgcolor="#FFFFFF">
      {/* FROM ROW */}
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        pb={1.2}
        borderBottom="1px solid #E6E6E6"
      >
        <Typography fontSize={14} color="#7A7A7A" minWidth={48}>
          From :
        </Typography>

        <TextField
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder="Enter sender email"
          variant="standard"
          sx={{ minWidth: 260, "& .MuiInputBase-input": { fontSize: 14 } }}
          InputProps={{ disableUnderline: true }}
        />
      </Box>

      {/* TO ROW */}
      <Box
        ref={toRowRef}
        display="flex"
        alignItems="flex-start"
        gap={1}
        pb={1.5}
        borderBottom="1px solid #E6E6E6"
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          cursor: "default",
        }}
      >
        <Typography fontSize={14} color="#7A7A7A">
          To :
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap" flex={1} minWidth={180}>
          {replyTo.map((mail) => (
            <Box
              key={mail}
              display="flex"
              alignItems="center"
              gap={1}
              px={1.2}
              py={0.5}
              borderRadius="16px"
              bgcolor="#F1F3F5"
            >
              <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>
                {mail.charAt(0).toUpperCase()}
              </Avatar>

              <Typography fontSize={13} fontWeight={500}>
                {mail}
              </Typography>

              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyTo(
                    replyTo.filter(
                      (m) => normalizeEmail(m) !== normalizeEmail(mail),
                    ),
                  );
                }}
                sx={{
                  cursor: "pointer",
                  fontSize: 16,
                  color: "#7A7A7A",
                  "&:hover": { color: "#000" },
                }}
              >
                ×
              </Box>
            </Box>
          ))}
          <InputBase
            value={toInput}
            placeholder="Add TO recipients"
            onClick={(e) => e.stopPropagation()}
            onFocus={() => {
              if (recipients.length > 0 && toRowRef.current) {
                setAnchorEl(toRowRef.current);
              }
            }}
            onChange={(e) => {
              setToInput(e.target.value);
            }}
            onBlur={() => {
              addEmailsFromInput(toInput, replyTo, setReplyTo);
              setToInput("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
                e.preventDefault();
                addEmailsFromInput(toInput, replyTo, setReplyTo);
                setToInput("");
              }
            }}
            sx={{ minWidth: 180, fontSize: 14, flex: 1 }}
          />
        </Box>

        <Box display="flex" gap={1} ml="auto" pt={0.5}>
          <Typography
            onClick={(e) => {
              e.stopPropagation();
              setShowCc(!showCc);
            }}
            sx={{
              fontSize: 13,
              cursor: "pointer",
              color: showCc || replyCc.length > 0 ? "#232323" : "#9E9E9E",
              fontWeight: showCc || replyCc.length > 0 ? 600 : 400,
            }}
          >
            Cc
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#9E9E9E", fontWeight: 600 }}>
            |
          </Typography>
          <Typography
            onClick={(e) => {
              e.stopPropagation();
              setShowBcc(!showBcc);
            }}
            sx={{
              fontSize: 13,
              cursor: "pointer",
              color: showBcc || replyBcc.length > 0 ? "#232323" : "#9E9E9E",
              fontWeight: showBcc || replyBcc.length > 0 ? 600 : 400,
            }}
          >
            Bcc
          </Typography>
        </Box>

        <Popover
          open={openPicker}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          disableAutoFocus
          disableEnforceFocus
          disableRestoreFocus
          PaperProps={{
            ref: (node: HTMLDivElement) => {
              pickerPaperRef.current = node;
            },
            onClick: (e: React.MouseEvent<HTMLDivElement>) =>
              e.stopPropagation(),
          }}
        >
          <Box sx={{ width: 320, maxHeight: 260, overflowY: "auto", p: 1 }}>
            {filteredToRecipients.length === 0 ? (
              <Typography fontSize={13} color="text.secondary" p={1}>
                No recipients available
              </Typography>
            ) : (
              filteredToRecipients.map((lead) => (
                <Box
                  key={lead.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleToRecipient(lead.email);
                  }}
                  sx={{
                    p: 0.8,
                    borderRadius: 1,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    "&:hover": { backgroundColor: "#F5F5F5" },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={replyTo.some(
                      (mail) =>
                        normalizeEmail(mail) === normalizeEmail(lead.email),
                    )}
                    onChange={() => toggleToRecipient(lead.email)}
                  />
                  <Box>
                    <Typography fontSize={13} fontWeight={500}>
                      {lead.name}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      {lead.email}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Popover>
      </Box>
      {/* CC ROW */}
      {(showCc || replyCc.length > 0) && (
        <Box
          ref={ccFieldRef}
          display="flex"
          alignItems="center"
          gap={1}
          py={1}
          borderBottom="1px solid #E6E6E6"
        >
          <Typography fontSize={14} color="#7A7A7A" minWidth={35}>
            Cc :
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap" flex={1}>
            {replyCc.map((mail) => (
              <Box
                key={mail}
                display="flex"
                alignItems="center"
                gap={1}
                px={1.2}
                py={0.4}
                borderRadius="16px"
                bgcolor="#F1F3F5"
              >
                <Typography fontSize={13}>{mail}</Typography>
                <Box
                  component="span"
                  sx={{ cursor: "pointer", fontSize: 15, color: "#666" }}
                  onClick={() =>
                    setReplyCc(
                      replyCc.filter(
                        (item) => normalizeEmail(item) !== normalizeEmail(mail),
                      ),
                    )
                  }
                >
                  ×
                </Box>
              </Box>
            ))}
            <InputBase
              value={ccInput}
              placeholder="Add CC recipients"
              onFocus={() => setCcAnchorEl(ccFieldRef.current)}
              onChange={(e) => {
                setCcInput(e.target.value);
              }}
              onBlur={() => {
                addEmailsFromInput(ccInput, replyCc, setReplyCc);
                setCcInput("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
                  e.preventDefault();
                  addEmailsFromInput(ccInput, replyCc, setReplyCc);
                  setCcInput("");
                }
              }}
              sx={{ minWidth: 180, fontSize: 14, flex: 1 }}
            />
          </Box>

          <Popover
            open={openCcPicker}
            anchorEl={ccAnchorEl}
            onClose={() => setCcAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            disableAutoFocus
            disableEnforceFocus
            disableRestoreFocus
            PaperProps={{
              ref: (node: HTMLDivElement) => {
                ccPickerPaperRef.current = node;
              },
              onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
                e.preventDefault();
              },
            }}
          >
            <Box sx={{ width: 320, maxHeight: 240, overflowY: "auto", p: 1 }}>
              {filteredCcRecipients.length === 0 ? (
                <Typography fontSize={12} color="text.secondary" p={1}>
                  No matching recipients
                </Typography>
              ) : (
                filteredCcRecipients.map((lead) => (
                  <Box
                    key={`cc-${lead.id}`}
                    onClick={() =>
                      toggleRecipient(lead.email, replyCc, setReplyCc)
                    }
                    sx={{
                      p: 0.8,
                      borderRadius: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      "&:hover": { backgroundColor: "#F5F5F5" },
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={replyCc.some(
                        (mail) =>
                          normalizeEmail(mail) === normalizeEmail(lead.email),
                      )}
                      onChange={() =>
                        toggleRecipient(lead.email, replyCc, setReplyCc)
                      }
                    />
                    <Box>
                      <Typography fontSize={13} fontWeight={500}>
                        {lead.name}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {lead.email}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Popover>
        </Box>
      )}

      {/* BCC ROW */}
      {(showBcc || replyBcc.length > 0) && (
        <Box
          ref={bccFieldRef}
          display="flex"
          alignItems="center"
          gap={1}
          py={1}
          borderBottom="1px solid #E6E6E6"
        >
          <Typography fontSize={14} color="#7A7A7A" minWidth={40}>
            Bcc :
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap" flex={1}>
            {replyBcc.map((mail) => (
              <Box
                key={mail}
                display="flex"
                alignItems="center"
                gap={1}
                px={1.2}
                py={0.4}
                borderRadius="16px"
                bgcolor="#F1F3F5"
              >
                <Typography fontSize={13}>{mail}</Typography>
                <Box
                  component="span"
                  sx={{ cursor: "pointer", fontSize: 15, color: "#666" }}
                  onClick={() =>
                    setReplyBcc(
                      replyBcc.filter(
                        (item) => normalizeEmail(item) !== normalizeEmail(mail),
                      ),
                    )
                  }
                >
                  ×
                </Box>
              </Box>
            ))}
            <InputBase
              value={bccInput}
              placeholder="Add BCC recipients"
              onFocus={() => setBccAnchorEl(bccFieldRef.current)}
              onChange={(e) => {
                setBccInput(e.target.value);
              }}
              onBlur={() => {
                addEmailsFromInput(bccInput, replyBcc, setReplyBcc);
                setBccInput("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
                  e.preventDefault();
                  addEmailsFromInput(bccInput, replyBcc, setReplyBcc);
                  setBccInput("");
                }
              }}
              sx={{ minWidth: 180, fontSize: 14, flex: 1 }}
            />
          </Box>

          <Popover
            open={openBccPicker}
            anchorEl={bccAnchorEl}
            onClose={() => setBccAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            disableAutoFocus
            disableEnforceFocus
            disableRestoreFocus
            PaperProps={{
              ref: (node: HTMLDivElement) => {
                bccPickerPaperRef.current = node;
              },
              onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
                e.preventDefault();
              },
            }}
          >
            <Box sx={{ width: 320, maxHeight: 240, overflowY: "auto", p: 1 }}>
              {filteredBccRecipients.length === 0 ? (
                <Typography fontSize={12} color="text.secondary" p={1}>
                  No matching recipients
                </Typography>
              ) : (
                filteredBccRecipients.map((lead) => (
                  <Box
                    key={`bcc-${lead.id}`}
                    onClick={() =>
                      toggleRecipient(lead.email, replyBcc, setReplyBcc)
                    }
                    sx={{
                      p: 0.8,
                      borderRadius: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      "&:hover": { backgroundColor: "#F5F5F5" },
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={replyBcc.some(
                        (mail) =>
                          normalizeEmail(mail) === normalizeEmail(lead.email),
                      )}
                      onChange={() =>
                        toggleRecipient(lead.email, replyBcc, setReplyBcc)
                      }
                    />
                    <Box>
                      <Typography fontSize={13} fontWeight={500}>
                        {lead.name}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {lead.email}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Popover>
        </Box>
      )}

      {/* SUBJECT */}
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        pb={1.5}
        borderBottom="1px solid #E6E6E6"
      >
        <Typography fontSize={13} color="#9E9E9E" minWidth={60}>
          Subject :
        </Typography>

        <InputBase
          value={replySubject}
          onChange={(e) =>
            setReplySubject(e.target.value.slice(0, MAX_REPLY_SUBJECT_LENGTH))
          }
          placeholder="Enter subject"
          sx={{ flex: 1, fontSize: 14, fontWeight: 500 }}
          inputProps={{ maxLength: MAX_REPLY_SUBJECT_LENGTH }}
        />

        <Typography
          fontSize={11}
          color={
            replySubject.length >= MAX_REPLY_SUBJECT_LENGTH
              ? "error.main"
              : "text.secondary"
          }
        >
          {replySubject.length}/{MAX_REPLY_SUBJECT_LENGTH}
        </Typography>
      </Box>

      {/* MESSAGE */}
      <Box display="flex" justifyContent="flex-end" mt={0.75}>
        <Typography
          fontSize={11}
          color={
            replyMessageLength >= MAX_REPLY_MESSAGE_LENGTH
              ? "error.main"
              : "text.secondary"
          }
        >
          {replyMessageLength}/{MAX_REPLY_MESSAGE_LENGTH}
        </Typography>
      </Box>
      <Box
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-label="Write your reply..."
        suppressContentEditableWarning
        onClick={handleEditorClick}
        onInput={(e) => setReplyMessage((e.target as HTMLDivElement).innerHTML)}
        sx={{
          mt: 1,
          width: "100%",
          minHeight: 150,
          fontSize: 14,
          lineHeight: 1.6,
          padding: 0,
          outline: "none",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          "&:empty:before": {
            content: '"Write your reply..."',
            color: "#9E9E9E",
          },
        }}
        data-placeholder="Write your reply..."
      />

      {replyAttachments.length > 0 && (
        <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap mt={1.5}>
          {replyAttachments.map((attachment) => (
            <Box
              key={attachment.id}
              sx={{
                minWidth: 220,
                maxWidth: "100%",
                p: 1,
                border: "1px solid #DADCE0",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "#FFFFFF",
              }}
            >
              <InsertDriveFileOutlinedIcon
                sx={{ fontSize: 22, color: "#5F6368", flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  fontSize={13}
                  fontWeight={600}
                  noWrap
                  title={attachment.name}
                >
                  {attachment.name}
                </Typography>
                <Typography
                  component="button"
                  type="button"
                  onClick={() => onViewAttachment?.(attachment.file)}
                  sx={{
                    border: 0,
                    p: 0,
                    bgcolor: "transparent",
                    color: "#D85B45",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  View
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => onRemoveAttachment?.(attachment.id)}
                sx={{ color: "#5F6368" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 1.5 }} />

      {/* TOOLBAR */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <FormatBoldIcon sx={iconSx} onClick={handleBold} />
        <FormatItalicIcon sx={iconSx} onClick={handleItalic} />
        <FormatUnderlinedIcon sx={iconSx} onClick={handleUnderline} />
        <AttachFileIcon sx={iconSx} onClick={handleAttachClick} />
        <LinkIcon sx={iconSx} onClick={handleInsertLink} />
        <InsertEmoticonIcon
          sx={iconSx}
          onClick={() => setShowEmoji(!showEmoji)}
        />
        <CloudOutlinedIcon sx={iconSx} onClick={handleInsertDriveLink} />
        <ImageOutlinedIcon sx={iconSx} onClick={handleImageClick} />
        <AddBoxOutlinedIcon
          sx={iconSx}
          onClick={() => setOpenTemplateDialog(true)}
        />
      </Stack>

      {showEmoji && (
        <Box
          mt={1}
          p={1}
          border="1px solid #E0E0E0"
          borderRadius={2}
          display="flex"
          gap={1}
        >
          {["🙂", "👍", "🙏", "😊", "✔️", "🎉", "📩", "⭐"].map((e) => (
            <Typography
              key={e}
              sx={{ cursor: "pointer", fontSize: 20 }}
              onClick={() => handleEmojiInsert(e)}
            >
              {e}
            </Typography>
          ))}
        </Box>
      )}

      {/* ACTIONS */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        spacing={1}
        mt={1}
      >
        <Button onClick={handleCancelReply} sx={{ minWidth: "auto", p: 0.6 }}>
          <img
            src={DeleteMail}
            alt="Cancel"
            style={{ width: 45, height: 45 }}
          />
        </Button>

        <Button
          variant="contained"
          onClick={() => {
            commitPendingRecipientInputs();
            handleSendReply();
          }}
          sx={{
            height: 32,
            px: 2.2,
            fontSize: "13px",
            textTransform: "none",
            bgcolor: "#505050",
            borderRadius: "6px",
            "&:hover": { bgcolor: "#232323" },
          }}
        >
          Send
        </Button>
      </Stack>
    </Box>
  );
};

export default TicketReplyEditor;
