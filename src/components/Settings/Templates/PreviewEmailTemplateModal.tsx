import React from 'react';
import { Box, Typography, Button, IconButton, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from '../../../styles/Template/PreviewEmailTemplateModal.module.css';

interface PreviewTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onBackToEdit: () => void;
  onSave: () => void;
  templateData: {
    name: string;
    useCase: string;
    subject: string;
    body: string;
  };
}

export const PreviewTemplateModal: React.FC<PreviewTemplateModalProps> = ({ 
  open, 
  onClose,
  onBackToEdit,
  onSave,
  templateData 
}) => {
  if (!open) return null;

  // Parse the body to replace placeholders with styled versions
  const renderBody = (text: string) => {
    const parts = text.split(/(\{[^}]+\})/g);
    return parts.map((part, index) => {
      if (part.match(/^\{[^}]+\}$/)) {
        return (
          <span key={index} className={styles.placeholder}>
            {part}
          </span>
        );
      }
      // Handle line breaks
      return part.split('\n').map((line, i) => (
        <React.Fragment key={`${index}-${i}`}>
          {line}
          {i < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <Box>
      {/* Header */}
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>Preview Template</Typography>
        <IconButton onClick={onClose} size="small" className={styles.closeBtn}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Email Preview Content */}
      <Box className={styles.emailPreview}>
        {/* Sender Info */}
        <Box className={styles.senderSection}>
          <Avatar className={styles.avatar}>VC</Avatar>
          <Box className={styles.senderInfo}>
            <Typography className={styles.clinicName}>VIDAI Clinic</Typography>
            <Typography className={styles.emailAddress}>vidalfertilityclinic@gmail.com</Typography>
          </Box>
        </Box>

        {/* Email Subject */}
        <Box className={styles.subjectLine}>
          {renderBody(templateData.subject)}
        </Box>

        {/* Email Body */}
        <Box className={styles.emailBody}>
          {renderBody(templateData.body)}
        </Box>

        {/* Logo */}
        <Box className={styles.logoSection}>
          <img 
            src="/vidai-logo.png" 
            alt="VIDAI Logo" 
            className={styles.logo}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </Box>
      </Box>

      {/* Footer Buttons */}
      <Box className={styles.modalFooter}>
        <Button 
          variant="outlined"
          onClick={onBackToEdit}
          className={styles.backBtn}
        >
          Back to Edit
        </Button>
        <Button 
          variant="contained"
          onClick={handleSave}
          className={styles.saveBtn}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};