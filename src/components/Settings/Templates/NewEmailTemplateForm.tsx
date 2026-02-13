import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, IconButton, TextField, MenuItem, Select, Popover } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import AttachmentIcon from '@mui/icons-material/Attachment';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EditIcon from '@mui/icons-material/Edit';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Link as TiptapLink } from '@tiptap/extension-link';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { PreviewTemplateModal } from './PreviewEmailTemplateModal';

interface FormProps {
  onClose: () => void;
  onSave: (template: any) => void;
  initialData?: any;
  mode: 'create' | 'edit' | 'view';
}

export const NewEmailTemplateForm: React.FC<FormProps> = ({ onClose, onSave, initialData, mode }) => {
  const isViewOnly = mode === 'view';

  // Get clinic ID from various possible sources
  const getClinicId = (): number => {
    // Try localStorage first
    const storedClinicId = localStorage.getItem("clinic_id");
    if (storedClinicId) return parseInt(storedClinicId, 10);
    
    // Try from user data
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.clinic_id) return user.clinic_id;
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
    
    // Try from initial data
    if (initialData?.clinic) return initialData.clinic;
    
    // Default fallback - you should replace this with actual clinic ID
    console.warn("No clinic ID found, using default. Please set clinic_id in localStorage or context.");
    return 1;
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || 'Appointment Confirmation',
    useCase: initialData?.use_case || initialData?.useCase || 'Appointment',
    subject: initialData?.subject || 'Your Consultation is Confirmed - {appointment_date}',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [colorAnchor, setColorAnchor] = useState<HTMLButtonElement | null>(null);
  const [currentFont] = useState('Nunito');
  const [currentHeading] = useState('Tt');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Rainbow color palette
  const colors = [
    '#FF0000', // Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#0000FF', // Blue
    '#4B0082', // Indigo
    '#9400D3', // Violet
    '#FF1493', // Pink
    '#000000', // Black
    '#808080', // Gray
    '#FFFFFF', // White
    '#8B4513', // Brown
  ];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TiptapLink.configure({
        openOnClick: false,
      }),
      TiptapImage,
      TextStyle,
      Color,
    ],
    content: initialData?.body || initialData?.email_body || `<p>Hi {lead_first_name},</p><p><br></p><p>Thank you for choosing {clinic_name}.</p><p>Your fertility consultation has been successfully scheduled!</p><p><br></p><ul><li><p>Date : {appointment_date}</p></li><li><p>Time : {appointment_time}</p></li><li><p>Location : {clinic_name} {clinic_address}</p></li></ul><p><br></p><p>Please arrive 10 minutes early and bring any relevant medical reports.</p><p><br></p><p>If you need to reschedule, please let us know.</p><p><br></p><p>Warm regards,</p><p>The Vidal Team</p>`,
    editable: !isViewOnly,
  });

  // force re-render when editor state/selection changes so toolbar reflects active states, undo/redo, font etc.
  const [, setToolbarTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const update = () => setToolbarTick(t => t + 1);
    editor.on('transaction', update);
    editor.on('selectionUpdate', update);
    editor.on('update', update);
    return () => {
      editor.off('transaction', update);
      editor.off('selectionUpdate', update);
      editor.off('update', update);
    };
  }, [editor]);

  const handleColorClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setColorAnchor(event.currentTarget);
  };

  const handleColorClose = () => {
    setColorAnchor(null);
  };

  const handleColorSelect = (color: string) => {
    if (editor) {
      editor.chain().focus().setColor(color).run();
    }
    handleColorClose();
  };

  const handleFontChange = (value: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontFamily: value }).run();
  };

  const handleHeadingChange = (value: string) => {
    if (!editor) return;
    if (value === 'Tt') {
      try {
        editor.chain().focus().setParagraph().run();
      } catch {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      }
      return;
    }
    if (value === 'H1') editor.chain().focus().toggleHeading({ level: 1 }).run();
    if (value === 'H2') editor.chain().focus().toggleHeading({ level: 2 }).run();
  };

  const adjustIndent = (delta: number) => {
    if (!editor) return;
    const { selection } = editor.state;
    const { $from } = selection;
    const node = $from.parent;
    const style = (node.attrs && node.attrs.style) || '';
    const match = /margin-left:\s*(\d+)px/.exec(style);
    const curr = match ? parseInt(match[1], 10) : 0;
    const next = Math.max(0, curr + delta);
    const cleaned = style.replace(/margin-left:\s*\d+px;?/g, '').trim();
    const newStyle = (cleaned ? cleaned + '; ' : '') + `margin-left: ${next}px`;
    editor.chain().focus().updateAttributes('paragraph', { style: newStyle }).run();
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        editor.chain().focus().setImage({ src: url }).run();
      };
      reader.readAsDataURL(file);
    }
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
    const clinicId = getClinicId();
    
    const apiPayload = {
      name: formData.name,
      use_case: formData.useCase,
      body: editor?.getHTML() || '',
      subject: formData.subject,
      clinic: clinicId,
    };

    console.log("📧 Email Template Payload:", JSON.stringify(apiPayload, null, 2));

    onSave(apiPayload);
    onClose();
  };

  if (showPreview) {
    const previewTemplate = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      subject: formData.subject,
      body: editor?.getHTML() || '',
      useCase: formData.useCase,
      lastUpdatedAt: initialData?.lastUpdatedAt || new Date().toLocaleDateString('en-GB') + ' | ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      createdBy: initialData?.createdBy || 'System',
      type: 'email' as const
    };

    return (
      <PreviewTemplateModal 
        open={showPreview}
        onClose={onClose}
        onBackToEdit={handleBackToEdit}
        onSave={handleSave}
        templateData={previewTemplate}
      />
    );
  }

  if (!editor) {
    return null;
  }

  const openColorPicker = Boolean(colorAnchor);

  return (
    <Box sx={{ width: '100%', bgcolor: 'white', borderRadius: '12px' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2.5, 
        borderBottom: '1px solid #E5E7EB' 
      }}>
        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
          {isViewOnly ? 'View Email Template' : mode === 'edit' ? 'Edit Email Template' : 'New Email Template'}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#6B7280' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ p: 3, maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Name Field */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#374151', mb: 0.75 }}>
            Name
          </Typography>
          <TextField 
            fullWidth 
            size="small" 
            value={formData.name}
            disabled={isViewOnly}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                fontSize: '14px',
                bgcolor: isViewOnly ? '#F9FAFB' : '#fff',
                '& fieldset': { borderColor: '#E5E7EB' }
              }
            }}
          />
        </Box>

        {/* Use Case */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#374151', mb: 0.75 }}>
            Use Case
          </Typography>
          <Select 
            fullWidth 
            size="small" 
            value={formData.useCase}
            disabled={isViewOnly}
            onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
            IconComponent={KeyboardArrowDownIcon}
            sx={{ 
              fontSize: '14px',
              borderRadius: '6px', 
              bgcolor: isViewOnly ? '#F9FAFB' : '#fff',
              '& fieldset': { borderColor: '#E5E7EB' }
            }}
          >
            <MenuItem value="Appointment">
               <Box component="span" sx={{ 
                 color: '#16A34A', 
                 bgcolor: '#F0FDF4', 
                 px: 1.5, 
                 py: 0.5, 
                 borderRadius: '4px', 
                 fontSize: '12px', 
                 fontWeight: 600 
               }}>
                 Appointment
               </Box>
            </MenuItem>
            <MenuItem value="Follow-up">
               <Box component="span" sx={{ 
                 color: '#3B82F6', 
                 bgcolor: '#EFF6FF', 
                 px: 1.5, 
                 py: 0.5, 
                 borderRadius: '4px', 
                 fontSize: '12px', 
                 fontWeight: 600 
               }}>
                 Follow-up
               </Box>
            </MenuItem>
            <MenuItem value="Reminder">
               <Box component="span" sx={{ 
                 color: '#D97706', 
                 bgcolor: '#FFFBEB', 
                 px: 1.5, 
                 py: 0.5, 
                 borderRadius: '4px', 
                 fontSize: '12px', 
                 fontWeight: 600 
               }}>
                 Reminder
               </Box>
            </MenuItem>
          </Select>
        </Box>

        {/* Subject Field */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#374151', mb: 0.75 }}>
            Subject
          </Typography>
          <TextField 
            fullWidth 
            size="small" 
            value={formData.subject}
            disabled={isViewOnly}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                fontSize: '14px',
                bgcolor: isViewOnly ? '#F9FAFB' : '#fff',
                '& fieldset': { borderColor: '#E5E7EB' }
              }
            }}
          />
        </Box>

        {/* Body Editor */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#374151', mb: 0.75 }}>
            Body
          </Typography>
          
          <Box sx={{ 
            border: '1px solid #E5E7EB', 
            borderRadius: '8px',
            bgcolor: isViewOnly ? '#F9FAFB' : '#fff',
          }}>
            {/* Editor Content */}
            <Box sx={{
              '& .ProseMirror': {
                minHeight: '200px',
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '12px 16px',
                outline: 'none',
                fontSize: '13px',
                lineHeight: 1.6,
                color: '#374151',
                '& p': { margin: '0 0 4px 0' },
                '& ul, & ol': { paddingLeft: '20px', margin: '4px 0' },
                '& li p': { margin: 0 },
                '& a': { color: '#6366F1', textDecoration: 'underline' },
                '& img': { maxWidth: '100%', height: 'auto', borderRadius: '4px' },
              }
            }}>
              <EditorContent editor={editor} />
            </Box>

            {/* Toolbar - First Row */}
            {!isViewOnly && (
              <>
                <Box sx={{
                  display: 'flex',
                  gap: 0.5,
                  p: 1,
                  borderTop: '1px solid #E5E7EB',
                  bgcolor: '#FAFBFC',
                  flexWrap: 'wrap'
                }}>
                  <IconButton size="small" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} sx={{ p: 0.5 }}>
                    <UndoIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} sx={{ p: 0.5 }}>
                    <RedoIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                  </IconButton>

                  {/* Font family selector */}
                  <Select
                    size="small"
                    value={currentFont}
                    onChange={(e) => handleFontChange(e.target.value as string)}
                    sx={{ width: 120, height: 28, fontSize: '12px', ml: 1, '& fieldset': { border: 'none' } }}
                  >
                    <MenuItem value="Nunito">Nunito</MenuItem>
                    <MenuItem value="Arial">Arial</MenuItem>
                    <MenuItem value="Times New Roman">Times</MenuItem>
                  </Select>

                  {/* Size / Heading selector */}
                  <Select
                    size="small"
                    value={currentHeading}
                    onChange={(e) => handleHeadingChange(e.target.value as string)}
                    sx={{ width: 60, height: 28, fontSize: '12px', '& fieldset': { border: 'none' } }}
                  >
                    <MenuItem value="Tt">Tt</MenuItem>
                    <MenuItem value="H1">H1</MenuItem>
                    <MenuItem value="H2">H2</MenuItem>
                  </Select>

                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    sx={{ p: 0.5, bgcolor: editor.isActive('bold') ? '#E5E7EB' : 'transparent' }}
                    aria-pressed={editor.isActive('bold')}
                  >
                    <FormatBoldIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    sx={{ p: 0.5, bgcolor: editor.isActive('italic') ? '#E5E7EB' : 'transparent' }}
                    aria-pressed={editor.isActive('italic')}
                  >
                    <FormatItalicIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    sx={{ p: 0.5, bgcolor: editor.isActive('underline') ? '#E5E7EB' : 'transparent' }}
                    aria-pressed={editor.isActive('underline')}
                  >
                    <FormatUnderlinedIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    sx={{ p: 0.5, bgcolor: editor.isActive('strike') ? '#E5E7EB' : 'transparent' }}
                    aria-pressed={editor.isActive('strike')}
                  >
                    <StrikethroughSIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={handleColorClick}
                    sx={{ p: 0.5 }}
                  >
                    <FormatColorTextIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    sx={{ p: 0.5 }}
                  >
                    <FormatAlignLeftIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    sx={{ p: 0.5 }}
                  >
                    <FormatAlignCenterIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    sx={{ p: 0.5 }}
                  >
                    <FormatAlignRightIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    sx={{ p: 0.5 }}
                  >
                    <FormatAlignJustifyIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    sx={{ p: 0.5 }}
                  >
                    <FormatListBulletedIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    sx={{ p: 0.5 }}
                  >
                    <FormatListNumberedIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>

                  {/* Indent controls */}
                  <IconButton
                    size="small"
                    onClick={() => adjustIndent(-20)}
                    sx={{ p: 0.5 }}
                  >
                    <FormatIndentDecreaseIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => adjustIndent(20)}
                    sx={{ p: 0.5 }}
                  >
                    <FormatIndentIncreaseIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    sx={{ p: 0.5 }}
                  >
                    <FormatQuoteIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    sx={{ p: 0.5 }}
                  >
                    <CodeIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                </Box>

                {/* Toolbar - Second Row */}
                <Box sx={{
                  display: 'flex',
                  gap: 0.5,
                  px: 1,
                  pb: 1,
                  bgcolor: '#FAFBFC',
                  borderBottomLeftRadius: '8px',
                  borderBottomRightRadius: '8px'
                }}>
                  <IconButton size="small" onClick={handleColorClick} sx={{ p: 0.5 }}>
                    <FormatColorTextIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={{ p: 0.5 }}>
                    <AttachmentIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton size="small" onClick={addLink} sx={{ p: 0.5 }}>
                    <LinkIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <EmojiEmotionsIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <AttachFileIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton size="small" onClick={addImage} sx={{ p: 0.5 }}>
                    <ImageIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <AttachFileIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <EditIcon sx={{ fontSize: 18, color: '#374151' }} />
                  </IconButton>
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Upload Documents */}
        <Box>
          <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#374151', mb: 0.75 }}>
            Upload Documents
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            <Button 
              variant="contained" 
              onClick={() => !isViewOnly && fileInputRef.current?.click()} 
              disabled={isViewOnly}
              sx={{ 
                bgcolor: '#6B7280',
                textTransform: 'none',
                fontSize: '13px',
                px: 2,
                py: 0.75,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#4B5563' }
              }}
            >
              Choose File
            </Button>
            <Typography sx={{ color: '#9CA3AF', fontSize: '12px' }}>
              No File Chosen
            </Typography>
          </Box>
          {uploadedFiles.length > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {uploadedFiles.map((file, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#F9FAFB', borderRadius: '6px' }}>
                  <AttachFileIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                  <Typography sx={{ flex: 1, fontSize: '12px', color: '#374151' }}>{file.name}</Typography>
                  {!isViewOnly && (
                    <IconButton size="small" onClick={() => removeFile(index)} sx={{ p: 0.5 }}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 1.5, 
        p: 2.5, 
        borderTop: '1px solid #E5E7EB' 
      }}>
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
          Cancel
        </Button>
        {!isViewOnly && (
          <>
            <Button 
              variant="outlined" 
              onClick={handlePreview}
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
          </>
        )}
      </Box>

      {/* Color Picker Popover */}
      <Popover
        open={openColorPicker}
        anchorEl={colorAnchor}
        onClose={handleColorClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, maxWidth: '220px' }}>
          {colors.map((color) => (
            <Box
              key={color}
              onClick={() => handleColorSelect(color)}
              sx={{
                width: 30,
                height: 30,
                bgcolor: color,
                borderRadius: '4px',
                cursor: 'pointer',
                border: color === '#FFFFFF' ? '1px solid #E5E7EB' : 'none',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }
              }}
            />
          ))}
        </Box>
      </Popover>
    </Box>
  );
};