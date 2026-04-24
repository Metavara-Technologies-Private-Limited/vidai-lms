import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { Box, Button, Dialog, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type ConfirmActionType = "archive" | "delete";

type SalesPipelineActionConfirmDialogProps = {
	open: boolean;
	action: ConfirmActionType | null;
	entityLabel: "Pipeline" | "Stage";
	actionInProgress: boolean;
	onClose: () => void;
	onConfirm: () => void;
};

const SalesPipelineActionConfirmDialog = ({
	open,
	action,
	entityLabel,
	actionInProgress,
	onClose,
	onConfirm,
}: SalesPipelineActionConfirmDialogProps) => {
	const theme = useTheme();

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 4,
					maxWidth: 548,
					overflow: "hidden",
				},
			}}
		>
			<Box sx={{ px: 2.8, pt: 2.8, pb: 2.4, textAlign: "center" }}>
				<Box
					sx={{
						mx: "auto",
						mb: 2.25,
						width: 88,
						height: 88,
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor:
							action === "delete"
								? alpha("#CF3D3D", 0.08)
								: alpha(theme.palette.warning.main, 0.12),
					}}
				>
					{action === "delete" ? (
						<DeleteOutlineOutlinedIcon sx={{ fontSize: 36, color: "#CF3D3D" }} />
					) : (
						<ArchiveOutlinedIcon
							sx={{ fontSize: 36, color: theme.palette.warning.dark }}
						/>
					)}
				</Box>

				<Typography
					sx={{
						fontWeight: 700,
						fontSize: 25,
						lineHeight: 1.1,
						textAlign: "center",
						mb: 1.5,
					}}
				>
					{action === "delete" ? `Delete ${entityLabel}` : `Archive ${entityLabel}`}
				</Typography>
				<Typography
					sx={{
						fontWeight: 500,
						fontSize: 16,
						lineHeight: 1.45,
						color: "#393939",
						maxWidth: 420,
						mx: "auto",
						mb: 3,
					}}
				>
					{action === "delete"
						? `This ${entityLabel.toLowerCase()} and its configuration will be permanently removed.`
						: `This ${entityLabel.toLowerCase()} will be hidden but existing data will be preserved.`}
				</Typography>

				<Stack direction="row" spacing={1.8}>
					<Button
						fullWidth
						variant="outlined"
						onClick={onClose}
						disabled={actionInProgress}
						sx={{
							borderRadius: 2.2,
							py: 1.45,
							fontWeight: 700,
							fontSize: 16,
							borderColor: "#E0E0E0",
							color: "#2D2D2D",
							backgroundColor: "#F4F4F4",
							"&:hover": {
								backgroundColor: "#EBEBEB",
								borderColor: "#D8D8D8",
							},
						}}
					>
						Cancel
					</Button>
					<Button
						fullWidth
						variant="contained"
						onClick={onConfirm}
						disabled={actionInProgress}
						sx={{
							borderRadius: 2.2,
							py: 1.45,
							fontWeight: 700,
							fontSize: 16,
							backgroundColor: "#5A5A5A",
							"&:hover": { backgroundColor: "#4A4A4A" },
						}}
					>
						{action === "delete" ? "Delete" : "Archive"}
					</Button>
				</Stack>
			</Box>
		</Dialog>
	);
};

export default SalesPipelineActionConfirmDialog;
