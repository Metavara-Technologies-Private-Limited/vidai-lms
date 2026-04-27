import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { ClinicAPI, LeadAPI } from "../../services/leads.api";
import type { Employee, Lead } from "../../services/leads.api";
import { useDispatch, useSelector } from "react-redux";
import { clearSources, loadReferralSources, selectSources, selectSourcesLoading } from "../../store/referralSlice";
import type { AppDispatch } from "../../store";
import { selectClinic } from "../../store/clinicSlice";
import {
  DoctorsTable,
  HeaderWithSearch,
  PartnerSourceTable,
  PatientDetails,
} from "./referrals.shared";
import type { PatientCard, SourceTableRow } from "./referrals.shared";
import {
  buildMRN,
  formatDate,
  getInitials,
  getPatientAvatarStyle,
} from "./referrals.utils";
import { fetchReferralDepartments } from "../../services/referral.api";

interface DoctorRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  referrals: number;
  clinicName: string;
}

interface ReferralSource {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  referral_count: number;
  external_clinic_name?: string;
}

interface SourcePageConfig {
  title: string;
  departmentId?: number;
  searchPlaceholder: string;
  headers: string[];
  toRow: (source: ReferralSource) => SourceTableRow;
}

const SOURCE_PAGE_CONFIG: Record<string, SourcePageConfig> = {
  corporate: {
    title: "Corporate HR",
    // departmentId: 2,
    searchPlaceholder: "Search by Partner name",
    headers: ["HR Name", "Email | Contact", "Referrals", "Company Name"],
    toRow: (item) => ({
      id: item.id,
      primary: item.name,
      email: item.email || "",
      phone: item.phone || "",
      referrals: item.referral_count,
      extra1: item.external_clinic_name || "",
    }),
  },
  insurance: {
    title: "Insurance Partners",
    // departmentId: 4,
    searchPlaceholder: "Search by Partner name",
    headers: [
      "Insurance Provider",
      "Email | Contact",
      "Referrals",
      "Relationship Manager",
    ],
    toRow: (item) => ({
      id: item.id,
      primary: item.name,
      email: item.email || "",
      phone: item.phone || "",
      referrals: item.referral_count,
      extra1: item.external_clinic_name || "",
    }),
  },
  diagnostic: {
    title: "Diagnostic Labs",
    // departmentId: 3,
    searchPlaceholder: "Search by Partner name",
    headers: ["Lab Name", "Email | Contact", "Referrals", "City"],
    toRow: (item) => ({
      id: item.id,
      primary: item.name,
      email: item.email || "",
      phone: item.phone || "",
      referrals: item.referral_count,
      extra1: item.external_clinic_name || "",
    }),
  },
  zoya: {
    title: "Zoya Partners",
    // departmentId: 6,
    searchPlaceholder: "Search by Partner name",
    headers: ["Partner Name", "Email | Contact", "Referrals", "Region"],
    toRow: (item) => ({
      id: item.id,
      primary: item.name,
      email: item.email || "",
      phone: item.phone || "",
      referrals: item.referral_count,
      extra1: item.external_clinic_name || "",
    }),
  },
  practo: {
    title: "Practo Referrals",
    // departmentId: 5,
    searchPlaceholder: "Search by Partner name",
    headers: [
      "Account Manager",
      "Email | Contact",
      "Referrals",
      "Campaign",
      "City",
    ],
    toRow: (item) => ({
      id: item.id,
      primary: item.name,
      email: item.email || "",
      phone: item.phone || "",
      referrals: item.referral_count,
      extra1: item.external_clinic_name || "",
      extra2: "",
    }),
  },
};

const SourceDepartmentPage = ({
  pageKey,
}: {
  pageKey: keyof typeof SOURCE_PAGE_CONFIG;
}) => {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const sources = useSelector(selectSources) as ReferralSource[];
  const config = SOURCE_PAGE_CONFIG[pageKey];
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const loading = useSelector(selectSourcesLoading);

  useEffect(() => {
    const loadDept = async () => {
      const clinicId = Number(localStorage.getItem("clinic_id"));
      const depts = await fetchReferralDepartments(clinicId);

      const match = depts.find((d) =>
        config.title.toLowerCase().includes(d.name.toLowerCase()),
      );

      if (match) {
        setDepartmentId(match.id);
      }
    };

    loadDept();
  }, [config.title]);

  useEffect(() => {
    if (!departmentId) return;

    dispatch(clearSources());

    dispatch(loadReferralSources({ referral_department_id: departmentId }));
  }, [dispatch, departmentId]);

  const rows = useMemo(
    () =>
      sources
        .map(config.toRow)
        .filter((item) =>
          item.primary.toLowerCase().includes(search.toLowerCase()),
        ),
    [sources, config, search],
  );

  return (
    <Box p={1}>
      <HeaderWithSearch
        title={`${config.title} (${rows.length})`}
        search={search}
        setSearch={setSearch}
        placeholder={config.searchPlaceholder}
      />
      {loading ? (
        <CircularProgress />
      ) : (
        <PartnerSourceTable rows={rows} headers={config.headers} />
      )}
    </Box>
  );
};

