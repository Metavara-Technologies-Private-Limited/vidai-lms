import CloseIcon from "@mui/icons-material/Close";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useState } from "react";
import {
	Box,
	Button,
	Divider,
	IconButton,
	InputAdornment,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type StageConfigurationProps = {
	open: boolean;
	stageName: string;
	onStageNameChange?: (stageName: string) => void;
	onClose: () => void;
	onSave?: (stageName: string) => void | Promise<boolean | void>;
	mode?: "create" | "edit";
};

type DataCaptureField = {
	id: string;
	fieldName: string;
	fieldType: "text" | "number" | "date" | "dropdown";
	isMandatory: boolean;
};

const StageConfiguration = ({
	open,
	stageName,
	onStageNameChange,
	onClose,
	onSave,
	mode = "create",
}: StageConfigurationProps) => {
	const theme = useTheme();
	const [activeTab, setActiveTab] = useState<"stage-rules" | "data-capture">("stage-rules");
	const [stageType, setStageType] = useState("Lead");
	const [stageStatus, setStageStatus] = useState("Open");
	const [colorCode, setColorCode] = useState("#EBFAEF");
	const [entryRule, setEntryRule] = useState("Manual");
	const [isSaving, setIsSaving] = useState(false);
	const [dataCaptureFields, setDataCaptureFields] = useState<DataCaptureField[]>([
		{
			id: "field-1",
			fieldName: "Appointment date",
			fieldType: "date",
			isMandatory: true,
		},
		{
			id: "field-2",
			fieldName: "No. of samples",
			fieldType: "number",
			isMandatory: true,
		},
	]);

	const createEmptyField = (): DataCaptureField => ({
		id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		fieldName: "",
		fieldType: "text",
		isMandatory: false,
	});

	const handleAddAnotherField = () => {
		setDataCaptureFields((previous) => [...previous, createEmptyField()]);
	};

	const handleCopyField = (fieldId: string) => {
		setDataCaptureFields((previous) => {
			const fieldIndex = previous.findIndex((field) => field.id === fieldId);
			if (fieldIndex === -1) return previous;

			const fieldToCopy = previous[fieldIndex];
			const copiedField: DataCaptureField = {
				...fieldToCopy,
				id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			};

			const next = [...previous];
			next.splice(fieldIndex + 1, 0, copiedField);
			return next;
		});
	};

	const handleDeleteField = (fieldId: string) => {
		setDataCaptureFields((previous) => previous.filter((field) => field.id !== fieldId));
	};

	const handleUpdateField = (
		fieldId: string,
		key: "fieldName" | "fieldType",
		value: string,
	) => {
		setDataCaptureFields((previous) =>
			previous.map((field) =>
				field.id === fieldId
					? {
							...field,
							[key]: key === "fieldType" ? (value as DataCaptureField["fieldType"]) : value,
						}
					: field,
			),
		);
	};

	const handleToggleMandatory = (fieldId: string) => {
		setDataCaptureFields((previous) =>
			previous.map((field) =>
				field.id === fieldId ? { ...field, isMandatory: !field.isMandatory } : field,
			),
		);
	};

	const handleSave = async () => {
		const trimmedStageName = stageName.trim();
		if (!trimmedStageName) return;
		if (typeof onSave !== "function") return;
		try {
			setIsSaving(true);
			await onSave(trimmedStageName);
		} finally {
			setIsSaving(false);
		}
	};

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
						onClick={() => setActiveTab("stage-rules")}
						sx={{
							flex: 1,
							py: 0.6,
							borderRadius: 2,
							textAlign: "center",
							fontSize: 14,
							fontWeight: activeTab === "stage-rules" ? 700 : 500,
							color:
								activeTab === "stage-rules"
									? theme.palette.primary.main
									: "text.primary",
							border:
								activeTab === "stage-rules"
									? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
									: "1px solid transparent",
							backgroundColor: alpha(theme.palette.background.paper, 0.96),
							boxShadow:
								activeTab === "stage-rules"
									? "0 4px 12px rgba(15, 23, 42, 0.08)"
									: "none",
							cursor: "pointer",
						}}
					>
						Stage Rules
					</Box>
					<Box
						onClick={() => setActiveTab("data-capture")}
						sx={{
							flex: 1,
							py: 0.6,
							borderRadius: 2,
							textAlign: "center",
							fontSize: 14,
							fontWeight: activeTab === "data-capture" ? 700 : 500,
							color:
								activeTab === "data-capture"
									? theme.palette.primary.main
									: "text.primary",
							border:
								activeTab === "data-capture"
									? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
									: "1px solid transparent",
							backgroundColor: alpha(theme.palette.background.paper, 0.96),
							boxShadow:
								activeTab === "data-capture"
									? "0 4px 12px rgba(15, 23, 42, 0.08)"
									: "none",
							cursor: "pointer",
						}}
					>
						Data Capture
					</Box>
				</Stack>
			</Box>

			<Box sx={{ px: 2, pb: 1.2, overflowY: "auto" }}>
				{activeTab === "stage-rules" ? (
					<>
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
									onChange={(event) => onStageNameChange?.(event.target.value)}
								/>
								<TextField
									size="small"
									label="Stage Type"
									value={stageType}
									onChange={(event) => setStageType(event.target.value)}
									InputProps={{
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
									value={stageStatus}
									onChange={(event) => setStageStatus(event.target.value)}
									InputProps={{
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
									value={colorCode}
									onChange={(event) => setColorCode(event.target.value)}
									InputProps={{
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
									value={entryRule}
									onChange={(event) => setEntryRule(event.target.value)}
									InputProps={{
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
							<Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.2 }}>
								ACTIONS
							</Typography>
							<Typography sx={{ fontSize: 12, color: "#E9A67A", mb: 1.2 }}>
								*Define actions that must be completed before a lead moves to the
								next stage.
							</Typography>

							<Stack spacing={1}>
								{[
									"Allow manual move via drag & drop",
									"Auto-move lead to next stage after actions are completed",
									"Call",
									"Send Follow-Up",
								].map((item) => (
									<Box
										key={item}
										sx={{ display: "flex", alignItems: "center", gap: 0.9 }}
									>
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
										<Typography sx={{ fontSize: 13, color: "text.primary" }}>
											{item}
										</Typography>
									</Box>
								))}
							</Stack>
						</Box>
					</>
				) : (
					<>
						<Typography sx={{ fontSize: 12, color: "#E9A67A", mb: 1.2 }}>
							*Choose what information must be filled before moving to the next stage.
						</Typography>

						{dataCaptureFields.map((field, index) => (
							<Box
								key={field.id}
								sx={{
									border: `1px solid ${theme.palette.grey[200]}`,
									borderRadius: 2,
									mb: 1.4,
									overflow: "hidden",
								}}
							>
								<Box
									sx={{
										px: 1.4,
										py: 1.1,
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										borderBottom: `1px solid ${theme.palette.grey[200]}`,
									}}
								>
									<Typography sx={{ fontSize: 13, fontWeight: 700 }}>
										{`FIELD ${index + 1}`}
									</Typography>
									<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
										<ContentCopyOutlinedIcon
											onClick={() => handleCopyField(field.id)}
											sx={{
												fontSize: 19,
												color: theme.palette.primary.main,
												cursor: "pointer",
											}}
										/>
										<DeleteOutlineOutlinedIcon
											onClick={() => handleDeleteField(field.id)}
											sx={{
												fontSize: 19,
												color: theme.palette.error.main,
												cursor: "pointer",
											}}
										/>
									</Box>
								</Box>

								<Box sx={{ p: 1.4 }}>
									<TextField
										size="small"
										label="Field Name"
										value={field.fieldName}
										onChange={(event) =>
											handleUpdateField(field.id, "fieldName", event.target.value)
										}
										fullWidth
										sx={{ mb: 1.2 }}
									/>
									<TextField
										size="small"
										label="Field Type"
										value={field.fieldType}
										onChange={(event) =>
											handleUpdateField(field.id, "fieldType", event.target.value)
										}
										select
										fullWidth
										InputProps={{
											endAdornment: (
												<InputAdornment position="end">
													<KeyboardArrowDownRoundedIcon />
												</InputAdornment>
											),
										}}
										sx={{ mb: 1.1 }}
									>
										<MenuItem value="text">Text</MenuItem>
										<MenuItem value="number">Number</MenuItem>
										<MenuItem value="date">Date</MenuItem>
										<MenuItem value="dropdown">Dropdown</MenuItem>
									</TextField>

									<Box
										onClick={() => handleToggleMandatory(field.id)}
										sx={{ display: "flex", alignItems: "center", gap: 0.9, cursor: "pointer" }}
									>
										<Box
											sx={{
												width: 18,
												height: 18,
												borderRadius: 1,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												backgroundColor: field.isMandatory
													? "#C2E7C8"
													: alpha(theme.palette.grey[400], 0.18),
												color: field.isMandatory ? "#1E7A3B" : theme.palette.grey[500],
											}}
										>
											{field.isMandatory && <CheckRoundedIcon sx={{ fontSize: 12 }} />}
										</Box>
										<Typography sx={{ fontSize: 13, color: "text.primary" }}>
											Mandatory
										</Typography>
									</Box>
								</Box>
							</Box>
						))}

						<Box
							onClick={handleAddAnotherField}
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "flex-end",
								gap: 0.7,
								color: theme.palette.primary.main,
								fontWeight: 500,
								fontSize: 14,
								cursor: "pointer",
							}}
						>
							<AddBoxOutlinedIcon sx={{ fontSize: 17 }} />
							Add Another Field
						</Box>
					</>
				)}
			</Box>

			<Divider />
			<Box sx={{ p: 1.5 }}>
				<Button
					fullWidth
					variant="contained"
					onClick={handleSave}
					disabled={isSaving}
					sx={{
						backgroundColor: "#545454",
						fontWeight: 700,
						fontSize: 14,
						py: 1,
						"&:hover": { backgroundColor: "#3F3F3F" },
					}}
				>
					{mode === "edit" ? "Update" : "Save"}
				</Button>
			</Box>
		</Box>
	);
};

export default StageConfiguration;