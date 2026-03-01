import { useMemo, useState } from "react";
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
	Divider,
	IconButton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

type IndustryOption = {
	id: string;
	label: string;
	icon?: React.ElementType;
	iconColor?: string;
};

type CreateNewPipelineProps = {
	open: boolean;
	onClose: () => void;
	onSave?: (payload: { pipelineName: string; industry: string }) => void;
};

const INDUSTRY_OPTIONS: IndustryOption[] = [
	{
		id: "healthcare",
		label: "Healthcare",
		icon: HealthAndSafetyOutlinedIcon,
		iconColor: "#5C7ED8",
	},
	{
		id: "ivf-fertility",
		label: "IVF & Fertility",
		icon: SpaOutlinedIcon,
		iconColor: "#4CAF84",
	},
	{
		id: "pharma-biotech",
		label: "Pharma / Biotech",
		icon: VaccinesOutlinedIcon,
		iconColor: "#D1AA48",
	},
	{
		id: "diagnostics-lab",
		label: "Diagnostics Lab",
		icon: ScienceOutlinedIcon,
		iconColor: "#E98080",
	},
	{
		id: "corporate-sales",
		label: "Corporate Sales",
		icon: PercentOutlinedIcon,
		iconColor: "#BEAD36",
	},
	{
		id: "education-training",
		label: "Education / Training",
		icon: CastForEducationOutlinedIcon,
		iconColor: "#9B7ADA",
	},
	{
		id: "saas-technology",
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
	borderRadius: 2,
	border: "1px solid #E6E6E6",
	minHeight: 134,
	px: 2,
	py: 1.75,
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	gap: 1.5,
	textAlign: "center",
	cursor: "pointer",
	transition: "all 0.2s ease",
	backgroundColor: "#FFFFFF",
};

const Createnewpipeline = ({ open, onClose, onSave }: CreateNewPipelineProps) => {
	const [pipelineName, setPipelineName] = useState("Student Enrollment Pipeline");
	const [selectedIndustry, setSelectedIndustry] =
		useState<string>("education-training");

	const canSave = useMemo(
		() => pipelineName.trim().length > 0 && selectedIndustry.length > 0,
		[pipelineName, selectedIndustry],
	);

	const handleSave = () => {
		if (!canSave) return;
		onSave?.({ pipelineName: pipelineName.trim(), industry: selectedIndustry });
		setPipelineName("Student Enrollment Pipeline");
		setSelectedIndustry("education-training");
		onClose();
	};

	const handleClose = () => {
		setPipelineName("Student Enrollment Pipeline");
		setSelectedIndustry("education-training");
		onClose();
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 3,
					maxWidth: 760,
					mx: 2,
				},
			}}
		>
			<Box sx={{ px: 3, py: 2.25, display: "flex", justifyContent: "space-between" }}>
				<Typography variant="h5" sx={{ fontWeight: 700, fontSize: 34 }}>
					New Pipeline
				</Typography>
				<IconButton
					onClick={handleClose}
					sx={{
						width: 34,
						height: 34,
						backgroundColor: "#E9E9E9",
						"&:hover": { backgroundColor: "#DCDCDC" },
					}}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</Box>

			<Divider />

			<Box sx={{ px: 3, pt: 2.75, pb: 2.5 }}>
				<TextField
					fullWidth
					value={pipelineName}
					onChange={(event) => setPipelineName(event.target.value)}
					label="Pipeline Name"
					variant="outlined"
					InputProps={{
						sx: {
							fontSize: 31,
							fontWeight: 500,
							borderRadius: 2,
						},
					}}
					sx={{
						"& .MuiInputLabel-root": {
							fontSize: 28,
							fontWeight: 500,
							color: "#8E8E8E",
						},
						"& .MuiInputBase-input": {
							py: 1.85,
						},
						"& .MuiOutlinedInput-notchedOutline": {
							borderColor: "#DFDFDF",
						},
					}}
				/>

				<Typography sx={{ mt: 2.2, mb: 1.4, fontSize: 30, color: "#6E6E6E" }}>
					Select Industry/Sector
				</Typography>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
						gap: 1.5,
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
									borderColor: isSelected ? alpha("#D86650", 0.5) : "#E6E6E6",
									backgroundColor: isSelected
										? alpha("#D86650", 0.03)
										: "#FFFFFF",
								}}
								onClick={() => setSelectedIndustry(option.id)}
							>
								{Icon ? (
									<Box
										sx={{
											width: 46,
											height: 46,
											borderRadius: 1.5,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											backgroundColor: alpha(option.iconColor ?? "#B0B0B0", 0.12),
											color: option.iconColor ?? "#8C8C8C",
											boxShadow: `0 0 18px ${alpha(option.iconColor ?? "#B0B0B0", 0.2)}`,
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
										color: "#4A4A4A",
										lineHeight: 1.35,
									}}
								>
									{option.label}
								</Typography>
							</Box>
						);
					})}
				</Box>

				<Stack direction="row" spacing={2} sx={{ mt: 2.8 }}>
					<Button
						fullWidth
						variant="outlined"
						onClick={handleClose}
						sx={{
							py: 1.15,
							borderColor: "#4B4B4B",
							borderRadius: 1.5,
							color: "#4B4B4B",
							fontWeight: 700,
							fontSize: 17,
							"&:hover": {
								borderColor: "#3D3D3D",
								backgroundColor: alpha("#4B4B4B", 0.04),
							},
						}}
					>
						Cancel
					</Button>

					<Button
						fullWidth
						variant="contained"
						onClick={handleSave}
						disabled={!canSave}
						sx={{
							py: 1.15,
							borderRadius: 1.5,
							fontWeight: 700,
							fontSize: 17,
							backgroundColor: "#545454",
							"&:hover": { backgroundColor: "#3F3F3F" },
							"&.Mui-disabled": {
								backgroundColor: "#B9B9B9",
								color: "#FFFFFF",
							},
						}}
					>
						Save
					</Button>
				</Stack>
			</Box>
		</Dialog>
	);
};

export default Createnewpipeline;