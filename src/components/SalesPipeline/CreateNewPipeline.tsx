import { useEffect, useMemo, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import VaccinesOutlinedIcon from "@mui/icons-material/VaccinesOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import CastForEducationOutlinedIcon from "@mui/icons-material/CastForEducationOutlined";
import MemoryOutlinedIcon from "@mui/icons-material/MemoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import BiotechOutlinedIcon from "@mui/icons-material/BiotechOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import {
	Box,
	Button,
	Dialog,
	IconButton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { isAlphabeticName, normalizeNameForCompare } from "./salesPipeline.utils";

type IndustryOption = {
	id: string;
	label: string;
	icon?: React.ElementType;
	iconColor?: string;
};

type CreateNewPipelineProps = {
	open: boolean;
	onClose: () => void;
	onSave?: (payload: { pipelineName: string; industry: string }) => void | boolean | Promise<void | boolean>;
	mode?: "create" | "edit";
	initialPipelineName?: string;
	initialIndustry?: string;
};

const INDUSTRY_OPTIONS: IndustryOption[] = [
	{
		id: "healthcare",
		label: "Healthcare",
		icon: HealthAndSafetyOutlinedIcon,
		iconColor: "#5C7ED8",
	},
	{
		id: "ivf",
		label: "IVF & Fertility",
		icon: SpaOutlinedIcon,
		iconColor: "#4CAF84",
	},
	{
		id: "pharma",
		label: "Pharma / Biotech",
		icon: VaccinesOutlinedIcon,
		iconColor: "#D1AA48",
	},
	{
		id: "diagnostics",
		label: "Diagnostics Lab",
		icon: ScienceOutlinedIcon,
		iconColor: "#E98080",
	},
	{
		id: "corporate",
		label: "Corporate Sales",
		icon: PercentOutlinedIcon,
		iconColor: "#BEAD36",
	},
	{
		id: "education",
		label: "Education / Training",
		icon: CastForEducationOutlinedIcon,
		iconColor: "#9B7ADA",
	},
	{
		id: "saas",
		label: "SaaS / Technology",
		icon: MemoryOutlinedIcon,
		iconColor: "#57B8C8",
	},
	{
		id: "manufacturing",
		label: "Manufacturing",
		icon: Inventory2OutlinedIcon,
		iconColor: "#BD9B64",
	},
	{
		id: "research",
		label: "Research",
		icon: BiotechOutlinedIcon,
		iconColor: "#72C8A4",
	},
	{
		id: "government",
		label: "Government",
		icon: AccountBalanceOutlinedIcon,
		iconColor: "#B3BF4D",
	},
	{
		id: "other",
		label: "Other",
	},
];

const tileBaseSx: SxProps<Theme> = {
	width: "100%",
	minHeight: 136,
	borderRadius: "12px",
	border: "1px solid #E6E6E6",
	padding: "18px 14px",
	boxSizing: "border-box",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	gap: "14px",
	textAlign: "center",
	cursor: "pointer",
	transition: "all 0.2s ease",
	backgroundColor: "#FFFFFF",
};

const Createnewpipeline = ({ open, onClose, onSave, mode = "create", initialPipelineName, initialIndustry }: CreateNewPipelineProps) => {
	const [pipelineName, setPipelineName] = useState(initialPipelineName ?? "");
	const [selectedIndustry, setSelectedIndustry] = useState<string>(initialIndustry ?? "education");
	const [showValidation, setShowValidation] = useState(false);

	useEffect(() => {
		if (!open) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setPipelineName(initialPipelineName ?? "");
		setSelectedIndustry(initialIndustry ?? "education");
		setShowValidation(false);
	}, [open, initialIndustry, initialPipelineName]);

	const isNameValid = useMemo(() => isAlphabeticName(pipelineName), [pipelineName]);
	const trimmedPipelineName = pipelineName.trim();
	const isSingleLetterPipelineName =
		trimmedPipelineName.length === 1 && /^[A-Za-z]$/.test(trimmedPipelineName);
	const hasInitialName = (initialPipelineName ?? "").trim().length > 0;
	const isNameChanged =
		mode !== "edit" ||
		!hasInitialName ||
		normalizeNameForCompare(pipelineName) !== normalizeNameForCompare(initialPipelineName ?? "");
	const isNameAcceptedForSave =
		(isNameValid && !isSingleLetterPipelineName) || (mode === "edit" && !isNameChanged);
	const showNameError =
		(showValidation && pipelineName.trim().length === 0) ||
		(pipelineName.trim().length > 0 && (!isNameValid || isSingleLetterPipelineName) && isNameChanged);

	const canSave = useMemo(
		() => pipelineName.trim().length > 0 && selectedIndustry.length > 0 && isNameAcceptedForSave,
		[pipelineName, selectedIndustry, isNameAcceptedForSave],
	);

	const handleSave = async () => {
		if (!canSave || !isNameAcceptedForSave) return;
		const saveResult = await onSave?.({ pipelineName: pipelineName.trim(), industry: selectedIndustry });
		if (saveResult === false) return;
		setPipelineName("");
		setSelectedIndustry("education");
		setShowValidation(false);
		onClose();
	};

	const handleClose = () => {
		setPipelineName("");
		setSelectedIndustry("education");
		setShowValidation(false);
		onClose();
	};

	return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: 660,
          height: "auto",
          maxWidth: "calc(100vw - 24px)",
          maxHeight: "calc(100vh - 24px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          borderBottom: "2px solid #E6E6E6",
        }}
      >
        <Typography
          sx={{
            fontFamily: "Montserrat",
            fontWeight: 700,
            fontSize: "32px",
            lineHeight: 1,
            color: "#232323",
          }}
        >
          {mode === "edit" ? "Edit Pipeline" : "New Pipeline"}
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1,
            border: "1px solid #C9DDFF",
            backgroundColor: "#FFFFFF",
            "&:hover": { backgroundColor: "#F7FAFF" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          flex: 1,
          p: 3,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <TextField
          autoFocus
          fullWidth
          label="Pipeline Name"
          placeholder="Enter pipeline name"
          value={pipelineName}
          onChange={(event) => {
            setPipelineName(event.target.value);
            if (showValidation) setShowValidation(false);
          }}
          error={showNameError}
          helperText={
            showNameError
              ? pipelineName.trim().length === 0
                ? "Pipeline name is required"
                : isSingleLetterPipelineName
                  ? "Pipeline name cannot be a single letter"
                  : "Only letters, numbers, hyphens, and special characters are allowed"
              : " "
          }
          variant="outlined"
          InputProps={{
            sx: {
              fontFamily: "Montserrat",
              fontWeight: 700,
              fontSize: "16px",
              lineHeight: "24px",
              borderRadius: 2.5,
            },
          }}
          sx={{
            "& .MuiInputLabel-root": {
              fontSize: "14px",
              color: "#8A8A8A",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#8A8A8A",
            },
            "& .MuiInputBase-input": {
              py: 1.6,
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#DFDFDF",
            },
            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#D3D3D3",
            },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
              {
                borderColor: "#DFDFDF",
                borderWidth: 1,
              },
          }}
        />

        <Typography
          sx={{
            fontSize: 30,
            lineHeight: 1,
            fontWeight: 500,
            color: "#919191",
          }}
        >
          Select Industry/Sector
        </Typography>

        <Box
          sx={{
            display: "grid",
            width: "100%",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            columnGap: "12px",
            rowGap: "12px",
            alignItems: "stretch",
            pb: 2,
            borderBottom: "1px solid #E6E6E6",
          }}
        >
          {INDUSTRY_OPTIONS.map((option) => {
            const isSelected = selectedIndustry === option.id;
            const Icon = option.icon;

            return (
              <Box
                key={option.id}
                sx={{
                  ...tileBaseSx,
                  borderColor: isSelected ? "#2293FF" : "#DDE4ED",
                  backgroundColor: "#FFFFFF",
                  boxShadow: isSelected
                    ? `0 0 0 1px ${alpha("#2293FF", 0.25)} inset`
                    : "none",
                  "&:hover": {
                    borderColor: isSelected ? "#2293FF" : "#C8D2DF",
                  },
                }}
                onClick={() => setSelectedIndustry(option.id)}
              >
                {Icon ? (
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 1.8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: alpha(
                        option.iconColor ?? "#B0B0B0",
                        0.12,
                      ),
                      color: option.iconColor ?? "#8C8C8C",
                      boxShadow: `0 4px 14px ${alpha(option.iconColor ?? "#B0B0B0", 0.24)}`,
                    }}
                  >
                    <Icon sx={{ fontSize: 22 }} />
                  </Box>
                ) : (
                  <Box sx={{ width: 46, height: 46 }} />
                )}

                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#4C4C4C",
                    lineHeight: 1.35,
                  }}
                >
                  {option.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleClose}
            sx={{
              py: 1.45,
              borderColor: "#6A6A6A",
              borderRadius: 2,
              color: "#565656",
              fontWeight: 700,
              fontSize: 16,
              "&:hover": {
                borderColor: "#5C5C5C",
                backgroundColor: alpha("#4B4B4B", 0.04),
              },
            }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setShowValidation(true);
              void handleSave();
            }}
            disabled={!canSave}
            sx={{
              py: 1.45,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: 16,
              backgroundColor: "#5A5A5A",
              "&:hover": { backgroundColor: "#4A4A4A" },
              "&.Mui-disabled": {
                backgroundColor: "#B9B9B9",
                color: "#FFFFFF",
              },
            }}
          >
            {mode === "edit" ? "Update" : "Save"}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};

export default Createnewpipeline;