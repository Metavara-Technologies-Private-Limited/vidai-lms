import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Box, Stack, Typography } from '@mui/material';
import { Visibility, Edit, ContentCopy } from '@mui/icons-material';
import TrashIcon from '../../../assets/icons/trash.svg';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { Template } from '../templateMockData';
import styles from '../../../styles/Template/TemplateTable.module.css';

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => regex.test(part) ? (
        <span key={i} style={{ fontWeight: 700, color: '#111827' }}>{part}</span>
      ) : (part))}
    </>
  );
};

interface Props {
  data: Template[];
  searchQuery: string;
  onAction: (type: 'view' | 'edit' | 'copy' | 'delete', template: Template) => void;
}

export const SmsTemplateTable: React.FC<Props> = ({ data, searchQuery, onAction }) => {
  const [page, setPage] = useState(0); // 0-based
  const rowsPerPage = 10;
  const totalPages = data.length === 0 ? 0 : Math.ceil(data.length / rowsPerPage);
  const visibleRows = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // clamp page when data changes
  useEffect(() => {
    if (totalPages === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(0);
      return;
    }
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [data.length, totalPages, page]);

  const start = data.length === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min((page + 1) * rowsPerPage, data.length);

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const goToPage = (idx: number) => setPage(Math.min(Math.max(0, idx), Math.max(0, totalPages - 1)));

  const getUseCaseStyles = (useCase: string) => {
    switch (useCase.toLowerCase()) {
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
            {visibleRows.map((row) => {
              const ui = getUseCaseStyles(row.useCase);
              return (
                <TableRow key={row.id} className={styles.bodyRow}>
                  <TableCell className={styles.nameCell}><HighlightText text={row.name} highlight={searchQuery} /></TableCell>
                  <TableCell className={styles.subjectCell}><HighlightText text={row.subject} highlight={searchQuery} /></TableCell>
                  <TableCell>
                    <Chip label={row.useCase} sx={{ color: ui.color, bgcolor: ui.bgColor, border: `1px solid ${ui.borderColor}`, fontWeight: 600, fontSize: '11px', height: '24px', borderRadius: '100px' }} />
                  </TableCell>
                  <TableCell className={styles.dateCell}>{row.lastUpdatedAt}</TableCell>
                  <TableCell className={styles.authorCell}>{row.createdBy}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton size="small" sx={{ color: '#5A8AEA' }} onClick={() => onAction('view', row)}><Visibility fontSize="inherit" /></IconButton>
                      <IconButton size="small" sx={{ color: '#5A8AEA' }} onClick={() => onAction('edit', row)}><Edit fontSize="inherit" /></IconButton>
                      <IconButton size="small" sx={{ color: '#5A8AEA' }} onClick={() => onAction('copy', row)}><ContentCopy fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={() => onAction('delete', row)} sx={{ p: 0.5 }}><img src={TrashIcon} alt="Delete" style={{ width: '18px', height: '18px' }} /></IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box className={styles.paginationWrapper} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
        <Typography variant="caption" sx={{ color: '#6B7280', whiteSpace: 'nowrap' }}>
          Showing {start} to {end} of {data.length} entries
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
          <IconButton onClick={handlePrev} disabled={page === 0} className={styles.arrowBtn}><ChevronLeftIcon fontSize="small" /></IconButton>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p, idx) => (
            <Box
              key={p}
              onClick={() => goToPage(idx)}
              className={`${styles.pageNumber} ${page === idx ? styles.activePage : ''}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goToPage(idx); }}
              aria-current={page === idx ? 'page' : undefined}
            >
              {p}
            </Box>
          ))}

          <IconButton onClick={handleNext} disabled={page === totalPages - 1 || totalPages === 0} className={styles.arrowBtn}><ChevronRightIcon fontSize="small" /></IconButton>
        </Stack>
      </Box>
    </Box>
  );
};