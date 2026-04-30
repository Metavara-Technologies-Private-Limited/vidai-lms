import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import { useState } from "react";
import FilterLeadsIcon from "../../assets/icons/Filter_Leads.svg";
import type { Lead } from "../../services/leads.api";
import type { ReviewRequestFormData } from "./reviewRequest.utils";

type ReviewRequestStepDetailsProps = {
  formData: ReviewRequestFormData;
  allLeads: Lead[];
  leadSelectionType: "all" | "manual";
  selectedLeads: Lead[];
  coralRadio: Record<string, unknown>;
  onRequestNameChange: (value: string) => void;
  onRequestNameBlur: () => void;
  onDescriptionChange: (value: string) => void;
  onDescriptionBlur: () => void;
  onLeadSelectionTypeChange: (value: "all" | "manual") => void;
  onSelectedLeadsChange: (leads: Lead[]) => void;
  leadActionFilter: string;
  onLeadActionFilterChange: (value: string) => void;
  onCollectOnChange: (value: "google" | "form" | "both") => void;
};

const ACTION_FILTER_OPTIONS = [
  "Follow Up",
  "Call Patient",
  "Book Appointment",
  "Send Message",
  "Send Email",
  "Review Details",
  "No Action",
] as const;

const AVATAR_BG_COLORS = [
  "#F97316",
  "#2563EB",
  "#059669",
  "#E11D48",
  "#7C3AED",
  "#0EA5E9",
  "#CA8A04",
  "#0891B2",
] as const;

const getLeadAvatarColor = (lead: Lead) => {
  const seed = `${lead.id ?? ""}-${lead.full_name ?? ""}`;

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length];
};

const ReviewRequestStepDetails = ({
  formData,
  allLeads,
  leadSelectionType,
  selectedLeads,
  coralRadio,
  onRequestNameChange,
  onRequestNameBlur,
  onDescriptionChange,
  onDescriptionBlur,
  onLeadSelectionTypeChange,
  onSelectedLeadsChange,
  leadActionFilter,
  onLeadActionFilterChange,
  onCollectOnChange,
}: ReviewRequestStepDetailsProps) => {
  const leadList = leadSelectionType === "all" ? allLeads : selectedLeads;
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null,
  );

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1.5,
          mb: 1.5,
        }}
      >
<TextField
  size="small"
  fullWidth
  label="Request Name"
  value={formData.request_name}
  onChange={(e) => onRequestNameChange(e.target.value)}
  onBlur={onRequestNameBlur}
  inputProps={{ maxLength: 100 }}
