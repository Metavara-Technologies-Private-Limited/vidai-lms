import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Box, Stack, Typography } from '@mui/material';
import { Visibility, Edit, ContentCopy } from '@mui/icons-material';
import TrashIcon from '../../../assets/icons/trash.svg';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import styles from '../../../styles/Template/TemplateTable.module.css';
import type { FormTemplate, EmailTemplate, SMSTemplate, WhatsAppTemplate } from '../../../types/templates.types';

type TableTemplate = EmailTemplate | SMSTemplate | WhatsAppTemplate;

interface Props {
  data: TableTemplate[];
  onAction: (type: 'view' | 'edit' | 'copy' | 'delete', template: TableTemplate) => void;
}

export const SmsTemplateTable: React.FC<Props> = ({ data = [], onAction }) => {
  const [page, setPage] = useState(0); 
  const rowsPerPage = 10;
  const totalPages = data.length === 0 ? 0 : Math.ceil(data.length / rowsPerPage);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const visibleRows = data.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);

  const start = data.length === 0 ? 0 : safePage * rowsPerPage + 1;
  const end = Math.min((safePage + 1) * rowsPerPage, data.length);

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const goToPage = (idx: number) => setPage(Math.min(Math.max(0, idx), Math.max(0, totalPages - 1)));

  const getUseCaseStyles = (useCase: string | undefined) => {
    // FIX: Added safe check to prevent toLowerCase() undefined crash
    const safeCase = (useCase || 'default').toLowerCase();
    switch (safeCase) {
      case 'appointment': return { color: '#16A34A', bgColor: '#F0FDF4', borderColor: '#DCFCE7' };
      case 'reminder': return { color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FEF3C7' };
      case 'feedback': return { color: '#EA580C', bgColor: '#FFF7ED', borderColor: '#FFEDD5' };
      default: return { color: '#6B7280', bgColor: '#F9FAFB', borderColor: '#F3F4F6' };
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TableContainer component={Paper} elevation={0} className={styles.container}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className={styles.headCell}>Template Name</TableCell>
              <TableCell className={styles.headCell}>Content</TableCell>
              <TableCell className={styles.headCell}>Use Case</TableCell>
              <TableCell className={styles.headCell}>Last Updated At</TableCell>
              <TableCell className={styles.headCell}>Created By</TableCell>
              <TableCell className={styles.headCell} align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#6B7280' }}>
                  No SMS templates found.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => {
                const record = row as FormTemplate;
                // DB Field Mapping: Map audience_name and email_body from your API
                const templateName = record.audience_name || record.name || 'Untitled SMS';
                const bodyContent = record.email_body || record.subject || record.body || '--';
                const useCase = record.use_case || record.useCase || 'General';
                const date = record.modified_at || record.lastUpdatedAt || record.updated_at || 'N/A';
                const author = record.created_by_name || record.createdBy || 'System';

                const ui = getUseCaseStyles(useCase);

                return (
                  <TableRow key={String(record.id ?? templateName)} className={styles.bodyRow}>
                    <TableCell className={styles.nameCell}>
                      {templateName}
                    </TableCell>
                    <TableCell className={styles.subjectCell}>
                      {bodyContent}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={useCase} 
                        sx={{ 
                          color: ui.color, 
                          bgcolor: ui.bgColor, 
                          border: `1px solid ${ui.borderColor}`, 
                          fontWeight: 600, 
                          fontSize: '11px', 
                          height: '24px', 
                          borderRadius: '100px' 
                        }} 
                      />
                    </TableCell>
                    <TableCell className={styles.dateCell}>
                      {date.includes('T') ? new Date(date).toLocaleDateString() : date}
                    </TableCell>
                    <TableCell className={styles.authorCell}>{author}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <IconButton size="small" sx={{ color: '#5A8AEA' }} onClick={() => onAction('view', row)}>
                          <Visibility fontSize="inherit" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#5A8AEA' }} onClick={() => onAction('edit', row)}>
                          <Edit fontSize="inherit" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#5A8AEA' }} onClick={() => onAction('copy', row)}>
                          <ContentCopy fontSize="inherit" />
                        </IconButton>
                        <IconButton size="small" onClick={() => onAction('delete', row)} sx={{ p: 0.5 }}>
                          <img src={TrashIcon} alt="Delete" style={{ width: '18px', height: '18px' }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box className={styles.paginationWrapper} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
        <Typography variant="caption" sx={{ color: '#6B7280', whiteSpace: 'nowrap' }}>
          Showing {start} to {end} of {data.length} entries
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
          <IconButton onClick={handlePrev} disabled={page === 0} className={styles.arrowBtn}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p, idx) => (
            <Box
              key={p}
              onClick={() => goToPage(idx)}
              className={`${styles.pageNumber} ${page === idx ? styles.activePage : ''}`}
              role="button"
              tabIndex={0}
            >
              {p}
            </Box>
          ))}

          <IconButton onClick={handleNext} disabled={page === totalPages - 1 || totalPages === 0} className={styles.arrowBtn}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};