import {
  Box,
  Typography,
  Tabs,
  Tab,
  Stack,
  Divider,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  Button,
  CircularProgress,
} from "@mui/material";
import dayjs from "dayjs";

import {
  propertyContainerSx,
  propertyFieldSx,
  floatingLabelSx,
  priorityChipSx,
  propertyMenuProps,
  statusChipSx,
  ticketDetailsTabsSx,
} from "../../../styles/Settings/Tickets.styles";

interface Props {
  ticket: any;
  employees: any[];

  tab: number;
  setTab: (v: number) => void;

  type: string;
  setType: (v: string) => void;

  status: string;
  setStatus: (v: any) => void;

  priority: string;
  setPriority: (v: any) => void;

  assignTo: number | "";
  setAssignTo: (v: number | "") => void;

  handleUpdate: () => void;
  updating: boolean;

  ticketTypes: string[];
}

const TicketPropertiesSidebar = ({
  ticket,
  employees,
  tab,
  setTab,
  type,
  setType,
  status,
  setStatus,
  priority,
  setPriority,
  assignTo,
  setAssignTo,
  handleUpdate,
  updating,
  ticketTypes,
}: Props) => {
  if (!ticket) return null;

  return (
    <Box flex={1} bgcolor="#FAFAFA" p={3} borderRadius={2} border="1px solid #E0E0E0">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...ticketDetailsTabsSx, mb: 3 }}>
        <Tab label="Ticket Details" />
        <Tab label="Timeline" />
      </Tabs>

      {tab === 0 ? (
        <Stack spacing={3}>
          {/* DETAILS */}
          <Box>
            <Typography variant="subtitle2" fontWeight={500} mb={2}>
              Details
            </Typography>

            <DetailRow label="Ticket ID" value={ticket.ticket_no} />
            <DetailRow label="Lab Name" value={ticket.lab_name} />
            <DetailRow label="Subject" value={ticket.subject} />
            <DetailRow label="Created Date" value={dayjs(ticket.created_at).format("DD/MM/YYYY")} />
            <DetailRow label="Requested By" value={ticket.requested_by} />
            <DetailRow label="Department" value={ticket.department_name} />
          </Box>

          <Divider />

          {/* PROPERTIES */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>
              Properties
            </Typography>

            <Box sx={propertyContainerSx}>
              {/* TYPE */}
              <TextField
                select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                fullWidth
                size="small"
                sx={propertyFieldSx}
                InputLabelProps={{ sx: floatingLabelSx }}
                SelectProps={{ MenuProps: propertyMenuProps }}
              >
                {ticketTypes.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              {/* STATUS */}
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                fullWidth
                size="small"
                sx={propertyFieldSx}
                InputLabelProps={{ sx: floatingLabelSx }}
              >
                {["new", "pending", "resolved", "closed"].map((s) => (
                  <MenuItem key={s} value={s}>
                    <Chip label={s.toUpperCase()} sx={statusChipSx(s)} />
                  </MenuItem>
                ))}
              </TextField>

              {/* PRIORITY */}
              <TextField
                select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                fullWidth
                size="small"
                sx={propertyFieldSx}
                InputLabelProps={{ sx: floatingLabelSx }}
              >
                {["low", "medium", "high"].map((p) => (
                  <MenuItem key={p} value={p}>
                    <Chip label={p.toUpperCase()} sx={priorityChipSx(p)} />
                  </MenuItem>
                ))}
              </TextField>

              {/* ASSIGN */}
              <TextField
                select
                label="Assign To"
                value={assignTo}
                onChange={(e) =>
                  setAssignTo(e.target.value === "" ? "" : Number(e.target.value))
                }
                fullWidth
                size="small"
                sx={propertyFieldSx}
                InputLabelProps={{ sx: floatingLabelSx }}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>
                        {emp.emp_name?.[0]}
                      </Avatar>
                      <Typography fontSize={13}>{emp.emp_name}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleUpdate}
            disabled={updating}
            sx={{ bgcolor: "#505050", py: 1.5, borderRadius: 2, "&:hover": { bgcolor: "#232323" } }}
          >
            {updating ? <CircularProgress size={24} color="inherit" /> : "Update"}
          </Button>
        </Stack>
      ) : (
        <Box>
          {(() => {
            const timeline = ticket.timeline ? [...ticket.timeline] : [];

            let displayItems = [...timeline];
            const hasAssignment = displayItems.some(t => t.action?.toLowerCase().includes("assign"));

            if (!hasAssignment && ticket.assigned_to) {
              const assignItem = {
                id: "auto-assign",
                action: `Assigned to ${ticket.requested_by}`,
                created_at: ticket.created_at,
                is_injected: true
              };
              if (displayItems.length > 0) {
                displayItems.splice(1, 0, assignItem);
              } else {
                displayItems.push(assignItem);
              }
            }

            return displayItems.map((item: any, index: number) => {
              const isAssigned = item.action?.toLowerCase().includes("assign") || item.is_injected;
              const isLast = index === displayItems.length - 1;

              return (
                <Box key={item.id || index} position="relative" pb={3}>
                  {/* VERTICAL CONNECTING LINE */}
                  {!isLast && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: 15,
                        top: 34,
                        width: 2,
                        height: "calc(100% - 10px)", 
                        bgcolor: "#E0E0E0",
                        zIndex: 0,
                      }}
                    />
                  )}

                  {/* LEFT NODE */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: -2,
                      top: 2,
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      backgroundColor: "#F1EDFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1, 
                    }}
                  >
                    {isAssigned ? (
                      <Avatar
                        src={`https://ui-avatars.com/api/?name=${ticket.requested_by}`}
                        sx={{ width: 34, height: 34 }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: "#7B61FF",
                        }}
                      />
                    )}
                  </Box>

                  {/* TEXT CONTENT */}
                  <Box ml={5}>
                    <Typography fontSize={14} fontWeight={500}>
                      {isAssigned
                        ? `Assigned to ${ticket.requested_by}`
                        : item.action}
                    </Typography>

                    <Typography fontSize={12} color="#8A8A8A">
                      {dayjs(item.created_at).format("DD/MM/YYYY | hh:mm A")}
                    </Typography>
                  </Box>
                </Box>
              );
            });
          })()}

        </Box>
      )}
    </Box>
  );
};

export default TicketPropertiesSidebar;

/* Small reusable row */
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Box display="flex" justifyContent="space-between" mb={1.5}>
    <Typography variant="body2" color="text.secondary">
      {label} :
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value}
    </Typography>
  </Box>
);
