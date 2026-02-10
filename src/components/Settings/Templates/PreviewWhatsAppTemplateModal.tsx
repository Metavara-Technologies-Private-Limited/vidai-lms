import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from '../../../styles/Template/PreviewWhatsAppTemplateModal.module.css';

interface PreviewProps {
  onClose: () => void;
  onBackToEdit: () => void;
  onSave: () => void;
  templateData: { body: string };
}

export const PreviewWhatsAppTemplateModal: React.FC<PreviewProps> = ({ 
  onClose, onBackToEdit, onSave, templateData 
}) => {
  // Regex for WhatsApp {{variable}} syntax
  const renderBody = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        return <span key={index} className={styles.placeholder}>{part}</span>;
      }
      return part.split('\n').map((line, i) => (
        <React.Fragment key={`${index}-${i}`}>
          {line}
          {i < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  return (
    <Box className={styles.modalContainer}>
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>Preview Template</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>

      <Box className={styles.previewContent}>
        <Box className={styles.whatsappBubble}>
          {renderBody(templateData.body)}
          <span className={styles.timestamp}>5:47 AM</span>
        </Box>
      </Box>

      <Box className={styles.modalFooter}>
        <Button variant="outlined" onClick={onBackToEdit} className={styles.backBtn}>
          Back to Edit
        </Button>
        <Button variant="contained" onClick={onSave} className={styles.saveBtn}>
          Save
        </Button>
      </Box>
    </Box>
  );
};