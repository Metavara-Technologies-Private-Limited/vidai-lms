import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, IconButton, Box, Stack, Typography 
} from '@mui/material';
import { Visibility, Edit, ContentCopy } from '@mui/icons-material';
import TrashIcon from '../../../assets/icons/trash.svg';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import styles from '../../../styles/Template/TemplateTable.module.css';

const HighlightText = ({ text, highlight }: { text: string | undefined; highlight: string }) => {
  const safeText = text || "";
  if (!highlight.trim()) return <>{safeText}</>;
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = safeText.split(regex);
  return (
    <>
      {parts.map((part, i) => regex.test(part) ? (
        <span key={i} style={{ fontWeight: 700, color: '#111827' }}>{part}</span>
      ) : (part))}
    </>
  );
};

interface Props {
  data: any[]; 
  searchQuery: string;
  onAction: (type: 'view' | 'edit' | 'copy' | 'delete', template: any) => void;
}

export const WhatsAppTemplateTable: React.FC<Props> = ({ data = [], searchQuery, onAction }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const totalPages = data.length === 0 ? 0 : Math.ceil(data.length / rowsPerPage);
  const visibleRows = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const start = data.length === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min((page + 1) * rowsPerPage, data.length);

  // Pagination Handlers
  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const goToPage = (pageIndex: number) => setPage(pageIndex);

  useEffect(() => {
    if (page > 0 && totalPages > 0 && page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [data.length, totalPages, page]);

  /**
   * ✅ Use Case Styles: 
   * Synchronized with SmsTemplateTable colors and borders.
   */
  const getUseCaseStyles = (useCase: string | undefined) => {
    const safeCase = (useCase || 'default').toLowerCase();
    switch (safeCase) {
      case 'appointment': 
        return { color: '#16A34A', bgColor: '#F0FDF4', borderColor: '#DCFCE7' };
      case 'reminder': 
        return { color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FEF3C7' };
      case 'feedback': 
        return { color: '#EA580C', bgColor: '#FFF7ED', borderColor: '#FFEDD5' };
      case 'marketing': 
        return { color: '#7C3AED', bgColor: '#F5F3FF', borderColor: '#EDE9FE' };
      default: 
        return { color: '#6B7280', bgColor: '#F9FAFB', borderColor: '#F3F4F6' };
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
                  No WhatsApp templates found.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => {
                const useCase = row.use_case || row.useCase || 'General';
                const ui = getUseCaseStyles(useCase);
                const templateName = row.audience_name || row.name || 'Untitled WhatsApp';
                const bodyContent = row.email_body || row.subject || row.body || '--';
                
                const rawDate = row.modified_at || row.lastUpdatedAt || 'N/A';
                const formattedDate = (rawDate && rawDate !== 'N/A' && rawDate.includes('T')) 
                  ? new Date(rawDate).toLocaleDateString('en-GB') 
                  : rawDate;

                return (
                  <TableRow key={row.id} className={styles.bodyRow}>
                    <TableCell className={styles.nameCell}>
                      <HighlightText text={templateName} highlight={searchQuery} />
                    </TableCell>
                    <TableCell className={styles.subjectCell}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: '250px', fontSize: '13px' }}>
                        <HighlightText text={bodyContent} highlight={searchQuery} />
                      </Typography>
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
                    <TableCell className={styles.dateCell}>{formattedDate}</TableCell>
                    <TableCell className={styles.authorCell}>{row.created_by_name || row.createdBy || 'System'}</TableCell>
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
                          <img src={TrashIcon} alt="Delete" style={{ width: '18px' }} />
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

      {/* Pagination Section */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mt: 3,
        px: 1 
      }}>
        <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '13px' }}>
          Showing <strong>{start}</strong> to <strong>{end}</strong> of <strong>{data.length}</strong> entries
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton 
            onClick={handlePrev} 
            disabled={page === 0} 
            sx={{ 
              border: '1px solid #E5E7EB', 
              borderRadius: '8px', 
              p: '6px',
              '&.Mui-disabled': { border: '1px solid #F3F4F6' }
            }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {Array.from({ length: totalPages }, (_, i) => i).map((index) => {
              const isCurrentPage = page === index;
              return (
                <Box
                  key={index}
                  onClick={() => goToPage(index)}
                  sx={{
                    minWidth: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isCurrentPage ? 700 : 500,
                    borderRadius: '8px',
                    bgcolor: isCurrentPage ? '#000000' : 'transparent',
                    color: isCurrentPage ? '#fff' : '#374151',
                    border: isCurrentPage ? '1px solid #000000' : '1px solid #E5E7EB',
                    transition: '0.2s',
                    '&:hover': {
                      bgcolor: isCurrentPage ? '#000000' : '#F9FAFB',
                    }   
                  }}
                >
                  {index + 1}
                </Box>
              );
            })}
          </Box>

          <IconButton 
            onClick={handleNext} 
            disabled={page >= totalPages - 1 || totalPages === 0} 
            sx={{ 
              border: '1px solid #E5E7EB', 
              borderRadius: '8px', 
              p: '6px',
              '&.Mui-disabled': { border: '1px solid #F3F4F6' }
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};