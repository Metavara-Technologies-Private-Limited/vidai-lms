import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  DialogContent,
  CircularProgress,
  Alert,
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

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: unknown) => void;
  initialData?: any;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialData?.type) {
        const viewType = initialData.type === 'mail' ? 'email' : initialData.type;
        setView(viewType);
      } else {
        setView("select");
      }
      setError(null);
    }
  }, [open, initialData]);

  const handleClose = () => {
    if (loading) return;
    onClose();
    setTimeout(() => {
      setView("select");
      setError(null);
    }, 300);
  };

  const handleFormSave = async (formData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Map UI type to API type
      const apiType: APITemplateType = view === "email" ? "mail" : (view as APITemplateType);
      
      let response;
      if (mode === "edit" && initialData?.id) {
        response = await TemplateService.updateTemplate(apiType, initialData.id, formData);
      } else {
        response = await TemplateService.createTemplate(apiType, formData);
      }

      onSave(response);
      handleClose();
    } catch (err: any) {
      // ✅ IMPROVED ERROR LOGGING: This will help you see the exact field validation error
      console.error("❌ API Error Details:", err.response?.data);
      
      let errorMessage = "Failed to save. ";
      if (err.response?.data) {
        // If the error is an object (Django validation errors), format it nicely
        if (typeof err.response.data === 'object') {
          errorMessage += Object.entries(err.response.data)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(", ");
        } else {
          errorMessage += err.response.data;
        }
      }
      
      setError(errorMessage);
      alert(`Backend Error: ${errorMessage}`);
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

  const ErrorDisplay = error && (
    <Box sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20, maxWidth: '90%' }}>
      <Alert severity="error" onClose={() => setError(null)} sx={{ whiteSpace: 'pre-wrap' }}>{error}</Alert>
    </Box>
  );

  if (view === "email") {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        {LoaderOverlay} {ErrorDisplay}
        <NewEmailTemplateForm onClose={handleClose} onSave={handleFormSave} initialData={initialData} mode={mode} />
      </Dialog>
    );
  }

  if (view === "sms") {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        {LoaderOverlay} {ErrorDisplay}
        <NewSMSTemplateForm onClose={handleClose} onSave={handleFormSave} initialData={initialData} mode={mode} />
      </Dialog>
    );
  }

  if (view === "whatsapp") {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        {LoaderOverlay} {ErrorDisplay}
        <NewWhatsAppTemplateForm onClose={handleClose} onSave={handleFormSave} initialData={initialData} mode={mode} />
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
const SelectionCard = ({ icon, title, sub, onClick, bgClass }: any) => (
  <Box className={styles.categoryCard} onClick={onClick} sx={{ width: '140px', cursor: 'pointer' }}>
    <Box className={`${styles.iconWrapper} ${bgClass}`}>{icon}</Box>
    <Typography className={styles.cardTitle}>{title}</Typography>
    <Typography className={styles.cardSub}>{sub}</Typography>
  </Box>
);