import { useState, useEffect } from "react";
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
  Autocomplete,
} from "@mui/material";
import dayjs from "dayjs";
import { authApi } from "../../../services/auth.api";

type AssigneeOption = {
  id: number;
  first_name: string | undefined;
  last_name: string | undefined;
  username: string | undefined;
  email: string | undefined;
  role: string | undefined;
  designation: string | undefined;
};

const asRecordSafe = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const normalizeAssignees = (raw: unknown): AssigneeOption[] => {
  const root = asRecordSafe(raw);
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray(root?.objects)
      ? (root?.objects as unknown[])
      : Array.isArray(root?.results)
        ? (root?.results as unknown[])
        : Array.isArray(root?.data)
          ? (root?.data as unknown[])
          : [];
  return list
    .map((item) => {
      const record = asRecordSafe(item);
      if (!record) return null;
      const idValue = record.id ?? record.user_id;
      const id =
        typeof idValue === "number"
          ? idValue
          : typeof idValue === "string"
            ? Number(idValue)
            : NaN;
      if (!Number.isFinite(id)) return null;
      return {
        id,
        first_name: typeof record.first_name === "string" ? record.first_name : undefined,
        last_name: typeof record.last_name === "string" ? record.last_name : undefined,
        username: typeof record.username === "string" ? record.username : undefined,
        email: typeof record.email === "string"
          ? record.email
          : typeof record.username === "string" && record.username.includes("@")
            ? record.username
            : undefined,
        role: typeof record.role === "string" ? record.role : undefined,
        designation: typeof record.designation === "string" ? record.designation : undefined,
      };
    })
    .filter((item): item is AssigneeOption => item !== null);
};

const assigneeLabel = (option: AssigneeOption): string => {
  const fullName = `${option.first_name ?? ""} ${option.last_name ?? ""}`.trim();
  const primary = fullName || option.username || `User ${option.id}`;
  const secondary = option.role || option.designation;
  return secondary ? `${primary} (${secondary})` : primary;
};
import type {
  TicketDetail,
  Employee,
  TicketPriority,
  TicketStatus,
  TicketTimeline,
} from "../../../types/tickets.types";

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
  ticket: TicketDetail | null;
  employees: Employee[];
  selectedAssigneeName?: string;
  selectedAssigneeEmail?: string;

  tab: number;
  setTab: (v: number) => void;

  type: string;
  setType: (v: string) => void;

  status: TicketStatus;
  setStatus: (v: TicketStatus) => void;

  priority: TicketPriority;
  setPriority: (v: TicketPriority) => void;

  assignTo: number | "";
  setAssignTo: (v: number | "") => void;

  handleUpdate: () => void;
  setAssigneeName?: (name: string) => void;
  setAssigneeEmail?: (email: string) => void;

  updating: boolean;

  ticketTypes: string[];
}

