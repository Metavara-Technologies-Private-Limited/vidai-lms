import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  DialogContent,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import SmsIcon from "@mui/icons-material/Sms";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import styles from "../../../styles/Template/NewTemplateModal.module.css";
import { NewEmailTemplateForm } from "./NewEmailTemplateForm";
import { NewSMSTemplateForm } from "./NewSMSTemplateForm";
import { NewWhatsAppTemplateForm } from "./NewWhatsAppTemplateForm";
import TemplateService, { type APITemplateType } from "../../../services/templates.api";
import type { EmailTemplate, SMSTemplate, WhatsAppTemplate } from '../../../types/templates.types';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: unknown) => void | Promise<void>;
  initialData?: EmailTemplate | SMSTemplate | WhatsAppTemplate | undefined;
  mode: "create" | "edit" | "view";
}

export const NewTemplateModal: React.FC<ModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  mode,
}) => {
  const [view, setView] = useState<"select" | "email" | "sms" | "whatsapp">("select");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // First, check if initialData has a 'type' field (from edit action)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataType = (initialData as any)?.type;

      if (dataType === 'whatsapp') {
        setView('whatsapp');
      } else if (dataType === 'sms') {
        setView('sms');
      } else if (dataType === 'email') {
        setView('email');
      } else if (initialData) {
        // Fallback to field-based detection for templates without explicit type
        if ('audience_name' in initialData || 'subject' in initialData) {
          setView('email');
        } else if ('body' in initialData && !('audience_name' in initialData) && !('subject' in initialData)) {
          // Could be SMS or WhatsApp - default to SMS
          setView('sms');
        }
      } else {
        setView("select");
      }
    }
  }, [open, initialData]);

  const handleClose = () => {
    if (loading) return;
    onClose();
    setTimeout(() => {
      setView("select");
    }, 300);
  };

  // ─── MAIN CHANGE: accepts files as optional second argument ──────────────────
  // Form components call: onSave(payload, files?)
  // This function:
  //   1. Validates template name
  //   2. Calls createTemplate/updateTemplate → gets response WITH id
  //   3. If files present, POSTs each to /templates/{type}/{id}/documents/
  //      which inserts rows into restapi_template_mail/sms/whatsapp_document
  //   4. Calls parent onSave(response) → triggers loadTemplates()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSave = async (formData: any, uploadedFiles?: File[]) => {
    const rawName = formData instanceof FormData
      ? ((formData.get("name") ?? formData.get("audience_name") ?? "") as string)
      : ((formData?.name ?? formData?.audience_name ?? "") as string);
    const templateName = rawName.trim();
    const alphabetOnlyPattern = /^[A-Za-z\s]+$/;

    if (!templateName || !alphabetOnlyPattern.test(templateName)) {
      toast.error("Template name should contain only alphabets.");
      return;
    }

    setLoading(true);

    try {
      // Map UI type to API type
      const apiType: APITemplateType = view === "email" ? "mail" : (view as APITemplateType);

      // Step 1: Save the template — response contains the id
      let response;
      if (mode === "edit" && initialData?.id) {
        response = await TemplateService.updateTemplate(apiType, initialData.id, formData);
      } else {
        response = await TemplateService.createTemplate(apiType, formData);
      }

      console.log("✅ Template saved:", response);

      // Step 2: Upload documents using the returned template id
      // FIX: Ensure templateId is always a string, handle both uuid and numeric ids
      const templateId = response?.id ? String(response.id) : null;

      console.log("📋 Template ID for document upload:", templateId);
      console.log("📁 Files to upload:", uploadedFiles?.length ?? 0);

      if (templateId && uploadedFiles && uploadedFiles.length > 0) {
        console.log(`📎 Uploading ${uploadedFiles.length} document(s) for template id=${templateId}`);
        
        for (const file of uploadedFiles) {
          try {
            console.log(`📤 Uploading file: ${file.name} (${file.size} bytes, type: ${file.type})`);
            
            // FIX: Pass the raw File directly — let uploadTemplateDocument build FormData correctly
            // with both `template` and `template_id` field names
            const docResponse = await TemplateService.uploadTemplateDocument(apiType, templateId, file);
            
            console.log(`✅ Document uploaded successfully: ${file.name}`, docResponse);
          } catch (docErr) {
            // FIX: Log the full error response to diagnose field name mismatch
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const docError = docErr as any;
            console.error(`❌ Failed to upload document: ${file.name}`);
            console.error("   Status:", docError?.response?.status);
            console.error("   Error data:", JSON.stringify(docError?.response?.data, null, 2));
            console.error("   Full error:", docError);
            
            // Build a user-friendly error message from Django validation errors
            let docErrMsg = `Template saved but failed to upload file: ${file.name}`;
            if (docError?.response?.data && typeof docError.response.data === 'object') {
              const fieldErrors = Object.entries(docError.response.data)
                .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : String(msg)}`)
                .join('; ');
              docErrMsg += ` (${fieldErrors})`;
            }
            toast.warning(docErrMsg);
          }
        }
      } else if (uploadedFiles && uploadedFiles.length > 0 && !templateId) {
        // Edge case: files were selected but no template ID returned
        console.warn("⚠️ Cannot upload documents: template ID not found in response", response);
        toast.warning("Template saved but could not upload documents: template ID missing from response.");
      }

      await onSave(response);
      const templateLabel = view === "email" ? "Email" : view === "sms" ? "SMS" : "WhatsApp";
      const message = mode === "edit"
        ? `${templateLabel} template updated successfully!`
        : `${templateLabel} template saved successfully!`;
      toast.success(message);
      handleClose();
    } catch (err) {
      // ✅ IMPROVED ERROR LOGGING: This will help you see the exact field validation error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      console.error("❌ API Error Details:", error?.response?.data);

      let errorMessage = "Failed to save. ";
      if (error?.response?.data) {
        // If the error is an object (Django validation errors), format it nicely
        if (typeof error.response.data === 'object') {
          errorMessage += Object.entries(error.response.data)
            .map(([field, msg]) => {
              if (Array.isArray(msg)) {
                return `${field}: ${msg.join(', ')}`;
              }
              if (msg && typeof msg === 'object') {
                return `${field}: ${JSON.stringify(msg)}`;
              }
              return `${field}: ${String(msg)}`;
            })
            .join(", ");
        } else {
          errorMessage += error.response.data;
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // UI components for overlay and error...
  const LoaderOverlay = loading && (
    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.85)', zIndex: 10, borderRadius: '12px' }}>
      <CircularProgress size={48} />
    </Box>
  );

  if (view === "email") {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        {LoaderOverlay}
        <NewEmailTemplateForm onClose={handleClose} onSave={handleFormSave} initialData={initialData as EmailTemplate | undefined} mode={mode} />
      </Dialog>
    );
  }

  if (view === "sms") {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        {LoaderOverlay}
        <NewSMSTemplateForm onClose={handleClose} onSave={handleFormSave} initialData={initialData as SMSTemplate | undefined} mode={mode} />
      </Dialog>
    );
  }

  if (view === "whatsapp") {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        {LoaderOverlay}
        <NewWhatsAppTemplateForm onClose={handleClose} onSave={handleFormSave} initialData={initialData as WhatsAppTemplate | undefined} mode={mode} />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ className: styles.modalPaper, sx: { maxHeight: '50vh' } }}>
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>New Template</Typography>
        <IconButton onClick={handleClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <DialogContent>
        <Box className={styles.selectionGrid} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, py: 4, flexWrap: 'wrap' }}>        
          <SelectionCard icon={<EmailIcon sx={{ color: "#fff" }} />} title="Email" sub="Create new Email template" onClick={() => setView("email")} bgClass={styles.emailBg} />
          <SelectionCard icon={<SmsIcon sx={{ color: "#fff" }} />} title="SMS" sub="Create new SMS template" onClick={() => setView("sms")} bgClass={styles.smsBg} />
          <SelectionCard icon={<WhatsAppIcon sx={{ color: "#fff" }} />} title="WhatsApp" sub="Create new WhatsApp template" onClick={() => setView("whatsapp")} bgClass={styles.whatsappBg} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Helper component for cleaner selection view
const SelectionCard: React.FC<{icon: React.ReactNode; title: string; sub: string; onClick: () => void; bgClass: string}> = ({ icon, title, sub, onClick, bgClass }) => (
  <Box className={styles.categoryCard} onClick={onClick} sx={{ width: '140px', cursor: 'pointer' }}>
    <Box className={`${styles.iconWrapper} ${bgClass}`}>{icon}</Box>
    <Typography className={styles.cardTitle}>{title}</Typography>
    <Typography className={styles.cardSub}>{sub}</Typography>
  </Box>
);