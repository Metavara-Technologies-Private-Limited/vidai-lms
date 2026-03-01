import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import {
	Box,
	Button,
	Divider,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type StageConfigurationProps = {
	open: boolean;
	stageName: string;
	onClose: () => void;
};

const StageConfiguration = ({ open, stageName, onClose }: StageConfigurationProps) => {
	const theme = useTheme();

	if (!open) return null;

	return (
		<Box
			sx={{
				position: "absolute",
				top: 8,
				right: 8,
				bottom: 8,
				width: 352,
				borderRadius: 2,
				border: `1px solid ${theme.palette.grey[200]}`,
				backgroundColor: alpha(theme.palette.background.paper, 0.97),
				display: "flex",
				flexDirection: "column",
				zIndex: 4,
			}}
		>
			<Box
				sx={{
					px: 2,
					py: 1.4,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Typography sx={{ fontSize: 26, fontWeight: 700 }}>Stage Configuration</Typography>
				<IconButton
					size="small"
					onClick={onClose}
					sx={{ backgroundColor: alpha(theme.palette.grey[300], 0.3) }}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</Box>

			<Box sx={{ px: 2, pb: 1.4 }}>
				<Stack direction="row" spacing={1}>
					<Box
						sx={{
							flex: 1,
							py: 0.6,
							borderRadius: 2,
							textAlign: "center",
							fontSize: 14,
							fontWeight: 700,
							color: theme.palette.primary.main,
							border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							backgroundColor: alpha(theme.palette.background.paper, 0.96),
							boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
						}}
					>
						Stage Rules
					</Box>
					<Box
						sx={{
							flex: 1,
							py: 0.6,
							borderRadius: 2,
							textAlign: "center",
							fontSize: 14,
							fontWeight: 500,
							color: "text.primary",
						}}
					>
						Data Capture
					</Box>
				</Stack>
			</Box>

			<Box sx={{ px: 2, pb: 1.2, overflowY: "auto" }}>
				<Box
					sx={{
						border: `1px solid ${theme.palette.grey[200]}`,
						borderRadius: 2,
						p: 1.4,
						mb: 1.4,
					}}
				>
					<Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.2 }}>
						BASIC SETTINGS
					</Typography>

					<Stack spacing={1.1}>
						<TextField
							size="small"
							label="Stage Name"
							value={stageName}
							InputProps={{ readOnly: true }}
						/>
						<TextField
							size="small"
							label="Stage Type"
							value="Closure"
							InputProps={{
								readOnly: true,
								endAdornment: (
									<InputAdornment position="end">
										<KeyboardArrowDownRoundedIcon />
									</InputAdornment>
								),
							}}
						/>
						<TextField
							size="small"
							label="Stage Status"
							value="Open"
							InputProps={{
								readOnly: true,
								endAdornment: (
									<InputAdornment position="end">
										<KeyboardArrowDownRoundedIcon />
									</InputAdornment>
								),
							}}
						/>

						<TextField
							size="small"
							label="Color Code"
							value="#EBFAEF"
							InputProps={{
								readOnly: true,
								endAdornment: (
									<InputAdornment position="end">
										<Box
											sx={{
												width: 22,
												height: 22,
												borderRadius: 1,
												border: `1px solid ${theme.palette.grey[300]}`,
												backgroundColor: "#B6E9C6",
											}}
										/>
									</InputAdornment>
								),
							}}
						/>

						<TextField
							size="small"
							label="Entry Rule"
							value="Manual"
							InputProps={{
								readOnly: true,
								endAdornment: (
									<InputAdornment position="end">
										<KeyboardArrowDownRoundedIcon />
									</InputAdornment>
								),
							}}
						/>
					</Stack>
				</Box>

				<Box
					sx={{
						border: `1px solid ${theme.palette.grey[200]}`,
						borderRadius: 2,
						p: 1.4,
					}}
				>
					<Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.2 }}>ACTIONS</Typography>
					<Typography sx={{ fontSize: 12, color: "#E9A67A", mb: 1.2 }}>
						*Define actions that must be completed before a lead moves to the next
						stage.
					</Typography>

					<Stack spacing={1}>
						{[
							"Allow manual move via drag & drop",
							"Auto-move lead to next stage after actions are completed",
							"Call",
							"Send Follow-Up",
						].map((item) => (
							<Box key={item} sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
								<Box
									sx={{
										width: 16,
										height: 16,
										borderRadius: 0.8,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										backgroundColor: "#C2E7C8",
										color: "#1E7A3B",
									}}
								>
									<CheckRoundedIcon sx={{ fontSize: 12 }} />
								</Box>
								<Typography sx={{ fontSize: 13, color: "text.primary" }}>{item}</Typography>
							</Box>
						))}
					</Stack>
				</Box>
			</Box>

			<Divider />
			<Box sx={{ p: 1.5 }}>
				<Button
					fullWidth
					variant="contained"
					sx={{
						backgroundColor: "#545454",
						fontWeight: 700,
						fontSize: 14,
						py: 1,
						"&:hover": { backgroundColor: "#3F3F3F" },
					}}
				>
					Update
				</Button>
			</Box>
		</Box>
	);
};

export default StageConfiguration;