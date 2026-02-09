import React, { useState } from 'react';
import { Box, Typography, Button, TextField, InputAdornment, IconButton, Tabs, Tab } from '@mui/material';
import { Search, FilterList, Add } from '@mui/icons-material';
import styles from '../../../styles/Template/TemplateHeader.module.css';

interface TemplateHeaderProps {
  onTabChange: (tabName: string) => void;
  onNewTemplate: () => void;
  counts: { email: number; sms: number; whatsapp: number }; // Added counts prop
}

export const TemplateHeader: React.FC<TemplateHeaderProps> = ({ onTabChange, onNewTemplate, counts }) => {
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTabIdx(newValue);
    const tabLabels = ['Email', 'SMS', 'WhatsApp'];
    onTabChange(tabLabels[newValue]);
  };

  return (
    <Box className={styles.mainContainer}>
      <Box className={styles.topSection}>
        <Typography variant="h5" className={styles.title}>Templates</Typography>
        <Box className={styles.actions}>
          <TextField
            placeholder="Search by Template name"
            size="small"
            className={styles.searchField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: '#9CA3AF' }} />
                </InputAdornment>
              ),
            }}
          />
          <IconButton className={styles.filterBtn}><FilterList fontSize="small" /></IconButton>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            className={styles.newTemplateBtn}
            onClick={onNewTemplate}
          >
            New Template
          </Button>
        </Box>
      </Box>

      <Box className={styles.tabsWrapper}>
        <Tabs value={activeTabIdx} onChange={handleTabChange} TabIndicatorProps={{ style: { display: 'none' } }}>
          <Tab 
            label={<span>Email <span className={styles.countText}>({counts.email})</span></span>} 
            className={`${styles.tabItem} ${activeTabIdx === 0 ? styles.activeTab : ''}`} 
          />
          <Tab 
            label={<span>SMS <span className={styles.countText}>({counts.sms})</span></span>} 
            className={`${styles.tabItem} ${activeTabIdx === 1 ? styles.activeTab : ''}`} 
          />
          <Tab 
            label={<span>WhatsApp <span className={styles.countText}>({counts.whatsapp})</span></span>} 
            className={`${styles.tabItem} ${activeTabIdx === 2 ? styles.activeTab : ''}`} 
          />
        </Tabs>
      </Box>
    </Box>
  );
};