const TicketPropertiesSidebar = ({
  ticket,
  employees,
  selectedAssigneeName,
  selectedAssigneeEmail,
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
  setAssigneeName,
  setAssigneeEmail,
  handleUpdate,
  updating,
  ticketTypes,
}: Props) => {
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [selectedAssigneeOption, setSelectedAssigneeOption] = useState<AssigneeOption | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!assigneeSearch.trim()) {
        setAssigneeOptions([]);
        return;
      }
      try {
        setAssigneeLoading(true);
        const response = await authApi.searchUsers({ search: assigneeSearch, limit: 20, offset: 0 });
        setAssigneeOptions(normalizeAssignees(response));
      } catch {
        setAssigneeOptions([]);
      } finally {
        setAssigneeLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [assigneeSearch]);

  if (!ticket) return null;

  const currentAssigneeName =
    selectedAssigneeName?.trim() ||
    (selectedAssigneeOption ? assigneeLabel(selectedAssigneeOption) : "") ||
    employees.find((e) => e.id === ticket.assigned_to_id)?.emp_name ||
    ticket.assigned_to_name ||
    "";
  const currentAssigneeEmail =
    selectedAssigneeEmail?.trim() ||
    selectedAssigneeOption?.email?.trim() ||
    employees.find((e) => e.id === ticket.assigned_to_id)?.email ||
    "";
  const hasPendingAssignmentChange =
    assignTo !== "" && assignTo !== (ticket.assigned_to_id ?? "");
  const currentAssignmentAction = `Assigned to ${currentAssigneeName || "Assignee"}`;

  const handleUpdateWithTimeline = () => {
    const actions: string[] = [];

    if (ticket.status !== status) {
      actions.push(`Status changed from ${ticket.status} to ${status}`);
    }

    if (ticket.type !== type) {
      actions.push(`Type changed from ${ticket.type} to ${type}`);
    }
    if (ticket.priority !== priority) {
      actions.push(`Priority changed from ${ticket.priority} to ${priority}`);
    }

    if (ticket.assigned_to_id !== assignTo) {
      actions.push(
        `Assigned changed from ${ticket.assigned_to_name || "Unassigned"} to ${currentAssigneeName || "Assignee"}`,
      );
    }

    console.log("Timeline actions:", actions);

    handleUpdate();
  };

  return (
    <Box
      flex={1}
      bgcolor="#FAFAFA"
      p={3}
      borderRadius={2}
      border="1px solid #E0E0E0"
    >
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ ...ticketDetailsTabsSx, mb: 3 }}
      >
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
            <DetailRow
              label="Created Date"
              value={dayjs(ticket.created_at).format("DD/MM/YYYY")}
            />
            <DetailRow label="Requested By" value={ticket.requested_by} />
            <DetailRow label="Department" value={ticket.department_name} />

            {/* ASSIGNED TO with avatar */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="body2" color="text.secondary">
                Assigned To :
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "#7B61FF" }}>
                  {(currentAssigneeName.trim().charAt(0) || "U").toUpperCase()}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>
                  {currentAssigneeName || "Unassigned"}
                </Typography>
              </Stack>
            </Box>
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
                key={type}
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
                key={status}
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
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
                key={priority}
                select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
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
              <Autocomplete
                options={assigneeOptions}
                loading={assigneeLoading}
                value={selectedAssigneeOption}
                onInputChange={(_, value) => setAssigneeSearch(value)}
                onChange={(_, value) => {
                  setSelectedAssigneeOption(value);
                  setAssignTo(value?.id ?? "");
                  const name = value ? assigneeLabel(value) : "";
                  const email = value?.email?.trim() || "";
                  setAssigneeName?.(name);
                  setAssigneeEmail?.(email);
                }}
                getOptionLabel={assigneeLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                fullWidth
                noOptionsText="Type to search assignee"
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>
                        {(assigneeLabel(option).trim().charAt(0) || "U").toUpperCase()}
                      </Avatar>
                      <Typography fontSize={13}>{assigneeLabel(option)}</Typography>
                    </Stack>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign To"
                    placeholder={ticket.assigned_to_name || "Search assignee"}
                    size="small"
                    sx={propertyFieldSx}
                    InputLabelProps={{ ...params.InputLabelProps, sx: floatingLabelSx, shrink: true }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {assigneeLoading ? <CircularProgress size={14} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleUpdateWithTimeline}
            disabled={updating}
            sx={{
              bgcolor: "#505050",
              py: 1.5,
              borderRadius: 2,
              "&:hover": { bgcolor: "#232323" },
            }}
          >
            {updating ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Update"
            )}
          </Button>
        </Stack>
      ) : (
        <Box>
          {(() => {
            const timeline = (ticket.timeline || []) as TicketTimeline[];

            const displayItems: (TicketTimeline & { is_injected?: boolean })[] =
              [...timeline];
            const hasCurrentAssignmentItem = displayItems.some(
              (t) =>
                t.action?.trim().toLowerCase() ===
                currentAssignmentAction.trim().toLowerCase(),
            );
            const shouldShowCurrentAssignment =
              Boolean(assignTo || ticket.assigned_to_id) &&
              Boolean(currentAssigneeName) &&
              (hasPendingAssignmentChange || !hasCurrentAssignmentItem);

            if (shouldShowCurrentAssignment) {
              displayItems.unshift({
                id: `pending-assign-${assignTo}`,
                action: currentAssignmentAction,
                created_at: hasPendingAssignmentChange
                  ? new Date().toISOString()
                  : ticket.updated_at || ticket.created_at,
                is_injected: true,
              });
            }

            return displayItems.map((item, index) => {
              const isAssigned =
                item.action?.toLowerCase().includes("assign") ||
                item.is_injected;
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
                      <Avatar sx={{ width: 34, height: 34 }}>
                        {(currentAssigneeName.trim().charAt(0) || "U").toUpperCase()}
                      </Avatar>
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
                      {item.is_injected
                        ? currentAssignmentAction
                        : item.action}
                    </Typography>

                    {isAssigned && item.is_injected && currentAssigneeEmail ? (
                      <Typography
                        fontSize={12}
                        color="#8A8A8A"
                        sx={{ mt: 0.25 }}
                      >
                        {currentAssigneeEmail}
                      </Typography>
                    ) : null}

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
