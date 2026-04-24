import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import BackwardIcon from "../../assets/icons/Backward_icon.svg";
import type { Lead, LeadDocument } from "../../services/leads.api";
import { formatDateTime, getDoctorAvatarStyle } from "./referrals.utils";

export interface PatientCard {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  mrn: string;
  referralDate: string;
  raw: Lead;
}

export interface SourceTableRow {
  id: number;
  primary: string;
  email: string;
  phone: string;
  referrals: number;
  extra1: string;
  extra2?: string;
}

const SEARCH_SX = {
  width: 300,
  "& .MuiOutlinedInput-root": { height: 38 },
  "& input::placeholder": { fontSize: "14px", color: "#9E9E9E", opacity: 1 },
};

const TABLE_HEAD_SX = {
  "& .MuiTableCell-head": {
    backgroundColor: "#f8f8f9",
    color: "#626262",
    fontSize: 14,
    borderBottom: "none",
    paddingY: 1,
  },
  "& .MuiTableCell-head:first-of-type": {
    borderTopLeftRadius: "12px",
    borderBottomLeftRadius: "12px",
  },
  "& .MuiTableCell-head:last-of-type": {
    borderTopRightRadius: "12px",
    borderBottomRightRadius: "12px",
  },
};

const TABLE_BODY_SX = {
  "& .MuiTableCell-body": { color: "#232323", fontSize: "13px", py: 1.5 },
  "& .MuiTableCell-body .MuiTypography-root": {
    color: "#232323",
    fontSize: "13px",
  },
};

const InfoField = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <Box>
    <Typography
      fontSize="11px"
      fontWeight={600}
      color="#9E9E9E"
      textTransform="uppercase"
      letterSpacing="0.05em"
      mb={0.5}
    >
      {label}
    </Typography>
    <Typography fontSize="13px" color="#232323">
      {value || "—"}
    </Typography>
  </Box>
);

const BackTitle = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  return (
    <Box display="flex" alignItems="center" gap={2}>
      <Box
        component="img"
        src={BackwardIcon}
        alt="Back"
        sx={{ width: 40, height: 40, cursor: "pointer" }}
        onClick={() => navigate(-1)}
      />
      <Typography variant="h6" fontWeight={600} mt={-1}>
        {title}
      </Typography>
    </Box>
  );
};

export const HeaderWithSearch = ({
  title,
  search,
  setSearch,
  placeholder,
  rightSlot,
}: {
  title: string;
  search: string;
  setSearch: (value: string) => void;
  placeholder: string;
  rightSlot?: React.ReactNode;
}) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    mb={3}
    mt={-2}
  >
    <BackTitle title={title} />
    {rightSlot ?? (
      <TextField
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={SEARCH_SX}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 20, color: "#9E9E9E" }} />
            </InputAdornment>
          ),
        }}
      />
    )}
  </Box>
);

