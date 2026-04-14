import CloseIcon from "@mui/icons-material/Close";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
	Box,
	Button,
	Divider,
	IconButton,
	InputAdornment,
	MenuItem,
	Stack,
	Switch,
	TextField,
	Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

type StageConfigurationProps = {
	open: boolean;
	stageName: string;
	onStageNameChange?: (stageName: string) => void;
	onClose: () => void;
	onSave?: (stageName: string, stageConfig?: StageConfigPayload) => void | Promise<boolean | void>;
	initialValues?: Partial<StageConfigPayload>;
	mode?: "create" | "edit";
};

type DataCaptureField = {
	id: string;
	fieldName: string;
	fieldType: "text" | "number" | "date" | "dropdown";
	isMandatory: boolean;
};

export type StageAction = {
	id: string;
	label: string;
	checked: boolean;
};

export type StageConfigPayload = {
	stageType: string;
	stageStatus: string;
	colorCode: string;
	entryRule: string;
	actions: StageAction[];
	dataCaptureFields?: Array<{
		fieldName: string;
		fieldType: "text" | "number" | "date" | "dropdown";
		isMandatory: boolean;
	}>;
};

const DEFAULT_STAGE_ACTIONS: StageAction[] = [
	{ id: "manual-move", label: "Allow manual move via drag & drop", checked: true },
	{
		id: "auto-move",
		label: "Auto-move lead to next stage after actions are completed",
		checked: true,
	},
	{ id: "call", label: "Call", checked: true },
	{ id: "proposal-email", label: "Proposal - Email", checked: false },
	{ id: "whatsapp", label: "WhatsApp", checked: false },
	{ id: "sms", label: "SMS", checked: false },
	{ id: "appointment", label: "Appointment", checked: false },
];

const normalizeHexColorInput = (value: string): string => {
	const onlyHex = value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
	return `#${onlyHex}`;
};

const isValidHexColor = (value: string): boolean => /^#[0-9A-F]{6}$/.test(value.toUpperCase());

