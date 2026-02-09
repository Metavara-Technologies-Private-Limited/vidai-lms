import React, { useState } from 'react';
import { Box } from '@mui/material';
import { TemplateHeader } from './TemplateHeader';
import { EmailTemplateTable } from './EmailTemplate';
import { SmsTemplateTable } from './SMSTemplate';
import { WhatsAppTemplateTable } from './WhatsAppTemplate'; // 🆕 New Import
import { NewTemplateModal } from './NewTemplateModal';
import { TEMPLATES_MOCK_DATA } from '../templateMockData';
import styles from '../../../styles/Template/TemplatesPage.module.css';

const TemplatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Email');
  const [isModalOpen, setModalOpen] = useState(false);

  // Dynamic counts for each tab derived from mock data
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
        counts={counts}
      />

      <Box className={styles.tableWrapper}>
        {/* Toggle tables based on activeTab */}
        {activeTab === 'Email' && <EmailTemplateTable />}
        {activeTab === 'SMS' && <SmsTemplateTable />}
        {activeTab === 'WhatsApp' && <WhatsAppTemplateTable />}
      </Box>

      <NewTemplateModal 
        open={isModalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </Box>
  );
};

export default TemplatesPage;