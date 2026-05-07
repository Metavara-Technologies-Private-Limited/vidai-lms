/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import "react-toastify/dist/ReactToastify.css";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import styles from "../../../styles/Template/NewTemplateModal.module.css";
import { PreviewWhatsAppTemplateModal } from "./PreviewWhatsAppTemplateModal";
import type {
  NewWhatsAppTemplateFormProps,
  TemplateDocument,
} from "../../../types/templates.types";
import type { UseCase } from "../../../services/usecase.api";
import { toast } from "react-toastify";

const TEMPLATE_NAME_REGEX = /^[A-Za-z0-9\s–-]*$/;

const getDocumentUrl = (doc: TemplateDocument): string => {
  const candidate = doc.file_url || doc.file || doc.url || "";
  if (!candidate) return "";
  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    return candidate;
  }
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
    /\/api\/?$/,
    "",
  );
  return `${baseUrl}${candidate}`;
};

const getDocumentName = (doc: TemplateDocument): string => {
  return (
    doc.name ||
    doc.filename ||
    doc.file?.split("/").pop() ||
    doc.file_url?.split("/").pop() ||
    "Document"
  );
};

const extractDocuments = (payload: unknown): TemplateDocument[] => {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const candidates = [
    record.documents,
    record.template_documents,
    record.files,
    record.attachments,
  ];
  const match = candidates.find((value) => Array.isArray(value));
  return Array.isArray(match) ? (match as TemplateDocument[]) : [];
};

interface NewWhatsAppTemplateFormExtendedProps extends NewWhatsAppTemplateFormProps {
  useCases?: UseCase[];
}

export const NewWhatsAppTemplateForm: React.FC<
  NewWhatsAppTemplateFormExtendedProps
