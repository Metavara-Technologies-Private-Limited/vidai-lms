import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BackwardIcon from "../../assets/icons/Backward_icon.svg";
import { useNavigate } from "react-router-dom";
import { LeadAPI, ClinicAPI } from "../../services/leads.api";
import type { Lead, Employee } from "../../services/leads.api";

// ── Types ──────────────────────────────────────────────────────────────────
interface DoctorRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  referrals: number;
  clinicName: string;
}

// ── Avatar colors ──────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: "#E7F1FF", color: "#1D4ED8" },
  { bg: "#F0FDF4", color: "#16A34A" },
  { bg: "#FFF7ED", color: "#C2410C" },
  { bg: "#F5F3FF", color: "#7C3AED" },
  { bg: "#FFF1F2", color: "#BE123C" },
  { bg: "#F0F9FF", color: "#0369A1" },
];

function getAvatarStyle(id: number) {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

// ── Component ──────────────────────────────────────────────────────────────
const Doctors: React.FC = () => {
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Step 1: Fetch all leads via LeadAPI (uses auth_token automatically)
        const allLeads: Lead[] = await LeadAPI.list();

        // Step 2: Group leads by assigned_to — each unique assigned_to = a doctor
        const doctorMap: Record<number, { id: number; name: string; referrals: number }> = {};
        allLeads.forEach((lead) => {
          if (lead.assigned_to_id && lead.assigned_to_name) {
            if (doctorMap[lead.assigned_to_id]) {
              doctorMap[lead.assigned_to_id].referrals += 1;
            } else {
              doctorMap[lead.assigned_to_id] = {
                id: lead.assigned_to_id,
                name: lead.assigned_to_name,
                referrals: 1,
              };
            }
          }
        });

        // Step 3: Try to get employee details (email/phone/clinic) for each doctor
        // Use clinic_id from the first lead to fetch employees
        let empById: Record<number, Employee & { email?: string; contact_no?: string; clinic_name?: string }> = {};
        try {
          const clinicId = allLeads[0]?.clinic_id;
          if (clinicId) {
            const employees = await ClinicAPI.getEmployees(clinicId);
            employees.forEach((e) => {
              empById[e.id] = e as Employee & { email?: string; contact_no?: string; clinic_name?: string };
            });
          }
        } catch {
          // Employees enrichment failed — continue without it
        }

        // Step 4: Build rows combining lead data + optional employee details
        const rows: DoctorRow[] = Object.values(doctorMap).map((doc) => {
          const emp = empById[doc.id];
          return {
            id: doc.id,
            name: doc.name,
            email: (emp as { email?: string })?.email || "—",
            phone: (emp as { contact_no?: string })?.contact_no || "—",
            referrals: doc.referrals,
            clinicName:
              (emp as { clinic_name?: string })?.clinic_name ||
              (allLeads.find((l) => l.assigned_to_id === doc.id)?.clinic_name ?? "—"),
          };
        });

        rows.sort((a, b) => b.referrals - a.referrals);
        setDoctors(rows);
      } catch (err) {
        console.error("Failed to load doctors:", err);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={1}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        mt={-2}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            component="img"
            src={BackwardIcon}
            alt="Back"
            sx={{ width: 40, height: 40, cursor: "pointer" }}
            onClick={() => navigate(-1)}
          />
          <Typography variant="h6" fontWeight={600} mt={-1}>
            Doctors List ({filteredDoctors.length})
          </Typography>
        </Box>

        <TextField
          placeholder="Search by Doctor name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: 300,
            "& .MuiOutlinedInput-root": { height: 38 },
            "& input::placeholder": {
              fontSize: "14px",
              color: "#9E9E9E",
              opacity: 1,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: "#9E9E9E" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading ? (
        <Box display="flex" justifyContent="center" pt={8}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ overflow: "hidden" }}>
          <Table sx={{ borderCollapse: "separate" }}>
            <TableHead
              sx={{
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
              }}
            >
              <TableRow>
                <TableCell>Doctors Name</TableCell>
                <TableCell>Email | Contact No.</TableCell>
                <TableCell>Referrals</TableCell>
                <TableCell>Clinic Name</TableCell>
              </TableRow>
            </TableHead>

            <TableBody
              sx={{
                "& .MuiTableCell-body": {
                  color: "#232323",
                  fontSize: "13px",
                  py: 1.5,
                },
                "& .MuiTableCell-body .MuiTypography-root": {
                  color: "#232323",
                  fontSize: "13px",
                },
              }}
            >
              {filteredDoctors.length === 0 ? (
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
                filteredDoctors.map((doctor) => {
                  const avatarStyle = getAvatarStyle(doctor.id);
                  return (
                    <TableRow
                      key={doctor.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate(`/referrals/doctors/${doctor.id}`, {
                          state: {
                            doctorName: doctor.name,
                            doctorId: doctor.id,
                          },
                        })
                      }
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

          {filteredDoctors.length > 0 && (
            <Box mt={1.5} px={1} pb={1}>
              <Typography fontSize="12px" color="#9E9E9E">
                Showing 1 to {filteredDoctors.length} of{" "}
                {filteredDoctors.length} entries
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default Doctors;