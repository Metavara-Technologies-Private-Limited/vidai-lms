import {
  Box,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import EyePng from "../../assets/icons/eye.png";
import CallTranscriptPopup from "./CallTranscriptPopup";
import { CALL_REPORT_CARDS, CALL_REPORT_ROWS } from "./reports.mockData";
import type { CallReportRow, CallViewMode } from "../../types/reports.types";

interface CallReportsProps {
  searchQuery: string;
}

const PAGE_SIZE = 8;


const tableStyles = {
  container: {
    mt: 2,
    border: "none",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "none",
  },
  headRow: {
    backgroundColor: "#F5F6F8",
  },
  headCell: {
    borderBottom: "none",
    fontSize: "12px",
    color: "#7A7F87",
    fontWeight: 600,
    py: 1.25,
    px: 1.25,
    whiteSpace: "nowrap",
  },
  bodyCell: {
    borderBottom: "1px solid #F0F1F3",
    fontSize: "13px",
    color: "#2A2D32",
    py: 1.5,
    px: 1.25,
    whiteSpace: "nowrap",
  },
};

const initials = (fullName: string) => {
  const parts = fullName.split(" ");
  return `${parts[0][0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
};

const firstInitial = (fullName: string) => {
  return (fullName.trim()[0] || "").toUpperCase();
};

const CallReports = ({ searchQuery }: CallReportsProps) => {
  const [viewMode, setViewMode] = useState<CallViewMode>("attempted");
  const [page, setPage] = useState(1);
  const [isTranscriptOpen, setTranscriptOpen] = useState(false);
  const [selectedCallerName, setSelectedCallerName] = useState("");

  const modeRows = useMemo(() => {
    return CALL_REPORT_ROWS.filter((item) => item.mode === viewMode);
  }, [viewMode]);

  const showStatusColumn = viewMode === "attempted";

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return modeRows;
    }

    const term = searchQuery.toLowerCase();
    return modeRows.filter((row) => {
      return (
        row.name.toLowerCase().includes(term) ||
        row.phoneNumber.toLowerCase().includes(term) ||
        row.callsReceivedBy.toLowerCase().includes(term)
      );
    });
  }, [modeRows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);

  const startIndex = filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(safePage * PAGE_SIZE, filteredRows.length);

  const handleTranscriptOpen = (callerName: string) => {
    setSelectedCallerName(callerName);
    setTranscriptOpen(true);
  };

  return (
    <>
      <Box
        sx={{
          mt: 2,
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "repeat(1, minmax(0, 1fr))",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
          },
        }}
      >
        {CALL_REPORT_CARDS.map((card) => (
          <Box
            key={card.label}
            sx={{
              borderRadius: "14px",
              border: "1px solid",
              borderColor: card.border,
              backgroundImage: `linear-gradient(180deg, ${card.bg} 0%, #FFFFFF 76%)`,
              px: 2,
              py: 1.6,
              minHeight: 104,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ width: 24, height: 24, display: "flex", alignItems: "center" }}>
              <Box component="img" src={card.icon} alt={card.label} sx={{ width: 24, height: 24 }} />
            </Box>
            <Typography sx={{ fontSize: "14px", color: "#959AA2", mt: 0.5 }}>{card.label}</Typography>
            <Typography sx={{ fontSize: "20px", lineHeight: 1, color: "#1F2328", fontWeight: 700, mt: 0.5 }}>
              {card.value}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        <Box
          onClick={() => {
            setViewMode("attempted");
            setPage(1);
          }}
          sx={{
            cursor: "pointer",
            px: 2,
            py: 1,
            borderRadius: "10px",
            border: "1px solid",
            borderColor: viewMode === "attempted" ? "#F2B7A8" : "#E8EAF0",
            color: viewMode === "attempted" ? "#E17E61" : "#51555A",
            fontWeight: 600,
            fontSize: "14px",
            backgroundColor: viewMode === "attempted" ? "#FFF5F2" : "#F6F7FA",
          }}
        >
          Call Attempted
        </Box>

        <Box
          onClick={() => {
            setViewMode("received");
            setPage(1);
          }}
          sx={{
            cursor: "pointer",
            px: 2,
            py: 1,
            borderRadius: "10px",
            border: "1px solid",
            borderColor: viewMode === "received" ? "#F2B7A8" : "#E8EAF0",
            color: viewMode === "received" ? "#E17E61" : "#51555A",
            fontWeight: 600,
            fontSize: "14px",
            backgroundColor: viewMode === "received" ? "#FFF5F2" : "#F6F7FA",
          }}
        >
          Call Received
        </Box>
      </Box>

      <TableContainer sx={tableStyles.container}>
        <Table size="small">
          <TableHead>
            <TableRow sx={tableStyles.headRow}>
              <TableCell sx={tableStyles.headCell}>Name</TableCell>
              <TableCell sx={tableStyles.headCell}>Date & Time</TableCell>
              <TableCell sx={tableStyles.headCell}>Phone Number</TableCell>
              <TableCell sx={tableStyles.headCell}>Call Duration</TableCell>
              <TableCell sx={tableStyles.headCell}>Calls Received By</TableCell>
              {showStatusColumn && <TableCell sx={tableStyles.headCell}>Call Status</TableCell>}
              <TableCell sx={tableStyles.headCell}>Call Transcript</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showStatusColumn ? 7 : 6} align="center" sx={{ ...tableStyles.bodyCell, py: 6 }}>
                  <Typography color="text.secondary">No call records found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row: CallReportRow) => (
                <TableRow key={row.id} hover sx={{ "&:last-of-type td": { borderBottom: "none" } }}>
                  <TableCell sx={tableStyles.bodyCell}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          backgroundColor: "#F1EEFF",
                          color: "#7D67E3",
                          fontSize: "11px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {initials(row.name)}
                      </Box>
                      <Typography sx={{ fontSize: "13px", color: "#2A2D32", fontWeight: 600 }}>{row.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.dateTime}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.phoneNumber}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.callDuration}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "linear-gradient(180deg, #E0E7FF 0%, #F9FAFB 100%)",
                          color: "#6D74A3",
                          fontSize: "10px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {firstInitial(row.callsReceivedBy)}
                      </Box>
                      <Typography sx={{ fontSize: "13px", color: "#2A2D32" }}>{row.callsReceivedBy}</Typography>
                    </Box>
                  </TableCell>
                  {showStatusColumn && (
                    <TableCell sx={tableStyles.bodyCell}>
                      <Box
                        sx={{
                          width: "fit-content",
                          px: 1.2,
                          py: 0.25,
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          border: "1px solid",
                          color: row.status === "Connected" ? "#54AA6A" : "#F16E6E",
                          borderColor: row.status === "Connected" ? "#8DD3A0" : "#F4A4A4",
                          backgroundColor: row.status === "Connected" ? "#EAF8EF" : "#FFF1F1",
                        }}
                      >
                        {row.status}
                      </Box>
                    </TableCell>
                  )}
                  <TableCell sx={tableStyles.bodyCell}>
                    <Box
                      component="button"
                      onClick={() => handleTranscriptOpen(row.name)}
                      sx={{
                        width: 22,
                        height: 22,
                        p: 0,
                        border: "none",
                        bgcolor: "transparent",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box component="img" src={EyePng} alt="Transcript" sx={{ width: 18, height: 18 }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CallTranscriptPopup
        open={isTranscriptOpen}
        onClose={() => setTranscriptOpen(false)}
        callerName={selectedCallerName}
      />

      <Box
        sx={{
          mt: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {startIndex} to {endIndex} of {filteredRows.length} entries
        </Typography>
        <Pagination
          size="small"
          count={totalPages}
          page={safePage}
          onChange={(_, value) => setPage(value)}
          shape="rounded"
          sx={{
            "& .MuiPaginationItem-root": {
              fontSize: "12px",
              color: "#8A8F98",
            },
            "& .MuiPaginationItem-page.Mui-selected": {
              fontWeight: 700,
              backgroundColor: "#000000",
              color: "#FFFFFF",
            },
            "& .MuiPaginationItem-page.Mui-selected:hover": {
              backgroundColor: "#000000",
            },
          }}
        />
      </Box>
    </>
  );
};

export default CallReports;
