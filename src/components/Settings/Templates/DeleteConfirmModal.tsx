import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface Props {
  open: boolean;
  templateName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<Props> = ({ open, templateName, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '12px', padding: '16px', maxWidth: '400px' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
        <Box sx={{ bgcolor: '#FEE2E2', p: 2, borderRadius: '50%', mb: 2 }}>
          <DeleteForeverIcon sx={{ color: '#EF4444', fontSize: '40px' }} />
        </Box>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Template?</DialogTitle>
        <DialogContent>
          <Typography align="center" color="textSecondary">
            Are you sure you want to delete <strong>{templateName}</strong>?
          </Typography>
        </DialogContent>
      </Box>
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none' }}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#EF4444' }}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
};