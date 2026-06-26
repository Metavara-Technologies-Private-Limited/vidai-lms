import * as React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { toast } from "react-toastify";
import ExcelJS from "exceljs";

interface LeadsBulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (files: File[]) => Promise<void>;
  importing?: boolean;
}

type UploadStatus = "uploading" | "ready";

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_FILE_REGEX = /\.(xls|xlsx|csv)$/i;

const TEMPLATE_HEADERS = [
  "Lab Name",
  "Lab Contact No",
  "Lead Name*",
  "Contact No*",
  "Email",
  "Location",
  "Source",
  "Lead Status",
  "Assigned To*",
  "Department",
  "Product Interest",
];

const TEMPLATE_SAMPLE_ROW = [
  "Progenesis",
  "0224567890",
  "John Doe",
  "9876543210",
  "john.doe@example.com",
  "Mumbai",
  "Website",
  "New Lead",
  "superadmin",
  "General",
  "PGT-A",
];

const formatSize = (size: number): string => {
  const mb = size / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

const escapeHtml = (value: string): string => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const buildPreviewHtml = (title: string, rows: string[][]): string => {
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const normalizedRows = rows.map((row) => {
    if (row.length >= maxColumns) return row;
    return [...row, ...Array.from({ length: maxColumns - row.length }, () => "")];
  });

  const tableRows = normalizedRows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell) => {
          const tag = rowIndex === 0 ? "th" : "td";
          return `<${tag}>${escapeHtml(String(cell ?? ""))}</${tag}>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #111827; }
    h2 { margin: 0 0 12px; font-size: 20px; }
    .meta { margin-bottom: 12px; color: #6B7280; font-size: 13px; }
    .table-wrap { overflow: auto; border: 1px solid #E5E7EB; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; min-width: 640px; }
    th, td { border-bottom: 1px solid #E5E7EB; border-right: 1px solid #F3F4F6; padding: 8px 10px; text-align: left; white-space: nowrap; font-size: 13px; }
    th { position: sticky; top: 0; background: #F9FAFB; font-weight: 600; }
    tr:last-child td { border-bottom: none; }
  </style>
</head>
<body>
  <h2>${escapeHtml(title)}</h2>
  <div class="meta">Preview shows first 100 rows.</div>
  <div class="table-wrap">
    <table>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
</body>
</html>`;
};

const LeadsBulkImportModal: React.FC<LeadsBulkImportModalProps> = ({
  open,
  onClose,
  onImport,
  importing = false,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const intervalMapRef = React.useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const [uploadItems, setUploadItems] = React.useState<UploadItem[]>([]);

  const clearUploadIntervals = React.useCallback(() => {
    Object.values(intervalMapRef.current).forEach((intervalId) => clearInterval(intervalId));
    intervalMapRef.current = {};
  }, []);

  React.useEffect(() => {
    if (!open) {
      clearUploadIntervals();
      setUploadItems([]);
    }
  }, [open, clearUploadIntervals]);

  React.useEffect(() => {
    return () => {
      clearUploadIntervals();
    };
  }, [clearUploadIntervals]);

  const startMockUpload = React.useCallback((itemId: string) => {
    const intervalId = setInterval(() => {
      setUploadItems((current) =>
        current.map((item) => {
          if (item.id !== itemId || item.status === "ready") return item;

          const nextProgress = Math.min(item.progress + 20, 100);
          if (nextProgress >= 100) {
            clearInterval(intervalMapRef.current[itemId]);
            delete intervalMapRef.current[itemId];
            return { ...item, progress: 100, status: "ready" };
          }

          return { ...item, progress: nextProgress };
        }),
      );
    }, 300);

    intervalMapRef.current[itemId] = intervalId;
  }, []);

  const addFiles = React.useCallback((files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!SUPPORTED_FILE_REGEX.test(file.name)) {
        toast.error(`Unsupported file: ${file.name}. Use XLS/XLSX/CSV.`);
        return false;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${file.name} exceeds 10MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newItems: UploadItem[] = validFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      progress: 0,
      status: "uploading",
    }));

    setUploadItems((current) => [...newItems, ...current]);
    newItems.forEach((item) => startMockUpload(item.id));
  }, [startMockUpload]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    addFiles(files);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files ?? []);
    addFiles(files);
  };

  const handleDeleteItem = (itemId: string) => {
    if (intervalMapRef.current[itemId]) {
      clearInterval(intervalMapRef.current[itemId]);
      delete intervalMapRef.current[itemId];
    }
    setUploadItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handlePreviewItem = async (file: File) => {
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      toast.error("Pop-up blocked. Please allow pop-ups to preview files.");
      return;
    }

    previewWindow.document.write("<html><body style='font-family:Arial;padding:16px'>Loading preview...</body></html>");
    previewWindow.document.close();

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      let previewRows: string[][] = [];

      if (extension === "csv") {
        const text = await file.text();
        previewRows = text
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .slice(0, 100)
          .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
      } else {
        if (extension === "xls") {
          throw new Error("Old .xls preview is not supported. Please use .xlsx or .csv.");
        }

        const workbook = new ExcelJS.Workbook();
        const buffer = await file.arrayBuffer();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];

        if (!sheet) {
          throw new Error("No worksheet found in this file.");
        }

        sheet.eachRow((row, rowNumber) => {
          if (rowNumber > 100) return;
          const values = Array.isArray(row.values) ? row.values.slice(1) : [];
          previewRows.push(values.map((value) => String(value ?? "").trim()));
        });
      }

      if (previewRows.length === 0) {
        throw new Error("File is empty.");
      }

      const previewHtml = buildPreviewHtml(file.name, previewRows);
      previewWindow.document.open();
      previewWindow.document.write(previewHtml);
      previewWindow.document.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to preview file.";
      previewWindow.document.open();
      previewWindow.document.write(`<html><body style='font-family:Arial;padding:16px;color:#B91C1C'>${escapeHtml(message)}</body></html>`);
      previewWindow.document.close();
    }
  };

  const handleImport = async () => {
    const readyFiles = uploadItems.filter((item) => item.status === "ready").map((item) => item.file);
    if (readyFiles.length === 0) return;

    await onImport(readyFiles);
    onClose();
  };

  const hasUploading = uploadItems.some((item) => item.status === "uploading");
  const canImport = uploadItems.some((item) => item.status === "ready") && !hasUploading && !importing;

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    worksheet.addRow(TEMPLATE_HEADERS);
    worksheet.addRow(TEMPLATE_SAMPLE_ROW);

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E78" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    TEMPLATE_HEADERS.forEach((header, index) => {
      const sample = TEMPLATE_SAMPLE_ROW[index] ?? "";
      worksheet.getColumn(index + 1).width = Math.min(
        Math.max(String(header).length, String(sample).length) + 4,
        32,
      );
    });

    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Bulk Upload format.xlsx";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onClose={() => !importing && onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            sx={{
              fontFamily: "Montserrat",
              fontWeight: 700,
              fontSize: "20px",
              color: "#23272F",
              lineHeight: "100%",
              letterSpacing: 0,
            }}
          >
            Bulk Import Leads
          </Typography>
          <IconButton
            onClick={onClose}
            disabled={importing}
            sx={{ bgcolor: "#E5E7EB", width: 34, height: 34, "&:hover": { bgcolor: "#D1D5DB" } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xls,.xlsx,.csv"
          style={{ display: "none" }}
          onChange={handleInputChange}
        />

        <Box
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          sx={{
            minHeight: 240,
            border: "2px dashed #D1D5DB",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            bgcolor: "#FFFFFF",
            textAlign: "center",
            mb: 2,
          }}
        >
          <UploadFileOutlinedIcon sx={{ fontSize: 32, color: "#111827", mb: 1.5 }} />
          <Typography
            sx={{
              fontFamily: "Montserrat",
              fontWeight: 600,
              fontSize: "14px",
              color: "#2E3137",
              lineHeight: "120%",
              letterSpacing: 0,
            }}
          >
            Drag and Drop or <Box component="span" sx={{ color: "#4F7CF4", textDecoration: "underline" }}>Click to Upload</Box>
          </Typography>
          <Typography
            sx={{
              mt: 1,
              fontFamily: "Montserrat",
              fontWeight: 600,
              fontSize: "14px",
              color: "#9CA3AF",
              lineHeight: "120%",
              letterSpacing: 0,
            }}
          >
            Supported formats: CSV, XLSX  Max Size: 10.00MB
          </Typography>
        </Box>

        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
          <Button
            variant="text"
            onClick={handleDownloadTemplate}
            startIcon={<DownloadOutlinedIcon />}
            sx={{
              textTransform: "none",
              fontFamily: "Montserrat",
              fontWeight: 600,
              color: "#4F7CF4",
            }}
          >
            Download Import Template
          </Button>
        </Stack>

        {uploadItems.length > 0 && (
          <Stack spacing={1.5} sx={{ mb: 1 }}>
            {uploadItems.map((item) => (
              <Box
                key={item.id}
                sx={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  px: 2,
                  py: 1.5,
                  bgcolor: "#FFFFFF",
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#EDF7F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <DescriptionOutlinedIcon sx={{ fontSize: 24, color: "#0A7A43" }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#20222A" }} noWrap>
                        {item.file.name}
                      </Typography>
                      <Typography sx={{ fontSize: "13px", color: "#9CA3AF" }}>
                        {formatSize(item.file.size)}
                        {item.status === "uploading" ? `  |  ${item.progress}%` : ""}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={0.75}>
                    {item.status === "ready" && (
                      <IconButton onClick={() => void handlePreviewItem(item.file)} sx={{ color: "#4F7CF4" }}>
                        <VisibilityOutlinedIcon />
                      </IconButton>
                    )}
                    <IconButton onClick={() => handleDeleteItem(item.id)} sx={{ color: "#EF4444" }}>
                      <DeleteOutlineOutlinedIcon />
                    </IconButton>
                  </Stack>
                </Stack>

                {item.status === "uploading" && (
                  <LinearProgress
                    variant="determinate"
                    value={item.progress}
                    sx={{
                      mt: 1.25,
                      height: 6,
                      borderRadius: "999px",
                      backgroundColor: "#E5E7EB",
                      "& .MuiLinearProgress-bar": { backgroundColor: "#E07A5F", borderRadius: "999px" },
                    }}
                  />
                )}
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>

      <Box sx={{ px: 3, py: 2, borderTop: "1px solid #E5E7EB" }}>
        <Stack direction="row" spacing={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            disabled={importing}
            sx={{
              height: 52,
              borderRadius: "12px",
              textTransform: "none",
              fontFamily: "Montserrat",
              fontSize: "14px",
              fontWeight: 600,
              color: "#4B5563",
              borderColor: "#6B7280",
              lineHeight: "120%",
              letterSpacing: 0,
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            disabled={!canImport}
            onClick={handleImport}
            sx={{
              height: 52,
              borderRadius: "12px",
              textTransform: "none",
              fontFamily: "Montserrat",
              fontSize: "14px",
              fontWeight: 600,
              bgcolor: "#5B5B5B",
              color: "#FFFFFF",
              "&:hover": { bgcolor: "#4B4B4B" },
              "&.Mui-disabled": { bgcolor: "#C5C7CB", color: "#FFFFFF" },
              lineHeight: "120%",
              letterSpacing: 0,
            }}
          >
            {importing ? "Importing..." : "Import"}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};

export default LeadsBulkImportModal;
