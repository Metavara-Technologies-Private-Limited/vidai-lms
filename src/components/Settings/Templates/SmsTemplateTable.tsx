import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Box, Stack } from '@mui/material';
import { Visibility, Edit, ContentCopy, Delete } from '@mui/icons-material';
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
        <span key={i} style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 600, borderRadius: '2px' }}>{part}</span>
      ) : (part))}
    </>
  );
};

interface Props {
  data: Template[];
  searchQuery: string;
  // ✅ Added onAction prop
  onAction: (type: 'view' | 'edit' | 'copy' | 'delete', template: Template) => void;
}

export const SmsTemplateTable: React.FC<Props> = ({ data, searchQuery, onAction }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const visibleRows = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                    <Chip label={row.useCase} sx={{ color: ui.color, bgcolor: ui.bgColor, border: `1px solid ${ui.borderColor}`, fontWeight: 600, fontSize: '11px', height: '24px' }} />
                  </TableCell>
                  <TableCell className={styles.dateCell}>{row.lastUpdatedAt}</TableCell>
                  <TableCell className={styles.authorCell}>{row.createdBy}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {/* ✅ Logic connected to Icons */}
                      <IconButton size="small" sx={{ color: '#6366F1' }} onClick={() => onAction('view', row)}><Visibility fontSize="inherit" /></IconButton>
                      <IconButton size="small" sx={{ color: '#3B82F6' }} onClick={() => onAction('edit', row)}><Edit fontSize="inherit" /></IconButton>
                      <IconButton size="small" sx={{ color: '#10B981' }} onClick={() => onAction('copy', row)}><ContentCopy fontSize="inherit" /></IconButton>
                      <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => onAction('delete', row)}><Delete fontSize="inherit" /></IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box className={styles.paginationWrapper}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => setPage(page - 1)} disabled={page === 0} className={styles.arrowBtn}><ChevronLeftIcon fontSize="small" /></IconButton>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p, idx) => (
            <Box key={p} onClick={() => setPage(idx)} className={`${styles.pageNumber} ${page === idx ? styles.activePage : ''}`}>{p}</Box>
          ))}
          <IconButton onClick={() => setPage(page + 1)} disabled={page === totalPages - 1} className={styles.arrowBtn}><ChevronRightIcon fontSize="small" /></IconButton>
        </Stack>
      </Box>
    </Box>
  );
};