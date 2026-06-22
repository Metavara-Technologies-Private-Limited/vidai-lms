import CloseIcon from "@mui/icons-material/Close";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
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
import { toast } from "react-toastify";
import {
	FALLBACK_LEAD_FORM_FIELDS,
	LeadFormFieldAPI,
	type LeadFormField,
} from "../../services/leads.api";

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
	mode: "existing" | "custom";
	fieldKey: string;
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
		fieldKey?: string;
		fieldName: string;
		fieldType: "text" | "number" | "date" | "dropdown";
		isMandatory: boolean;
	}>;
};

const DEFAULT_STAGE_ACTIONS: StageAction[] = [
  {
    id: "manual-move",
    label: "Allow manual move via drag & drop",
    checked: true,
  },
  {
    id: "auto-move",
    label: "Auto-move lead to next stage after actions are completed",
    checked: true,
  },
  { id: "call", label: "Call", checked: true },
  { id: "proposal-email", label: "Proposal - Email", checked: true },
  { id: "whatsapp", label: "WhatsApp", checked: true },
  { id: "sms", label: "SMS", checked: true },
  { id: "appointment", label: "Appointment", checked: false },
];

const normalizeHexColorInput = (value: string): string => {
	const onlyHex = value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
	return `#${onlyHex}`;
};

const isValidHexColor = (value: string): boolean => /^#[0-9A-F]{6}$/.test(value.toUpperCase());
const NAME_PATTERN = /^[A-Za-z0-9 \-&.()/]+$/;
const MAX_NAME_LENGTH = 50;
const isAlphabeticName = (value?: string): boolean => {
	if (!value) return false;
	const normalized = value.trim().replace(/\s+/g, " ");
	return normalized.length > 0 && NAME_PATTERN.test(normalized);
};

const sanitizeAlphabeticName = (value: string): string =>
  value.replace(/[^A-Za-z0-9 \-&.()/]/g, "").slice(0, MAX_NAME_LENGTH);

const INPUT_TOAST_OPTIONS = {
	position: "top-right" as const,
	autoClose: 1400,
};

