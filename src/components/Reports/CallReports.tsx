import {
  Box,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import EyePng from "../../assets/icons/eye.png";
import MouseCircleGreenIcon from "../../assets/icons/mouse-circle-green.svg";
import ProfileTwoUserIcon from "../../assets/icons/profile-2user.svg";
import MouseCircleIcon from "../../assets/icons/mouse-circle.svg";
import DollarCircleIcon from "../../assets/icons/dollar-circle.svg";
import CallTranscriptPopup from "./CallTranscriptPopup";
import { LeadAPI, api, type Lead } from "../../services/leads.api";
import type { CallReportRow, CallViewMode } from "../../types/reports.types";

interface CallReportsProps {
  searchQuery: string;
}

const PAGE_SIZE = 8;

type TwilioCallRecord = {
  id?: number | string;
  sid?: string;
  lead_uuid?: string;
  from_number?: string;
  to_number?: string;
  status?: string;
  created_at?: string;
  direction?: string;
  duration?: number | string;
  duration_sec?: number | string;
  duration_seconds?: number | string;
};

const tableStyles = {
  container: {
    mt: 2,
    border: "none",
    borderRadius: "12px",
    overflowX: "auto",
    overflowY: "hidden",
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

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDurationSeconds = (call: TwilioCallRecord): number => {
  return (
    toNumber(call.duration_seconds) ||
    toNumber(call.duration_sec) ||
    toNumber(call.duration) ||
    0
  );
};

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return "0:00 Min";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")} Min`;
};

const formatDateTime = (value?: string): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour12 = date.getHours() % 12 || 12;
  const mins = String(date.getMinutes()).padStart(2, "0");
  const ampm = date.getHours() >= 12 ? "PM" : "AM";
  return `${day}/${month}/${year} | ${String(hour12).padStart(2, "0")}:${mins} ${ampm}`;
};

const normalizeStatus = (status?: string): CallReportRow["status"] => {
  const normalized = (status ?? "").toLowerCase().trim();
  const connectedStatuses = ["completed", "in-progress", "in_progress", "answered", "connected"];
  return connectedStatuses.includes(normalized) ? "Connected" : "Not-Connected";
};

const getCallMode = (call: TwilioCallRecord): CallViewMode => {
  const direction = (call.direction ?? "").toLowerCase().trim();
  if (["inbound", "incoming", "received"].includes(direction)) {
    return "received";
  }
  return "attempted";
};

const CallReports = ({ searchQuery }: CallReportsProps) => {
  const [viewMode, setViewMode] = useState<CallViewMode>("attempted");
  const [page, setPage] = useState(1);
  const [isTranscriptOpen, setTranscriptOpen] = useState(false);
  const [selectedCallerName, setSelectedCallerName] = useState("");
  const [callRows, setCallRows] = useState<CallReportRow[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCallRows = async () => {
      try {
        setLoadingCalls(true);

        const leads = await LeadAPI.list();
        const leadById = new Map<string, Lead>();
        leads.forEach((lead) => {
          if (lead?.id) {
            leadById.set(String(lead.id), lead);
          }
        });

        let allCalls: TwilioCallRecord[] = [];

        try {
          const response = await api.get<TwilioCallRecord[] | { results?: TwilioCallRecord[] }>("/twilio/calls/");
          const payload = response.data;
          allCalls = Array.isArray(payload) ? payload : payload?.results ?? [];
        } catch {
          const perLeadCalls = await Promise.allSettled(
            leads.map(async (lead) => {
              const response = await api.get<TwilioCallRecord[] | { results?: TwilioCallRecord[] }>(`/twilio/calls/?lead_uuid=${lead.id}`);
              const payload = response.data;
              return Array.isArray(payload) ? payload : payload?.results ?? [];
            }),
          );

          allCalls = perLeadCalls
            .filter((result): result is PromiseFulfilledResult<TwilioCallRecord[]> => result.status === "fulfilled")
            .flatMap((result) => result.value);
        }

        const uniqueCalls = new Map<string, TwilioCallRecord>();
        allCalls.forEach((call, index) => {
          const key = String(call.id ?? call.sid ?? index);
          if (!uniqueCalls.has(key)) {
            uniqueCalls.set(key, call);
          }
        });

        const mappedRows: CallReportRow[] = Array.from(uniqueCalls.values()).map((call, index) => {
          const lead = leadById.get(String(call.lead_uuid ?? ""));
          const durationInSeconds = getDurationSeconds(call);

          return {
            id: index + 1,
            name: lead?.full_name || "Unknown Lead",
            dateTime: formatDateTime(call.created_at),
            phoneNumber: call.to_number || lead?.contact_no || "N/A",
            callDuration: formatDuration(durationInSeconds),
            callsReceivedBy: lead?.assigned_to_name || "System",
            status: normalizeStatus(call.status),
            mode: getCallMode(call),
          };
        });

        mappedRows.sort((a, b) => {
          const first = new Date(a.dateTime.replace(" | ", " ")).getTime();
          const second = new Date(b.dateTime.replace(" | ", " ")).getTime();
          return Number.isNaN(second - first) ? 0 : second - first;
        });

        if (!isMounted) return;
        setCallRows(mappedRows);
      } catch (error) {
        console.error("Failed to fetch call history:", error);
        if (!isMounted) return;
        setCallRows([]);
      } finally {
        if (isMounted) {
          setLoadingCalls(false);
        }
      }
    };

    void fetchCallRows();

    return () => {
      isMounted = false;
    };
  }, []);

  const modeRows = useMemo(() => {
    return callRows.filter((item) => item.mode === viewMode);
  }, [callRows, viewMode]);

  const callCards = useMemo(() => {
    const totalReceived = callRows.filter((row) => row.mode === "received").length;
    const totalAttempted = callRows.filter((row) => row.mode === "attempted").length;
    const connectedCount = callRows.filter((row) => row.status === "Connected").length;
    const notConnectedCount = callRows.filter((row) => row.status === "Not-Connected").length;
    const notConnectedPercentage = totalAttempted > 0 ? (notConnectedCount / totalAttempted) * 100 : 0;

    const totalDurationSeconds = callRows.reduce((sum, row) => {
      const durationText = row.callDuration.replace(" Min", "");
      const [minsPart, secsPart] = durationText.split(":");
      return sum + (toNumber(minsPart) * 60 + toNumber(secsPart));
    }, 0);

    const averageDuration = callRows.length > 0 ? Math.floor(totalDurationSeconds / callRows.length) : 0;

    return [
      { label: "Total Calls Received", value: String(totalReceived), icon: EyePng, bg: "#F8FAFF", border: "#EEF3FF" },
      { label: "Total Calls Attempted", value: String(totalAttempted), icon: MouseCircleGreenIcon, bg: "#F7FCF9", border: "#EAF7EE" },
      { label: "Connected", value: String(connectedCount), icon: ProfileTwoUserIcon, bg: "#FFF9F9", border: "#FDEEEF" },
      { label: "Not Connected", value: `${notConnectedPercentage.toFixed(1)}%`, icon: MouseCircleIcon, bg: "#F8FAFF", border: "#EEF3FF" },
      { label: "Avg. Call Duration", value: formatDuration(averageDuration).replace(" Min", " min"), icon: DollarCircleIcon, bg: "#FFFCF7", border: "#FDF3E4" },
    ];
  }, [callRows]);

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
        {callCards.map((card) => (
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

      {loadingCalls && (
        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1.25 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">Loading call history...</Typography>
        </Box>
      )}

      <TableContainer sx={tableStyles.container}>
        <Table size="small" sx={{ minWidth: 900 }}>
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
