import React from 'react';
import { Box, Button, IconButton, Dialog } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from '../../../styles/Template/PreviewWhatsAppTemplateModal.module.css';

interface PreviewProps {
  open: boolean;
  onClose: () => void;
  onBackToEdit: () => void;
  onSave: () => void;
  templateData: { body: string };
}

export const PreviewWhatsAppTemplateModal: React.FC<PreviewProps> = ({ 
  open, onBackToEdit, onSave, templateData 
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
    <Dialog open={open} onClose={onBackToEdit} maxWidth="sm" fullWidth>
      {/* Header */}
      <Box className={styles.modalHeader}>
        <span className={styles.modalTitle}>
          Preview Template
        </span>
        <IconButton onClick={onBackToEdit} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Preview Content - Chat Bubble Style */}
      <Box className={styles.previewContent}>
        <Box className={styles.whatsappBubble}>
          {renderBody(templateData.body)}
          <Box className={styles.timestamp}>
            5:47 AM
          </Box>
        </Box>
      </Box>

      {/* Footer with Actions */}
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
          onClick={onSave}
          className={styles.saveBtn}
        >
          Save
        </Button>
      </Box>
    </Dialog>
  );
};