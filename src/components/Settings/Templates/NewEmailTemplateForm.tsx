import React, { useState, useRef } from 'react';
import { Box, Typography, Button, IconButton, TextField, MenuItem, Select, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EditIcon from '@mui/icons-material/Edit';
import { PreviewTemplateModal } from './PreviewEmailTemplateModal';
import styles from '../../../styles/Template/NewTemplateModal.module.css';

export const NewEmailTemplateForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: 'Appointment Confirmation',
    useCase: 'Appointment',
    subject: 'Your Consultation is Confirmed - {appointment_date}',
    body: `Hi {lead_first_name},

Thank you for choosing {clinic_name}.
Your fertility consultation has been successfully scheduled!

- Date: {appointment_date}
- Time: {appointment_time}
- Location: {clinic_name} {clinic_address}

Please arrive 10 minutes early and bring any relevant medical reports.

If you need to reschedule, please let us know.

Warm regards,
The Vidal Team`
  });

  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyFormatting = (command: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.body.substring(start, end);
    let newText = formData.body;

    switch (command) {
      case 'bold':
        newText = formData.body.substring(0, start) + `**${selectedText}**` + formData.body.substring(end);
        break;
      case 'italic':
        newText = formData.body.substring(0, start) + `*${selectedText}*` + formData.body.substring(end);
        break;
      case 'underline':
        newText = formData.body.substring(0, start) + `__${selectedText}__` + formData.body.substring(end);
        break;
      case 'strikethrough':
        newText = formData.body.substring(0, start) + `~~${selectedText}~~` + formData.body.substring(end);
        break;
      default:
        break;
    }

    setFormData({ ...formData, body: newText });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end + 4);
    }, 0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const handleSave = () => {
    // Add your save logic here
    console.log('Saving template:', formData);
    onClose();
  };

  // If preview is shown, only show preview modal
  if (showPreview) {
    return (
      <PreviewTemplateModal 
        open={showPreview}
        onClose={onClose}
        onBackToEdit={handleBackToEdit}
        onSave={handleSave}
        templateData={formData}
      />
    );
  }

  // Otherwise show the form
  return (
    <Box>
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>New Email Template</Typography>
        <IconButton onClick={onClose} size="small" className={styles.closeBtn}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box className={styles.modalBody}>
        {/* Name Field */}
        <Box className={styles.formGroup}>
          <Typography className={styles.fieldLabel}>Name</Typography>
          <TextField 
            fullWidth 
            size="small" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={styles.textField}
          />
        </Box>

        {/* Use Case with green chip */}
        <Box className={styles.formGroup}>
          <Typography className={styles.fieldLabel}>Use Case</Typography>
          <Box className={styles.useCaseWrapper}>
            <span className={styles.useCaseChip}>{formData.useCase}</span>
            <Select 
              fullWidth 
              size="small" 
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
              className={styles.selectField}
            >
              <MenuItem value="Appointment">Appointment</MenuItem>
              <MenuItem value="Follow-up">Follow-up</MenuItem>
              <MenuItem value="Reminder">Reminder</MenuItem>
            </Select>
          </Box>
        </Box>

        {/* Subject Field */}
        <Box className={styles.formGroup}>
          <Typography className={styles.fieldLabel}>Subject</Typography>
          <TextField 
            fullWidth 
            size="small" 
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className={styles.textField}
          />
        </Box>

        {/* Body Area with toolbar */}
        <Box className={styles.formGroup}>
          <Typography className={styles.fieldLabel}>Body</Typography>
          <Box className={styles.editorBox}>
            <textarea 
              ref={textareaRef}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className={styles.textArea}
            />
            
            <Divider />
            
            {/* Toolbar Row */}
            <Box className={styles.toolbarRow}>
              {/* Font Selector */}
              <Select
                size="small"
                defaultValue="Nunito"
                variant="standard"
                disableUnderline
                className={styles.fontSelector}
              >
                <MenuItem value="Nunito">Nunito</MenuItem>
                <MenuItem value="Arial">Arial</MenuItem>
                <MenuItem value="Times New Roman">Times New Roman</MenuItem>
              </Select>

              <Divider orientation="vertical" flexItem className={styles.divider} />

              {/* Text Size */}
              <Select
                size="small"
                defaultValue="normal"
                variant="standard"
                disableUnderline
                className={styles.fontSelector}
              >
                <MenuItem value="small">Tt</MenuItem>
                <MenuItem value="normal">Tt</MenuItem>
                <MenuItem value="large">Tt</MenuItem>
              </Select>

              <Divider orientation="vertical" flexItem className={styles.divider} />

              {/* Text Formatting */}
              <IconButton size="small" className={styles.toolbarBtn} onClick={() => applyFormatting('bold')}>
                <FormatBoldIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn} onClick={() => applyFormatting('italic')}>
                <FormatItalicIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn} onClick={() => applyFormatting('underline')}>
                <FormatUnderlinedIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn} onClick={() => applyFormatting('strikethrough')}>
                <StrikethroughSIcon />
              </IconButton>

              <Divider orientation="vertical" flexItem className={styles.divider} />

              {/* Alignment */}
              <IconButton size="small" className={styles.toolbarBtn}>
                <FormatAlignLeftIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <FormatAlignCenterIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <FormatAlignRightIcon />
              </IconButton>

              <Divider orientation="vertical" flexItem className={styles.divider} />

              {/* Lists */}
              <IconButton size="small" className={styles.toolbarBtn}>
                <FormatListBulletedIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <FormatListNumberedIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <FormatIndentDecreaseIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <FormatIndentIncreaseIcon />
              </IconButton>

              <Divider orientation="vertical" flexItem className={styles.divider} />

              {/* Quote & Code */}
              <IconButton size="small" className={styles.toolbarBtn}>
                <FormatQuoteIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <CodeIcon />
              </IconButton>

              <Divider orientation="vertical" flexItem className={styles.divider} />

              {/* Insert Options */}
              <IconButton size="small" className={styles.toolbarBtn}>
                <LinkIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <EmojiEmotionsIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <AlternateEmailIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <ImageIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <InsertDriveFileIcon />
              </IconButton>
              <IconButton size="small" className={styles.toolbarBtn}>
                <EditIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Upload Documents Section */}
        <Box className={styles.formGroup}>
          <Typography className={styles.fieldLabel}>Upload Documents</Typography>
          <Box className={styles.uploadSection}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              className={styles.attachBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
            <Typography className={styles.uploadHint}>
              Use File Chooser
            </Typography>
          </Box>
          
          {/* Display uploaded files */}
          {uploadedFiles.length > 0 && (
            <Box className={styles.fileList}>
              {uploadedFiles.map((file, index) => (
                <Box key={index} className={styles.fileItem}>
                  <AttachFileIcon className={styles.fileIcon} />
                  <Typography className={styles.fileName}>{file.name}</Typography>
                  <IconButton size="small" onClick={() => removeFile(index)} className={styles.removeFileBtn}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box className={styles.modalFooter}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          className={styles.cancelBtn}
        >
          Cancel
        </Button>
        <Button 
          variant="outlined"
          className={styles.previewBtn}
          onClick={handlePreview}
        >
          Preview
        </Button>
        <Button 
          variant="contained"
          className={styles.saveBtn}
          onClick={handleSave}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};