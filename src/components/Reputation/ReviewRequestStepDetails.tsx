import {
  Avatar,
  Box,
  Chip,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
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
  onCollectOnChange: (value: "google" | "form" | "both") => void;
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
  onCollectOnChange,
}: ReviewRequestStepDetailsProps) => {
  const leadList = leadSelectionType === "all" ? allLeads : selectedLeads;

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          label="Request Name"
          value={formData.request_name}
          onChange={(e) => onRequestNameChange(e.target.value)}
          onBlur={onRequestNameBlur}
        />
        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={onDescriptionBlur}
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
        sx={{ mb: 2 }}
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

      <Autocomplete<Lead, true, false, false>
        multiple
        options={allLeads}
        disabled={leadSelectionType === "all"}
        getOptionLabel={(option) => option.full_name || ""}
        value={selectedLeads}
        onChange={(_, newValue) => onSelectedLeadsChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Assignee"
            placeholder={
              leadSelectionType === "all"
                ? "All leads selected"
                : "Search & Select"
            }
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small">
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                  <KeyboardArrowDownIcon />
                </InputAdornment>
              ),
            }}
          />
        )}
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mb: 3,
          minHeight: "32px",
        }}
      >
        {leadList.slice(0, 10).map((lead) => (
          <Chip
            key={lead.id}
            avatar={
              <Avatar
                sx={{ bgcolor: "#E86A4A", color: "#FFF", fontSize: "10px" }}
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
