import type { PipelineStageType } from "../../services/pipeline.api";

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

export const normalizeStageType = (value?: string): PipelineStageType => {
	const normalized = value?.toLowerCase().trim();
	if (normalized === "engagement") return "engagement";
	if (normalized === "conversion") return "conversion";
	if (normalized === "closure") return "closure";
	return "lead";
};

export const normalizeStageStatus = (value?: string): "open" | "won" | "lost" => {
	const normalized = value?.toLowerCase().trim();
	if (normalized === "won") return "won";
	if (normalized === "lost") return "lost";
	return "open";
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
