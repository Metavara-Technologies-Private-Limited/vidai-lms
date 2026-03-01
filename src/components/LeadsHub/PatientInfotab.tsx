import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";

import { Info, DocumentRow } from "./LeadDetailSubComponents";
import type { LeadRecord } from "./LeadDetailTypes";
interface PatientInfoTabProps {
  lead: LeadRecord;
  // Computed lead fields
  leadPhone: string;
  leadEmail: string;
  leadLocation: string;
  leadGender: string;
  leadAge: string;
  leadMaritalStatus: string;
  leadAddress: string;
  leadLanguage: string;
  leadAssigned: string;
  leadCreatedAt: string;
  partnerName: string;
  partnerAge: string;
  partnerGender: string;
  leadSubSource: string;
  leadCampaignName: string;
  leadCampaignDuration: string;
  appointmentDepartment: string;
  appointmentPersonnel: string;
  appointmentDate: string;
  appointmentSlot: string;
  appointmentRemark: string;
  treatmentInterest: string[];
  // Documents
  documents: { url: string; name: string }[];
  docsLoading: boolean;
  docsError: string | null;
  onClearDocsError: () => void;
}

const PatientInfoTab: React.FC<PatientInfoTabProps> = ({
  leadPhone,
  leadEmail,
  leadLocation,
  leadGender,
  leadAge,
  leadMaritalStatus,
  leadAddress,
  leadLanguage,
  leadAssigned,
  leadCreatedAt,
  partnerName,
  partnerAge,
  partnerGender,
  leadSubSource,
  leadCampaignName,
  leadCampaignDuration,
  appointmentDepartment,
  appointmentPersonnel,
  appointmentDate,
  appointmentSlot,
  appointmentRemark,
  treatmentInterest,
  documents,
  docsLoading,
  docsError,
  onClearDocsError,
}) => {
  return (
    <Stack direction="row" spacing={3}>
      {/* ── LEFT: Basic Info ── */}
      <Box sx={{ flex: 2 }}>
        <Card
          sx={{
            p: 3,
            borderRadius: "16px",
            mb: 1,
            bgcolor: "#fcfcfc",
            boxShadow: "none",
            border: "none",
            mt: -1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} mb={3}>
            Basic Information
          </Typography>
          <Divider sx={{ mb: 1, mt: -2, mx: -3 }} />

          {/* Lead Information */}
          <Typography
            variant="caption"
            fontWeight={500}
            color="#232323"
            display="block"
            mb={2}
            sx={{ textTransform: "uppercase", letterSpacing: "1px" }}
          >
            Lead Information
          </Typography>
          <Stack spacing={3}>
            <Stack direction="row" spacing={6}>
              <Info label="CONTACT NO" value={leadPhone} />
              <Info label="EMAIL" value={leadEmail} />
              <Info label="LOCATION" value={leadLocation} />
            </Stack>
            <Stack direction="row" spacing={6}>
              <Info label="GENDER" value={leadGender} />
              <Info label="AGE" value={leadAge} />
              <Info label="MARITAL STATUS" value={leadMaritalStatus} />
            </Stack>
            <Stack direction="row" spacing={6}>
              <Info label="ADDRESS" value={leadAddress} />
              <Info label="LANGUAGE PREFERENCE" value={leadLanguage} />
              <Info label="ASSIGNED TO" value={leadAssigned} isAvatar />
            </Stack>
            <Info label="CREATED DATE & TIME" value={leadCreatedAt} />
          </Stack>

          <Divider sx={{ mb: 2, mt: 2, mx: -3 }} />

          {/* Partner Information */}
          <Typography
            variant="caption"
            fontWeight={500}
            color="#232323"
            display="block"
            mb={2}
            sx={{ textTransform: "uppercase", letterSpacing: "1px" }}
          >
            Partner Information
          </Typography>
          <Stack direction="row" spacing={6}>
            <Info label="FULL NAME" value={partnerName} />
            <Info label="AGE" value={partnerAge} />
            <Info label="GENDER" value={partnerGender} />
          </Stack>

          <Divider sx={{ mb: 2, mt: 2, mx: -3 }} />

          {/* Source & Campaign */}
          <Typography
            variant="caption"
            fontWeight={500}
            color="#232323"
            display="block"
            mb={2}
            sx={{ textTransform: "uppercase", letterSpacing: "1px" }}
          >
            Source & Campaign Details
          </Typography>
          <Stack direction="row" spacing={6}>
            <Info label="SUB-SOURCE" value={leadSubSource} />
            <Info label="CAMPAIGN NAME" value={leadCampaignName} />
            <Info label="CAMPAIGN DURATION" value={leadCampaignDuration} />
          </Stack>
        </Card>
      </Box>

      {/* ── RIGHT: Appointment, Treatment, Documents ── */}
      <Stack spacing={3} sx={{ flex: 1 }}>
        {/* Appointment Card */}
        <Card
          sx={{
            p: 3,
            bgcolor: "#fcfffa",
            borderRadius: "10px",
            border: "none",
            mt: -1,
          }}
        >
          <Typography color="#16A34A" fontWeight={700} variant="subtitle2" mb={2}>
            Appointment
          </Typography>
          <Divider sx={{ mb: 1, mt: 1, mx: -3 }} />
          <Stack direction="row" mb={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                DEPARTMENT
              </Typography>
              <Typography fontWeight={600} variant="body2">
                {appointmentDepartment}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                PERSONNEL
              </Typography>
              <Typography fontWeight={600} variant="body2">
                {appointmentPersonnel}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" mb={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                DATE
              </Typography>
              <Typography fontWeight={600} variant="body2">
                {appointmentDate}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                SLOT
              </Typography>
              <Typography fontWeight={600} variant="body2">
                {appointmentSlot}
              </Typography>
            </Box>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            REMARK
          </Typography>
          <Typography fontWeight={600} variant="body2">
            {appointmentRemark}
          </Typography>
        </Card>

        {/* Treatment Interest Card */}
        <Card
          sx={{
            p: 3,
            borderRadius: "10px",
            backgroundColor: "#fcfcfc",
            border: "none",
            boxShadow: "none",
          }}
        >
          <Typography fontWeight={700} variant="subtitle2" mb={2}>
            Treatment Interest
          </Typography>
          <Divider sx={{ mb: 2, mx: -3 }} />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {treatmentInterest.length > 0 ? (
              treatmentInterest.map((treatment, idx) => (
                <Chip
                  key={idx}
                  label={treatment}
                  size="small"
                  sx={{
                    bgcolor: "#F5F3FF",
                    color: "#7C3AED",
                    fontWeight: 500,
                    mb: 1,
                  }}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No treatments selected
              </Typography>
            )}
          </Stack>
        </Card>

        {/* Documents Card */}
        <Card
          sx={{
            p: 2,
            borderRadius: "10px",
            mb: 2,
            backgroundColor: "#fcfcfc",
            border: "none",
            boxShadow: "none",
          }}
        >
          <Typography fontWeight={700} variant="subtitle2" mb={2}>
            Documents
          </Typography>
          <Divider sx={{ mb: 2, mx: -3 }} />
          {docsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <Stack alignItems="center" spacing={1}>
                <CircularProgress size={20} />
                <Typography variant="caption" color="text.secondary">
                  Loading documents...
                </Typography>
              </Stack>
            </Box>
          ) : docsError ? (
            <Alert
              severity="error"
              onClose={onClearDocsError}
              sx={{ borderRadius: "8px", fontSize: "12px" }}
            >
              {docsError}
            </Alert>
          ) : documents.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <InsertDriveFileOutlinedIcon
                sx={{ fontSize: 32, color: "#CBD5E1", mb: 0.5 }}
              />
              <Typography variant="caption" color="text.secondary" display="block">
                No documents uploaded
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {documents.map((doc, idx) => (
                <DocumentRow
                  key={idx}
                  sx={{ backgroundColor: "#FFFFFF", borderRadius: "10px", p: 2 }}
                  name={doc.name}
                  url={doc.url}
                />
              ))}
            </Stack>
          )}
        </Card>
      </Stack>
    </Stack>
  );
};

export default PatientInfoTab;