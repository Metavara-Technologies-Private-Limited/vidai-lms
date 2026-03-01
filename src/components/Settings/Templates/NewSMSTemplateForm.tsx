import React, { useState, useRef } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Typography, Button, IconButton, Select, MenuItem, OutlinedInput } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import styles from "../../../styles/Template/NewTemplateModal.module.css";
import { PreviewSMSTemplateModal } from './PreviewSMSTemplateModal';
import type { NewSMSTemplateFormProps, TemplateDocument } from '../../../types/templates.types';

const getDocumentUrl = (doc: TemplateDocument): string => {
  const candidate = doc.file_url || doc.file || doc.url || '';
  if (!candidate) return '';
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate;
  }
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/api\/?$/, '');
  return `${baseUrl}${candidate}`;
};

const getDocumentName = (doc: TemplateDocument): string => {
  return doc.name || doc.filename || doc.file?.split('/').pop() || doc.file_url?.split('/').pop() || 'Document';
};

const extractDocuments = (payload: unknown): TemplateDocument[] => {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  const candidates = [record.documents, record.template_documents, record.files, record.attachments];
  const match = candidates.find((value) => Array.isArray(value));
  return Array.isArray(match) ? (match as TemplateDocument[]) : [];
};

export const NewSMSTemplateForm: React.FC<NewSMSTemplateFormProps> = ({ onClose, onSave, initialData, mode }) => {
  const isViewOnly = mode === 'view'; 
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingDocuments, setExistingDocuments] = useState<TemplateDocument[]>([]);
  const [removedExistingDocumentIds, setRemovedExistingDocumentIds] = useState<string[]>([]);

  const getClinicId = (): number => {
    const storedClinicId = localStorage.getItem("clinic_id");
    if (storedClinicId) return parseInt(storedClinicId, 10);
    
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.clinic_id) return user.clinic_id;
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((initialData as any)?.clinic || 1); 
  };

  // Normalize useCase to match MenuItem values (capitalize first letter)
  // Also handles API responses that might come in different formats
  const normalizeUseCase = (value: string | undefined) => {
    if (!value) return "";
    const trimmed = value.trim().toLowerCase();
    
    // Map common API variations to canonical form
    const mapping: Record<string, string> = {
      'appointment': 'Appointment',
      'confirm': 'Appointment',
      'confirmation': 'Appointment',
      'reminder': 'Reminder',
      'follow-up': 'Follow-up',
      'followup': 'Follow-up'
    };
    
    return mapping[trimmed] || value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  const [formData, setFormData] = useState({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: ((initialData as any)?.name || (initialData as any)?.audience_name || ""),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useCase: normalizeUseCase((initialData as any)?.useCase || (initialData as any)?.use_case || ""),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: ((initialData as any)?.body || (initialData as any)?.email_body || (initialData as any)?.subject || "")
  });

  // Sync formData when initialData changes (for edit/view mode)
  React.useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = initialData as any;
      setFormData({
        name: data?.name || data?.audience_name || "",
        useCase: normalizeUseCase(data?.useCase || data?.use_case || ""),
        body: data?.body || data?.email_body || data?.subject || ""
      });

      setExistingDocuments(extractDocuments(initialData));
      setRemovedExistingDocumentIds([]);
      setSelectedFile(null);
    }
  }, [initialData]); // Re-sync when initialData changes

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeExistingDocument = (documentId?: string | number) => {
    if (documentId === undefined || documentId === null) return;
    const normalized = String(documentId);
    setExistingDocuments((prev) => prev.filter((doc) => String(doc.id) !== normalized));
    setRemovedExistingDocumentIds((prev) => prev.includes(normalized) ? prev : [...prev, normalized]);
  };

  // ─── ONLY CHANGE: pass selectedFile as second argument ───────────────────────
  // NewTemplateModal.handleFormSaveWithFiles(payload, files) receives both,
  // saves the template first (gets id back), then POSTs the file to
  // POST /api/templates/sms/{id}/documents/ → inserts into restapi_template_sms_document
  const handleSave = async () => {
    const clinicId = getClinicId();
    
    const apiPayload = {
      name: formData.name,
      body: formData.body,
      use_case: formData.useCase,
      clinic: clinicId,
      is_active: true,
      subject: "SMS Template",
    };

    console.log("🚀 Saving SMS with File:", selectedFile?.name || "No file");

    const files = selectedFile ? [selectedFile] : [];
    await onSave(apiPayload, files, removedExistingDocumentIds);
  };

  if (showPreview) {
    return (
      <PreviewSMSTemplateModal
        open={showPreview}
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
          {isViewOnly ? 'View SMS Template' : mode === 'edit' ? 'Edit SMS Template' : 'New SMS Template'}
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
            sx={{ 
              borderRadius: '8px',
              backgroundColor: isViewOnly ? '#F9FAFB' : '#fff',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' }
            }}
          />
        </Box>

        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Typography className={styles.fieldLabel}>Use Case</Typography>
          <Select
            fullWidth size="small"
            value={formData.useCase}
            displayEmpty
            disabled={isViewOnly} 
            onChange={(e) => handleInputChange('useCase', e.target.value as string)}
            IconComponent={KeyboardArrowDownIcon}
            sx={{ borderRadius: '8px', backgroundColor: isViewOnly ? '#F9FAFB' : '#fff' }}
          >
            <MenuItem value="" disabled>Select Use Case</MenuItem>
            <MenuItem value="Appointment">
              <Box component="span" sx={{ color: '#16A34A', bgcolor: '#F0FDF4', px: 1.5, py: 0.5, borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                Appointment
              </Box>
            </MenuItem>
            <MenuItem value="Feedback">
              <Box component="span" sx={{ color: '#3B82F6', bgcolor: '#EFF6FF', px: 1.5, py: 0.5, borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                Feedback
              </Box>
            </MenuItem>
          </Select>
        </Box>

        <Box className={styles.formGroup} sx={{ mb: 2.5 }}>
          <Typography className={styles.fieldLabel}>Body</Typography>
          <textarea 
            className={styles.textArea}
            rows={6}
            placeholder="Write your SMS message here..."
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

          {existingDocuments.length > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {existingDocuments.map((doc) => {
                const url = getDocumentUrl(doc);
                const name = getDocumentName(doc);
                return (
                  <Box
                    key={String(doc.id ?? name)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      bgcolor: '#F9FAFB',
                    }}
                  >
                    <Typography
                      component={url ? 'a' : 'span'}
                      href={url || undefined}
                      target={url ? '_blank' : undefined}
                      rel={url ? 'noopener noreferrer' : undefined}
                      sx={{
                        flex: 1,
                        fontSize: '12px',
                        color: url ? '#2563EB' : '#374151',
                        textDecoration: url ? 'underline' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </Typography>
                    {!isViewOnly && (
                      <IconButton size="small" onClick={() => removeExistingDocument(doc.id)} sx={{ p: 0.5 }}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      <Box className={styles.modalFooter}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          sx={{
            textTransform: 'none',
            fontSize: '14px',
            borderColor: '#D1D5DB',
            color: '#374151',
            px: 3,
            '&:hover': { borderColor: '#9CA3AF', bgcolor: '#F9FAFB' }
          }}
        >
          {isViewOnly ? 'Close' : 'Cancel'}
        </Button>
        {!isViewOnly && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button 
              variant="outlined" 
              onClick={() => setShowPreview(true)} 
              sx={{
                textTransform: 'none',
                fontSize: '14px',
                borderColor: '#D1D5DB',
                color: '#374151',
                px: 3,
                '&:hover': { borderColor: '#9CA3AF', bgcolor: '#F9FAFB' }
              }}
            >
              Preview
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSave} 
              sx={{ 
                textTransform: 'none',
                fontSize: '14px',
                bgcolor: '#111827',
                px: 3,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#000' }
              }}
            >
              Save
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};