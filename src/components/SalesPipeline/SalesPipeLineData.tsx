import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent,
} from "react";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PublishedWithChangesOutlinedIcon from "@mui/icons-material/PublishedWithChangesOutlined";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import type { Lead as ApiLead } from "../../services/leads.api";
import type { AppDispatch } from "../../store";
import { fetchLeads, selectLeads, selectLeadsLoading } from "../../store/leadSlice";
import StageConfiguration from "./StageConfiguration";

type SalesPipeLineDataProps = {
    stages: string[];
};

const STAGE_SUB_LABELS = ["Lead", "Engage", "Conversion", "Closure"];

const normalizeLeadStatus = (lead: ApiLead): string => {
    const raw = (
        ((lead.lead_status as string | undefined) ??
            (lead as { status?: string }).status ??
            "new")
    )
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_");

    if (raw === "follow_ups" || raw === "followups" || raw === "follow_up") return "follow_up";
    if (raw === "cycle_conversion") return "cycle_conversion";
    if (raw === "appointment") return "appointment";
    if (raw === "converted") return "converted";
    if (raw === "lost") return "lost";
    if (raw === "contacted") return "contacted";

    return "new";
};

const stageToStatusCandidates = (stageName: string): string[] => {
    const value = stageName.toLowerCase();
    if (value.includes("follow") || value.includes("qualified")) return ["follow_up", "contacted"];
    if (value.includes("appointment") || value.includes("demo") || value.includes("presentation")) return ["appointment"];
    if (
        value.includes("register") ||
        value.includes("closed") ||
        value.includes("final") ||
        value.includes("won") ||
        value.includes("convert")
    ) return ["converted"];
    if (value.includes("lost")) return ["lost"];
    if (value.includes("cycle")) return ["cycle_conversion"];
    return ["new"];
};