export const PartnerSourceTable = ({
  rows,
  headers,
}: {
  rows: SourceTableRow[];
  headers: string[];
}) => (
  <Paper elevation={0} sx={{ overflow: "hidden" }}>
    <Table sx={{ borderCollapse: "separate" }}>
      <TableHead sx={TABLE_HEAD_SX}>
        <TableRow>
          {headers.map((h) => (
            <TableCell key={h}>{h}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody sx={TABLE_BODY_SX}>
        {rows.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar>{row.primary.charAt(0).toUpperCase()}</Avatar>
                <Typography>{row.primary}</Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Typography>{row.email}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {row.phone}
              </Typography>
            </TableCell>
            <TableCell>{row.referrals}</TableCell>
            <TableCell>{row.extra1}</TableCell>
            {headers.length === 5 && <TableCell>{row.extra2 || ""}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
);

export const DoctorsTable = ({
  rows,
  onRowClick,
}: {
  rows: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    referrals: number;
    clinicName: string;
  }>;
  onRowClick: (id: number, name: string) => void;
}) => (
  <Paper elevation={0} sx={{ overflow: "hidden" }}>
    <Table sx={{ borderCollapse: "separate" }}>
      <TableHead sx={TABLE_HEAD_SX}>
        <TableRow>
          <TableCell>Doctors Name</TableCell>
          <TableCell>Email | Contact No.</TableCell>
          <TableCell>Referrals</TableCell>
          <TableCell>Clinic Name</TableCell>
        </TableRow>
      </TableHead>
      <TableBody sx={TABLE_BODY_SX}>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              align="center"
              sx={{ py: 6, color: "#9E9E9E" }}
            >
              No doctors found
            </TableCell>
          </TableRow>
        ) : (
          rows.map((doctor) => {
            const avatarStyle = getDoctorAvatarStyle(doctor.id);
            return (
              <TableRow
                key={doctor.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => onRowClick(doctor.id, doctor.name)}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      sx={{
                        bgcolor: avatarStyle.bg,
                        color: avatarStyle.color,
                        fontWeight: 600,
                        width: 36,
                        height: 36,
                      }}
                    >
                      {doctor.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography>{doctor.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography>{doctor.email}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {doctor.phone}
                  </Typography>
                </TableCell>
                <TableCell>{doctor.referrals}</TableCell>
                <TableCell>{doctor.clinicName}</TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>

    {rows.length > 0 && (
      <Box mt={1.5} px={1} pb={1}>
        <Typography fontSize="12px" color="#9E9E9E">
          Showing 1 to {rows.length} of {rows.length} entries
        </Typography>
      </Box>
    )}
  </Paper>
);

export const PatientDetails = ({ patient }: { patient: PatientCard }) => {
  const treatments = patient.raw.treatment_interest
    ? patient.raw.treatment_interest
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const patientInfo = [
    { label: "Contact No.", value: patient.raw.contact_no },
    { label: "Email", value: patient.raw.email },
    { label: "Location", value: patient.raw.location },
    { label: "Gender", value: "—" },
    { label: "Age", value: patient.raw.age },
    { label: "Address", value: patient.raw.address },
    {
      label: "Language Preference",
      value: (patient.raw as Lead & { language_preference?: string })
        .language_preference,
    },
    {
      label: "Created Date & Time",
      value: formatDateTime(patient.raw.created_at),
    },
  ];

  const partnerInfo = [
    { label: "Full Name", value: patient.raw.partner_full_name },
    { label: "Age", value: patient.raw.partner_age },
    { label: "Gender", value: patient.raw.partner_gender },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        borderRadius: "12px",
        border: "1px solid #F0F0F0",
        bgcolor: "#fff",
        p: 3,
        overflowY: "auto",
        maxHeight: "calc(100vh - 160px)",
      }}
    >
      <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
        <Typography fontSize="15px" fontWeight={700} color="#232323">
          Patient Info
        </Typography>
        <Box
          sx={{
            bgcolor: "#EFF6FF",
            color: "#1D4ED8",
            px: 1.25,
            py: 0.25,
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          {patient.mrn}
        </Box>
      </Box>

      <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: patient.avatarBg,
            color: patient.avatarColor,
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {patient.initials}
        </Avatar>
        <Typography fontSize="14px" fontWeight={700} color="#232323">
          {patient.name}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2.5, borderColor: "#F8F8F9" }} />
      <Typography
        fontSize="11px"
        fontWeight={700}
        color="#9E9E9E"
        textTransform="uppercase"
        letterSpacing="0.06em"
        mb={2}
      >
        Patient Information
      </Typography>
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2.5} mb={3}>
        {patientInfo.map((f) => (
          <InfoField key={f.label} label={f.label} value={f.value} />
        ))}
      </Box>

      <Divider sx={{ mb: 2.5, borderColor: "#F8F8F9" }} />
      <Typography
        fontSize="11px"
        fontWeight={700}
        color="#9E9E9E"
        textTransform="uppercase"
        letterSpacing="0.06em"
        mb={2}
      >
        Partner Information
      </Typography>
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2.5} mb={3}>
        {partnerInfo.map((f) => (
          <InfoField key={f.label} label={f.label} value={f.value} />
        ))}
      </Box>

      <Divider sx={{ mb: 2.5, borderColor: "#F8F8F9" }} />
      <Typography
        fontSize="11px"
        fontWeight={700}
        color="#9E9E9E"
        textTransform="uppercase"
        letterSpacing="0.06em"
        mb={1.5}
      >
        Treatment Interest
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
        {treatments.length > 0 ? (
          treatments.map((t) => (
            <Chip
              key={t}
              label={t}
              size="small"
              sx={{
                bgcolor: "#F8F8F9",
                color: "#232323",
                fontWeight: 500,
                fontSize: "12px",
                borderRadius: "6px",
                height: 26,
                border: "1px solid #E2E8F0",
              }}
            />
          ))
        ) : (
          <Typography fontSize="13px" color="#9E9E9E">
            No treatment interests recorded
          </Typography>
        )}
      </Box>

      {patient.raw.documents && patient.raw.documents.length > 0 && (
        <>
          <Divider sx={{ mb: 2.5, borderColor: "#F8F8F9" }} />
          <Typography
            fontSize="11px"
            fontWeight={700}
            color="#9E9E9E"
            textTransform="uppercase"
            letterSpacing="0.06em"
            mb={1.5}
          >
            Documents
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            {patient.raw.documents.map((doc: LeadDocument) => {
              const fileName = doc.file?.split("/").pop() ?? "Document";
              const fileUrl = doc.file?.startsWith("http")
                ? doc.file
                : `http://127.0.0.1:8000${doc.file}`;
              return (
                <Box
                  key={doc.id}
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  px={2}
                  py={1.25}
                  sx={{
                    border: "1px solid #F0F0F0",
                    borderRadius: "8px",
                    bgcolor: "#FAFAFA",
                  }}
                >
                  <DescriptionOutlinedIcon
                    sx={{ fontSize: 18, color: "#F43F5E" }}
                  />
                  <Typography
                    fontSize="13px"
                    fontWeight={500}
                    color="#232323"
                    flex={1}
                    noWrap
                  >
                    {fileName}
                  </Typography>
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        sx={{ color: "#626262" }}
                        onClick={() =>
                          doc.file && window.open(fileUrl, "_blank")
                        }
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        sx={{ color: "#626262" }}
                        onClick={() => {
                          if (!doc.file) return;
                          const a = document.createElement("a");
                          a.href = fileUrl;
                          a.download = fileName;
                          a.click();
                        }}
                      >
                        <DownloadOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Paper>
  );
};
