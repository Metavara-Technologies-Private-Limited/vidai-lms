import React, { useState } from 'react';
import { Dialog, Box, Typography, IconButton, DialogContent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import styles from '../../../styles/Template/NewTemplateModal.module.css';
import { NewEmailTemplateForm } from './NewEmailTemplateForm';

export const NewTemplateModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [view, setView] = useState<'select' | 'email'>('select');

  const handleClose = () => {
    onClose();
    setTimeout(() => setView('select'), 300);
  };

  if (view === 'email') {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <NewEmailTemplateForm onClose={handleClose} />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ className: styles.modalPaper }}>
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>New Template</Typography>
        <IconButton onClick={handleClose} size="small" className={styles.closeBtn}><CloseIcon /></IconButton>
      </Box>
      <DialogContent>
        {/* Added flex layout here */}
        <Box className={styles.selectionGrid}>
          <Box className={styles.categoryCard} onClick={() => setView('email')}>
            <Box className={`${styles.iconWrapper} ${styles.emailBg}`}><EmailIcon /></Box>
            <Typography className={styles.cardTitle}>Email</Typography>
            <Typography className={styles.cardSub}>Create new Email template</Typography>
          </Box>

          <Box className={styles.categoryCard}>
            <Box className={`${styles.iconWrapper} ${styles.smsBg}`}><SmsIcon /></Box>
            <Typography className={styles.cardTitle}>SMS</Typography>
            <Typography className={styles.cardSub}>Create new SMS template</Typography>
          </Box>

          <Box className={styles.categoryCard}>
            <Box className={`${styles.iconWrapper} ${styles.whatsappBg}`}><WhatsAppIcon /></Box>
            <Typography className={styles.cardTitle}>WhatsApp</Typography>
            <Typography className={styles.cardSub}>Create new WhatsApp template</Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};