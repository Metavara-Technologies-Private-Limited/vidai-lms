import React, { useState, useRef } from 'react';
import { Box, Typography, Button, IconButton, Select, MenuItem, OutlinedInput, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import styles from "../../../styles/Template/NewTemplateModal.module.css";
import { PreviewWhatsAppTemplateModal } from './PreviewWhatsAppTemplateModal';

interface Props {
  onClose: () => void;
  onSave: (template: any) => void;
  initialData?: any;
  mode: 'create' | 'edit' | 'view';
}

export const NewWhatsAppTemplateForm: React.FC<Props> = ({ onClose, onSave, initialData, mode }) => {
  const isViewOnly = mode === 'view';
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Helper to get styling for the chips (matched to Table styles)
  const getUseCaseStyles = (useCase: string | undefined) => {
    const safeCase = (useCase || 'default').toLowerCase();
    switch (safeCase) {
      case 'appointment': 
        return { color: '#16A34A', bgColor: '#F0FDF4', borderColor: '#DCFCE7' };
      case 'reminder': 
        return { color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FEF3C7' };
      case 'feedback': 
        return { color: '#EA580C', bgColor: '#FFF7ED', borderColor: '#FFEDD5' };
      case 'marketing': 
        return { color: '#7C3AED', bgColor: '#F5F3FF', borderColor: '#EDE9FE' };
      default: 
        return { color: '#6B7280', bgColor: '#F9FAFB', borderColor: '#F3F4F6' };
    }
  };

  const getClinicId = (): number => {
    const stored = localStorage.getItem("clinic_id");
    return stored ? parseInt(stored, 10) : (initialData?.clinic || 1);
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || initialData?.audience_name || "",
    useCase: initialData?.useCase || initialData?.use_case || "",
    body: initialData?.body || initialData?.email_body || initialData?.subject || ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSave = () => {
    const clinicId = getClinicId();
    const apiPayload = {
      name: formData.name,
      body: formData.body,
      use_case: formData.useCase,
      clinic: clinicId,
      subject: "WhatsApp Message",
      is_active: true
    };
    onSave(apiPayload);
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
        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Typography className={styles.fieldLabel}>Name</Typography>
          <OutlinedInput 
            fullWidth size="small" 
            placeholder="Enter template name"
            value={formData.name}
            disabled={isViewOnly}
            onChange={(e) => handleInputChange('name', e.target.value)}
            sx={{ borderRadius: '8px', backgroundColor: isViewOnly ? '#F9FAFB' : '#fff' }}
          />
        </Box>

        {/* ✅ UPDATED: Use Case Field with Styled Chips */}
        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Typography className={styles.fieldLabel}>Use Case</Typography>
          <Select
            fullWidth
            size="small"
            value={formData.useCase}
            displayEmpty
            disabled={isViewOnly}
            onChange={(e) => handleInputChange('useCase', e.target.value)}
            IconComponent={KeyboardArrowDownIcon}
            renderValue={(selected) => {
              if (!selected) return <Typography color="#9CA3AF" sx={{ fontSize: '14px' }}>Select Use Case</Typography>;
              const ui = getUseCaseStyles(selected as string);
              return (
                <Chip 
                  label={selected as string} 
                  sx={{ 
                    color: ui.color, 
                    bgcolor: ui.bgColor, 
                    border: `1px solid ${ui.borderColor}`, 
                    fontWeight: 600, 
                    fontSize: '11px', 
                    height: '24px', 
                    borderRadius: '100px' 
                  }} 
                />
              );
            }}
            sx={{ borderRadius: '8px', backgroundColor: isViewOnly ? '#F9FAFB' : '#fff' }}
          >
            <MenuItem value="" disabled>Select Use Case</MenuItem>
            
            <MenuItem value="Appointment">
              <Chip label="Appointment" sx={{ color: '#16A34A', bgcolor: '#F0FDF4', border: '1px solid #DCFCE7', fontWeight: 600, fontSize: '11px', height: '24px' }} />
            </MenuItem>
            
            <MenuItem value="Reminder">
              <Chip label="Reminder" sx={{ color: '#D97706', bgcolor: '#FFFBEB', border: '1px solid #FEF3C7', fontWeight: 600, fontSize: '11px', height: '24px' }} />
            </MenuItem>
            
            <MenuItem value="Feedback">
              <Chip label="Feedback" sx={{ color: '#EA580C', bgcolor: '#FFF7ED', border: '1px solid #FFEDD5', fontWeight: 600, fontSize: '11px', height: '24px' }} />
            </MenuItem>

            <MenuItem value="Marketing">
              <Chip label="Marketing" sx={{ color: '#7C3AED', bgcolor: '#F5F3FF', border: '1px solid #EDE9FE', fontWeight: 600, fontSize: '11px', height: '24px' }} />
            </MenuItem>
          </Select>
        </Box>

        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Typography className={styles.fieldLabel}>Body</Typography>
          <textarea 
            className={styles.textArea} 
            rows={8}
            placeholder="Hi {{1}}, thank you for choosing our clinic..."
            value={formData.body}
            disabled={isViewOnly}
            onChange={(e) => handleInputChange('body', e.target.value)}
            style={{ 
              width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', 
              fontFamily: 'inherit', resize: 'vertical', backgroundColor: isViewOnly ? '#F9FAFB' : '#fff'
            }}
          />
        </Box>

        <Box className={styles.formGroup}>
          <Typography className={styles.fieldLabel}>Upload Documents</Typography>
          <Box sx={{ 
            display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px dashed #E5E7EB', 
            borderRadius: '8px', backgroundColor: isViewOnly ? '#F9FAFB' : 'transparent'
          }}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden />
            <Button 
              variant="contained" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isViewOnly}
              sx={{ bgcolor: '#F3F4F6', color: '#374151', textTransform: 'none', boxShadow: 'none' }}
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