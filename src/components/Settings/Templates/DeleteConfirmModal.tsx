import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  templateName: string;
}

export const DeleteConfirmModal: React.FC<DeleteModalProps> = ({
  open,
  onClose,
  onConfirm,
  templateName,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          width: '100%',
          maxWidth: '400px',
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ textAlign: 'center', pt: 0, pb: 4, px: 4 }}>
        {/* Warning Icon */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 2 
        }}>
          <Box sx={{ 
            bgcolor: '#FEF2F2', 
            borderRadius: '50%', 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <WarningAmberIcon sx={{ color: '#EF4444', fontSize: '40px' }} />
          </Box>
        </Box>

        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#111827', mb: 1 }}>
          Delete Template?
        </Typography>
        
        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>
          Are you sure you want to delete <strong>"{templateName}"</strong>? This action cannot be undone.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              textTransform: 'none',
              borderColor: '#D1D5DB',
              color: '#374151',
              fontWeight: 600,
              '&:hover': { borderColor: '#9CA3AF', bgcolor: '#F9FAFB' }
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={onConfirm}
            sx={{
              textTransform: 'none',
              bgcolor: '#EF4444',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#DC2626', boxShadow: 'none' }
            }}
          >
            Delete
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};