const showInputToast = (toastId: string, message: string) => {
	if (!toast.isActive(toastId)) {
		toast.error(message, { ...INPUT_TOAST_OPTIONS, toastId });
	}
};

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
	const [stageType, setStageType] = useState("");
	const [stageStatus, setStageStatus] = useState("Active");
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
	const [expandedFieldIds, setExpandedFieldIds] = useState<Set<string>>(new Set());
	const [leadFormFields, setLeadFormFields] = useState<LeadFormField[]>([]);
	const [leadFormFieldsLoading, setLeadFormFieldsLoading] = useState(false);

	const createExistingField = (): DataCaptureField => ({
		id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		mode: "existing",
		fieldKey: "",
		fieldName: "",
		fieldType: "text",
		isMandatory: false,
	});

	const createCustomField = (): DataCaptureField => ({
		id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		mode: "custom",
		fieldKey: "",
		fieldName: "",
		fieldType: "text",
		isMandatory: false,
	});

	const getCatalogField = (fieldKey: string): LeadFormField | undefined =>
		leadFormFields.find((field) => field.field_key === fieldKey);

	const getSelectedFieldKeys = (currentFieldId?: string): Set<string> =>
		new Set(
			dataCaptureFields
				.filter((field) => field.id !== currentFieldId)
				.map((field) => field.fieldKey)
				.filter(Boolean),
		);

	const handleAddField = (fieldMode: DataCaptureField["mode"]) => {
		if (!stageName.trim()) {
			toast.error("Please enter stage name before adding data capture", {
				position: "top-right",
				autoClose: 2000,
			});
			return;
		}
		const nextField =
			fieldMode === "existing" ? createExistingField() : createCustomField();
		setDataCaptureFields((previous) => [...previous, nextField]);
		setExpandedFieldIds((previous) => new Set([...previous, nextField.id]));
	};

	const handleCopyField = (fieldId: string) => {
		setDataCaptureFields((previous) => {
			const fieldIndex = previous.findIndex((field) => field.id === fieldId);
			if (fieldIndex === -1) return previous;

			const fieldToCopy = previous[fieldIndex];
			const copiedField: DataCaptureField = {
				...fieldToCopy,
				id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				mode: fieldToCopy.mode,
				fieldKey: "",
				fieldName:
					fieldToCopy.mode === "custom" ? `${fieldToCopy.fieldName} Copy` : "",
				fieldType: fieldToCopy.mode === "custom" ? fieldToCopy.fieldType : "text",
				isMandatory: false,
			};

			const next = [...previous];
			next.splice(fieldIndex + 1, 0, copiedField);
			setExpandedFieldIds((expanded) => new Set([...expanded, copiedField.id]));
			return next;
		});
	};

	const handleDeleteField = (fieldId: string) => {
		setDataCaptureFields((previous) => previous.filter((field) => field.id !== fieldId));
		setExpandedFieldIds((previous) => {
			const next = new Set(previous);
			next.delete(fieldId);
			return next;
		});
	};

	const handleUpdateField = (
		fieldId: string,
		key: "fieldName" | "fieldType",
		value: string,
	) => {
		if (key === "fieldName") {
			if (/[^A-Za-z0-9 \-&.()/]/.test(value)) {
        showInputToast(
          "pipeline-data-capture-name-alpha",
          "Only letters, numbers, hyphens, and special characters are allowed",
        );
      }
			if (value.length > MAX_NAME_LENGTH) {
				showInputToast("pipeline-data-capture-name-length", "Maximum 50 characters allowed");
			}
		}

		const sanitizedValue =
			key === "fieldName" ? sanitizeAlphabeticName(value) : value;
		setDataCaptureFields((previous) =>
			previous.map((field) =>
				field.id === fieldId
					? {
							...field,
							[key]:
								key === "fieldType"
									? (sanitizedValue as DataCaptureField["fieldType"])
									: sanitizedValue,
						}
					: field,
			),
		);
	};

	const handleSelectLeadFormField = (fieldId: string, fieldKey: string) => {
		const catalogField = getCatalogField(fieldKey);
		setDataCaptureFields((previous) =>
			previous.map((field) =>
				field.id === fieldId
					? {
							...field,
							fieldKey,
							fieldName: catalogField?.field_label ?? "",
							fieldType: catalogField?.stage_field_type ?? "text",
							isMandatory:
								catalogField?.is_locked && catalogField?.is_required
									? true
									: field.isMandatory,
						}
					: field,
			),
		);
	};

	const handleStageNameInputChange = (value: string) => {
		if (/[^A-Za-z0-9 \-&.()/]/.test(value)) {
      showInputToast(
        "pipeline-stage-name-alpha",
        "Only letters, numbers, hyphens, and special characters are allowed",
      );
    }
		if (value.length > MAX_NAME_LENGTH) {
			showInputToast("pipeline-stage-name-length", "Maximum 50 characters allowed");
		}
		onStageNameChange?.(sanitizeAlphabeticName(value));
	};

	const handleToggleMandatory = (fieldId: string) => {
		setDataCaptureFields((previous) =>
			previous.map((field) =>
				field.id === fieldId &&
				!(getCatalogField(field.fieldKey)?.is_locked && getCatalogField(field.fieldKey)?.is_required)
					? { ...field, isMandatory: !field.isMandatory }
					: field,
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

	const syncDataCaptureFieldsWithCatalog = async (): Promise<DataCaptureField[]> => {
		const syncedFields: DataCaptureField[] = [];
		let nextCatalog = [...leadFormFields];

		for (const field of dataCaptureFields) {
			const trimmedLabel = field.fieldName.trim();
			if (field.mode === "custom") {
				const createdField = await LeadFormFieldAPI.create({
					field_label: trimmedLabel,
					field_type: field.fieldType,
					stage_field_type: field.fieldType,
					form_step: 1,
					section: "Additional Fields",
					is_required: false,
					is_active: true,
				});
				nextCatalog = [...nextCatalog, createdField];
				syncedFields.push({
					...field,
					mode: "existing",
					fieldKey: createdField.field_key,
					fieldName: createdField.field_label,
					fieldType: createdField.stage_field_type,
				});
				continue;
			}

			const catalogField = nextCatalog.find(
				(item) => item.field_key === field.fieldKey,
			);
			if (catalogField && catalogField.field_label !== trimmedLabel) {
				const updatedField = await LeadFormFieldAPI.update(field.fieldKey, {
					field_label: trimmedLabel,
				});
				nextCatalog = nextCatalog.map((item) =>
					item.field_key === updatedField.field_key ? updatedField : item,
				);
				syncedFields.push({
					...field,
					fieldName: updatedField.field_label,
					fieldType: updatedField.stage_field_type,
				});
				continue;
			}

			syncedFields.push(field);
		}

		setLeadFormFields(nextCatalog);
		setDataCaptureFields(syncedFields);
		return syncedFields;
	};

	const handleSaveCustomAction = () => {
		const trimmed = customActionText.trim();
		if (!trimmed || !isAlphabeticName(trimmed)) return;
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
		setStageType(initialValues?.stageType ?? "");
		setStageStatus(initialValues?.stageStatus ?? "Active");
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
			const nextFields: DataCaptureField[] = initialValues.dataCaptureFields.map((field, i) => ({
					id: `field-${Date.now()}-${i}`,
					mode: field.fieldKey ? "existing" : "custom",
					fieldKey: field.fieldKey ?? "",
					fieldName: field.fieldName,
					fieldType: field.fieldType,
					isMandatory: field.isMandatory,
				}));
			setDataCaptureFields(nextFields);
			setExpandedFieldIds(
				new Set(
					nextFields
						.filter((field) => field.mode === "custom" || !field.fieldKey)
						.map((field) => field.id),
				),
			);
		}
		setShowValidation(false);
	}, [open, initialValues, mode, stageName]);

	useEffect(() => {
		if (!open || leadFormFieldsLoading) return;
		let isMounted = true;
		setLeadFormFieldsLoading(true);
		LeadFormFieldAPI.list()
			.then((fields) => {
				if (isMounted) setLeadFormFields(fields.length > 0 ? fields : FALLBACK_LEAD_FORM_FIELDS);
			})
			.catch(() => {
				if (isMounted) {
					setLeadFormFields(FALLBACK_LEAD_FORM_FIELDS);
					toast.error("Unable to load lead form fields", {
						position: "top-right",
						autoClose: 2000,
					});
				}
			})
			.finally(() => {
				if (isMounted) setLeadFormFieldsLoading(false);
			});
		return () => {
			isMounted = false;
		};
	}, [open]);

	useEffect(() => {
		if (!leadFormFields.length) return;
		setDataCaptureFields((previous) =>
			previous.map((field) => {
				if (field.mode !== "existing" || !field.fieldKey) return field;
				const catalogField = leadFormFields.find(
					(leadField) => leadField.field_key === field.fieldKey,
				);
				if (!catalogField) return field;
				return {
					...field,
					fieldName: catalogField.field_label,
					fieldType: catalogField.stage_field_type,
					isMandatory:
						catalogField.is_locked && catalogField.is_required
							? true
							: field.isMandatory,
				};
			}),
		);
	}, [leadFormFields]);

	const handleSave = async () => {
		const trimmedStageName = stageName.trim();
		const normalizedStageName = trimmedStageName.replace(/\s+/g, " ");
		const isSingleLetterStageName =
			normalizedStageName.length === 1 && /^[A-Za-z]$/.test(normalizedStageName);
		const trimmedStageType = stageType.trim();
		const trimmedStageStatus = stageStatus.trim();
		const trimmedColorCode = colorCode.trim();
		const trimmedEntryRule = entryRule.trim();
		const hasInvalidDataCaptureName = dataCaptureFields.some((field) => {
			const trimmedFieldName = field.fieldName.trim();
			return (
				(field.mode === "existing" && !field.fieldKey.trim()) ||
				!trimmedFieldName ||
				trimmedFieldName.length > MAX_NAME_LENGTH ||
				!isAlphabeticName(trimmedFieldName)
			);
		});
		const selectedFieldKeys = dataCaptureFields
			.map((field) => field.fieldKey)
			.filter(Boolean);
		const hasDuplicateDataCaptureFields =
			new Set(selectedFieldKeys).size !== selectedFieldKeys.length;

		const hasValidationError =
			isSingleLetterStageName ||
			trimmedStageName.length > MAX_NAME_LENGTH ||
			(trimmedStageName.length > 0 && !isAlphabeticName(trimmedStageName)) ||
			hasInvalidDataCaptureName ||
			hasDuplicateDataCaptureFields ||
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
			const syncedDataCaptureFields =
				await syncDataCaptureFieldsWithCatalog();
			await onSave(normalizedStageName, {
				stageType: trimmedStageType,
				stageStatus: trimmedStageStatus,
				colorCode: trimmedColorCode.toUpperCase(),
				entryRule: trimmedEntryRule,
				actions: stageActions,
				dataCaptureFields: syncedDataCaptureFields.map(({ fieldKey, fieldName, fieldType, isMandatory }) => ({
					fieldKey,
					fieldName,
					fieldType,
					isMandatory,
				})),
			});
		} catch (error) {
			console.error("[StageConfiguration] Failed to save data capture", error);
			toast.error("Unable to save data capture fields", {
				position: "top-right",
				autoClose: 2000,
			});
		} finally {
			setIsSaving(false);
		}
	};

	if (!open) return null;

	const normalizedTypedStageName = stageName.trim().replace(/\s+/g, " ");
	const isSingleLetterTypedStageName =
		normalizedTypedStageName.length === 1 && /^[A-Za-z]$/.test(normalizedTypedStageName);

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
              color: activeTab === "stage-rules" ? "#EA7C5A" : "text.primary",
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
              color: activeTab === "data-capture" ? "#EA7C5A" : "text.primary",
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
                  onChange={(event) =>
                    handleStageNameInputChange(event.target.value)
                  }
                  error={
                    showValidation &&
                    (isSingleLetterTypedStageName ||
                      stageName.trim().length > MAX_NAME_LENGTH ||
                      (stageName.trim().length > 0 &&
                        !isAlphabeticName(stageName)))
                  }
                  helperText={
                    showValidation && isSingleLetterTypedStageName
                      ? "Stage name cannot be a single letter"
                      : showValidation &&
                          stageName.trim().length > MAX_NAME_LENGTH
                        ? "Maximum 50 characters allowed"
                        : showValidation &&
                            !isAlphabeticName(stageName) &&
                            stageName.trim().length > 0
                          ? "Only letters, numbers, hyphens, and special characters are allowed"
                          : " "
                  }
                  inputProps={{ maxLength: MAX_NAME_LENGTH }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.4,
                      backgroundColor: "#FFFFFF",
                    },
                    "& .MuiFormHelperText-root": {
                      minHeight: 18,
                      m: 0,
                      pt: 0.35,
                    },
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
                    showValidation && !stageType.trim()
                      ? "Stage type is required"
                      : " "
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.4,
                      backgroundColor: "#FFFFFF",
                    },
                    "& .MuiFormHelperText-root": {
                      minHeight: 18,
                      m: 0,
                      pt: 0.35,
                    },
                    "& .MuiSelect-select": { textAlign: "left" },
                  }}
                >
                  <MenuItem value="">
                    <em>Select stage type</em>
                  </MenuItem>
                  <MenuItem value="Entry">Entry</MenuItem>
                  <MenuItem value="Mid">Mid</MenuItem>
                  <MenuItem value="Final">Final</MenuItem>
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
                    showValidation && !stageStatus.trim()
                      ? "Stage status is required"
                      : " "
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.4,
                      backgroundColor: "#FFFFFF",
                    },
                    "& .MuiFormHelperText-root": {
                      minHeight: 18,
                      m: 0,
                      pt: 0.35,
                    },
                    "& .MuiSelect-select": { textAlign: "left" },
                  }}
                >
                  <MenuItem value="">
                    <em>Select stage status</em>
                  </MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
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
                            value={
                              isValidHexColor(colorCode) ? colorCode : "#EEE788"
                            }
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
                    "& .MuiFormHelperText-root": {
                      minHeight: 18,
                      m: 0,
                      pt: 0.35,
                    },
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
                    showValidation && !entryRule.trim()
                      ? "Entry rule is required"
                      : " "
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.4,
                      backgroundColor: "#FFFFFF",
                    },
                    "& .MuiFormHelperText-root": {
                      minHeight: 18,
                      m: 0,
                      pt: 0.35,
                    },
                    "& .MuiSelect-select": { textAlign: "left" },
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
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#E9A67A",
                  px: 1.4,
                  pt: 1.2,
                  mb: 1.2,
                }}
              >
                *Define actions that must be completed before a lead moves to
                the next stage.
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
                      textAlign: "left",
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
                      {item.checked ? (
                        <CheckRoundedIcon sx={{ fontSize: 13 }} />
                      ) : null}
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
                      onChange={(event) =>
                        setCustomActionText(event.target.value)
                      }
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
                        disabled={!isAlphabeticName(customActionText)}
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
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                      Add Custom Action
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </>
        ) : (
          <>
            <Typography sx={{ fontSize: 12, color: "#E9A67A", mb: 1.2 }}>
              *Choose what information must be filled before moving to the next
              stage.
            </Typography>

            {dataCaptureFields.map((field, index) => {
              const catalogField = getCatalogField(field.fieldKey);
              const selectedKeys = getSelectedFieldKeys(field.id);
              const isLockedMandatory = Boolean(
                catalogField?.is_locked && catalogField?.is_required,
              );
              const hasDuplicateField =
                field.fieldKey.trim().length > 0 && selectedKeys.has(field.fieldKey);
              const isExpanded =
                expandedFieldIds.has(field.id) ||
                field.mode === "custom" ||
                !field.fieldKey;

              if (!isExpanded) {
                return (
                  <Box
                    key={field.id}
                    onClick={() =>
                      setExpandedFieldIds((previous) =>
                        new Set([...previous, field.id]),
                      )
                    }
                    sx={{
                      border: `1px solid ${theme.palette.grey[200]}`,
                      borderRadius: 2,
                      mb: 1.1,
                      px: 1.4,
                      py: 1.1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#FFFFFF",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#FAFAFB" },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                        {field.fieldName || catalogField?.field_label || `FIELD ${index + 1}`}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                        Existing lead field
                        {field.isMandatory ? " • Mandatory" : ""}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      Edit
                    </Typography>
                  </Box>
                );
              }

              return (
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
                    {field.mode === "existing" && field.fieldKey ? (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() =>
                          setExpandedFieldIds((previous) => {
                            const next = new Set(previous);
                            next.delete(field.id);
                            return next;
                          })
                        }
                        sx={{ minWidth: 0, px: 0.7, fontSize: 12, textTransform: "none" }}
                      >
                        Done
                      </Button>
                    ) : null}
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
                  {field.mode === "existing" ? (
                    <TextField
                      size="small"
                      label="Existing Lead Field"
                      value={field.fieldKey || (field.fieldName ? "__legacy__" : "")}
                      onChange={(event) =>
                        handleSelectLeadFormField(field.id, event.target.value)
                      }
                      select
                      SelectProps={{
                        MenuProps: {
                          disablePortal: true,
                          PaperProps: { "data-stage-config-keep-open": "true" },
                        },
                      }}
                      error={showValidation && (!field.fieldKey.trim() || hasDuplicateField)}
                      helperText={
                        showValidation && !field.fieldKey.trim()
                          ? "Select a lead field"
                          : showValidation && hasDuplicateField
                            ? "This field is already selected"
                            : " "
                      }
                      fullWidth
                      sx={{
                        mb: 1.2,
                        "& .MuiFormHelperText-root": {
                          minHeight: 18,
                          m: 0,
                          pt: 0.35,
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>
                          {leadFormFieldsLoading
                            ? "Loading fields..."
                            : "Select lead field"}
                        </em>
                      </MenuItem>
                      {field.fieldName && !field.fieldKey && (
                        <MenuItem value="__legacy__" disabled>
                          {field.fieldName}
                        </MenuItem>
                      )}
                      {field.fieldKey && !catalogField && field.fieldName && (
                        <MenuItem value={field.fieldKey} disabled>
                          {field.fieldName}
                        </MenuItem>
                      )}
                      {leadFormFields.map((leadField) => (
                        <MenuItem
                          key={leadField.field_key}
                          value={leadField.field_key}
                          disabled={selectedKeys.has(leadField.field_key)}
                        >
                          {leadField.field_label}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : null}
                  <TextField
                    size="small"
                    label={field.mode === "existing" ? "Stage Field Label" : "New Field Label"}
                    value={field.fieldName}
                    onChange={(event) =>
                      handleUpdateField(
                        field.id,
                        "fieldName",
                        event.target.value,
                      )
                    }
                    error={
                      showValidation &&
                      (!field.fieldName.trim() ||
                        field.fieldName.trim().length > MAX_NAME_LENGTH ||
                        !isAlphabeticName(field.fieldName))
                    }
                    helperText={
                      showValidation && !field.fieldName.trim()
                        ? "Field label is required"
                        : showValidation &&
                            field.fieldName.trim().length > MAX_NAME_LENGTH
                          ? "Maximum 50 characters allowed"
                          : showValidation && !isAlphabeticName(field.fieldName)
                            ? "Only letters, numbers, hyphens, and special characters are allowed"
                            : field.mode === "existing" && catalogField
                              ? `Default label: ${catalogField.field_label}`
                              : " "
                    }
                    inputProps={{ maxLength: MAX_NAME_LENGTH }}
                    fullWidth
                    sx={{
                      mb: 1.2,
                      "& .MuiFormHelperText-root": {
                        minHeight: 18,
                        m: 0,
                        pt: 0.35,
                      },
                    }}
                  />
                  <TextField
                    size="small"
                    label="Field Type"
                    value={field.fieldType}
                    onChange={(event) =>
                      handleUpdateField(
                        field.id,
                        "fieldType",
                        event.target.value,
                      )
                    }
                    select
                    disabled={field.mode === "existing" && Boolean(field.fieldKey)}
                    SelectProps={{
                      MenuProps: {
                        disablePortal: true,
                        PaperProps: { "data-stage-config-keep-open": "true" },
                      },
                    }}
                    fullWidth
                    sx={{ mb: 1.1 }}
                  >
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="dropdown">Dropdown</MenuItem>
                  </TextField>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.9,
                      cursor: isLockedMandatory ? "default" : "pointer",
                    }}
                  >
                    <Switch
                      size="small"
                      checked={field.isMandatory}
                      onChange={(event) => {
                        event.stopPropagation();
                        handleToggleMandatory(field.id);
                      }}
                      color="success"
                      disabled={isLockedMandatory}
                      sx={{ m: 0 }}
                    />
                    <Typography sx={{ fontSize: 13, color: "text.primary" }}>
                      Mandatory
                    </Typography>
                  </Box>
                </Box>
                </Box>
              );
            })}

            <Stack
              direction="row"
              spacing={1}
              sx={{
                justifyContent: "flex-end",
                flexWrap: "wrap",
                rowGap: 1,
              }}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddBoxOutlinedIcon sx={{ fontSize: 17 }} />}
                onClick={() => handleAddField("existing")}
                sx={{ fontSize: 12, textTransform: "none" }}
              >
                Use Existing Field
              </Button>
              <Button
                size="small"
                variant="text"
                startIcon={<AddBoxOutlinedIcon sx={{ fontSize: 17 }} />}
                onClick={() => handleAddField("custom")}
                sx={{
                  fontSize: 12,
                  textTransform: "none",
                  color: theme.palette.primary.main,
                }}
              >
                Add New Field
              </Button>
            </Stack>
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
