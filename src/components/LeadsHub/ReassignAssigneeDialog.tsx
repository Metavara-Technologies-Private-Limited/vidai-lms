import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch } from "react-redux";
import { EmployeeAPI, LeadAPI } from "../../services/leads.api";
import type { Employee } from "../../services/leads.api";
import { fetchLeads } from "../../store/leadSlice";

interface Props {
  open: boolean;
  lead: any;
  onClose: () => void;
}

// Next Action Type options
const nextActionTypes = [
  "Follow Up",
  "Call Patient",
  "Send Message",
  "Send Email",
  "Book Appointment",
  "Review Details",
  "No Action",
];

// Next Action Status options
const nextActionStatuses = [
  { value: "pending", label: "To Do" },
  { value: "completed", label: "Completed" },
];

const ReassignAssigneeDialog: React.FC<Props> = ({ open, lead, onClose }) => {
  const dispatch = useDispatch();

  // ====================== State ======================
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<number | null>(null);
  const [nextActionType, setNextActionType] = React.useState("");
  const [nextActionStatus, setNextActionStatus] = React.useState("pending");
  const [nextActionDescription, setNextActionDescription] = React.useState("");
  
  const [loading, setLoading] = React.useState(false);
  const [fetchingEmployees, setFetchingEmployees] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ====================== Fetch Employees ======================
  React.useEffect(() => {
    const fetchEmployees = async () => {
      if (!open || !lead.clinic_id) return;

      try {
        setFetchingEmployees(true);
        setError(null);

        console.log(`📋 Fetching employees for clinic_id: ${lead.clinic_id}`);
        
        const employeeList = await EmployeeAPI.listByClinic(lead.clinic_id);
        
        console.log(`✅ Fetched ${employeeList.length} employees`);
        setEmployees(employeeList);

        // Pre-populate with current values
        if (lead.assigned_to_id) {
          setSelectedEmployeeId(lead.assigned_to_id);
        }
        if (lead.next_action_type) {
          setNextActionType(lead.next_action_type);
        }
        if (lead.next_action_status) {
          setNextActionStatus(lead.next_action_status);
        }
        if (lead.next_action_description) {
          setNextActionDescription(lead.next_action_description);
        }
      } catch (err: any) {
        console.error("❌ Failed to fetch employees:", err);
        const errorMsg =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load employees";
        setError(errorMsg);
      } finally {
        setFetchingEmployees(false);
      }
    };

    fetchEmployees();
  }, [open, lead.clinic_id, lead.assigned_to_id, lead.next_action_type, lead.next_action_status, lead.next_action_description]);

  // ====================== Handle Save (OPTIMIZED - FAST) ======================
  const handleSave = async () => {
    // Validation
    if (!selectedEmployeeId) {
      setError("Please select an assignee");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`💾 Saving reassignment for lead ${lead.id}`);

      // ✅ Prepare update payload
      const updatePayload = {
        // Required fields from API schema
        full_name: lead.full_name || lead.name,
        contact_no: lead.contact_no || lead.contact,
        source: lead.source,
        treatment_interest: lead.treatment_interest || lead.treatmentInterest || "",
        appointment_date: lead.appointment_date || lead.appointmentDate || lead.date || new Date().toISOString().split('T')[0],
        slot: lead.slot || "10:00 AM",

        // Update fields
        assigned_to_id: selectedEmployeeId,
        next_action_type: nextActionType || undefined,
        next_action_status: nextActionStatus || "pending",
        next_action_description: nextActionDescription || undefined,

        // Keep existing values
        clinic_id: lead.clinic_id,
        department_id: lead.department_id,
        email: lead.email || undefined,
        age: lead.age || undefined,
        marital_status: lead.marital_status || lead.marital || undefined,
        location: lead.location || undefined,
        address: lead.address || undefined,
        partner_inquiry: lead.partner_inquiry || false,
        partner_full_name: lead.partner_full_name || lead.partnerName || undefined,
        partner_age: lead.partner_age || lead.partnerAge || undefined,
        partner_gender: lead.partner_gender || lead.partnerGender || undefined,
        sub_source: lead.sub_source || lead.subSource || undefined,
        lead_status: lead.lead_status || lead.status || "new",
        book_appointment: lead.book_appointment || lead.wantAppointment === "yes" || false,
        remark: lead.remark || undefined,
        is_active: lead.is_active !== false,
      };

      console.log("📤 Sending update payload:", updatePayload);

      // ⚡ FAST: Close dialog immediately for better UX
      onClose();

      // ✅ Call the PUT /leads/{lead_id}/update/ endpoint (async in background)
      LeadAPI.update(lead.id, updatePayload)
        .then(() => {
          console.log("✅ Lead updated successfully");
          
          // Refresh leads list in background
          dispatch(fetchLeads() as any);

          // Emit event for other components to sync
          const event = new CustomEvent("lead-updated", {
            detail: { 
              id: lead.id, 
              assigned_to_id: selectedEmployeeId,
              next_action_type: nextActionType,
              next_action_status: nextActionStatus,
              next_action_description: nextActionDescription,
            },
          });
          window.dispatchEvent(event);
        })
        .catch((err: any) => {
          console.error("❌ Failed to update lead:", err);
          // Re-open dialog with error if save failed
          const errorMsg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to update lead";
          setError(errorMsg);
        })
        .finally(() => {
          setLoading(false);
        });

    } catch (err: any) {
      console.error("❌ Failed to update lead:", err);
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update lead";
      setError(errorMsg);
      setLoading(false);
    }
  };

  // ====================== Reset on Close ======================
  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSelectedEmployeeId(lead.assigned_to_id || null);
      setNextActionType(lead.next_action_type || "");
      setNextActionStatus(lead.next_action_status || "pending");
      setNextActionDescription(lead.next_action_description || "");
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "8px",
          width: "450px",
          maxWidth: "90vw",
        }
      }}
    >
      {/* Dialog Title with Close Button */}
      <DialogTitle 
        sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          pb: 2,
          pt: 2.5,
          px: 3,
          borderBottom: "1px solid #E0E0E0",
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: "18px",
            fontWeight: 600,
            color: "#1A1A1A",
          }}
        >
          Reassign Assignee
        </Typography>
        <IconButton 
          onClick={handleClose} 
          disabled={loading}
          size="small"
          sx={{
            color: "#666",
            "&:hover": {
              bgcolor: "#F5F5F5",
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent 
        sx={{ 
          pt: 3,
          pb: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Error Message */}
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ mb: 1 }}
            >
              {error}
            </Alert>
          )}

          {/* Assignee Dropdown */}
          <FormControl 
            fullWidth 
            disabled={fetchingEmployees || loading}
            size="small"
          >
            <InputLabel 
              sx={{ 
                fontSize: "14px",
                "&.Mui-focused": {
                  color: "#1976d2",
                }
              }}
            >
              Assignee
            </InputLabel>
            <Select
              value={selectedEmployeeId || ""}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              label="Assignee"
              sx={{
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D0D0D0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#999",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              {fetchingEmployees ? (
                <MenuItem disabled>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography fontSize="14px">Loading employees...</Typography>
                  </Box>
                </MenuItem>
              ) : employees.length === 0 ? (
                <MenuItem disabled>
                  <Typography fontSize="14px">No employees available</Typography>
                </MenuItem>
              ) : (
                employees.map((employee) => (
                  <MenuItem 
                    key={employee.id} 
                    value={employee.id}
                    sx={{ fontSize: "14px" }}
                  >
                    {employee.emp_name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Next Action Type */}
          <FormControl 
            fullWidth 
            disabled={loading}
            size="small"
          >
            <InputLabel 
              sx={{ 
                fontSize: "14px",
                "&.Mui-focused": {
                  color: "#1976d2",
                }
              }}
            >
              Next Action Type
            </InputLabel>
            <Select
              value={nextActionType}
              onChange={(e) => setNextActionType(e.target.value)}
              label="Next Action Type"
              sx={{
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D0D0D0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#999",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              {nextActionTypes.map((type) => (
                <MenuItem 
                  key={type} 
                  value={type}
                  sx={{ fontSize: "14px" }}
                >
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Next Action Status */}
          <FormControl 
            fullWidth 
            disabled={loading}
            size="small"
          >
            <InputLabel 
              sx={{ 
                fontSize: "14px",
                "&.Mui-focused": {
                  color: "#1976d2",
                }
              }}
            >
              Next Action Status
            </InputLabel>
            <Select
              value={nextActionStatus}
              onChange={(e) => setNextActionStatus(e.target.value)}
              label="Next Action Status"
              sx={{
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D0D0D0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#999",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              {nextActionStatuses.map((status) => (
                <MenuItem 
                  key={status.value} 
                  value={status.value}
                  sx={{ fontSize: "14px" }}
                >
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Next Action Description */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Next Action Description"
            placeholder="Enter Description"
            value={nextActionDescription}
            onChange={(e) => setNextActionDescription(e.target.value)}
            disabled={loading}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "14px",
                "& fieldset": {
                  borderColor: "#D0D0D0",
                },
                "&:hover fieldset": {
                  borderColor: "#999",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#1976d2",
                },
              },
              "& .MuiInputLabel-root": {
                fontSize: "14px",
                "&.Mui-focused": {
                  color: "#1976d2",
                }
              },
              "& .MuiInputBase-input::placeholder": {
                fontSize: "14px",
                color: "#999",
              }
            }}
          />
        </Box>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions 
        sx={{ 
          px: 3, 
          pb: 2.5,
          pt: 2,
          gap: 1.5,
          justifyContent: "flex-end",
        }}
      >
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
          sx={{ 
            minWidth: 100,
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
            borderColor: "#D0D0D0",
            color: "#666",
            "&:hover": {
              borderColor: "#999",
              bgcolor: "#F5F5F5",
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || fetchingEmployees || !selectedEmployeeId}
          sx={{ 
            minWidth: 100,
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
            bgcolor: "#2C2C2C",
            color: "#FFFFFF",
            "&:hover": {
              bgcolor: "#1A1A1A",
            },
            "&.Mui-disabled": {
              bgcolor: "#E0E0E0",
              color: "#999",
            }
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReassignAssigneeDialog;