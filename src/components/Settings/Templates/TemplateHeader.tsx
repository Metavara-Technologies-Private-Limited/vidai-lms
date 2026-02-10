import React, { useState } from 'react';
import { Box, Typography, Button, TextField, InputAdornment, IconButton, Tabs, Tab } from '@mui/material';
import { Search, FilterList, Add } from '@mui/icons-material';
import styles from '../../../styles/Template/TemplateHeader.module.css';
import { TemplateFilterPopover } from './TemplateFilterPopover';

interface TemplateHeaderProps {
  onTabChange: (tabName: string) => void;
  onNewTemplate: () => void;
  onSearch: (query: string) => void;
  onApplyFilters: (filters: any) => void;
  counts: { email: number; sms: number; whatsapp: number };
}

export const TemplateHeader: React.FC<TemplateHeaderProps> = ({ 
  onTabChange, onNewTemplate, onSearch, onApplyFilters, counts 
}) => {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  // 🆕 Changed from anchorEl to a simple boolean for centered display
  const [isFilterOpen, setIsFilterOpen] = useState(false); 

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
            onChange={(e) => onSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: '#9CA3AF' }} />
                </InputAdornment>
              ),
            }}
          />
          
          <IconButton 
            className={styles.filterBtn}
            onClick={() => setIsFilterOpen(true)} // 🆕 Open centered dialog
          >
            <FilterList fontSize="small" />
          </IconButton>

          <TemplateFilterPopover 
            open={isFilterOpen} // 🆕 Pass boolean state
            onClose={() => setIsFilterOpen(false)}
            onApply={onApplyFilters}
            onClear={() => onApplyFilters(null)}
          />
          
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
            label={<Box component="span">Email <span className={styles.countText}>({counts.email})</span></Box>} 
            className={`${styles.tabItem} ${activeTabIdx === 0 ? styles.activeTab : ''}`} 
          />
          <Tab 
            label={<Box component="span">SMS <span className={styles.countText}>({counts.sms})</span></Box>} 
            className={`${styles.tabItem} ${activeTabIdx === 1 ? styles.activeTab : ''}`} 
          />
          <Tab 
            label={<Box component="span">WhatsApp <span className={styles.countText}>({counts.whatsapp})</span></Box>} 
            className={`${styles.tabItem} ${activeTabIdx === 2 ? styles.activeTab : ''}`} 
          />
        </Tabs>
      </Box>
    </Box>
  );
};