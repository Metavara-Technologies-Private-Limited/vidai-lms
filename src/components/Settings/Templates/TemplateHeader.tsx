import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import { Search, Add } from "@mui/icons-material";
import styles from "../../../styles/Template/TemplateHeader.module.css";
import { TemplateFilterPopover, type Filters } from "./TemplateFilterPopover";
import FilterLeadsIcon from "../../../assets/icons/Filter_Leads.svg";

interface TemplateHeaderProps {
  onTabChange: (tabName: string) => void;
  onNewTemplate: () => void;
  onSearch: (query: string) => void;
  onApplyFilters: (filters: Filters | null) => void;
  counts: { email: number; sms: number; whatsapp: number };
  useCaseOptions?: string[];
  canAddTemplate?: boolean;
}

export const TemplateHeader: React.FC<TemplateHeaderProps> = ({
  onTabChange,
  onNewTemplate,
  onSearch,
  onApplyFilters,
  counts,
  useCaseOptions = [],
  canAddTemplate = true,
}) => {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  // 🆕 Changed from anchorEl to a simple boolean for centered display
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTabIdx(newValue);
    const tabLabels = ["Email", "SMS", "WhatsApp"];
    onTabChange(tabLabels[newValue]);
  };

  return (
    <Box className={styles.mainContainer}>
      <Box className={styles.topSection}>
        <Typography variant="h5" className={styles.title}>
          Templates
        </Typography>

        <Box className={styles.actions}>
          <TextField
            placeholder="Search by Template name"
            size="small"
            className={styles.searchField}
            onChange={(e) => onSearch(e.target.value)}
                sx={{
                  flex: { xs: "1 1 180px", sm: "0 1 auto" },
                  width: { xs: "auto", sm: 240 },
                  minWidth: { xs: 0, sm: 220 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    backgroundColor: "#fff",
                  },
    "& input::placeholder": {   
      fontSize: "14px",
      opacity: 0.5,
    },
                }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: "#9CA3AF" }} />
                </InputAdornment>
              ),
            }}
          />

          <IconButton
            className={styles.filterBtn}
            onClick={() => setIsFilterOpen(true)} // 🆕 Open centered dialog
            sx={{
              p: 0.75,
              border: "none",
              bgcolor: "transparent",
              "&:hover": { bgcolor: "transparent" },
            }}
          >
            <img
              src={FilterLeadsIcon}
              alt="Filter"
              style={{ width: "40px", height: "40px" }}
            />
          </IconButton>

          <TemplateFilterPopover
            open={isFilterOpen} // 🆕 Pass boolean state
            onClose={() => setIsFilterOpen(false)}
            onApply={onApplyFilters}
            onClear={() => onApplyFilters(null)}
            useCaseOptions={useCaseOptions}
          />

          <Tooltip
            title={!canAddTemplate ? "You do not have permission to create templates." : ""}
            disableHoverListener={canAddTemplate}
            disableFocusListener={canAddTemplate}
            disableTouchListener={canAddTemplate}
          >
            <span>
              <Button
                variant="contained"
                startIcon={<Add />}
                className={`${styles.newTemplateBtn} mobile-add-button`}
                onClick={onNewTemplate}
                disabled={!canAddTemplate}
              >
                <span className="mobile-add-button-label">New Template</span>
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Box className={styles.tabsWrapper}>
        <Tabs
          value={activeTabIdx}
          onChange={handleTabChange}
          TabIndicatorProps={{ style: { display: "none" } }}
        >
          <Tab
            label={
              <Box component="span">
                Email <span className={styles.countText}>({counts.email})</span>
              </Box>
            }
            className={`${styles.tabItem} ${activeTabIdx === 0 ? styles.activeTab : ""}`}
          />
          <Tab
            label={
              <Box component="span">
                SMS <span className={styles.countText}>({counts.sms})</span>
              </Box>
            }
            className={`${styles.tabItem} ${activeTabIdx === 1 ? styles.activeTab : ""}`}
          />
          <Tab
            label={
              <Box component="span">
                WhatsApp{" "}
                <span className={styles.countText}>({counts.whatsapp})</span>
              </Box>
            }
            className={`${styles.tabItem} ${activeTabIdx === 2 ? styles.activeTab : ""}`}
          />
        </Tabs>
      </Box>
    </Box>
  );
};
