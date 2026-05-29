import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Box, Stack, Typography } from '@mui/material';
import { Visibility, Edit, ContentCopy } from '@mui/icons-material';
import TrashIcon from '../../../assets/icons/trash.svg';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import styles from '../../../styles/Template/TemplateTable.module.css';
import type { FormTemplate, EmailTemplate, SMSTemplate, WhatsAppTemplate } from '../../../types/templates.types';
import type { UseCase } from "../../../services/usecase.api";

type TableTemplate = EmailTemplate | SMSTemplate | WhatsAppTemplate;

interface Props {
  data: TableTemplate[];
  onAction: (
    type: "view" | "edit" | "copy" | "delete",
    template: TableTemplate,
  ) => void;
  canEditTemplate?: boolean;
  useCases?: UseCase[];
}

export const SmsTemplateTable: React.FC<Props> = ({
  data = [],
  onAction,
  canEditTemplate = true,
  useCases = [],
}) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const formatDisplayDate = (value: unknown): string => {
    if (!value) return "N/A";
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) return String(value);
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const sortedData = useMemo(() => {
    const getTime = (row: FormTemplate) => {
      const raw =
        row.modified_at ||
        row.lastUpdatedAt ||
        row.updated_at ||
        row.created_at;
      if (!raw) return 0;
      const ts = new Date(String(raw)).getTime();
      return Number.isNaN(ts) ? 0 : ts;
    };

    return [...data].sort(
      (a, b) => getTime(b as FormTemplate) - getTime(a as FormTemplate),
    );
  }, [data]);

  const totalPages =
    sortedData.length === 0 ? 0 : Math.ceil(sortedData.length / rowsPerPage);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const visibleRows = sortedData.slice(
    safePage * rowsPerPage,
    safePage * rowsPerPage + rowsPerPage,
  );

  const start = sortedData.length === 0 ? 0 : safePage * rowsPerPage + 1;
  const end = Math.min((safePage + 1) * rowsPerPage, sortedData.length);

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const goToPage = (idx: number) =>
    setPage(Math.min(Math.max(0, idx), Math.max(0, totalPages - 1)));

  const getUseCaseStyles = (useCase: string | undefined) => {
    const safeCase = (useCase || "default").trim().toLowerCase();

    switch (safeCase) {
      case "appointment":
        return {
          color: "#16A34A",
          bgColor: "#F0FDF4",
          borderColor: "#DCFCE7",
        };

      case "follow-up":
      case "followup":
        return {
          color: "#3B82F6",
          bgColor: "#EFF6FF",
          borderColor: "#DBEAFE",
        };

      case "reminder":
        return {
          color: "#D97706",
          bgColor: "#FFFBEB",
          borderColor: "#FEF3C7",
        };

      case "re-engagement":
      case "reengagement":
        return {
          color: "#7C3AED",
          bgColor: "#F5F3FF",
          borderColor: "#E9D5FF",
        };

      case "feedback":
        return {
          color: "#EA580C",
          bgColor: "#FFF7ED",
          borderColor: "#FFEDD5",
        };

      default:
        return {
          color: "#6B7280",
          bgColor: "#F9FAFB",
          borderColor: "#F3F4F6",
        };
    }
  };
  const getUseCaseName = (useCaseId?: string) => {
    if (!useCaseId) return "General";

    const matched = useCases.find((uc) => String(uc.id) === String(useCaseId));

    return matched?.name || useCaseId;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <TableContainer
        component={Paper}
        elevation={0}
        className={styles.container}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className={styles.headCell}>Template Name</TableCell>
              <TableCell className={styles.headCell}>Use Case</TableCell>
              <TableCell className={styles.headCell}>Last Updated At</TableCell>
              <TableCell className={styles.headCell}>Created By</TableCell>
              <TableCell className={styles.headCell} align="right">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ py: 3, color: "#6B7280" }}
                >
                  No SMS templates found.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => {
                const record = row as FormTemplate;
                // DB Field Mapping: Map audience_name and email_body from your API
                const templateName =
                  record.audience_name || record.name || "Untitled SMS";
                  const useCaseId = record.use_case || record.useCase || "";
                  const useCase = getUseCaseName(useCaseId);
                const date =
                  record.modified_at ||
                  record.lastUpdatedAt ||
                  record.updated_at ||
                  record.created_at ||
                  "N/A";
                const author =
                  record.created_by_name || record.createdBy || "System";

                const ui = getUseCaseStyles(useCase);

                return (
                  <TableRow
                    key={String(record.id ?? templateName)}
                    className={styles.bodyRow}
                  >
                    <TableCell className={styles.nameCell}>
                      {templateName}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={useCase}
                        sx={{
                          color: ui.color,
                          bgcolor: ui.bgColor,
                          border: `1px solid ${ui.borderColor}`,
                          fontWeight: 600,
                          fontSize: "11px",
                          height: "24px",
                          borderRadius: "100px",
                        }}
                      />
                    </TableCell>
                    <TableCell className={styles.dateCell}>
                      {formatDisplayDate(date)}
                    </TableCell>
                    <TableCell className={styles.authorCell}>
                      {author}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          sx={{ color: "#5A8AEA" }}
                          onClick={() => onAction("view", row)}
                        >
                          <Visibility fontSize="inherit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: "#5A8AEA" }}
                          onClick={() => onAction("edit", row)}
                          disabled={!canEditTemplate}
                        >
                          <Edit fontSize="inherit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: "#5A8AEA" }}
                          onClick={() => onAction("copy", row)}
                        >
                          <ContentCopy fontSize="inherit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onAction("delete", row)}
                          sx={{ p: 0.5 }}
                          disabled={!canEditTemplate}
                        >
                          <img
                            src={TrashIcon}
                            alt="Delete"
                            style={{ width: "18px", height: "18px" }}
                          />
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

      <Box
        className={styles.paginationWrapper}
        sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}
      >
        <Typography
          variant="caption"
          sx={{ color: "#6B7280", whiteSpace: "nowrap" }}
        >
          Showing {start} to {end} of {sortedData.length} entries
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ ml: "auto" }}
        >
          <IconButton
            onClick={handlePrev}
            disabled={page === 0}
            className={styles.arrowBtn}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p, idx) => (
            <Box
              key={p}
              onClick={() => goToPage(idx)}
              className={`${styles.pageNumber} ${page === idx ? styles.activePage : ""}`}
              role="button"
              tabIndex={0}
            >
              {p}
            </Box>
          ))}

          <IconButton
            onClick={handleNext}
            disabled={page === totalPages - 1 || totalPages === 0}
            className={styles.arrowBtn}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};