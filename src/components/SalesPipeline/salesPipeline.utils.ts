import type {
	PipelineRuleActionType,
	PipelineStageField,
	PipelineStageRule,
	PipelineStageType,
} from "../../services/pipeline.api";
import type { StageAction } from "./StageConfiguration";

export const INDUSTRY_LABEL_MAP: Record<string, string> = {
	healthcare: "HEALTHCARE",
	ivf: "IVF & FERTILITY",
	pharma: "PHARMA / BIOTECH",
	diagnostics: "DIAGNOSTICS LAB",
	corporate: "CORPORATE SALES",
	education: "EDUCATION / TRAINING",
	saas: "SAAS / TECHNOLOGY",
	manufacturing: "MANUFACTURING",
	research: "RESEARCH",
	government: "GOVERNMENT",
	other: "OTHER",
};

export const STAGE_TYPE_SEQUENCE: PipelineStageType[] = [
	"lead",
	"engagement",
	"conversion",
	"closure",
];

const NAME_PATTERN = /^[A-Za-z ]+$/;

export const normalizeNameForCompare = (value: string): string =>
	value.trim().replace(/\s+/g, " ").toLowerCase();

export const isAlphabeticName = (value?: string): boolean => {
	if (!value) return false;
	const normalized = value.trim().replace(/\s+/g, " ");
	return normalized.length > 0 && NAME_PATTERN.test(normalized);
};

export const normalizeStageType = (value?: string): PipelineStageType => {
	const normalized = value?.toLowerCase().trim();
	if (normalized === "entry") return "lead";
	if (normalized === "mid") return "engagement";
	if (normalized === "final") return "closure";
	if (normalized === "engagement") return "engagement";
	if (normalized === "conversion") return "conversion";
	if (normalized === "closure") return "closure";
	return "lead";
};

export const normalizeStageStatus = (value?: string): "active" | "inactive" => {
	const normalized = value?.toLowerCase().trim();
	if (normalized === "inactive") return "inactive";
	return "active";
};

export const normalizeEntryRule = (value?: string): "manual" | "auto" => {
	const normalized = value?.toLowerCase().trim();
	if (normalized === "auto") return "auto";
	return "manual";
};

export const buildDuplicateStageName = (
	baseStageName: string,
	existingStages: Array<{ stage_name: string }>,
): string => {
	const trimmedBaseName = baseStageName.trim();
	const existingNames = new Set(
		existingStages.map((stage) => stage.stage_name.toLowerCase()),
	);

	let nextName = `${trimmedBaseName} Copy`;
	let suffix = 2;
	while (existingNames.has(nextName.toLowerCase())) {
		nextName = `${trimmedBaseName} Copy ${suffix}`;
		suffix += 1;
	}

	return nextName;
};

const ACTION_ID_TO_TYPE: Record<string, PipelineRuleActionType> = {
	call: "call",
	"proposal-email": "email",
	whatsapp: "whatsapp",
	sms: "sms",
	appointment: "appointment",
};

const ACTION_TYPE_TO_ID: Record<PipelineRuleActionType, string> = {
	call: "call",
	email: "proposal-email",
	whatsapp: "whatsapp",
	sms: "sms",
	appointment: "appointment",
	custom: "custom",
};

const ACTION_TYPE_TO_LABEL: Partial<Record<string, string>> = {
	call: "Call",
	"proposal-email": "Proposal - Email",
	whatsapp: "WhatsApp",
	sms: "SMS",
	appointment: "Appointment",
};

/**
 * Converts UI StageAction[] (from StageConfiguration) into backend PipelineStageRule[].
 */
export const mapActionsToRules = (actions: StageAction[]): PipelineStageRule[] => {
	const allowManualMove = actions.find((a) => a.id === "manual-move")?.checked ?? true;
	const autoMove = actions.find((a) => a.id === "auto-move")?.checked ?? true;

	return actions
		.filter((a) => a.id in ACTION_ID_TO_TYPE || a.id.startsWith("custom-"))
		.map((a) => ({
			action_type: a.id in ACTION_ID_TO_TYPE ? ACTION_ID_TO_TYPE[a.id] : "custom",
			custom_label: a.id.startsWith("custom-") ? a.label : undefined,
			is_enabled: a.checked,
			is_required: false,
			auto_move: autoMove,
			allow_manual_move: allowManualMove,
		}));
};

/**
 * Converts backend PipelineStageRule[] back into UI StageAction[] for display.
 */
export const mapRulesToActions = (rules: PipelineStageRule[]): StageAction[] => {
	if (rules.length === 0) return [];

	const anyRule = rules[0];
	const allowManualMove = anyRule?.allow_manual_move ?? true;
	const autoMove = anyRule?.auto_move ?? true;

	const actionRules: StageAction[] = rules.map((rule) => {
		if (rule.action_type === "custom") {
			const label = rule.custom_label?.trim() || "Custom";
			return {
				id: `custom-${rule.id ?? label}`,
				label,
				checked: rule.is_enabled,
			};
		}
		const id = ACTION_TYPE_TO_ID[rule.action_type] ?? rule.action_type;
		return {
			id,
			label: ACTION_TYPE_TO_LABEL[id] ?? id,
			checked: rule.is_enabled,
		};
	});

	return [
		{ id: "manual-move", label: "Allow manual move via drag & drop", checked: allowManualMove },
		{ id: "auto-move", label: "Auto-move lead to next stage after actions are completed", checked: autoMove },
		...actionRules,
	];
};

/**
 * Converts UI dataCaptureFields into backend PipelineStageField[].
 */
export const mapDataCaptureToFields = (
	dataCaptureFields?: Array<{
		fieldName: string;
		fieldType: "text" | "number" | "date" | "dropdown";
		isMandatory: boolean;
	}>,
): PipelineStageField[] => {
	if (!dataCaptureFields?.length) return [];
	return dataCaptureFields.map((f) => ({
		field_name: f.fieldName,
		field_type: f.fieldType,
		is_mandatory: f.isMandatory,
	}));
};
