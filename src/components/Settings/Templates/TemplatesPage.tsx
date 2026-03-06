import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, CircularProgress } from '@mui/material';
import TemplateService, { type APITemplateType } from "../../../services/templates.api";
import styles from "../../../styles/Template/TemplatesPage.module.css";
import type { EmailTemplate, SMSTemplate, WhatsAppTemplate, Template, TemplatesState, TemplateFilters } from '../../../types/templates.types';

const TemplateHeader = lazy(() =>
  import('./TemplateHeader').then((module) => ({ default: module.TemplateHeader }))
);
const EmailTemplateTable = lazy(() =>
  import('./EmailTemplateTable').then((module) => ({ default: module.EmailTemplateTable }))
);
const SmsTemplateTable = lazy(() =>
  import('./SmsTemplateTable').then((module) => ({ default: module.SmsTemplateTable }))
);
const WhatsAppTemplateTable = lazy(() =>
  import('./WhatsAppTemplateTable').then((module) => ({ default: module.WhatsAppTemplateTable }))
);
const NewTemplateModal = lazy(() =>
  import('./NewTemplateModal').then((module) => ({ default: module.NewTemplateModal }))
);
const DeleteConfirmModal = lazy(() =>
  import('./DeleteConfirmModal').then((module) => ({ default: module.DeleteConfirmModal }))
);
const CopyDetailsModal = lazy(() =>
  import('./CopyDetailsModal').then((module) => ({ default: module.CopyDetailsModal }))
);

const TemplatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Email');
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ✅ NEW: State for all templates to show counts immediately
  const [templates, setTemplates] = useState<TemplatesState>({
    mail: [],
    sms: [],
    whatsapp: []
  });

  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<'create' | 'edit' | 'view'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [templateInAction, setTemplateInAction] = useState<Template | null>(null);
  const [activeFilters, setActiveFilters] = useState<TemplateFilters | null>(null);

  const useCaseOptions = React.useMemo(() => {
    const allTemplates = [
      ...templates.mail,
      ...templates.sms,
      ...templates.whatsapp,
    ];

    return Array.from(
      new Set(
        allTemplates
          .map((template) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tAny = template as any;
            return ((tAny.use_case || tAny.useCase || '') as string).trim();
          })
          .filter(Boolean),
      ),
    );
  }, [templates]);

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
      toast.error('Error loading templates');
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
      filtered = filtered.filter(t => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tAny = t as any;
        const name = (tAny.audience_name || tAny.name || '') as string;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    if (activeFilters?.useCase) {
      filtered = filtered.filter(t => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tAny = t as any;
        const useCase = (tAny.use_case || tAny.useCase || '') as string;
        return useCase.toLowerCase() === activeFilters.useCase?.toLowerCase();
      });
    }
    return filtered;
  };

  const handleAction = (type: 'view' | 'edit' | 'copy' | 'delete', template: EmailTemplate | SMSTemplate | WhatsAppTemplate) => {
    const typeMapping: Record<string, string> = { 'Email': 'email', 'SMS': 'sms', 'WhatsApp': 'whatsapp' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tAny = template as any;
    const mappedTemplate = {
      ...template,
      type: typeMapping[activeTab],
      name: ((tAny.audience_name || tAny.name || '') as string),
      body: ((tAny.email_body || tAny.body || '') as string),
      useCase: ((tAny.use_case || tAny.useCase || '') as string),
      createdBy: ((tAny.created_by_name || tAny.createdBy || 'Admin') as string),
    } as Template & Record<string, unknown>;

    setTemplateInAction(mappedTemplate as Template);

    if (type === 'view') {
      setViewMode('view');
      setActiveTemplate(mappedTemplate as Template);
      setModalOpen(true);
    } else if (type === 'edit') {
      setViewMode('edit');
      setActiveTemplate(mappedTemplate as Template);
      setModalOpen(true);
    } else if (type === 'copy') {
      setIsCopyModalOpen(true);
    } else if (type === 'delete') {
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!templateInAction) return;
    try {
      await TemplateService.deleteTemplate(getApiType(activeTab), templateInAction.id);
      toast.success('Template deleted successfully!');
      loadTemplates();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Delete failed');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <Box className={styles.pageContainer} sx={{ overflow: 'hidden', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Suspense fallback={<Box sx={{ p: 2 }} />}>
        <TemplateHeader
          onTabChange={(tab) => { setActiveTab(tab); }}
          onNewTemplate={() => { setViewMode('create'); setActiveTemplate(null); setModalOpen(true); }}
          onSearch={setSearchQuery}
          onApplyFilters={(filters) => setActiveFilters(filters as TemplateFilters | null)}
          useCaseOptions={useCaseOptions}
          counts={{
            email: templates.mail.length,
            sms: templates.sms.length,
            whatsapp: templates.whatsapp.length,
          }}
        />
      </Suspense>

      <Box className={styles.tableWrapper} sx={{ flexGrow: 1, overflowY: 'auto', p: 2, position: 'relative' }}>
        {loading && templates.mail.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
        ) : (
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress size={24} /></Box>}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {activeTab === 'Email' && <EmailTemplateTable data={getFilteredData()} onAction={handleAction as any} />}
            {activeTab === 'SMS' && <SmsTemplateTable data={getFilteredData()} onAction={handleAction} />}
            {activeTab === 'WhatsApp' && <WhatsAppTemplateTable data={getFilteredData()} onAction={handleAction} />}
          </Suspense>
        )}
      </Box>

      {isModalOpen && (
        <Suspense fallback={null}>
          <NewTemplateModal
            open={isModalOpen}
            onClose={() => setModalOpen(false)}
            onSave={() => { loadTemplates(); }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialData={activeTemplate as any || undefined}
            mode={viewMode}
          />
        </Suspense>
      )}

      {isDeleteModalOpen && (
        <Suspense fallback={null}>
          <DeleteConfirmModal
            open={isDeleteModalOpen}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            templateName={((templateInAction as any)?.audience_name || (templateInAction as any)?.name || '')}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
          />
        </Suspense>
      )}

      {isCopyModalOpen && (
        <Suspense fallback={null}>
          <CopyDetailsModal
            open={isCopyModalOpen}
            template={templateInAction || ({} as Template)}
            onClose={() => setIsCopyModalOpen(false)}
            onCopySuccess={() => toast.success('Details copied to clipboard!')}
          />
        </Suspense>
      )}

    </Box>
  );
};

export default TemplatesPage;