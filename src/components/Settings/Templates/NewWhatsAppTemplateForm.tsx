import React, { useState, useRef } from 'react';
import { Box, Typography, Button, IconButton, Select, MenuItem, OutlinedInput } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import styles from "../../../styles/Template/NewTemplateModal.module.css";
import { PreviewWhatsAppTemplateModal } from './PreviewWhatsAppTemplateModal';
import type { Template } from '../templateMockData';

interface Props {
  onClose: () => void;
  onSave: (template: Template & { body?: string }) => void;
  initialData?: Partial<Template & { body?: string }>;
  mode: 'create' | 'edit' | 'view';
}

export const NewWhatsAppTemplateForm: React.FC<Props> = ({ onClose, onSave, initialData, mode }) => {
  const isViewOnly = mode === 'view';
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "IVF Consultation Feedback Collection",
    useCase: initialData?.useCase || "Feedback",
    body: initialData?.subject || "Hello {{Patient Name}} 👋\n\nThank you for visiting {{Clinic / Hospital Name}} for your recent consultation.\n\nWe'd love to hear about your experience.\nYour feedback helps us improve our care.\n\nShare your feedback here:\n{{Short Review Link}}\n\nIt will take less than a minute.\nThank you for your time!"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSave = () => {
    const template = {
      ...initialData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      subject: formData.body,
      useCase: formData.useCase,
      lastUpdatedAt: new Date().toLocaleDateString('en-GB') + ' | ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      createdBy: initialData?.createdBy || 'System',
      type: 'whatsapp' as const
    };
    onSave(template);
    onClose();
  };

  if (showPreview) {
    return (
      <PreviewWhatsAppTemplateModal
        onClose={onClose}
        onBackToEdit={() => setShowPreview(false)}
        onSave={handleSave}
        templateData={formData}
      />
    );
  }

  return (
    <Box className={styles.formContainer}>
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>
          {isViewOnly ? 'View WhatsApp Template' : mode === 'edit' ? 'Edit WhatsApp Template' : 'New WhatsApp Template'}
        </Typography>
        <IconButton onClick={onClose} size="small" className={styles.closeBtn}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box className={styles.formBody} sx={{ p: 3 }}>
        {/* Name Field */}
        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Typography className={styles.fieldLabel}>Name</Typography>
          <OutlinedInput 
            fullWidth size="small" 
            value={formData.name}
            disabled={isViewOnly}
            onChange={(e) => handleInputChange('name', e.target.value)}
            sx={{ borderRadius: '8px', backgroundColor: isViewOnly ? '#F9FAFB' : '#fff' }}
          />
        </Box>

        {/* Use Case Field */}
        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Typography className={styles.fieldLabel}>Use Case</Typography>
          <Select
            fullWidth size="small"
            value={formData.useCase}
            disabled={isViewOnly}
            onChange={(e) => handleInputChange('useCase', e.target.value)}
            IconComponent={KeyboardArrowDownIcon}
            sx={{ borderRadius: '8px', backgroundColor: isViewOnly ? '#F9FAFB' : '#fff' }}
          >
            <MenuItem value="Appointment">
              <Box component="span" sx={{ color: '#16A34A', bgcolor: '#F0FDF4', px: 1.5, py: 0.5, borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                Appointment
              </Box>
            </MenuItem>
            <MenuItem value="Feedback">
              <Box component="span" sx={{ color: '#EA580C', bgcolor: '#FFF7ED', px: 1.5, py: 0.5, borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                Feedback
              </Box>
            </MenuItem>
            <MenuItem value="Marketing">
              <Box component="span" sx={{ color: '#7C3AED', bgcolor: '#F5F3FF', px: 1.5, py: 0.5, borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                Marketing
              </Box>
            </MenuItem>
          </Select>
        </Box>

        {/* Body Area */}
        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Typography className={styles.fieldLabel}>Body</Typography>
          <textarea 
            className={styles.textArea} 
            rows={8}
            value={formData.body}
            disabled={isViewOnly}
            onChange={(e) => handleInputChange('body', e.target.value)}
            style={{ 
              width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', 
              fontFamily: 'inherit', resize: 'vertical', backgroundColor: isViewOnly ? '#F9FAFB' : '#fff'
            }}
          />
        </Box>

        {/* Upload Section */}
        <Box className={styles.formGroup}>
          <Typography className={styles.fieldLabel}>Upload Documents</Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 2, 
            border: '1px dashed #E5E7EB', 
            borderRadius: '8px',
            backgroundColor: isViewOnly ? '#F9FAFB' : 'transparent'
          }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              hidden
            />
            <Button 
              variant="contained" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isViewOnly}
              sx={{ 
                bgcolor: '#F3F4F6', 
                color: '#374151', 
                '&:hover': { bgcolor: '#E5E7EB' }, 
                textTransform: 'none', 
                boxShadow: 'none',
                borderRadius: '6px'
              }}
            >
              Choose File
            </Button>
            <Typography variant="body2" sx={{ color: selectedFile ? '#374151' : '#9CA3AF' }}>
              {selectedFile ? selectedFile.name : 'No File Chosen'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className={styles.modalFooter}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', borderRadius: '8px' }}>
          {isViewOnly ? 'Close' : 'Cancel'}
        </Button>
        {!isViewOnly && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" onClick={() => setShowPreview(true)} sx={{ textTransform: 'none', borderRadius: '8px' }}>
              Preview
            </Button>
            <Button variant="contained" onClick={handleSave} sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#6366F1' }}>
              Save
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};