/>
        <TextField
          size="small"
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={onDescriptionBlur}
          inputProps={{ maxLength: 255 }}
        />
      </Box>

      <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
        Select Leads
      </Typography>
      <RadioGroup
        row
        value={leadSelectionType}
        onChange={(e) =>
          onLeadSelectionTypeChange(e.target.value as "all" | "manual")
        }
        sx={{ mb: 1.5, flexDirection: { xs: "column", sm: "row" } }}
      >
        <FormControlLabel
          value="all"
          control={<Radio sx={coralRadio} size="small" />}
          label={<Typography variant="body2">All Leads</Typography>}
        />
        <FormControlLabel
          value="manual"
          control={<Radio sx={coralRadio} size="small" />}
          label={<Typography variant="body2">Select Manually</Typography>}
        />
      </RadioGroup>

      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          mb: 1.5,
        }}
      >
        <Autocomplete<Lead, true, false, false>
          multiple
          disableCloseOnSelect
          options={allLeads}
          disabled={leadSelectionType === "all"}
          slotProps={{
            popper: {
              placement: "bottom-start",
              sx: {
                width: "fit-content !important",
                minWidth: 260,
                maxWidth: 420,
              },
            },
            paper: {
              sx: {
                width: "fit-content",
                minWidth: 260,
                maxWidth: 420,
              },
            },
          }}
          isOptionEqualToValue={(option, value) =>
            String(option.id) === String(value.id)
          }
          getOptionLabel={(option) => option.full_name || ""}
          value={selectedLeads}
          onChange={(_, newValue) => onSelectedLeadsChange(newValue)}
          renderOption={(props, option, { selected }) => {
            // Extract key from props to pass it separately, avoiding React warning
            const { key, ...restProps } = props;
            const firstLetter = (option.full_name || "U")
              .charAt(0)
              .toUpperCase();

            return (
              <Box
                key={key}
                component="li"
                {...restProps}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Checkbox
                  size="small"
                  checked={selected}
                  sx={{
                    color: "#9CA3AF",
                    "&.Mui-checked": { color: "#E86A4A" },
                  }}
                />
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: 11,
                    bgcolor: getLeadAvatarColor(option),
                    color: "#FFFFFF",
                  }}
                >
                  {firstLetter}
                </Avatar>
                <Typography variant="body2" sx={{ color: "#1F2937" }}>
                  {option.full_name}
                </Typography>
              </Box>
            );
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const tagProps = getTagProps({ index });
              const firstLetter = (option.full_name || "U")
                .charAt(0)
                .toUpperCase();

              return (
                <Chip
                  {...tagProps}
                  key={String(option.id)}
                  avatar={
                    <Avatar
                      sx={{
                        width: 20,
                        height: 20,
                        fontSize: 10,
                        bgcolor: getLeadAvatarColor(option),
                        color: "#FFF",
                      }}
                    >
                      {firstLetter}
                    </Avatar>
                  }
                  label={option.full_name}
                  size="small"
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Search & Select"
              placeholder={
                leadSelectionType === "all"
                  ? "All leads selected"
                  : "Search & Select"
              }
            />
          )}
          sx={{ flex: 1, width: "100%" }}
        />

        <IconButton
          sx={{ p: 0, alignSelf: { xs: "flex-end", sm: "center" } }}
          onClick={(event) => setFilterAnchorEl(event.currentTarget)}
        >
          <img
            src={FilterLeadsIcon}
            alt="Filter"
            style={{ width: 36, height: 36 }}
          />
        </IconButton>

        {leadActionFilter && (
          <Chip
            label={leadActionFilter}
            size="small"
            onDelete={() => onLeadActionFilterChange("")}
            sx={{
              borderRadius: "999px",
              fontWeight: 600,
              color: "#6D28D9",
              backgroundColor: "#F5F3FF",
              border: "1px solid #DDD6FE",
            }}
          />
        )}

        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
          PaperProps={{
            sx: {
              width: 300,
              borderRadius: "12px",
              mt: 1,
            },
          }}
        >
          <MenuItem
            selected={leadActionFilter === ""}
            onClick={() => {
              onLeadActionFilterChange("");
              setFilterAnchorEl(null);
            }}
            sx={{
              m: 1,
              borderRadius: "8px",
              backgroundColor:
                leadActionFilter === "" ? "#F3ECEC" : "transparent",
            }}
          >
            <Typography>-- Select --</Typography>
          </MenuItem>

          {ACTION_FILTER_OPTIONS.map((option) => (
            <MenuItem
              key={option}
              selected={leadActionFilter === option}
              onClick={() => {
                onLeadActionFilterChange(option);
                setFilterAnchorEl(null);
              }}
            >
              <Typography>{option}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
          minHeight: "32px",
        }}
      >
        {leadList.slice(0, 10).map((lead) => (
          <Chip
            key={lead.id}
            avatar={
              <Avatar
                sx={{
                  bgcolor: getLeadAvatarColor(lead),
                  color: "#FFF",
                  fontSize: "10px",
                }}
              >
                {(lead.full_name || "U").charAt(0).toUpperCase()}
              </Avatar>
            }
            label={lead.full_name}
            size="small"
            onDelete={
              leadSelectionType === "manual"
                ? () =>
                    onSelectedLeadsChange(
                      selectedLeads.filter((l) => l.id !== lead.id),
                    )
                : undefined
            }
            sx={{ bgcolor: "#F5F3FF", color: "#6D28D9", fontWeight: 500 }}
          />
        ))}

        {leadList.length > 10 && (
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: 10,
              bgcolor: "#E5E7EB",
              color: "#4B5563",
            }}
          >
            +{leadList.length - 10}
          </Avatar>
        )}
      </Box>

      <Typography fontWeight={600} fontSize={13} sx={{ mb: 1 }}>
        Collect Reviews On
      </Typography>
      <RadioGroup
        row
        value={formData.collect_on}
        onChange={(e) =>
          onCollectOnChange(e.target.value as "google" | "form" | "both")
        }
      >
        <FormControlLabel
          value="google"
          control={<Radio sx={coralRadio} size="small" />}
          label={<Typography variant="body2">Google</Typography>}
        />
        <FormControlLabel
          value="form"
          control={<Radio sx={coralRadio} size="small" />}
          label={<Typography variant="body2">Feedback Form</Typography>}
        />
        <FormControlLabel
          value="both"
          control={<Radio sx={coralRadio} size="small" />}
          label={
            <Typography variant="body2">Both (With Rating Gate)</Typography>
          }
        />
      </RadioGroup>
    </Box>
  );
};

export default ReviewRequestStepDetails;
