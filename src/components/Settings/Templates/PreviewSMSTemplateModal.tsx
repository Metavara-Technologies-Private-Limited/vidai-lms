import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from '../../../styles/Template/PreviewSMSTemplateModal.module.css';

interface PreviewProps {
  open: boolean;
  onBackToEdit: () => void;
  onSave: () => void;
  templateData: { name?: string; useCase?: string; body: string };
}

export const PreviewSMSTemplateModal: React.FC<PreviewProps> = ({ 
  open, onBackToEdit, onSave, templateData 
}) => {
  if (!open) return null;

  const renderBody = (text: string) => {
    const parts = text.split(/(\{[^}]+\})/g);
    return parts.map((part, index) => (
      part.match(/^\{[^}]+\}$/) 
        ? <span key={index} className={styles.placeholder}>{part}</span> 
        : part
    ));
  };

  return (
    <Box className={styles.modalContainer}>
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>Preview Template</Typography>
        <IconButton onClick={onBackToEdit} size="small"><CloseIcon /></IconButton>
      </Box>

      <Box className={styles.previewContent} sx={{ 
        m: 2,
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'flex-end', 
        minHeight: '300px', 
        p: 3 
      }}>
        <Box sx={{ 
          backgroundColor: '#E3F2FD',
          border: '1px solid #BBDEFB',
          borderRadius: '12px',
          padding: '12px 16px',
          maxWidth: '60%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 1, color: '#000000', fontSize: '14px', lineHeight: 1.5 }}>
            {renderBody(templateData.body)}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <span className={styles.timestamp} style={{ fontSize: '12px', color: '#90CAF9', marginTop: '4px' }}>5:47 AM</span>
          </Box>
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