> = ({ onClose, onSave, initialData, mode, useCases = [] }) => {
  const isViewOnly = mode === "view";
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingDocuments, setExistingDocuments] = useState<
    TemplateDocument[]
  >([]);
  const [removedExistingDocumentIds, setRemovedExistingDocumentIds] = useState<
    string[]
  >([]);

  // Helper to get styling for the chips (matched to Table styles)
  const getUseCaseStyles = (useCase: string | undefined) => {
    const safeCase = (useCase || "default").trim().toLowerCase();

    switch (safeCase) {
      case "appointment":
        return {
          color: "#16A34A",
          bgColor: "#F0FDF4",
          borderColor: "#DCFCE7",
        };

      case "follow-up":
      case "followup":
        return {
          color: "#3B82F6",
          bgColor: "#EFF6FF",
          borderColor: "#DBEAFE",
        };

      case "reminder":
        return {
          color: "#D97706",
          bgColor: "#FFFBEB",
          borderColor: "#FEF3C7",
        };

      case "re-engagement":
      case "reengagement":
        return {
          color: "#7C3AED",
          bgColor: "#F5F3FF",
          borderColor: "#E9D5FF",
        };

      case "feedback":
        return {
          color: "#EA580C",
          bgColor: "#FFF7ED",
          borderColor: "#FFEDD5",
        };

      default:
        return {
          color: "#6B7280",
          bgColor: "#F9FAFB",
          borderColor: "#F3F4F6",
        };
    }
  };

  const getClinicId = (): number => {
    const stored = localStorage.getItem("clinic_id");
    return stored ? parseInt(stored, 10) : (initialData as any)?.clinic || 1;
  };

  // Normalize useCase to match MenuItem values (capitalize first letter)
  // Also handles API responses that might come in different formats
  // const normalizeUseCase = (value: string | undefined) => {
  //   if (!value) return "";
  //   const trimmed = value.trim().toLowerCase();

  //   // Map common API variations to canonical form
  //   const mapping: Record<string, string> = {
  //     appointment: "Appointment",
  //     confirm: "Appointment",
  //     confirmation: "Appointment",
  //     reminder: "Reminder",
  //     feedback: "Feedback",
  //     marketing: "Marketing",
  //     campaign: "Marketing",
  //     promotion: "Marketing",
  //   };

  //   return (
  //     mapping[trimmed] ||
  //     value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  //   );
  // };

  const [formData, setFormData] = useState({
    name:
      (initialData as any)?.name || (initialData as any)?.audience_name || "",
    useCase: String(
      (initialData as any)?.useCase || (initialData as any)?.use_case || "",
    ),
    body:
      (initialData as any)?.body ||
      (initialData as any)?.email_body ||
      (initialData as any)?.subject ||
      "",
  });

  // Sync formData when initialData changes (for edit/view mode)
  React.useEffect(() => {
    if (initialData) {
      const data = initialData as any;
      setFormData({
        name: data?.name || data?.audience_name || "",
        useCase: String(data?.useCase || data?.use_case || ""),
        body: data?.body || data?.email_body || data?.subject || "",
      });
      setExistingDocuments(extractDocuments(initialData));
      setRemovedExistingDocumentIds([]);
      setSelectedFile(null);
      console.log("WhatsApp Form - Updated formData from initialData:", {
        name: data?.name || data?.audience_name,
        useCase: String(data?.useCase || data?.use_case || ""),
        body: data?.body || data?.email_body || data?.subject,
      });
    }
  }, [initialData]); // Re-sync when initialData changes

  const handleInputChange = (field: string, value: string) => {
    if (field === "name") {
      if (!TEMPLATE_NAME_REGEX.test(value)) {
        toast.error(
          "Template name can only contain letters, numbers, spaces, and hyphens",
          {
            toastId: "template-name-alpha",
          },
        );
        return;
      }
      if (value.length > 50) return;
    }
    if (field === "body" && value.length > 1000) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const removeExistingDocument = (documentId?: string | number) => {
    if (documentId === undefined || documentId === null) return;
    const normalized = String(documentId);
    setExistingDocuments((prev) =>
      prev.filter((doc) => String(doc.id) !== normalized),
    );
    setRemovedExistingDocumentIds((prev) =>
      prev.includes(normalized) ? prev : [...prev, normalized],
    );
  };

  // ─── ONLY CHANGE: pass selectedFile as second argument ───────────────────────
  // NewTemplateModal.handleFormSaveWithFiles(payload, files) receives both,
  // saves the template first (gets id back), then POSTs the file to
  // POST /api/templates/whatsapp/{id}/documents/ → inserts into restapi_template_whatsapp_document
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name filed is mandtory", {
        toastId: "template-name-required",
      });
      return;
    }

    if (!formData.useCase) {
      toast.error("Use case is mandatory", {
        toastId: "template-usecase-required",
      });
      return;
    }

    if (!formData.body.trim()) {
      toast.error("Body is required", { toastId: "template-body-required" });
      return;
    }

    if (formData.name.length > 50) {
      toast.error("Name cannot exceed 50 characters", {
        toastId: "template-name-limit",
      });
      return;
    }

    if (formData.body.length > 1000) {
      toast.error("Body cannot exceed 1000 characters", {
        toastId: "template-body-limit",
      });
      return;
    }

    const clinicId = getClinicId();

    const apiPayload = {
      name: formData.name,
      body: formData.body,
      use_case: formData.useCase,
      clinic: clinicId,
      subject: "WhatsApp Message",
      is_active: true,
    };

    console.log(
      "🚀 Saving WhatsApp with File:",
      selectedFile?.name || "No file",
    );

    const files = selectedFile ? [selectedFile] : [];
    await onSave(apiPayload, files, removedExistingDocumentIds);
  };

  const selectedUseCase = useCases.find(
    (uc) => String(uc.id) === String(formData.useCase),
  );

  if (showPreview) {
    return (
      <PreviewWhatsAppTemplateModal
        open={showPreview}
        onClose={onClose}
        onBackToEdit={() => setShowPreview(false)}
        onSave={handleSave}
        templateData={formData}
      />
    );
  }

  return (
    <Box className={styles.formContainer}>
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>
          {isViewOnly
            ? "View WhatsApp Template"
            : mode === "edit"
              ? "Edit WhatsApp Template"
              : "New WhatsApp Template"}
        </Typography>
        <IconButton onClick={onClose} size="small" className={styles.closeBtn}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box className={styles.formBody} sx={{ p: 3 }}>
        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.75,
            }}
          >
            <Typography
              className={styles.fieldLabel}
              sx={{ mb: "0 !important" }}
            >
              Name
            </Typography>
            <Typography
              sx={{
                fontSize: "11px",
                color: formData.name.length >= 50 ? "#EF4444" : "#9CA3AF",
              }}
            >
              {formData.name.length}/50
            </Typography>
          </Box>
          <OutlinedInput
            fullWidth
            size="small"
            placeholder="Enter template name"
            value={formData.name}
            disabled={isViewOnly}
            inputProps={{ maxLength: 50 }}
            onChange={(e) => handleInputChange("name", e.target.value)}
            sx={{
              borderRadius: "8px",
              backgroundColor: isViewOnly ? "#F9FAFB" : "#fff",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: formData.name.length >= 50 ? "#EF4444" : undefined,
              },
            }}
          />
        </Box>

        {/* ✅ UPDATED: Use Case Field with Styled Chips */}
        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Typography className={styles.fieldLabel}>Use Case</Typography>
          <Select
            fullWidth
            size="small"
            value={formData.useCase || ""}
            disabled={isViewOnly}
            onChange={(e) =>
              handleInputChange("useCase", e.target.value as string)
            }
            IconComponent={KeyboardArrowDownIcon}
            renderValue={(selected) => {
              if (!selected) {
                return (
                  <Typography color="#9CA3AF" sx={{ fontSize: "14px" }}>
                    Select Use Case
                  </Typography>
                );
              }

              const matched = useCases.find(
                (uc) => String(uc.id) === String(selected),
              );

              const label = matched?.name || String(selected);

              const ui = getUseCaseStyles(label);

              return (
                <Chip
                  label={label}
                  sx={{
                    color: ui.color,
                    bgcolor: ui.bgColor,
                    border: `1px solid ${ui.borderColor}`,
                    fontWeight: 600,
                    fontSize: "11px",
                    height: "24px",
                    borderRadius: "100px",
                  }}
                />
              );
            }}
            sx={{
              borderRadius: "8px",
              backgroundColor: isViewOnly ? "#F9FAFB" : "#fff",
            }}
          >
            {!selectedUseCase && <MenuItem value="">Select Use Case</MenuItem>}

            {useCases.map((uc) => {
              const ui = getUseCaseStyles(uc.name);

              return (
                <MenuItem key={String(uc.id)} value={String(uc.id)}>
                  <Chip
                    label={uc.name}
                    sx={{
                      color: ui.color,
                      bgcolor: ui.bgColor,
                      border: `1px solid ${ui.borderColor}`,
                      fontWeight: 600,
                      fontSize: "11px",
                      height: "24px",
                      borderRadius: "100px",
                    }}
                  />
                </MenuItem>
              );
            })}
          </Select>
        </Box>

        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.75,
            }}
          >
            <Typography
              className={styles.fieldLabel}
              sx={{ mb: "0 !important" }}
            >
              Body
            </Typography>
            <Typography
              sx={{
                fontSize: "11px",
                color: formData.body.length >= 1000 ? "#EF4444" : "#9CA3AF",
              }}
            >
              {formData.body.length}/1000
            </Typography>
          </Box>
          <textarea
            className={styles.textArea}
            rows={8}
            placeholder="Hi {{1}}, thank you for choosing our clinic..."
            value={formData.body}
            disabled={isViewOnly}
            maxLength={1000}
            onChange={(e) => handleInputChange("body", e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${formData.body.length >= 1000 ? "#EF4444" : "#E5E7EB"}`,
              fontFamily: "inherit",
              resize: "vertical",
              backgroundColor: isViewOnly ? "#F9FAFB" : "#fff",
            }}
          />
        </Box>

        <Box className={styles.formGroup}>
          <Typography className={styles.fieldLabel}>
            Upload Documents
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              border: "1px dashed #E5E7EB",
              borderRadius: "8px",
              backgroundColor: isViewOnly ? "#F9FAFB" : "transparent",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              hidden
            />
            <Button
              variant="contained"
              onClick={() => fileInputRef.current?.click()}
              disabled={isViewOnly}
              sx={{
                bgcolor: "#F3F4F6",
                color: "#374151",
                textTransform: "none",
                boxShadow: "none",
              }}
            >
              Choose File
            </Button>
            <Typography
              variant="body2"
              sx={{ color: selectedFile ? "#374151" : "#9CA3AF" }}
            >
              {selectedFile ? selectedFile.name : "No File Chosen"}
            </Typography>
          </Box>

          {existingDocuments.length > 0 && (
            <Box
              sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}
            >
              {existingDocuments.map((doc) => {
                const url = getDocumentUrl(doc);
                const name = getDocumentName(doc);
                return (
                  <Box
                    key={String(doc.id ?? name)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      bgcolor: "#F9FAFB",
                    }}
                  >
                    <Typography
                      component={url ? "a" : "span"}
                      href={url || undefined}
                      target={url ? "_blank" : undefined}
                      rel={url ? "noopener noreferrer" : undefined}
                      sx={{
                        flex: 1,
                        fontSize: "12px",
                        color: url ? "#2563EB" : "#374151",
                        textDecoration: url ? "underline" : "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </Typography>
                    {!isViewOnly && (
                      <IconButton
                        size="small"
                        onClick={() => removeExistingDocument(doc.id)}
                        sx={{ p: 0.5 }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      <Box className={styles.modalFooter}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "none",
            fontSize: "14px",
            borderColor: "#D1D5DB",
            color: "#374151",
            px: 3,
            "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" },
          }}
        >
          {isViewOnly ? "Close" : "Cancel"}
        </Button>
        {!isViewOnly && (
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => setShowPreview(true)}
              sx={{
                textTransform: "none",
                fontSize: "14px",
                borderColor: "#D1D5DB",
                color: "#374151",
                px: 3,
                "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" },
              }}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                textTransform: "none",
                fontSize: "14px",
                bgcolor: "#111827",
                px: 3,
                boxShadow: "none",
                "&:hover": { bgcolor: "#000" },
              }}
            >
              Save
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};