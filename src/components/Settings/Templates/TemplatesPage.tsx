import React, { useState,  } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { TemplateHeader } from './TemplateHeader';
import { EmailTemplateTable } from './EmailTemplateTable';
import { SmsTemplateTable } from './SmsTemplateTable';
import { WhatsAppTemplateTable } from './WhatsAppTemplateTable';
import { NewTemplateModal } from './NewTemplateModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CopyDetailsModal } from './CopyDetailsModal';
import { TEMPLATES_MOCK_DATA, type Template } from '../templateMockData';
import styles from "../../../styles/Template/TemplatesPage.module.css";

const TemplatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Email');
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allTemplates, setAllTemplates] = useState<Template[]>(TEMPLATES_MOCK_DATA);
  
  // States for Edit/View/Copy
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<'create' | 'edit' | 'view'>('create');

  // Popup & Filter States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [templateInAction, setTemplateInAction] = useState<Template | null>(null);
  const [activeFilters, setActiveFilters] = useState<any>(null); // 🆕 Logic for filter dialog

  // Snackbar State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // 🆕 Integrated Search and Filter Logic
  const getFilteredData = (type: 'email' | 'sms' | 'whatsapp') => {
    let filtered = allTemplates.filter(t => t.type === type);

    // 1. Live Search Filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 2. Dialog Filter Logic (Priority/Department/Date)
    if (activeFilters) {
      if (activeFilters.priority) {
        // Mapping 'Low/Medium/High' filter to your 'useCase' or relevant data field
        filtered = filtered.filter(t => t.useCase.toLowerCase() === activeFilters.priority.toLowerCase());
      }
      
      // Date filtering logic (Assuming lastUpdatedAt contains a parsable date)
      if (activeFilters.fromDate && activeFilters.toDate) {
        const start = new Date(activeFilters.fromDate);
        const end = new Date(activeFilters.toDate);
        filtered = filtered.filter(t => {
          const updatedDate = new Date(t.lastUpdatedAt.split('|')[0].trim());
          return updatedDate >= start && updatedDate <= end;
        });
      }
    }

    return filtered;
  };

  const handleAction = (type: 'view' | 'edit' | 'copy' | 'delete', template: Template) => {
    setTemplateInAction(template);
    switch (type) {
      case 'view':
        setActiveTemplate(template);
        setViewMode('view');
        setModalOpen(true);
        break;
      case 'edit':
        setActiveTemplate(template);
        setViewMode('edit');
        setModalOpen(true);
        break;
      case 'copy':
        setIsCopyModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
    }
  };

  const triggerToast = (msg: string) => {
    setSnackbar({ open: true, message: msg, severity: 'success' });
  };

  return (
    <Box className={styles.pageContainer} sx={{ overflow: 'hidden', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TemplateHeader 
        onTabChange={(tab) => { setActiveTab(tab); setSearchQuery(''); }}
        onNewTemplate={() => { setViewMode('create'); setActiveTemplate(null); setModalOpen(true); }}
        onSearch={setSearchQuery}
        onApplyFilters={setActiveFilters} // 🆕 Apply logic from filter dialog
        counts={{
          email: allTemplates.filter(t => t.type === 'email').length,
          sms: allTemplates.filter(t => t.type === 'sms').length,
          whatsapp: allTemplates.filter(t => t.type === 'whatsapp').length,
        }} 
      />

      {/* 🆕 Scroll fix for table area */}
      <Box className={styles.tableWrapper} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {activeTab === 'Email' && <EmailTemplateTable data={getFilteredData('email')} searchQuery={searchQuery} onAction={handleAction} />}
        {activeTab === 'SMS' && <SmsTemplateTable data={getFilteredData('sms')} searchQuery={searchQuery} onAction={handleAction} />}
        {activeTab === 'WhatsApp' && <WhatsAppTemplateTable data={getFilteredData('whatsapp')} searchQuery={searchQuery} onAction={handleAction} />}
      </Box>

      <NewTemplateModal 
        open={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={(t) => { 
          if(viewMode === 'edit') {
            setAllTemplates(prev => prev.map(item => item.id === t.id ? t : item));
            triggerToast('Template updated successfully!');
          } else {
            setAllTemplates(p => [t, ...p]); 
            triggerToast('Template saved successfully!');
          }
        }} 
        initialData={activeTemplate} 
        mode={viewMode} 
      />

      <DeleteConfirmModal 
        open={isDeleteModalOpen} 
        templateName={templateInAction?.name || ''} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={() => {
          setAllTemplates(p => p.filter(t => t.id !== templateInAction?.id));
          setIsDeleteModalOpen(false);
          triggerToast('Template deleted successfully!');
        }} 
      />

      <CopyDetailsModal 
        open={isCopyModalOpen} 
        template={templateInAction} 
        onClose={() => setIsCopyModalOpen(false)} 
        onCopySuccess={() => triggerToast('Details copied to clipboard!')}
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: '8px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplatesPage;