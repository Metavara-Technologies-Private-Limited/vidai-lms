import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PublishedWithChangesOutlinedIcon from "@mui/icons-material/PublishedWithChangesOutlined";
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import type {
  PipelineStageField,
  PipelineStageRule,
} from "../../services/pipeline.api";
import type { Lead as ApiLead } from "../../services/leads.api";
import type { AppDispatch } from "../../store";
import {
  fetchLeads,
  selectLeads,
  selectLeadsLoading,
} from "../../store/leadSlice";
import StageConfiguration, {
  type StageConfigPayload,
} from "./StageConfiguration";
import { mapRulesToActions } from "./salesPipeline.utils";

type StageCard = {
  id: string;
  stageName: string;
  stageColor?: string;
  stageType?: string;
  stageStatus?: string;
  entryRule?: string;
  rules?: PipelineStageRule[];
  fields?: PipelineStageField[];
};

type SalesPipeLineDataProps = {
  stages: StageCard[];
  canEditPipeline?: boolean;
  onAddStage: (
    stageName?: string,
    stageConfig?: StageConfigPayload,
  ) => Promise<boolean> | boolean;
  onEditStage: (
    stageIndex: number,
    stageName: string,
    stageConfig?: StageConfigPayload,
  ) => Promise<boolean> | boolean;
  onDuplicateStage: (stageIndex: number) => Promise<boolean> | boolean;
  onArchiveStage: (stageIndex: number) => void;
  onDeleteStage: (stageIndex: number) => void;
  onReorderStages: (fromIndex: number, toIndex: number) => void;
  zoomPercent?: number;
};


const toStageLabel = (value?: string): string | undefined => {
  if (!value) return undefined;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};
const toStageTypeLabel = (value?: string): string => {
  const normalized = (value ?? "").toLowerCase().trim();
  if (normalized === "closure") return "Final";
  if (normalized === "engagement" || normalized === "conversion") return "Mid";
  return "Entry";
};

const toStageStatusLabel = (value?: string): string => {
  const normalized = (value ?? "").toLowerCase().trim();
  if (normalized === "inactive") return "Inactive";
  return "Active";
};

const calculateStageConversionPercent = (
  currentStageLeadCount: number,
  convertedLeadCount: number,
): number => {
  if (currentStageLeadCount <= 0 || convertedLeadCount <= 0) return 0;

  const rawPercent = Math.round(
    (convertedLeadCount / currentStageLeadCount) * 100,
  );
  return Math.min(100, Math.max(0, rawPercent));
};

const isConvertedLead = (lead: ApiLead): boolean => {
  const leadRecord = lead as unknown as Record<string, unknown>;
  const normalizeStatusValue = (value: unknown): string =>
    String(value ?? "")
      .toLowerCase()
      .trim()
      .replace(/[_\s-]+/g, "-");

  const candidateStatuses = [
    lead.lead_status,
    typeof leadRecord.status === "string" ? leadRecord.status : "",
    typeof leadRecord.stage_name === "string" ? leadRecord.stage_name : "",
    typeof leadRecord.pipeline_stage_name === "string"
      ? leadRecord.pipeline_stage_name
      : "",
    extractStageFromDescription(
      typeof lead.next_action_description === "string"
        ? lead.next_action_description
        : "",
    ),
  ].map((value) => normalizeStatusValue(value));

  const hasConvertedStatus = candidateStatuses.some(
    (normalizedStatus) =>
      normalizedStatus === "converted" ||
      normalizedStatus === "converted-lead" ||
      normalizedStatus === "converted-leads" ||
      normalizedStatus === "cycle-conversion" ||
      normalizedStatus === "cycleconversion",
  );

  if (hasConvertedStatus) return true;

  const hasConvertedFlag =
    leadRecord.converted === true ||
    Boolean(leadRecord.conversion_date) ||
    normalizeStatusValue(lead.next_action_status) === "completed";

  return hasConvertedFlag;
};

const getStatusKeys = (status: string): string[] => {
  const base = status.toLowerCase();
  const aliases: Record<string, string[]> = {
    new: ["new"],
    contacted: ["contacted"],
    "follow-ups": [
      "follow-ups",
      "follow-up",
      "followup",
      "follow-up-leads",
      "follow-up-lead",
      "follow-up-lead-stage",
      "follow-up-stage",
      "contacted",
    ],
    converted: ["converted", "converted-lead", "converted-leads"],
    lost: ["lost", "lost-lead", "lost-leads", "closed", "closed-lost"],
    "cycle-conversion": ["cycle-conversion", "cycleconversion"],
    "proposal-sent": ["proposal-sent", "proposal"],
    "contract-signed": ["contract-signed", "contractsigned", "contract"],
    "converted lead": ["converted lead", "converted"],
    "contract signed": ["contract signed", "contracted", "contract"],
    "proposal sent": ["proposal sent", "proposal"],
    "follow up": ["follow up", "follow-up", "followup"],
    appointment: ["appointment", "appointments"],
    negotiation: ["negotiation", "negotiating"],
    closed: ["closed", "lost", "closed lost"],
  };
  return aliases[base] ?? [base];
};

const extractStageFromDescription = (
  description: string | null | undefined,
): string => {
  if (!description) return "";
  const match = description.match(/(?:^|\|)\s*Stage:\s*([^|]+)/i);
  return match?.[1]?.trim() ?? "";
};

const getStageStatusKeys = (stage: StageCard): string[] => {
  const stageName = stage.stageName.toLowerCase().trim();
  const byName = getStatusKeys(stage.stageName);
  const byType = stage.stageType ? getStatusKeys(stage.stageType) : [];
  const byStatus = stage.stageStatus ? getStatusKeys(stage.stageStatus) : [];
  const explicit = [stageName, stage.stageName, stage.stageStatus ?? "", stage.stageType ?? ""];

  return Array.from(
    new Set(
      [...byName, ...byType, ...byStatus, ...explicit]
        .map((item) => item.toLowerCase().trim())
        .filter(Boolean),
    ),
  );
};

