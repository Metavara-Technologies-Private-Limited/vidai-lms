import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Stack } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface Props {
  open: boolean;
  template: any; // Using any to handle the mapped object from TemplatesPage
  onClose: () => void;
  onCopySuccess: () => void;
}

export const CopyDetailsModal: React.FC<Props> = ({ open, template, onClose, onCopySuccess }) => {
  if (!template) return null;

  // Formatting values for the clipboard string
  const templateName = template.name || "Untitled";
  const useCase = template.useCase || template.use_case || "General";
  const createdBy = template.createdBy || template.created_by_name || "Admin";
  const lastUpdated = template.lastUpdatedAt || (template.modified_at ? new Date(template.modified_at).toLocaleDateString() : "N/A");

  const copyText = `
Template Name: ${templateName}
Subject: ${template.subject || '--'}
Use Case: ${useCase}
Last Updated: ${lastUpdated}
Created By: ${createdBy}
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    onCopySuccess();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      PaperProps={{ sx: { borderRadius: '12px', width: '450px' } }}
    >
      <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', pt: 3 }}>
        Template Details
      </DialogTitle>
      
      <DialogContent>
        <Stack 
          spacing={2} 
          sx={{ 
            mt: 1, 
            bgcolor: '#F9FAFB', 
            p: 2, 
            borderRadius: '8px', 
            border: '1px solid #E5E7EB' 
          }}
        >
          <Box>
            <Typography variant="caption" color="textSecondary">Template Name</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{templateName}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">Subject</Typography>
            <Typography variant="body2">{template.subject || '--'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">Use Case</Typography>
            <Typography variant="body2">{useCase}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">Last Updated</Typography>
            <Typography variant="body2">{lastUpdated}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">Created By</Typography>
            <Typography variant="body2">{createdBy}</Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          fullWidth 
          sx={{ borderRadius: '8px', textTransform: 'none', color: '#374151', borderColor: '#D1D5DB' }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCopy} 
          variant="contained" 
          fullWidth 
          startIcon={<ContentCopyIcon />} 
          sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' } }}
        >
          Copy to Clipboard
        </Button>
      </DialogActions>
    </Dialog>
  );
};