const SalesPipeLineData = ({ stages }: SalesPipeLineDataProps) => {
    const theme = useTheme();
    const dispatch = useDispatch<AppDispatch>();
    const leads = useSelector(selectLeads) as ApiLead[];
    const leadsLoading = useSelector(selectLeadsLoading);
    
    const [selectedStageName, setSelectedStageName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const cardsContainerRef = useRef<HTMLDivElement | null>(null);
    
    // Using a ref for drag info to avoid unnecessary re-renders during mouse moves
    const dragInfo = useRef({
        isDown: false,
        startX: 0,
        scrollLeft: 0,
    });

    const stageHeaderColors = [
        alpha(theme.palette.primary.main, 0.16),
        alpha(theme.palette.warning.main, 0.14),
        alpha(theme.palette.info.main, 0.18),
        alpha(theme.palette.success.main, 0.16),
        alpha(theme.palette.secondary.main, 0.16),
        alpha(theme.palette.grey[500], 0.16),
    ];

    useEffect(() => {
        if (!leadsLoading && leads.length === 0) {
            dispatch(fetchLeads());
        }
    }, [dispatch, leads.length, leadsLoading]);

    const stageMetrics = useMemo(() => {
        const activeLeads = leads.filter((lead) => lead.is_active !== false);
        return stages.map((rawStage, index) => {
            const stageName = rawStage.replace(/^\d+\.\s*/, "");
            const statusCandidates = stageToStatusCandidates(stageName);
            const leadCount = activeLeads.filter((lead) =>
                statusCandidates.includes(normalizeLeadStatus(lead)),
            ).length;

            const nextStage = stages[index + 1];
            let conversionValue: number | null = null;

            if (nextStage) {
                const nextCandidates = stageToStatusCandidates(nextStage.replace(/^\d+\.\s*/, ""));
                const nextCount = activeLeads.filter((lead) =>
                    nextCandidates.includes(normalizeLeadStatus(lead)),
                ).length;
                conversionValue = leadCount > 0 ? Math.round((nextCount / leadCount) * 100) : 0;
            }

            return { rawStage, stageName, leadCount, conversionValue };
        });
    }, [leads, stages]);

    const isRegisteredSelected = selectedStageName
        ? selectedStageName.toLowerCase().includes("register")
        : false;

    // --- Drag Logic ---
    const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        if (!cardsContainerRef.current) return;
        
        dragInfo.current = {
            isDown: true,
            startX: event.pageX - cardsContainerRef.current.offsetLeft,
            scrollLeft: cardsContainerRef.current.scrollLeft,
        };
        setIsDragging(false); // Reset dragging state until movement occurs
    };

    const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
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

    const handleCardClick = (name: string) => {
        // Only open the configuration if we weren't just dragging
        if (!isDragging) {
            setSelectedStageName(name.trim());
        }
    };

    return (
        <Box
            sx={{
                width: "100%",
                minHeight: "74vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2.5,
                position: "relative",
            }}
        >
            <Box
                ref={cardsContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    gap: 0.9,
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    maxWidth: "100%",
                    pb: 1,
                    cursor: isDragging ? "grabbing" : "grab",
                    userSelect: "none", // Prevents text selection while dragging
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                    scrollBehavior: isDragging ? "auto" : "smooth",
                    "&::-webkit-scrollbar": { display: "none" },
                }}
            >
                {stageMetrics.map(({ rawStage, stageName, leadCount, conversionValue }, index) => {
                    const isSelectedStage = selectedStageName === stageName;

                    return (
                        <Box key={`${rawStage}-${index}`} sx={{ display: "flex", alignItems: "center", gap: 0.9, flexShrink: 0 }}>
                            <Box sx={{ position: "relative", pb: isSelectedStage ? 4 : 0 }}>
                                <Box
                                    onClick={() => handleCardClick(stageName)}
                                    sx={{
                                        width: 176,
                                        borderRadius: 2,
                                        border: `1px solid ${
                                            isSelectedStage
                                                ? alpha(theme.palette.primary.main, 0.45)
                                                : theme.palette.grey[200]
                                        }`,
                                        backgroundColor: theme.palette.background.paper,
                                        overflow: "hidden",
                                        cursor: isDragging ? "grabbing" : "pointer",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            px: 1.4,
                                            py: 1,
                                            backgroundColor: stageHeaderColors[index % stageHeaderColors.length],
                                        }}
                                    >
                                        <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                                            {stageName}
                                        </Typography>
                                        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.2 }}>
                                            {STAGE_SUB_LABELS[index] ?? `Stage ${index + 1}`}
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
                                                    backgroundColor: alpha(theme.palette.grey[300], 0.35),
                                                    color: theme.palette.text.secondary,
                                                }}
                                            >
                                                <Groups2OutlinedIcon sx={{ fontSize: 16 }} />
                                            </Box>
                                            <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
                                                {leadCount}
                                            </Typography>
                                            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                                                Leads
                                            </Typography>
                                        </Box>

                                        {index < stageMetrics.length - 1 && (
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
                                                        backgroundColor: alpha(theme.palette.grey[300], 0.35),
                                                        color: theme.palette.text.secondary,
                                                    }}
                                                >
                                                    <PublishedWithChangesOutlinedIcon sx={{ fontSize: 16 }} />
                                                </Box>
                                                <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
                                                    {conversionValue ?? 0}%
                                                </Typography>
                                                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                                                    Conv.
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                {isSelectedStage && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            left: "50%",
                                            bottom: 0,
                                            transform: "translate(-50%, 50%)",
                                            display: "flex",
                                            gap: 1,
                                            zIndex: 2,
                                        }}
                                    >
                                        <IconButton
                                            size="small"
                                            sx={{
                                                width: 28,
                                                height: 28,
                                                backgroundColor: alpha(theme.palette.info.main, 0.15),
                                                color: theme.palette.info.main,
                                                border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`,
                                            }}
                                        >
                                            <ContentCopyOutlinedIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            sx={{
                                                width: 28,
                                                height: 28,
                                                backgroundColor: alpha(theme.palette.error.main, 0.12),
                                                color: theme.palette.error.main,
                                                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                                            }}
                                        >
                                            <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                            <EastRoundedIcon sx={{ color: theme.palette.grey[400], fontSize: 18 }} />
                        </Box>
                    );
                })}

                <Box
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
                        cursor: "pointer",
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
                    <Typography sx={{ fontSize: 18, fontWeight: 700, textAlign: "center" }}>
                        Add New Stage
                    </Typography>
                </Box>
            </Box>

            {leadsLoading && (
                <Box sx={{ position: "absolute", right: 18, top: 18, display: "flex", alignItems: "center", gap: 0.8 }}>
                    <CircularProgress size={14} />
                    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Loading leads</Typography>
                </Box>
            )}

            <StageConfiguration
                open={isRegisteredSelected}
                stageName={selectedStageName ?? "Registered"}
                onClose={() => setSelectedStageName(null)}
            />
        </Box>
    );
};

export default SalesPipeLineData;