export const Doctors: React.FC = () => {
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const clinic = useSelector(selectClinic);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const allLeads: Lead[] = clinic?.id
          ? await LeadAPI.list(clinic?.id)
          : [];
        const doctorLeads = allLeads.filter(
          (lead) => lead.referral_department_name === "Doctors",
        );

        const doctorMap: Record<
          number,
          { id: number; name: string; referrals: number }
        > = {};
        doctorLeads.forEach((lead) => {
          if (!lead.assigned_to_id || !lead.assigned_to_name) return;
          if (doctorMap[lead.assigned_to_id])
            doctorMap[lead.assigned_to_id].referrals += 1;
          else
            doctorMap[lead.assigned_to_id] = {
              id: lead.assigned_to_id,
              name: lead.assigned_to_name,
              referrals: 1,
            };
        });

        const empById: Record<
          number,
          Employee & {
            email?: string;
            contact_no?: string;
            clinic_name?: string;
          }
        > = {};
        try {
          const clinicId = doctorLeads[0]?.clinic_id ?? allLeads[0]?.clinic_id;
          if (clinicId) {
            const employees = await ClinicAPI.getEmployees(clinicId);
            employees.forEach((e) => {
              empById[e.id] = e as Employee & {
                email?: string;
                contact_no?: string;
                clinic_name?: string;
              };
            });
          }
        } catch {
          // keep rows with lead data even if enrichment fails
        }

        const rows = Object.values(doctorMap)
          .map((doc): DoctorRow => {
            const emp = empById[doc.id] as
              | { email?: string; contact_no?: string; clinic_name?: string }
              | undefined;
            return {
              id: doc.id,
              name: doc.name,
              email: emp?.email || "—",
              phone: emp?.contact_no || "—",
              referrals: doc.referrals,
              clinicName:
                emp?.clinic_name ||
                doctorLeads.find((l) => l.assigned_to_id === doc.id)
                  ?.clinic_name ||
                "—",
            };
          })
          .sort((a, b) => b.referrals - a.referrals);

        setDoctors(rows);
      } catch (err) {
        console.error("Failed to load doctors:", err);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clinic?.id]);

  const filteredDoctors = useMemo(
    () =>
      doctors.filter((doc) =>
        doc.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [doctors, search],
  );

  return (
    <Box p={1}>
      <HeaderWithSearch
        title={`Doctors List (${filteredDoctors.length})`}
        search={search}
        setSearch={setSearch}
        placeholder="Search by Doctor name"
      />

      {loading ? (
        <Box display="flex" justifyContent="center" pt={8}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <DoctorsTable
          rows={filteredDoctors}
          onRowClick={(id, name) =>
            navigate(`/referrals/doctors/${id}`, {
              state: { doctorName: name, doctorId: id },
            })
          }
        />
      )}
    </Box>
  );
};

export const DoctorReferrals: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const location = useLocation();
  const clinic = useSelector(selectClinic);
  const state = location.state as { doctorName?: string } | null;
  const doctorName = state?.doctorName ?? `Doctor #${doctorId}`;
  const dispatch = useDispatch<AppDispatch>();
