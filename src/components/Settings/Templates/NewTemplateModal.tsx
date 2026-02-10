import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  DialogContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import SmsIcon from "@mui/icons-material/Sms";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import styles from "../../../styles/Template/NewTemplateModal.module.css";
import { NewEmailTemplateForm } from "./NewEmailTemplateForm";
import { NewSMSTemplateForm } from "./NewSMSTemplateForm";
import { NewWhatsAppTemplateForm } from "./NewWhatsAppTemplateForm";
import type { Template } from "../templateMockData";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: unknown) => void;
  initialData?: unknown;
  mode: "create" | "edit" | "view";
}

export const NewTemplateModal: React.FC<ModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  mode,
}) => {
  const [view, setView] = useState<"select" | "email" | "sms" | "whatsapp">(
    "select",
  );

  useEffect(() => {
    if (open) {
      if (initialData && typeof initialData === "object" && "type" in initialData) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setView((initialData as { type: "select" | "email" | "sms" | "whatsapp" }).type);
      } else {
        setView("select");
      }
    }
  }, [open, initialData]);

  const handleClose = () => {
    onClose();
    setTimeout(() => setView("select"), 300);
  };

  const handleFormSave = (data: unknown) => {
    onSave(data);
    handleClose();
  };

  if (view === "email")
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <NewEmailTemplateForm
          onClose={handleClose}
          onSave={handleFormSave}
          initialData={initialData as Partial<Template & { body?: string }>}
          mode={mode}
        />
      </Dialog>
    );
  if (view === "sms")
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <NewSMSTemplateForm
          onClose={handleClose}
          onSave={handleFormSave}
          initialData={initialData as Partial<Template & { body?: string }>}
          mode={mode}
        />
      </Dialog>
    );
  if (view === "whatsapp")
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <NewWhatsAppTemplateForm
          onClose={handleClose}
          onSave={handleFormSave}
          initialData={initialData as Partial<Template & { body?: string }>}
          mode={mode}
        />
      </Dialog>
    );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: styles.modalPaper }}
    >
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>New Template</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent>
        <Box className={styles.selectionGrid}>
          <Box className={styles.categoryCard} onClick={() => setView("email")}>
            <Box className={`${styles.iconWrapper} ${styles.emailBg}`}>
              <EmailIcon sx={{ color: "#fff" }} />
            </Box>
            <Typography className={styles.cardTitle}>Email</Typography>
            <Typography className={styles.cardSub}>
              Create new Email template
            </Typography>
          </Box>
          <Box className={styles.categoryCard} onClick={() => setView("sms")}>
            <Box className={`${styles.iconWrapper} ${styles.smsBg}`}>
              <SmsIcon sx={{ color: "#fff" }} />
            </Box>
            <Typography className={styles.cardTitle}>SMS</Typography>
            <Typography className={styles.cardSub}>
              Create new SMS template
            </Typography>
          </Box>
          <Box
            className={styles.categoryCard}
            onClick={() => setView("whatsapp")}
          >
            <Box className={`${styles.iconWrapper} ${styles.whatsappBg}`}>
              <WhatsAppIcon sx={{ color: "#fff" }} />
            </Box>
            <Typography className={styles.cardTitle}>WhatsApp</Typography>
            <Typography className={styles.cardSub}>
              Create new WhatsApp template
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