const SalesPipeLineData = ({
  stages,
  canEditPipeline = true,
  onAddStage,
  onEditStage,
  onDuplicateStage,
  onArchiveStage,
  onDeleteStage,
  onReorderStages,
  zoomPercent = 100,
}: SalesPipeLineDataProps) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const leads = useSelector(selectLeads) as ApiLead[];
  const leadsLoading = useSelector(selectLeadsLoading);

  const [selectedStageName, setSelectedStageName] = useState<string | null>(
    null,
  );
  const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(
    null,
  );
  const [selectedStageConfig, setSelectedStageConfig] = useState<
    Partial<StageConfigPayload>
  >({});
  const [configurationMode, setConfigurationMode] = useState<"create" | "edit">(
    "create",
  );
  const [draggedStageIndex, setDraggedStageIndex] = useState<number | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);

  const cardsContainerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Using a ref for drag info to avoid unnecessary re-renders during mouse moves
  const dragInfo = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
  });

  const stageHeaderColors = [
    "#F6E4E1",
    "#F5E9D2",
    "#DCE7FB",
    "#D9EFE7",
    "#E8DFF4",
    "#E6E9EF",
  ];

  useEffect(() => {
    // only dispatch once on mount; we don't want to refetch continuously if
    // the store keeps returning an empty array
    if (leads.length === 0) {
      dispatch(fetchLeads());
    }
  }, [dispatch, leads.length]);

  const stageMetrics = useMemo(() => {
    const activeLeads = leads.filter((lead) => lead.is_active !== false);

    const leadMatchesStage = (
      lead: ApiLead,
      targetStage: StageCard,
      targetStageStatusKeys: string[],
    ): boolean => {
      if (
        lead.stage_id !== null &&
        lead.stage_id !== undefined &&
        String(lead.stage_id) === String(targetStage.id)
      ) {
        return true;
      }

      const leadRecord = lead as unknown as Record<string, unknown>;
      const candidateStatuses = [
        lead.lead_status,
        typeof leadRecord.status === "string" ? leadRecord.status : "",
        typeof leadRecord.stage_name === "string" ? leadRecord.stage_name : "",
        typeof leadRecord.pipeline_stage_name === "string"
          ? leadRecord.pipeline_stage_name
          : "",
        typeof leadRecord.task_type === "string" ? leadRecord.task_type : "",
        typeof leadRecord.task === "string" ? leadRecord.task : "",
        extractStageFromDescription(
          typeof lead.next_action_description === "string"
            ? lead.next_action_description
            : "",
        ),
      ]
        .map((value) => String(value ?? "").toLowerCase().trim())
        .filter(Boolean);

      return targetStageStatusKeys.some((key) => candidateStatuses.includes(key));
    };

    return stages.map((stage) => {
      const stageName = stage.stageName.replace(/^\d+\.\s*/, "");
      const stageStatusKeys = getStageStatusKeys(stage);
      const stageLeads = activeLeads.filter((lead) =>
        leadMatchesStage(lead, stage, stageStatusKeys),
      );
      const leadCount = stageLeads.length;
      const convertedLeadCount = stageLeads.filter((lead) =>
        isConvertedLead(lead),
      ).length;

      const conversionValue = calculateStageConversionPercent(
        leadCount,
        convertedLeadCount,
      );

      return {
        stage,
        stageName,
        leadCount,
        convertedLeadCount,
        conversionValue,
      };
    });
  }, [leads, stages]);

  // --- Drag Logic ---
  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardsContainerRef.current) return;

    dragInfo.current = {
      isDown: true,
      startX: event.pageX - cardsContainerRef.current.offsetLeft,
      scrollLeft: cardsContainerRef.current.scrollLeft,
    };
    setIsDragging(false); // Reset dragging state until movement occurs
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragInfo.current.isDown || !cardsContainerRef.current) return;

    // Threshold to differentiate between a click and a drag
    const x = event.pageX - cardsContainerRef.current.offsetLeft;
    const walk = (x - dragInfo.current.startX) * 1.5; // Multiply for speed

    if (Math.abs(walk) > 5) {
      setIsDragging(true);
      cardsContainerRef.current.scrollLeft = dragInfo.current.scrollLeft - walk;
    }
    event.preventDefault();
  };

  const stopDragging = () => {
    dragInfo.current.isDown = false;
    // Small timeout so the click event doesn't fire immediately after dragging
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleAddStageClick = () => {
    if (!canEditPipeline) return;
    setConfigurationMode("create");
    setSelectedStageIndex(null);
    setSelectedStageName("");
    setSelectedStageConfig({
      stageType: "",
      stageStatus: "Active",
      colorCode: "#EBFAEF",
      entryRule: "Manual",
    });
  };

  const handleStageCardClick = (stage: StageCard, stageIndex: number) => {
    if (!canEditPipeline) return;
    if (isDragging) return;
    setConfigurationMode("edit");
    setSelectedStageIndex(stageIndex);
    setSelectedStageName(stage.stageName);
    const resolvedStageColor =
      stage.stageColor ??
      stageHeaderColors[stageIndex % stageHeaderColors.length];
    setSelectedStageConfig({
      stageType: toStageTypeLabel(stage.stageType),
      stageStatus: toStageStatusLabel(stage.stageStatus),
      colorCode: resolvedStageColor,
      entryRule: toStageLabel(stage.entryRule) ?? "Manual",
      actions:
        stage.rules && stage.rules.length > 0
          ? mapRulesToActions(stage.rules)
          : [],
      dataCaptureFields: stage.fields?.map((f) => ({
        fieldName: f.field_name,
        fieldType: f.field_type,
        isMandatory: f.is_mandatory,
      })),
    });
  };

  const handleSaveStageConfiguration = async (
    stageName: string,
    stageConfig?: StageConfigPayload,
  ) => {
    if (!canEditPipeline) return;
    const isEditMode =
      configurationMode === "edit" && selectedStageIndex !== null;
    const saved = isEditMode
      ? await Promise.resolve(
          onEditStage(selectedStageIndex, stageName, stageConfig),
        )
      : await Promise.resolve(onAddStage(stageName, stageConfig));

    if (saved !== false) {
      setSelectedStageIndex(null);
      setSelectedStageName(null);
      setSelectedStageConfig({});
    }
  };

  const handleHorizontalWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = cardsContainerRef.current;
    if (!container) return;

    const hasHorizontalOverflow =
      container.scrollWidth > container.clientWidth + 2;

    if (!hasHorizontalOverflow) return;

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    if (delta === 0) return;

    event.preventDefault();
    container.scrollLeft += delta;
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (selectedStageName === null) return;
      const targetNode = event.target as Node;
      const targetElement = event.target as HTMLElement | null;
      if (
        targetElement?.closest("[data-stage-config-keep-open='true']") ||
        targetElement?.closest("[role='listbox']") ||
        targetElement?.closest(".MuiMenu-paper") ||
        targetElement?.closest(".MuiMenuItem-root")
      ) {
        return;
      }
      if (rootRef.current?.contains(targetNode)) return;
      setSelectedStageName(null);
      setSelectedStageConfig({});
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [selectedStageName]);

  const handleStageDragStart = (index: number) => {
    if (!canEditPipeline) return;
    setDraggedStageIndex(index);
  };

  const handleStageDrop = (dropIndex: number) => {
    if (!canEditPipeline) return;
    if (draggedStageIndex === null) return;
    onReorderStages(draggedStageIndex, dropIndex);
    setDraggedStageIndex(null);
  };

  const stageActionButtonSx = {
    width: 28,
    height: 28,
    borderRadius: 1.2,
    border: `1px solid ${theme.palette.grey[200]}`,
    backgroundColor: theme.palette.background.paper,
    "&:hover": {
      backgroundColor: alpha(theme.palette.grey[200], 0.5),
    },
  } as const;

  const zoomScale = Math.max(50, Math.min(200, zoomPercent)) / 100;

  return (
    <Box
      ref={rootRef}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setSelectedStageIndex(null);
          setSelectedStageName(null);
        }
      }}
      sx={{
        width: "100%",
        minWidth: 0,
        height: "100%",
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: { xs: "flex-start", md: "center" },
        px: { xs: 0.5, sm: 2.5 },
        position: "relative",
        overflowX: "hidden",
        overflowY: "hidden",
      }}
    >
      <Box
        ref={cardsContainerRef}
        onWheel={handleHorizontalWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        sx={{
          width: "100%",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: stageMetrics.length === 0 ? "center" : "flex-start",
          overflowX: "auto",
          overflowY: "hidden",
          pb: 2,
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none", // Prevents text selection while dragging
          touchAction: "pan-x",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: `${alpha(theme.palette.grey[500], 0.7)} transparent`,
          scrollBehavior: isDragging ? "auto" : "smooth",
          scrollSnapType: "x mandatory",
          "&::-webkit-scrollbar": {
            height: 10,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: alpha(theme.palette.grey[500], 0.45),
            borderRadius: 999,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: alpha(theme.palette.grey[500], 0.7),
          },
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: stageMetrics.length === 0 ? "center" : "flex-start",
            flexWrap: "nowrap",
            gap: 0.9,
            width: "max-content",
            minWidth: "100%",
            maxWidth: "none",
            transform: `scale(${zoomScale})`,
            transformOrigin: "left top",
          }}
        >
          {stageMetrics.map(
            ({ stage, stageName, leadCount, convertedLeadCount, conversionValue }, index) => {
              return (
                <Box
                  key={`${stage.id}-${index}`}
                  draggable={canEditPipeline}
                  onDragStart={() => handleStageDragStart(index)}
                  onDragOver={(event) => {
                    if (canEditPipeline) {
                      event.preventDefault();
                    }
                  }}
                  onDrop={() => handleStageDrop(index)}
                  onDragEnd={() => setDraggedStageIndex(null)}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 0.9,
                    flexShrink: 0,
                    scrollSnapAlign: "start",
                  }}
                >
                  <Box sx={{ position: "relative" }}>
                    <Box
                      onClick={() => handleStageCardClick(stage, index)}
                      sx={{
                        width: 176,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.grey[200]}`,
                        backgroundColor: theme.palette.background.paper,
                        overflow: "hidden",
                        cursor: !canEditPipeline
                          ? "default"
                          : isDragging
                            ? "grabbing"
                            : "pointer",
                      }}
                    >
                      <Box
                        sx={{
                          px: 1.4,
                          py: 1,
                          backgroundColor:
                            stage.stageColor ??
                            stageHeaderColors[index % stageHeaderColors.length],
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 16,
                            fontWeight: 700,
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {stageName}
                        </Typography>
                        {(stage.stageStatus ?? "").toLowerCase().trim() ===
                          "inactive" && (
                          <Box
                            sx={{
                              mt: 0.45,
                              display: "inline-block",
                              px: 0.7,
                              py: 0.15,
                              borderRadius: 1,
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#B42318",
                              backgroundColor: "#FEE4E2",
                              border: "1px solid #FDA29B",
                            }}
                          >
                            Inactive
                          </Box>
                        )}
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "text.secondary",
                            mt: 0.2,
                          }}
                        >
                          {`Stage ${index + 1}`}
                        </Typography>
                      </Box>

                      <Box sx={{ p: 1.2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                            border: `1px solid ${theme.palette.grey[200]}`,
                            borderRadius: 1.5,
                            px: 0.95,
                            py: 0.6,
                            mb: 0.8,
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: 1.2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: alpha(
                                theme.palette.grey[300],
                                0.35,
                              ),
                              color: theme.palette.text.secondary,
                            }}
                          >
                            <Groups2OutlinedIcon sx={{ fontSize: 16 }} />
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 20,
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            {leadCount}
                          </Typography>
                          <Typography
                            sx={{ fontSize: 12, color: "text.secondary" }}
                          >
                            Leads
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                            border: `1px solid ${theme.palette.grey[200]}`,
                            borderRadius: 1.5,
                            px: 0.95,
                            py: 0.6,
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: 1.2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: alpha(
                                theme.palette.grey[300],
                                0.35,
                              ),
                              color: theme.palette.text.secondary,
                            }}
                          >
                            <PublishedWithChangesOutlinedIcon
                              sx={{ fontSize: 16 }}
                            />
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 20,
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            {conversionValue ?? 0}%
                          </Typography>
                          <Typography
                            sx={{ fontSize: 12, color: "text.secondary" }}
                          >
                            Conv.
                          </Typography>
                          <Typography
                            sx={{ fontSize: 11, color: "text.secondary", ml: 0.2 }}
                          >
                            ({convertedLeadCount}/{leadCount})
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.8}
                      sx={{ mt: 0.9, justifyContent: "center" }}
                    >
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          void onDuplicateStage(index);
                        }}
                        disabled={!canEditPipeline}
                        onMouseDown={(event) => event.stopPropagation()}
                        sx={stageActionButtonSx}
                      >
                        <ContentCopyOutlinedIcon
                          sx={{ fontSize: 16, color: "#5A88E8" }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          onArchiveStage(index);
                        }}
                        disabled={!canEditPipeline}
                        onMouseDown={(event) => event.stopPropagation()}
                        sx={stageActionButtonSx}
                      >
                        <ArchiveOutlinedIcon
                          sx={{ fontSize: 16, color: "#E29B55" }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteStage(index);
                        }}
                        disabled={!canEditPipeline}
                        onMouseDown={(event) => event.stopPropagation()}
                        sx={stageActionButtonSx}
                      >
                        <DeleteOutlineOutlinedIcon
                          sx={{ fontSize: 16, color: "#CF3D3D" }}
                        />
                      </IconButton>
                    </Stack>
                  </Box>
                  <EastRoundedIcon
                    sx={{
                      color: theme.palette.grey[400],
                      fontSize: 18,
                      mt: 10,
                    }}
                  />
                </Box>
              );
            },
          )}

          <Box
            onClick={handleAddStageClick}
            sx={{
              flexShrink: 0,
              width: 176,
              height: 188,
              borderRadius: 2,
              border: `1px dashed ${theme.palette.grey[300]}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              backgroundColor: alpha(theme.palette.background.paper, 0.58),
              cursor: canEditPipeline ? "pointer" : "not-allowed",
              opacity: canEditPipeline ? 1 : 0.65,
              scrollSnapAlign: "start",
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#2F2F2F",
                color: "#FFFFFF",
              }}
            >
              <AddBoxOutlinedIcon sx={{ fontSize: 17 }} />
            </Box>
            <Typography
              sx={{ fontSize: 18, fontWeight: 700, textAlign: "center" }}
            >
              Add New Stage
            </Typography>
          </Box>
        </Box>
      </Box>

      {leadsLoading && (
        <Box
          sx={{
            position: "absolute",
            right: 18,
            top: 18,
            display: "flex",
            alignItems: "center",
            gap: 0.8,
          }}
        >
          <CircularProgress size={14} />
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
            Loading leads
          </Typography>
        </Box>
      )}

      <StageConfiguration
        open={canEditPipeline && selectedStageName !== null}
        stageName={selectedStageName ?? ""}
        onStageNameChange={(stageName) => setSelectedStageName(stageName)}
        initialValues={selectedStageConfig}
        onClose={() => {
          setSelectedStageIndex(null);
          setSelectedStageName(null);
          setSelectedStageConfig({});
        }}
        onSave={handleSaveStageConfiguration}
        mode={configurationMode}
      />
    </Box>
  );
};

export default SalesPipeLineData;
