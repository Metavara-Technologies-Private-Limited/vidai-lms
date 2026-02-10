import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Stack } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface Props {
  open: boolean;
  template: any;
  onClose: () => void;
  onCopySuccess: () => void; // 🆕 Callback for toast
}

export const CopyDetailsModal: React.FC<Props> = ({ open, template, onClose, onCopySuccess }) => {
  if (!template) return null;

  const copyText = `
Template Name: ${template.name}
Content: ${template.subject}
Use Case: ${template.useCase}
Last Updated: ${template.lastUpdatedAt}
Created By: ${template.createdBy}
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText); // ✅ Clipboard logic
    onCopySuccess(); // ✅ Trigger the toast
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '12px', width: '450px' } }}>
      <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', pt: 3 }}>Template Details</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1, bgcolor: '#F9FAFB', p: 2, borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          <Box><Typography variant="caption" color="textSecondary">Template Name</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{template.name}</Typography></Box>
          <Box><Typography variant="caption" color="textSecondary">Content</Typography><Typography variant="body2">{template.subject}</Typography></Box>
          <Box><Typography variant="caption" color="textSecondary">Use Case</Typography><Typography variant="body2">{template.useCase}</Typography></Box>
          <Box><Typography variant="caption" color="textSecondary">Last Updated</Typography><Typography variant="body2">{template.lastUpdatedAt}</Typography></Box>
          <Box><Typography variant="caption" color="textSecondary">Created By</Typography><Typography variant="body2">{template.createdBy}</Typography></Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
        <Button onClick={onClose} variant="outlined" fullWidth sx={{ borderRadius: '8px', textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleCopy} variant="contained" fullWidth startIcon={<ContentCopyIcon />} sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#6366F1' }}>
          Copy to Clipboard
        </Button>
      </DialogActions>
    </Dialog>
  );
};