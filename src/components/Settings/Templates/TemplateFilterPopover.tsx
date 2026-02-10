import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Dialog, TextField, MenuItem, Select, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const TemplateFilterPopover: React.FC<any> = ({ open, onClose, onApply, onClear }) => {
  const [filters, setFilters] = useState({
    fromDate: '2025-12-01',
    toDate: '2025-12-31',
    priority: 'Low',
    department: 'Andrology'
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ 
        sx: { 
          borderRadius: '12px', 
          width: '400px', 
          maxHeight: 'none', // 🆕 Fix popup screen height
          overflow: 'hidden' // 🆕 Remove internal scroll
        } 
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 700 }}>Filter By</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <Divider />

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF', mb: 0.5, display: 'block' }}>From Date</Typography>
            <TextField fullWidth size="small" type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF', mb: 0.5, display: 'block' }}>To Date</Typography>
            <TextField fullWidth size="small" type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF', mb: 0.5, display: 'block' }}>Priority</Typography>
            <Select fullWidth size="small" value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})}>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF', mb: 0.5, display: 'block' }}>Department</Typography>
            <Select fullWidth size="small" value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})}>
              <MenuItem value="Andrology">Andrology</MenuItem>
              <MenuItem value="IVF">IVF</MenuItem>
            </Select>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => { onClear(); onClose(); }} sx={{ borderRadius: '8px', textTransform: 'none' }}>Clear All</Button>
          <Button fullWidth variant="contained" onClick={() => onApply(filters)} sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#4B4B4B' }}>Apply</Button>
        </Box>
      </Box>
    </Dialog>
  );
};