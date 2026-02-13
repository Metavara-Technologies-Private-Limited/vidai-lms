import React, { useState, useRef } from 'react';
import { Box, Typography, Button, IconButton, Select, MenuItem, OutlinedInput } from '@mui/material';
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

  // ✅ HELPER DEFINED INSIDE COMPONENT
  const getClinicId = (): number => {
    const storedClinicId = localStorage.getItem("clinic_id");
    if (storedClinicId) return parseInt(storedClinicId, 10);
    
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.clinic_id) return user.clinic_id;
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
    return initialData?.clinic || 1; 
  };

  // ✅ Fields handle both DB keys and UI keys
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
  // Ensure this helper is defined inside the component
  const getClinicId = (): number => {
    const stored = localStorage.getItem("clinic_id");
    return stored ? parseInt(stored, 10) : (initialData?.clinic || 1);
  };

  const clinicId = getClinicId();
  
  // THE FIX: Use the keys your backend validation is looking for
  const apiPayload = {
    name: formData.name,        // Changed from audience_name
    body: formData.body,        // Changed from email_body
    use_case: formData.useCase,  // Backend usually prefers snake_case
    clinic: clinicId,           // Must be an integer
    subject: "WhatsApp Message", // Backend often requires a subject placeholder
    is_active: true
  };

  console.log("🚀 WhatsApp Save Payload:", apiPayload);
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
        {/* Name Field */}
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

        {/* Use Case Field */}
        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Typography className={styles.fieldLabel}>Use Case</Typography>
          <Select
            fullWidth size="small"
            value={formData.useCase}
            displayEmpty
            disabled={isViewOnly}
            onChange={(e) => handleInputChange('useCase', e.target.value)}
            IconComponent={KeyboardArrowDownIcon}
            sx={{ borderRadius: '8px', backgroundColor: isViewOnly ? '#F9FAFB' : '#fff' }}
          >
            <MenuItem value="" disabled>Select Use Case</MenuItem>
            <MenuItem value="Appointment">Appointment</MenuItem>
            <MenuItem value="Feedback">Feedback</MenuItem>
            <MenuItem value="Marketing">Marketing</MenuItem>
          </Select>
        </Box>

        {/* Body Area */}
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

        {/* Upload Section */}
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