const sources = useSelector(selectSources) as ReferralSource[];

  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [selected, setSelected] = useState<PatientCard | null>(null);
  const [loading, setLoading] = useState(true);
  const sourceMap = useMemo(() => {
    const map: Record<number, ReferralSource> = {};
    sources.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [sources]);

  useEffect(() => {
    dispatch(loadReferralSources({}));
  }, [dispatch]);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const allLeads: Lead[] = clinic?.id
          ? await LeadAPI.list(clinic?.id)
          : [];
        const filtered = allLeads.filter(
          (lead) =>
            String(lead.assigned_to_id) === String(doctorId) &&
            lead.referral_department_name === "Doctors",
        );

        const cards = filtered.map((lead): PatientCard => {
          const style = getPatientAvatarStyle(lead.id);
          const source = sourceMap[lead.referral_source_id || 0];

          return {
            id: lead.id,
            name: lead.full_name ?? "Unknown",
            initials: getInitials(lead.full_name ?? "U"),
            avatarBg: style.bg,
            avatarColor: style.color,
            mrn: buildMRN(lead.id),
            referralDate: formatDate(lead.created_at),

            referralSourceName: source?.name ?? "Direct",

            raw: lead,
          };
        });

        setPatients(cards);
        if (cards.length > 0) setSelected(cards[0]);
      } catch (err) {
        console.error("Failed to load referrals:", err);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [doctorId, clinic?.id, sourceMap]);

  const filtered = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.mrn.toLowerCase().includes(search.toLowerCase()),
      ),
    [patients, search],
  );

  return (
    <Box p={1}>
      <HeaderWithSearch
        title={`${doctorName} Referrals`}
        search={search}
        setSearch={setSearch}
        placeholder="Search by Lead name/MRN No."
        rightSlot={
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            border="1px solid #E2E8F0"
            borderRadius="8px"
            px={1.5}
            py={0.75}
            sx={{ cursor: "pointer", bgcolor: "#fff" }}
          >
            <Typography fontSize="13px" color="#374151">
              {new Date().toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </Typography>
            <CalendarTodayOutlinedIcon
              sx={{ fontSize: 15, color: "#64748B" }}
            />
          </Box>
        }
      />

      {loading ? (
        <Box display="flex" justifyContent="center" pt={8}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box display="flex" gap={2.5} alignItems="flex-start">
          <Paper
            elevation={0}
            sx={{
              width: 290,
              flexShrink: 0,
              borderRadius: "12px",
              border: "1px solid #F0F0F0",
              bgcolor: "#fff",
              overflow: "hidden",
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px={2}
              py={1.5}
              sx={{ borderBottom: "1px solid #F8F8F9" }}
            >
              <Typography fontSize="13px" fontWeight={600} color="#232323">
                All Referrals ({filtered.length})
              </Typography>
              <Box display="flex">
                <Tooltip title="Info">
                  <IconButton size="small" sx={{ color: "#9E9E9E" }}>
                    <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Filter">
                  <IconButton size="small" sx={{ color: "#9E9E9E" }}>
                    <FilterListIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box
              sx={{
                maxHeight: "calc(100vh - 280px)",
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "#E2E8F0",
                  borderRadius: "4px",
                },
              }}
            >
              {filtered.length === 0 ? (
                <Box py={5} textAlign="center">
                  <Typography fontSize="13px" color="#9E9E9E">
                    No patients found
                  </Typography>
                </Box>
              ) : (
                filtered.map((p) => (
                  <Box
                    key={p.id}
                    onClick={() => setSelected(p)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      bgcolor:
                        selected?.id === p.id ? "#EFF6FF" : "transparent",
                      borderLeft:
                        selected?.id === p.id
                          ? "3px solid #1D4ED8"
                          : "3px solid transparent",
                      borderBottom: "1px solid #F8F8F9",
                      transition: "all 0.12s",
                      "&:hover": {
                        bgcolor: selected?.id === p.id ? "#EFF6FF" : "#FAFAFA",
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: p.avatarBg,
                          color: p.avatarColor,
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {p.initials}
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography
                          fontSize="13px"
                          fontWeight={600}
                          color="#232323"
                          noWrap
                        >
                          {p.name}
                        </Typography>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          mt={0.25}
                        >
                          <Typography
                            fontSize="11px"
                            color="#1D4ED8"
                            fontWeight={500}
                          >
                            {p.mrn}
                          </Typography>
                          <Typography fontSize="11px" color="#9E9E9E">
                            {p.referralDate}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>

          {selected ? (
            <PatientDetails patient={selected} />
          ) : (
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                borderRadius: "12px",
                border: "1px solid #F0F0F0",
                bgcolor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
              }}
            >
              <Typography fontSize="14px" color="#9E9E9E">
                Select a patient to view their details
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export const Corporate: React.FC = () => (
  <SourceDepartmentPage pageKey="corporate" />
);
export const Insurance: React.FC = () => (
  <SourceDepartmentPage pageKey="insurance" />
);
export const Diagnostic: React.FC = () => (
  <SourceDepartmentPage pageKey="diagnostic" />
);
export const Zoya: React.FC = () => <SourceDepartmentPage pageKey="zoya" />;
export const Practo: React.FC = () => <SourceDepartmentPage pageKey="practo" />;
