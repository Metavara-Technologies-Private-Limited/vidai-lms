import React from 'react';
import { Box, IconButton, Stack } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import styles from '../../../styles/Template/CustomPagination.module.css';

interface Props {
  count: number;
  page: number;
  onPageChange: (newPage: number) => void;
}

export const CustomPagination: React.FC<Props> = ({ count, page, onPageChange }) => {
  // Generate page numbers array
  const pages = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <Box className={styles.paginationContainer}>
      <Stack direction="row" spacing={1} alignItems="center">
        {/* Previous Button */}
        <IconButton 
          onClick={() => onPageChange(page - 1)} 
          disabled={page === 0}
          className={styles.arrowBtn}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        {/* Page Numbers */}
        {pages.map((p, idx) => (
          <Box
            key={p}
            onClick={() => onPageChange(idx)}
            className={`${styles.pageNumber} ${page === idx ? styles.activePage : ''}`}
          >
            {p}
          </Box>
        ))}

        {/* Next Button */}
        <IconButton 
          onClick={() => onPageChange(page + 1)} 
          disabled={page === count - 1}
          className={styles.arrowBtn}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
};