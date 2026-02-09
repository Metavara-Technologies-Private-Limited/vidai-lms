import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip, IconButton, Box 
} from '@mui/material';
import { Visibility, Edit, ContentCopy, Delete } from '@mui/icons-material';
import { TEMPLATES_MOCK_DATA } from '../templateMockData'; 
import styles from '../../../styles/Template/TemplateTable.module.css';

export const SmsTemplateTable: React.FC = () => {
  const getUseCaseStyles = (useCase: string) => {
    switch (useCase.toLowerCase()) {
      case 'appointment':
        return { color: '#16A34A', bgColor: '#F0FDF4', borderColor: '#DCFCE7' };
      case 'marketing':
        return { color: '#3B82F6', bgColor: '#EFF6FF', borderColor: '#DBEAFE' };
      default:
        return { color: '#6B7280', bgColor: '#F9FAFB', borderColor: '#F3F4F6' };
    }
  };

  return (
    <TableContainer component={Paper} elevation={0} className={styles.container}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell className={styles.headCell}>Template Name</TableCell>
            <TableCell className={styles.headCell}>Message Preview</TableCell>
            <TableCell className={styles.headCell}>Use Case</TableCell>
            <TableCell className={styles.headCell}>Last Updated At</TableCell>
            <TableCell className={styles.headCell}>Created By</TableCell>
            <TableCell className={styles.headCell} align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {TEMPLATES_MOCK_DATA.filter(t => t.type === 'sms').map((row) => {
            const ui = getUseCaseStyles(row.useCase);
            return (
              <TableRow key={row.id} className={styles.bodyRow}>
                <TableCell className={styles.nameCell}>{row.name}</TableCell>
                <TableCell className={styles.subjectCell}>
                  {row.subject.length > 50 ? `${row.subject.substring(0, 50)}...` : row.subject}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={row.useCase} 
                    sx={{ 
                      color: ui.color, 
                      bgcolor: ui.bgColor, 
                      border: `1px solid ${ui.borderColor}`,
                      fontWeight: 600,
                      fontSize: '11px',
                      height: '24px'
                    }} 
                  />
                </TableCell>
                <TableCell className={styles.dateCell}>{row.lastUpdatedAt}</TableCell>
                <TableCell className={styles.authorCell}>{row.createdBy}</TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton size="small" sx={{ color: '#6366F1' }}><Visibility fontSize="inherit" /></IconButton>
                    <IconButton size="small" sx={{ color: '#3B82F6' }}><Edit fontSize="inherit" /></IconButton>
                    <IconButton size="small" sx={{ color: '#10B981' }}><ContentCopy fontSize="inherit" /></IconButton>
                    <IconButton size="small" sx={{ color: '#EF4444' }}><Delete fontSize="inherit" /></IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};