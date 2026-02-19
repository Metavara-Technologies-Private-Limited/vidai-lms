import React, { useState, useEffect, useCallback } from 'react';
import { Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import { TemplateHeader } from './TemplateHeader';
import { EmailTemplateTable } from './EmailTemplateTable';
import { SmsTemplateTable } from './SmsTemplateTable';
import { WhatsAppTemplateTable } from './WhatsAppTemplateTable';
import { NewTemplateModal } from './NewTemplateModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CopyDetailsModal } from './CopyDetailsModal';
import TemplateService, { type APITemplateType } from "../../../services/templates.api";
import styles from "../../../styles/Template/TemplatesPage.module.css";

const TemplatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Email');
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ✅ NEW: State for all templates to show counts immediately
  const [templates, setTemplates] = useState({
    mail: [] as any[],
    sms: [] as any[],
    whatsapp: [] as any[]
  });

  const [activeTemplate, setActiveTemplate] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'create' | 'edit' | 'view'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [templateInAction, setTemplateInAction] = useState<any | null>(null);
  const [activeFilters, setActiveFilters] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const getApiType = (tab: string): APITemplateType => {
    if (tab === 'Email') return 'mail';
    return tab.toLowerCase() as APITemplateType;
  };

  // ✅ UPDATED: Fetch everything at once
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const [mailData, smsData, waData] = await Promise.all([
        TemplateService.getTemplates('mail'),
        TemplateService.getTemplates('sms'),
        TemplateService.getTemplates('whatsapp')
      ]);

      setTemplates({
        mail: Array.isArray(mailData) ? mailData : [],
        sms: Array.isArray(smsData) ? smsData : [],
        whatsapp: Array.isArray(waData) ? waData : []
      });
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      triggerToast('Error loading templates', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const getFilteredData = () => {
    const currentType = getApiType(activeTab);
    let filtered = [...templates[currentType]]; 

    if (searchQuery) {
      filtered = filtered.filter(t => 
        (t.audience_name || t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeFilters?.priority) {
      filtered = filtered.filter(t => (t.use_case || t.useCase || '').toLowerCase() === activeFilters.priority.toLowerCase());
    }
    return filtered;
  };

  const handleAction = (type: 'view' | 'edit' | 'copy' | 'delete', template: any) => {
    const typeMapping: Record<string, string> = { 'Email': 'email', 'SMS': 'sms', 'WhatsApp': 'whatsapp' };
    const mappedTemplate = {
      ...template,
      type: typeMapping[activeTab],
      name: template.audience_name || template.name,
      body: template.email_body || template.body,
      useCase: template.use_case || template.useCase,
      createdBy: template.created_by_name || template.createdBy || 'Admin',
    };

    setTemplateInAction(mappedTemplate);

    if (type === 'view') {
      setViewMode('view');
      setActiveTemplate(mappedTemplate);
      setModalOpen(true);
    } else if (type === 'edit') {
      setViewMode('edit');
      setActiveTemplate(mappedTemplate);
      setModalOpen(true);
    } else if (type === 'copy') {
      setIsCopyModalOpen(true);
    } else if (type === 'delete') {
      setIsDeleteModalOpen(true);
    }
  };

  const triggerToast = (msg: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message: msg, severity });
  };

  const handleConfirmDelete = async () => {
    if (!templateInAction) return;
    try {
      await TemplateService.deleteTemplate(getApiType(activeTab), templateInAction.id);
      triggerToast('Template deleted successfully!');
      loadTemplates();
    } catch (err) {
      triggerToast('Delete failed', 'error');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <Box className={styles.pageContainer} sx={{ overflow: 'hidden', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TemplateHeader 
        onTabChange={(tab) => { setActiveTab(tab); setSearchQuery(''); }}
        onNewTemplate={() => { setViewMode('create'); setActiveTemplate(null); setModalOpen(true); }}
        onSearch={setSearchQuery}
        onApplyFilters={setActiveFilters}
        // ✅ UPDATED: All counts show immediately from the bulk load
        counts={{
          email: templates.mail.length,
          sms: templates.sms.length,
          whatsapp: templates.whatsapp.length,
        }} 
      />

      <Box className={styles.tableWrapper} sx={{ flexGrow: 1, overflowY: 'auto', p: 2, position: 'relative' }}>
        {loading && templates.mail.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
        ) : (
          <>
            {activeTab === 'Email' && <EmailTemplateTable data={getFilteredData()} searchQuery={searchQuery} onAction={handleAction} />}
            {activeTab === 'SMS' && <SmsTemplateTable data={getFilteredData()} searchQuery={searchQuery} onAction={handleAction} />}
            {activeTab === 'WhatsApp' && <WhatsAppTemplateTable data={getFilteredData()} searchQuery={searchQuery} onAction={handleAction} />}
          </>
        )}
      </Box>

      <NewTemplateModal 
        open={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={() => { loadTemplates(); triggerToast(`Template ${viewMode === 'edit' ? 'updated' : 'saved'} successfully!`); }} 
        initialData={activeTemplate} 
        mode={viewMode} 
      />

      <DeleteConfirmModal 
        open={isDeleteModalOpen} 
        templateName={templateInAction?.audience_name || templateInAction?.name || ''} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleConfirmDelete} 
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