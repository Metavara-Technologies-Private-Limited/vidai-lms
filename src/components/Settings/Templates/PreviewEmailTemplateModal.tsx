import React from 'react';
import type { Template } from '../templateMockData';
import { Box, Typography, Button, IconButton, Avatar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from '../../../styles/Template/PreviewEmailTemplateModal.module.css';

interface PreviewTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onBackToEdit: () => void;
  onSave: () => void;
  templateData: Partial<Template> & { body: string };
}

export const PreviewTemplateModal: React.FC<PreviewTemplateModalProps> = ({ 
  open, 
  onClose,
  onBackToEdit,
  onSave,
  templateData 
}) => {
  if (!open) return null;

  const processHtmlWithPlaceholders = (htmlContent: string) => {
    const styledHtml = htmlContent.replace(
      /\{([^}]+)\}/g,
      `<span class="${styles.placeholder}">{$1}</span>`
    );
    return { __html: styledHtml };
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <Box sx={{ bgcolor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>Preview Template</Typography>
        <IconButton onClick={onClose} size="small" className={styles.closeBtn}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Single bordered preview card containing sender + subject + body + logo */}
      <Box
        className={styles.emailPreview}
        sx={{
          m: 3,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF'
        }}
      >
        {/* Sender Info (no separate border) */}
        <Box className={styles.senderSection} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar className={styles.avatar} sx={{ bgcolor: '#8B5CF6', fontSize: '14px' }}>VC</Avatar>
          <Box className={styles.senderInfo}>
            <Typography className={styles.clinicName} sx={{ fontWeight: 600, fontSize: '14px' }}>VIDAI Clinic</Typography>
            <Typography className={styles.emailAddress} sx={{ fontSize: '12px', color: '#6B7280' }}>vidalfertilityclinic@gmail.com</Typography>
          </Box>
        </Box>

        {/* Subject (no separate border beyond card) */}
        <Box 
          className={styles.subjectLine} 
          sx={{ p: 2, fontWeight: 700, fontSize: '14px' }}
          dangerouslySetInnerHTML={processHtmlWithPlaceholders(templateData.subject || '')}
        />

        {/* Body area with scrollbar */}
        <Box 
          className={styles.emailBody} 
          sx={{
            p: 3, 
            fontSize: '13px', 
            lineHeight: 1.6, 
            color: '#374151',
            minHeight: '120px',
            maxHeight: '46vh',
            overflowY: 'auto'
          }}
          dangerouslySetInnerHTML={processHtmlWithPlaceholders(templateData.body)}
        />

        {/* Logo (inside same bordered card) */}
        <Box className={styles.logoSection} sx={{ p: 3, textAlign: 'left' }}>
          <img 
            src="/vidai-logo.png" 
            alt="VIDAI Logo" 
            style={{ maxWidth: '120px' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </Box>
      </Box>

      {/* Footer Buttons */}
      <Box className={styles.modalFooter} sx={{ p: 2, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button 
          variant="outlined"
          onClick={onBackToEdit}
          sx={{ textTransform: 'none', borderRadius: '8px', px: 3, color: '#374151', borderColor: '#D1D5DB' }}
        >
          Back to Edit
        </Button>
        <Button 
          variant="contained"
          onClick={handleSave}
          sx={{ textTransform: 'none', borderRadius: '8px', px: 4, bgcolor: '#111827', boxShadow: 'none' }}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};