const StageConfiguration = ({
	open,
	stageName,
	onStageNameChange,
	onClose,
	onSave,
	initialValues,
	mode = "create",
}: StageConfigurationProps) => {
	const theme = useTheme();
	const [activeTab, setActiveTab] = useState<"stage-rules" | "data-capture">("stage-rules");
	const [stageType, setStageType] = useState("Lead");
	const [stageStatus, setStageStatus] = useState("Open");
	const [colorCode, setColorCode] = useState("#EEE788");
	const [entryRule, setEntryRule] = useState("Manual");
	const [isSaving, setIsSaving] = useState(false);
	const [showValidation, setShowValidation] = useState(false);
	const [stageActions, setStageActions] = useState<StageAction[]>(DEFAULT_STAGE_ACTIONS);
	const [showCustomActionForm, setShowCustomActionForm] = useState(false);
	const [customActionText, setCustomActionText] = useState("");
	const colorPickerRef = useRef<HTMLInputElement | null>(null);
	const [dataCaptureFields, setDataCaptureFields] = useState<DataCaptureField[]>([
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

	const handleToggleStageAction = (actionId: string) => {
		setStageActions((previous) =>
			previous.map((action) =>
				action.id === actionId ? { ...action, checked: !action.checked } : action,
			),
		);
	};

	const handleSaveCustomAction = () => {
		const trimmed = customActionText.trim();
		if (!trimmed) return;
		const newAction: StageAction = {
			id: `custom-${Date.now()}`,
			label: trimmed,
			checked: true,
		};
		setStageActions((previous) => [...previous, newAction]);
		setCustomActionText("");
		setShowCustomActionForm(false);
	};

	const handleColorPickerChange = (event: ChangeEvent<HTMLInputElement>) => {
		setColorCode(normalizeHexColorInput(event.target.value));
	};

	useEffect(() => {
		if (!open) return;
		setStageType(initialValues?.stageType ?? "Lead");
		setStageStatus(initialValues?.stageStatus ?? "Open");
		setColorCode(normalizeHexColorInput(initialValues?.colorCode ?? "#EEE788"));
		setEntryRule(initialValues?.entryRule ?? "Manual");
		setStageActions(
			initialValues?.actions && initialValues.actions.length > 0
				? initialValues.actions
				: DEFAULT_STAGE_ACTIONS,
		);
		setShowCustomActionForm(false);
		setCustomActionText("");
		if (initialValues?.dataCaptureFields !== undefined) {
			setDataCaptureFields(
				initialValues.dataCaptureFields.map((field, i) => ({
					id: `field-${Date.now()}-${i}`,
					fieldName: field.fieldName,
					fieldType: field.fieldType,
					isMandatory: field.isMandatory,
				})),
			);
		}
		setShowValidation(false);
	}, [open, initialValues, mode, stageName]);

	const handleSave = async () => {
		const trimmedStageName = stageName.trim();
		const trimmedStageType = stageType.trim();
		const trimmedStageStatus = stageStatus.trim();
		const trimmedColorCode = colorCode.trim();
		const trimmedEntryRule = entryRule.trim();

		const hasValidationError =
			!trimmedStageName ||
			!trimmedStageType ||
			!trimmedStageStatus ||
			!isValidHexColor(trimmedColorCode) ||
			!trimmedEntryRule;

		if (hasValidationError) {
			setShowValidation(true);
			return;
		}
		if (typeof onSave !== "function") return;
		try {
			setIsSaving(true);
			await onSave(trimmedStageName, {
				stageType: trimmedStageType,
				stageStatus: trimmedStageStatus,
				colorCode: trimmedColorCode.toUpperCase(),
				entryRule: trimmedEntryRule,
				actions: stageActions,
				dataCaptureFields: dataCaptureFields.map(({ fieldName, fieldType, isMandatory }) => ({
					fieldName,
					fieldType,
					isMandatory,
				})),
			});
		} finally {
			setIsSaving(false);
		}
	};

	if (!open) return null;

	return (
		<Box
			data-stage-config-keep-open="true"
			sx={{
				position: "absolute",
				top: 8,
				right: 8,
				bottom: 8,
				width: 352,
				borderRadius: 3,
				border: `1px solid ${theme.palette.grey[200]}`,
				backgroundColor: "#FBFBFC",
				display: "flex",
				flexDirection: "column",
				zIndex: 4,
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					px: 2,
					py: 1.7,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.2 }}>
					Stage Configuration
				</Typography>
				<IconButton
					size="small"
					onClick={onClose}
					sx={{
						backgroundColor: "#F2F2F2",
						width: 30,
						height: 30,
						"&:hover": { backgroundColor: "#EAEAEA" },
					}}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</Box>

			<Box sx={{ px: 2, pb: 1.5 }}>
				<Stack direction="row" spacing={1}>
					<Box
						onClick={() => setActiveTab("stage-rules")}
						sx={{
							flex: 1,
							py: 0.85,
							borderRadius: 2,
							textAlign: "center",
							fontSize: 14,
							fontWeight: activeTab === "stage-rules" ? 600 : 500,
							color:
								activeTab === "stage-rules"
									? "#EA7C5A"
									: "text.primary",
							border:
								activeTab === "stage-rules"
									? "1px solid #ECECEC"
									: "1px solid transparent",
							backgroundColor: "#FFFFFF",
							boxShadow:
								activeTab === "stage-rules"
									? "0 2px 10px rgba(15, 23, 42, 0.08)"
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
							py: 0.85,
							borderRadius: 2,
							textAlign: "center",
							fontSize: 14,
							fontWeight: activeTab === "data-capture" ? 600 : 500,
							color:
								activeTab === "data-capture"
									? "#EA7C5A"
									: "text.primary",
							border:
								activeTab === "data-capture"
									? "1px solid #ECECEC"
									: "1px solid transparent",
							backgroundColor: "#FFFFFF",
							boxShadow:
								activeTab === "data-capture"
									? "0 2px 10px rgba(15, 23, 42, 0.08)"
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
								backgroundColor: "#FAFAFB",
								p: 1.5,
								mb: 1.4,
							}}
						>
							<Stack spacing={1.05}>
								<TextField
									size="small"
									label="Stage Name"
									value={stageName}
									onChange={(event) => onStageNameChange?.(event.target.value)}
									error={showValidation && !stageName.trim()}
									helperText={
										showValidation && !stageName.trim() ? "Stage name is required" : " "
									}
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: 1.4,
											backgroundColor: "#FFFFFF",
										},
										"& .MuiFormHelperText-root": { minHeight: 18, m: 0, pt: 0.35 },
									}}
								/>
								<TextField
									size="small"
									label="Stage Type"
																		select
									value={stageType}
									onChange={(event) => setStageType(event.target.value)}
									SelectProps={{
										MenuProps: {
											disablePortal: true,
											PaperProps: { "data-stage-config-keep-open": "true" },
										},
									}}
									error={showValidation && !stageType.trim()}
									helperText={
										showValidation && !stageType.trim() ? "Stage type is required" : " "
									}
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: 1.4,
											backgroundColor: "#FFFFFF",
										},
										"& .MuiFormHelperText-root": { minHeight: 18, m: 0, pt: 0.35 },
									}}
								>
									<MenuItem value="Lead">Lead</MenuItem>
									<MenuItem value="Engagement">Engagement</MenuItem>
									<MenuItem value="Conversion">Conversion</MenuItem>
									<MenuItem value="Closure">Closure</MenuItem>
								</TextField>
								<TextField
									size="small"
									label="Stage Status"
																		select
									value={stageStatus}
									onChange={(event) => setStageStatus(event.target.value)}
									SelectProps={{
										MenuProps: {
											disablePortal: true,
											PaperProps: { "data-stage-config-keep-open": "true" },
										},
									}}
									error={showValidation && !stageStatus.trim()}
									helperText={
										showValidation && !stageStatus.trim() ? "Stage status is required" : " "
									}
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: 1.4,
											backgroundColor: "#FFFFFF",
										},
										"& .MuiFormHelperText-root": { minHeight: 18, m: 0, pt: 0.35 },
									}}
								>
									<MenuItem value="Open">Open</MenuItem>
									<MenuItem value="Won">Won</MenuItem>
									<MenuItem value="Lost">Lost</MenuItem>
								</TextField>

								<TextField
									size="small"
									label="Color Code"
									value={colorCode}
									onChange={(event) =>
										setColorCode(normalizeHexColorInput(event.target.value))
									}
									error={showValidation && !isValidHexColor(colorCode)}
									helperText={
										showValidation && !isValidHexColor(colorCode)
											? "Use valid hex color (example: #EEE788)"
											: " "
									}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<>
													<input
														type="color"
														ref={colorPickerRef}
														value={isValidHexColor(colorCode) ? colorCode : "#EEE788"}
														onChange={handleColorPickerChange}
														style={{
															position: "absolute",
															opacity: 0,
															pointerEvents: "none",
															width: 0,
															height: 0,
														}}
													/>
													<Box
														onClick={() => colorPickerRef.current?.click()}
														sx={{
															width: 28,
															height: 28,
															borderRadius: 1,
															border: "1px solid #DDE3DD",
															backgroundColor: isValidHexColor(colorCode)
																? colorCode
																: "#EEE788",
															cursor: "pointer",
														}}
													/>
												</>
											</InputAdornment>
										),
									}}
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: 1.4,
											backgroundColor: "#FFFFFF",
										},
										"& .MuiFormHelperText-root": { minHeight: 18, m: 0, pt: 0.35 },
									}}
								/>

								<TextField
									size="small"
									label="Entry Rule"
																		select
									value={entryRule}
									onChange={(event) => setEntryRule(event.target.value)}
									SelectProps={{
										MenuProps: {
											disablePortal: true,
											PaperProps: { "data-stage-config-keep-open": "true" },
										},
									}}
									error={showValidation && !entryRule.trim()}
									helperText={
										showValidation && !entryRule.trim() ? "Entry rule is required" : " "
									}
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: 1.4,
											backgroundColor: "#FFFFFF",
										},
										"& .MuiFormHelperText-root": { minHeight: 18, m: 0, pt: 0.35 },
									}}
								>
									<MenuItem value="Manual">Manual</MenuItem>
									<MenuItem value="Auto">Auto</MenuItem>
								</TextField>
							</Stack>
						</Box>

						<Box
							sx={{
								border: `1px solid ${theme.palette.grey[200]}`,
								borderRadius: 2,
								backgroundColor: "#FAFAFB",
								overflow: "hidden",
							}}
						>
							<Typography
								sx={{
									fontSize: 14,
									fontWeight: 700,
									px: 1.4,
									pt: 1.2,
									pb: 1,
									borderBottom: `1px solid ${theme.palette.grey[200]}`,
								}}
							>
								ACTIONS
							</Typography>
							<Typography sx={{ fontSize: 12, color: "#E9A67A", px: 1.4, pt: 1.2, mb: 1.2 }}>
								*Define actions that must be completed before a lead moves to the
								next stage.
							</Typography>

							<Stack spacing={1.05} sx={{ px: 1.4, pb: 1.3 }}>
								{stageActions.map((item) => (
									<Box
										key={item.id}
										onClick={() => handleToggleStageAction(item.id)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												handleToggleStageAction(item.id);
											}
										}}
										role="checkbox"
										aria-checked={item.checked}
										tabIndex={0}
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.9,
											cursor: "pointer",
										}}
									>
										<Box
											sx={{
												width: 18,
												height: 18,
												borderRadius: 0.8,
												border: `1px solid ${item.checked ? "#B8DCBE" : "#CFCFCF"}`,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												backgroundColor: item.checked ? "#D8F0DC" : "#FFFFFF",
												color: "#4D9E5E",
											}}
										>
											{item.checked ? <CheckRoundedIcon sx={{ fontSize: 13 }} /> : null}
										</Box>
										<Typography
											sx={{
												fontSize: 13,
												lineHeight: 1.35,
												fontWeight: 400,
												color: item.checked ? "#252525" : "#A4A4A4",
											}}
										>
											{item.label}
										</Typography>
									</Box>
								))}

								{showCustomActionForm ? (
									<Box sx={{ pt: 0.8 }}>
										<TextField
											size="small"
											placeholder="Enter action name"
											value={customActionText}
											autoFocus
											onChange={(event) => setCustomActionText(event.target.value)}
											onKeyDown={(event) => {
												if (event.key === "Enter") handleSaveCustomAction();
												if (event.key === "Escape") {
													setShowCustomActionForm(false);
													setCustomActionText("");
												}
											}}
											fullWidth
											sx={{
												mb: 0.8,
												"& .MuiOutlinedInput-root": {
													borderRadius: 1.4,
													backgroundColor: "#FFFFFF",
												},
											}}
										/>
										<Stack direction="row" spacing={0.8}>
											<Button
												size="small"
												variant="contained"
												onClick={handleSaveCustomAction}
												disabled={!customActionText.trim()}
												sx={{
													backgroundColor: "#545454",
													fontSize: 12,
													px: 1.4,
													"&:hover": { backgroundColor: "#3F3F3F" },
												}}
											>
												Add
											</Button>
											<Button
												size="small"
												variant="outlined"
												onClick={() => {
													setShowCustomActionForm(false);
													setCustomActionText("");
												}}
												sx={{ fontSize: 12, px: 1.4 }}
											>
												Cancel
											</Button>
										</Stack>
									</Box>
								) : (
									<Box
										onClick={() => setShowCustomActionForm(true)}
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.7,
											color: "#4584FF",
											cursor: "pointer",
											pt: 0.8,
										}}
									>
										<AddBoxOutlinedIcon sx={{ fontSize: 18 }} />
										<Typography sx={{ fontSize: 13, fontWeight: 500 }}>Add Custom Action</Typography>
									</Box>
								)}
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
										SelectProps={{
											MenuProps: {
												disablePortal: true,
												PaperProps: { "data-stage-config-keep-open": "true" },
											},
										}}
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
										<Switch
											size="small"
											checked={field.isMandatory}
											onChange={() => handleToggleMandatory(field.id)}
											color="success"
											sx={{ m: 0 }}
										/>
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