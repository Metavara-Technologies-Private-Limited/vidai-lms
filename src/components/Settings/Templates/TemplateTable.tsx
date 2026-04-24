import React, { useState } from 'react';
import { Box } from '@mui/material';
import { TemplateHeader } from './TemplateHeader';
import { EmailTemplateTable } from './EmailTemplate';
import { SmsTemplateTable } from './SMSTemplate';
import { WhatsAppTemplateTable } from './WhatsAppTemplate'; // New Import
import { NewTemplateModal } from './NewTemplateModal';
import { TEMPLATES_MOCK_DATA } from '../templateMockData';
import styles from '../../../styles/Templates/TemplatesPage.module.css';
import type { Filters } from './TemplateFilterPopover';

const TemplatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Email');
  const [isModalOpen, setModalOpen] = useState(false);

  // Dynamic counts for the tabs
  const counts = {
    email: TEMPLATES_MOCK_DATA.filter(t => t.type === 'email').length,
    sms: TEMPLATES_MOCK_DATA.filter(t => t.type === 'sms').length,
    whatsapp: TEMPLATES_MOCK_DATA.filter(t => t.type === 'whatsapp').length,
  };

  return (
    <Box className={styles.pageContainer}>
      <TemplateHeader 
        onTabChange={(tab) => setActiveTab(tab)}
        onNewTemplate={() => setModalOpen(true)}
        counts={counts} onSearch={function (): void {
          throw new Error('Function not implemented.');
        } } onApplyFilters={function (_filters: Filters | null): void { // eslint-disable-line @typescript-eslint/no-unused-vars
          throw new Error('Function not implemented.');
        } }      />

      <Box className={styles.tableWrapper}>
        {/* Render the correct table for the active tab */}
        {activeTab === 'Email' && <EmailTemplateTable />}
        {activeTab === 'SMS' && <SmsTemplateTable />}
        {activeTab === 'WhatsApp' && <WhatsAppTemplateTable />}
      </Box>

      <NewTemplateModal 
              open={isModalOpen}
              onClose={() => setModalOpen(false)} onSave={function (): void {
                  throw new Error('Function not implemented.');
              } } mode={'create'}      />
    </Box>
  );
};

export default TemplatesPage;