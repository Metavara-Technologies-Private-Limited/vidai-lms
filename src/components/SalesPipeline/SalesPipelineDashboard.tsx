import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RemoveIcon from "@mui/icons-material/Remove";
import {
	Box,
	Button,
	Dialog,
	IconButton,
	ListItemIcon,
	Menu,
	MenuItem,
	Paper,
	Stack,
	Typography,
	CircularProgress,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
	pipelineApi,
	type PipelineIndustryType,
	type PipelineStageType,
} from "../../services/pipeline.api";
import type { AppDispatch } from "../../store";
import { selectClinic } from "../../store/clinicSlice";
import { selectUser } from "../../store/authSlice";
import {
	hasAnySubcategoryActionPermission,
	resolveUserRole,
} from "../../utils/roleAccess";
import {
	createPipeline,
	createPipelineStage,
	fetchPipelineDetail,
	fetchPipelines,
	selectPipelineError,
	selectPipelineLoading,
	selectPipelines,
	selectSelectedPipeline,
	updatePipelineStage,
} from "../../store/pipelineSlice";
import CreateNewPipeline from "./CreateNewPipeline";
import SalesPipeLineData from "./SalesPipeLineData";

const INDUSTRY_LABEL_MAP: Record<string, string> = {
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

const STAGE_TYPE_SEQUENCE: PipelineStageType[] = [
	"lead",
	"engagement",
	"conversion",
	"closure",
];

const SalesPipelineDashboard = () => {
	const theme = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const clinic = useSelector(selectClinic);
	const user = useSelector(selectUser);
	const authUser = user as unknown as Record<string, unknown> | null;
	const role = resolveUserRole(authUser);
	const permissions = authUser?.permissions;
	const pipelineAliases = ["sales pipeline configuration", "pipeline", "sales pipeline"];
	const canViewPipeline =
		role === "super_admin" ||
		hasAnySubcategoryActionPermission(permissions, pipelineAliases, "view") ||
		hasAnySubcategoryActionPermission(permissions, pipelineAliases, "print");
	const canEditPipeline =
		role === "super_admin" ||
		hasAnySubcategoryActionPermission(permissions, pipelineAliases, "add") ||
		hasAnySubcategoryActionPermission(permissions, pipelineAliases, "edit");
	const pipelines = useSelector(selectPipelines);
	const selectedPipeline = useSelector(selectSelectedPipeline);
	const pipelineLoading = useSelector(selectPipelineLoading);
	const pipelineError = useSelector(selectPipelineError);
	const selectedPipelineId = selectedPipeline?.id ?? null;

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editPipelineData, setEditPipelineData] = useState<{ id: string; pipelineName: string; industry: string } | null>(null);
	const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
		null,
	);
	const [actionMenuPipelineId, setActionMenuPipelineId] = useState<string | null>(
		null,
	);
	const [confirmAction, setConfirmAction] = useState<"archive" | "delete" | null>(null);
	const [confirmPipelineId, setConfirmPipelineId] = useState<string | null>(null);
	const [actionInProgress, setActionInProgress] = useState(false);

	const chipBackgrounds = [
		alpha(theme.palette.primary.main, 0.14),
		alpha(theme.palette.warning.main, 0.16),
		alpha(theme.palette.info.main, 0.16),
		alpha(theme.palette.success.main, 0.16),
		alpha(theme.palette.secondary.main, 0.16),
		alpha(theme.palette.grey[500], 0.2),
	];

	useEffect(() => {
		if (!canViewPipeline) return;
		if (!clinic?.id) return;
		dispatch(fetchPipelines(clinic.id));
	}, [canViewPipeline, clinic?.id, dispatch]);

	useEffect(() => {
		if (!canViewPipeline) return;
		if (pipelineLoading || selectedPipeline || pipelines.length === 0) return;
		dispatch(fetchPipelineDetail(pipelines[0].id));
	}, [canViewPipeline, dispatch, pipelineLoading, pipelines, selectedPipeline]);

	useEffect(() => {
		if (!actionMenuAnchor) return;
		if (!actionMenuAnchor.isConnected || !document.body.contains(actionMenuAnchor)) {
			setActionMenuAnchor(null);
			setActionMenuPipelineId(null);
		}
	}, [actionMenuAnchor, pipelines]);

	const handleCreatePipelineSave = async ({
		pipelineName,
		industry,
	}: {
		pipelineName: string;
		industry: string;
	}) => {
		if (!canEditPipeline) return;
		if (!clinic?.id) return;

		if (editPipelineData) {
			try {
				setActionInProgress(true);
				await pipelineApi.update(editPipelineData.id, {
					pipeline_name: pipelineName,
					industry_type: industry as PipelineIndustryType,
					is_active: true,
				});
				await refreshPipelines();
				if (selectedPipelineId === editPipelineData.id) {
					await dispatch(fetchPipelineDetail(editPipelineData.id));
				}
			} finally {
				setActionInProgress(false);
				setEditPipelineData(null);
			}
		} else {
			dispatch(
				createPipeline({
					clinic_id: clinic.id,
					pipeline_name: pipelineName,
					industry_type: industry as PipelineIndustryType,
				}),
			);
		}
	};

	const handleOpenCreatePipeline = () => {
		if (!canEditPipeline) return;
		setEditPipelineData(null);
		setIsCreateModalOpen(true);
	};

	const handleOpenActionMenu = (
		event: React.MouseEvent<HTMLElement>,
		pipelineId: string,
	) => {
		if (!canEditPipeline) return;
		event.stopPropagation();
		setActionMenuPipelineId(pipelineId);
		setActionMenuAnchor(event.currentTarget);
	};

	const handleCloseActionMenu = () => {
		if (actionInProgress) return;
		setActionMenuAnchor(null);
		setActionMenuPipelineId(null);
	};

	const refreshPipelines = async () => {
		if (!clinic?.id) return;
		await dispatch(fetchPipelines(clinic.id));
	};

	const getActionPipeline = () => {
		if (!actionMenuPipelineId) return null;
		return pipelines.find((pipeline) => pipeline.id === actionMenuPipelineId) ?? null;
	};

	const handleEditPipeline = () => {
		if (!canEditPipeline) return;
		const pipeline = getActionPipeline();
		if (!pipeline) return;
		handleCloseActionMenu();
		setEditPipelineData({
			id: pipeline.id,
			pipelineName: pipeline.pipeline_name,
			industry: pipeline.industry_type,
		});
		window.setTimeout(() => {
			setIsCreateModalOpen(true);
		}, 0);
	};

	const handleDuplicatePipeline = async () => {
		if (!canEditPipeline) return;
		if (!actionMenuPipelineId) return;
		try {
			setActionInProgress(true);
			const duplicated = await pipelineApi.duplicate(actionMenuPipelineId);
			await refreshPipelines();
			await dispatch(fetchPipelineDetail(duplicated.id));
		} finally {
			setActionInProgress(false);
			handleCloseActionMenu();
		}
	};

	const handleArchivePipeline = () => {
		if (!canEditPipeline) return;
		if (!actionMenuPipelineId) return;
		handleCloseActionMenu();
		setConfirmPipelineId(actionMenuPipelineId);
		window.setTimeout(() => {
			setConfirmAction("archive");
		}, 0);
	};

	const handleDeletePipeline = () => {
		if (!canEditPipeline) return;
		if (!actionMenuPipelineId) return;
		handleCloseActionMenu();
		setConfirmPipelineId(actionMenuPipelineId);
		window.setTimeout(() => {
			setConfirmAction("delete");
		}, 0);
	};

	const handleCloseConfirmAction = () => {
		if (actionInProgress) return;
		setConfirmAction(null);
		setConfirmPipelineId(null);
	};

	const handleConfirmPipelineAction = async () => {
		if (!canEditPipeline) return;
		if (!confirmAction || !confirmPipelineId) return;
		try {
			setActionInProgress(true);
			if (confirmAction === "archive") {
				await pipelineApi.archive(confirmPipelineId);
				toast.success("Pipeline archived successfully.");
			} else {
				await pipelineApi.remove(confirmPipelineId);
				toast.success("Pipeline deleted successfully.");
			}
			await refreshPipelines();
			if (selectedPipelineId === confirmPipelineId) {
				setConfirmPipelineId(null);
			}
		} catch {
			toast.error(
				confirmAction === "archive"
					? "Failed to archive pipeline."
					: "Failed to delete pipeline.",
			);
		} finally {
			setActionInProgress(false);
			handleCloseConfirmAction();
		}
	};

	const createStageByName = async (stageName: string): Promise<boolean> => {
		if (!canEditPipeline) return false;
		if (!selectedPipelineId) return false;
		const trimmedStage = stageName.trim();
		if (!trimmedStage) return false;

		const nextStageType =
			STAGE_TYPE_SEQUENCE[
				Math.min(selectedPipeline?.stages.length ?? 0, STAGE_TYPE_SEQUENCE.length - 1)
			] ?? "lead";

		const stageExists = selectedPipeline?.stages.some(
			(stage) => stage.stage_name.toLowerCase() === trimmedStage.toLowerCase(),
		);
		if (stageExists) return false;

		try {
			await dispatch(
				createPipelineStage({
					pipeline_id: selectedPipelineId,
					stage_name: trimmedStage,
					stage_type: nextStageType,
					stage_status: "open",
					stage_order: (selectedPipeline?.stages.length ?? 0) + 1,
					entry_rule: "manual",
				}),
			).unwrap();
			return true;
		} catch {
			return false;
		}
	};

	const handleOpenAddStage = async (stageName?: string): Promise<boolean> => {
		if (!selectedPipelineId) return false;
		if (stageName && stageName.trim()) {
			return createStageByName(stageName);
		}
		return false;
	};

	const handleReorderStages = async (fromIndex: number, toIndex: number) => {
		if (!canEditPipeline) return;
		if (!selectedPipelineId || !selectedPipeline || fromIndex === toIndex) return;
		if (
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= selectedPipeline.stages.length ||
			toIndex >= selectedPipeline.stages.length
		) {
			return;
		}

		const nextStages = [...selectedPipeline.stages];
		const [movedStage] = nextStages.splice(fromIndex, 1);
		nextStages.splice(toIndex, 0, movedStage);

		for (const [index, stage] of nextStages.entries()) {
			const nextOrder = index + 1;
			if (stage.stage_order === nextOrder) continue;

			await dispatch(
				updatePipelineStage({
					pipelineId: selectedPipelineId,
					stageId: stage.id,
					payload: {
						stage_name: stage.stage_name,
						stage_type: stage.stage_type,
						stage_status: stage.stage_status,
						stage_order: nextOrder,
					},
				}),
			);
		}
	};

	const handleEditStage = async (
		stageIndex: number,
		updatedStageName: string,
	): Promise<boolean> => {
		if (!canEditPipeline) return false;
		if (!selectedPipelineId || !selectedPipeline) return false;
		if (stageIndex < 0 || stageIndex >= selectedPipeline.stages.length) return false;

		const trimmedStageName = updatedStageName.trim();
		if (!trimmedStageName) return false;

		const currentStage = selectedPipeline.stages[stageIndex];
		const duplicateName = selectedPipeline.stages.some(
			(stage, index) =>
				index !== stageIndex &&
				stage.stage_name.toLowerCase() === trimmedStageName.toLowerCase(),
		);
		if (duplicateName) return false;

		try {
			await dispatch(
				updatePipelineStage({
					pipelineId: selectedPipelineId,
					stageId: currentStage.id,
					payload: {
						stage_name: trimmedStageName,
						stage_type: currentStage.stage_type,
						stage_status: currentStage.stage_status,
						stage_order: currentStage.stage_order,
					},
				}),
			).unwrap();
			return true;
		} catch {
			return false;
		}
	};

	return (
		<Box sx={{ p: 0.5, overflow: "hidden" }}>
			{!canViewPipeline ? (
				<Typography sx={{ color: "#B45309", mb: 1.5 }}>
					You do not have permission to view sales pipeline.
				</Typography>
			) : null}
			<Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
				Sales Pipeline Configuration
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2.25 }}>
				Configure how leads flow, convert, and generate metrics across your
				business
			</Typography>

			<Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} sx={{ overflow: "hidden" }}>
				<Paper
					elevation={0}
					sx={{
						width: { xs: "100%", lg: 360 },
						flexShrink: 0,
						p: 1.5,
						borderRadius: 2,
						border: `1px solid ${theme.palette.grey[200]}`,
						backgroundColor: alpha(theme.palette.background.paper, 0.95),
						height: "74vh",
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
					}}
				>
					<Typography
						variant="subtitle2"
						sx={{ fontWeight: 700, color: "text.primary", mb: 1.5 }}
					>
						Pipelines
					</Typography>

					<Button
						fullWidth
						startIcon={<AddIcon fontSize="small" />}
						variant="outlined"
						onClick={handleOpenCreatePipeline}
						disabled={!canEditPipeline}
						sx={{
							justifyContent: "center",
							color: "text.primary",
							borderColor: theme.palette.grey[300],
							borderRadius: 2,
							fontWeight: 700,
							py: 1,
							mb: 1.75,
							backgroundColor: alpha(theme.palette.grey[200], 0.35),
							"&:hover": {
								borderColor: theme.palette.grey[400],
								backgroundColor: alpha(theme.palette.grey[200], 0.55),
							},
						}}
					>
						Create New Pipeline
					</Button>

					<Stack
						spacing={1.5}
						sx={{
							flex: 1,
							overflowY: "auto",
							overflowX: "hidden",
							pr: 0.3,
							msOverflowStyle: "none",
							scrollbarWidth: "none",
							"&::-webkit-scrollbar": { display: "none" },
						}}
					>
						{pipelineError ? (
							<Typography sx={{ fontSize: 13, color: theme.palette.error.main }}>
								{pipelineError}
							</Typography>
						) : null}

						{pipelineLoading && pipelines.length === 0 ? (
							<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
								<CircularProgress size={26} />
							</Box>
						) : null}

						{pipelines.map((pipeline) => {
							const isSelected = selectedPipelineId === pipeline.id;

							return (
								<Box
									key={pipeline.id}
									onClick={() => dispatch(fetchPipelineDetail(pipeline.id))}
									sx={{
										border: `1px solid ${
											isSelected
												? alpha(theme.palette.primary.main, 0.45)
												: theme.palette.grey[200]
										}`,
										borderRadius: 2,
										backgroundColor: theme.palette.background.paper,
										cursor: "pointer",
										overflow: "hidden",
										transition: "all 0.2s ease",
										"&:hover": {
											borderColor: alpha(theme.palette.primary.main, 0.4),
										},
									}}
								>
									<Box
										sx={{
											px: 1.5,
											py: 1.2,
											borderBottom:
												pipeline.stages.length > 0
													? `1px solid ${theme.palette.grey[100]}`
													: "none",
											display: "flex",
											alignItems: "flex-start",
											justifyContent: "space-between",
											backgroundColor: isSelected
												? alpha(theme.palette.primary.main, 0.04)
												: "transparent",
										}}
									>
										<Box>
											<Typography
												variant="body2"
												sx={{ fontWeight: 700, color: "text.primary" }}
											>
												{pipeline.pipeline_name}
											</Typography>
											<Typography
												variant="caption"
												sx={{
													textTransform: "uppercase",
													color: "text.secondary",
													letterSpacing: 0.6,
												}}
											>
												{INDUSTRY_LABEL_MAP[pipeline.industry_type] ?? pipeline.industry_type}
											</Typography>
										</Box>

										<IconButton
											size="small"
											sx={{ mt: -0.25, mr: -0.75 }}
											onClick={(event) =>
												handleOpenActionMenu(event, pipeline.id)
											}
											disabled={!canEditPipeline}
										>
											<MoreVertIcon fontSize="small" />
										</IconButton>
									</Box>

									{pipeline.stages.length > 0 ? (
										<Box
											sx={{ p: 1.5, display: "flex", flexWrap: "wrap", gap: 0.9 }}
										>
											{pipeline.stages.map((stage, index) => (
												<Box
													key={stage.id}
													sx={{
														px: 1.15,
														py: 0.5,
														borderRadius: 999,
														fontSize: 12,
														fontWeight: 600,
														color: "text.primary",
														backgroundColor:
															chipBackgrounds[index % chipBackgrounds.length],
													}}
												>
													{stage.stage_name}
												</Box>
											))}
										</Box>
									) : (
										<Box
											sx={{
												px: 1.5,
												py: 1.15,
												fontSize: 13,
												fontWeight: 500,
												color: "text.secondary",
												textAlign: "center",
												borderTop: `1px solid ${theme.palette.grey[100]}`,
											}}
										>
											No stages defined
										</Box>
									)}
								</Box>
							);
						})}
					</Stack>

					<Menu
						anchorEl={
							actionMenuAnchor && actionMenuAnchor.isConnected
								? actionMenuAnchor
								: null
						}
						open={Boolean(
							actionMenuPipelineId && actionMenuAnchor && actionMenuAnchor.isConnected,
						)}
						onClose={handleCloseActionMenu}
						anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
						transformOrigin={{ vertical: "top", horizontal: "right" }}
						MenuListProps={{
							sx: {
								px: 0.5,
								py: 0.5,
							},
						}}
						PaperProps={{
							sx: {
								mt: 0.9,
								width: 130,
								height: 174.94541931152344,
								borderRadius: "12px",
								border: "1px solid #ECECEC",
								boxShadow: "0 16px 34px rgba(25, 35, 58, 0.14)",
								overflow: "hidden",
								opacity: 1,
							},
						}}
					>
						<MenuItem
							onClick={handleEditPipeline}
							disabled={actionInProgress}
							sx={{
								minHeight: 42,
								px: 0.8,
								borderRadius: 1.5,
								fontSize: 12.5,
								fontWeight: 600,
								color: "#252525",
							}}
						>
							<ListItemIcon sx={{ minWidth: 28, color: "#5A88E8" }}>
								<EditOutlinedIcon sx={{ fontSize: 20 }} />
							</ListItemIcon>
							Edit
						</MenuItem>
						<MenuItem
							onClick={handleDuplicatePipeline}
							disabled={actionInProgress}
							sx={{
								minHeight: 42,
								px: 0.8,
								borderRadius: 1.5,
								fontSize: 12.5,
								fontWeight: 600,
								color: "#252525",
							}}
						>
							<ListItemIcon sx={{ minWidth: 28, color: "#5A88E8" }}>
								<ContentCopyOutlinedIcon sx={{ fontSize: 20 }} />
							</ListItemIcon>
							Duplicate
						</MenuItem>
						<MenuItem
							onClick={handleArchivePipeline}
							disabled={actionInProgress}
							sx={{
								minHeight: 42,
								px: 0.8,
								borderRadius: 1.5,
								fontSize: 12.5,
								fontWeight: 600,
								color: "#252525",
							}}
						>
							<ListItemIcon sx={{ minWidth: 28, color: "#5A88E8" }}>
								<ArchiveOutlinedIcon sx={{ fontSize: 20 }} />
							</ListItemIcon>
							Archive
						</MenuItem>
						<MenuItem
							onClick={handleDeletePipeline}
							disabled={actionInProgress}
							sx={{
								minHeight: 42,
								px: 0.8,
								borderRadius: 1.5,
								fontSize: 12.5,
								fontWeight: 600,
								color: "#CC4343",
							}}
						>
							<ListItemIcon sx={{ minWidth: 28, color: "#CC4343" }}>
								<DeleteOutlineOutlinedIcon sx={{ fontSize: 20 }} />
							</ListItemIcon>
							Delete
						</MenuItem>
					</Menu>
				</Paper>

				<Paper
					elevation={0}
					sx={{
						position: "relative",
						flex: 1,
						height: "74vh",
						borderRadius: 2,
						border: `1px solid ${theme.palette.grey[200]}`,
						backgroundColor: theme.palette.background.paper,
						backgroundImage: `radial-gradient(${alpha(
							theme.palette.grey[400],
							0.28,
						)} 0.8px, transparent 0.8px)`,
						backgroundSize: "16px 16px",
						overflow: "hidden",
					}}
				>
					<Box
						sx={{
							height: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							textAlign: "center",
							px: 2,
							overflow: "hidden",
						}}
					>
						{selectedPipeline ? (
							<SalesPipeLineData
								stages={selectedPipeline.stages.map((stage) => stage.stage_name)}
								onAddStage={handleOpenAddStage}
								onEditStage={handleEditStage}
								onReorderStages={handleReorderStages}
							/>
						) : pipelineLoading ? (
							<CircularProgress size={28} />
						) : (
							<Box>
								<Typography variant="h6" sx={{ fontWeight: 700, mb: 0.65 }}>
									No Pipeline Data Found
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Create a new pipeline or Select a pipeline to see the stages
									from left sidebar.
								</Typography>
								<Button
									startIcon={<AddIcon fontSize="small" />}
									variant="outlined"
									onClick={handleOpenCreatePipeline}
									sx={{
										mt: 1.5,
										borderRadius: 2,
										fontWeight: 700,
									}}
								>
									Create New Pipeline
								</Button>
							</Box>
						)}
					</Box>

					<Box
						sx={{
							position: "absolute",
							left: 14,
							bottom: 14,
							display: "flex",
							alignItems: "center",
							gap: 0.5,
						}}
					>
						<IconButton
							size="small"
							sx={{
								width: 26,
								height: 26,
								border: `1px solid ${theme.palette.grey[300]}`,
								backgroundColor: theme.palette.background.paper,
							}}
						>
							<RemoveIcon fontSize="small" />
						</IconButton>
						<Box
							sx={{
								px: 1,
								py: 0.3,
								fontSize: 12,
								fontWeight: 600,
								borderRadius: 1,
								border: `1px solid ${theme.palette.grey[300]}`,
								backgroundColor: theme.palette.background.paper,
							}}
						>
							150%
						</Box>
						<IconButton
							size="small"
							sx={{
								width: 26,
								height: 26,
								border: `1px solid ${theme.palette.grey[300]}`,
								backgroundColor: theme.palette.background.paper,
							}}
						>
							<AddIcon fontSize="small" />
						</IconButton>
					</Box>
				</Paper>
			</Stack>

			<CreateNewPipeline
				key={editPipelineData?.id ?? "create"}
				open={isCreateModalOpen}
				onClose={() => {
					setIsCreateModalOpen(false);
					setEditPipelineData(null);
				}}
				onSave={handleCreatePipelineSave}
				mode={editPipelineData ? "edit" : "create"}
				initialPipelineName={editPipelineData?.pipelineName}
				initialIndustry={editPipelineData?.industry}
			/>

			<Dialog
				open={confirmAction !== null}
				onClose={handleCloseConfirmAction}
				maxWidth="xs"
				fullWidth
			>
				<Box sx={{ p: 2.5, borderRadius: 3, textAlign: "center" }}>
					<Box
						sx={{
							mx: "auto",
							mb: 1.6,
							width: 92,
							height: 92,
							borderRadius: "50%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							backgroundColor:
								confirmAction === "delete"
									? alpha("#CF3D3D", 0.08)
									: alpha(theme.palette.warning.main, 0.12),
						}}
					>
						{confirmAction === "delete" ? (
							<DeleteOutlineOutlinedIcon sx={{ fontSize: 40, color: "#CF3D3D" }} />
						) : (
							<ArchiveOutlinedIcon
								sx={{ fontSize: 40, color: theme.palette.warning.dark }}
							/>
						)}
					</Box>

					<Typography
						sx={{
							fontFamily: "Montserrat",
							fontWeight: 700,
							fontSize: "20px",
							lineHeight: "100%",
							textAlign: "center",
							mb: 1.2,
						}}
					>
						{confirmAction === "delete" ? "Delete Stage" : "Archive Stage"}
					</Typography>
					<Typography
						sx={{
							fontFamily: "Montserrat",
							fontWeight: 700,
							fontSize: "14px",
							lineHeight: "22px",
							color: "#393939",
							mb: 2.5,
						}}
					>
						{confirmAction === "delete"
							? "This pipeline and its configuration will be permanently removed."
							: "This pipeline will be hidden but existing data will be preserved."}
					</Typography>

					<Stack direction="row" spacing={1.5}>
						<Button
							fullWidth
							variant="outlined"
							onClick={handleCloseConfirmAction}
							disabled={actionInProgress}
							sx={{
								borderRadius: 2,
								py: 1.2,
								fontWeight: 700,
								fontSize: 20,
								borderColor: "#E0E0E0",
								color: "#2D2D2D",
								backgroundColor: "#F0F0F0",
								"&:hover": { backgroundColor: "#EBEBEB", borderColor: "#D8D8D8" },
							}}
						>
							Cancel
						</Button>
						<Button
							fullWidth
							variant="contained"
							onClick={handleConfirmPipelineAction}
							disabled={actionInProgress}
							sx={{
								borderRadius: 2,
								py: 1.2,
								fontWeight: 700,
								fontSize: 20,
								backgroundColor: "#5A5A5A",
								"&:hover": { backgroundColor: "#4A4A4A" },
							}}
						>
							{confirmAction === "delete" ? "Delete" : "Archive"}
						</Button>
					</Stack>
				</Box>
			</Dialog>
		</Box>
	);
};

export default SalesPipelineDashboard;
