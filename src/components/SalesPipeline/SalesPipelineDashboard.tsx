import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
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
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	ListItemIcon,
	Menu,
	MenuItem,
	Paper,
	TextField,
	Stack,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CreateNewPipeline from "./CreateNewPipeline";
import SalesPipeLineData from "./SalesPipeLineData";

type PipelineCard = {
	id: string;
	title: string;
	category: string;
	stages: string[];
};

const INITIAL_PIPELINES: PipelineCard[] = [];

const INDUSTRY_LABEL_MAP: Record<string, string> = {
	healthcare: "HEALTHCARE",
	"ivf-fertility": "IVF & FERTILITY",
	"pharma-biotech": "PHARMA / BIOTECH",
	"diagnostics-lab": "DIAGNOSTICS LAB",
	"corporate-sales": "CORPORATE SALES",
	"education-training": "EDUCATION / TRAINING",
	"saas-technology": "SAAS / TECHNOLOGY",
	manufacturing: "MANUFACTURING",
	research: "RESEARCH",
	government: "GOVERNMENT",
	other: "OTHER",
};

const SalesPipelineDashboard = () => {
	const theme = useTheme();
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [pipelines, setPipelines] = useState<PipelineCard[]>(INITIAL_PIPELINES);
	const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(
		null,
	);
	const [isAddStageOpen, setIsAddStageOpen] = useState(false);
	const [newStageName, setNewStageName] = useState("");
	const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
		null,
	);

	const chipBackgrounds = [
		alpha(theme.palette.primary.main, 0.14),
		alpha(theme.palette.warning.main, 0.16),
		alpha(theme.palette.info.main, 0.16),
		alpha(theme.palette.success.main, 0.16),
		alpha(theme.palette.secondary.main, 0.16),
		alpha(theme.palette.grey[500], 0.2),
	];

	const selectedPipeline = pipelines.find(
		(pipeline) => pipeline.id === selectedPipelineId,
	);

	const handleCreatePipelineSave = ({
		pipelineName,
		industry,
	}: {
		pipelineName: string;
		industry: string;
	}) => {
		const newPipeline: PipelineCard = {
			id: `pipeline-${Date.now()}`,
			title: pipelineName,
			category: INDUSTRY_LABEL_MAP[industry] ?? industry.toUpperCase(),
			stages: [],
		};

		setPipelines((prevPipelines) => [newPipeline, ...prevPipelines]);
		setSelectedPipelineId(newPipeline.id);
	};

	const handleOpenActionMenu = (
		event: React.MouseEvent<HTMLElement>,
		pipelineId: string,
	) => {
		event.stopPropagation();
		setSelectedPipelineId(pipelineId);
		setActionMenuAnchor(event.currentTarget);
	};

	const handleCloseActionMenu = () => {
		setActionMenuAnchor(null);
	};

	const handleOpenAddStage = () => {
		if (!selectedPipelineId) return;
		setNewStageName("");
		setIsAddStageOpen(true);
	};

	const handleCloseAddStage = () => {
		setIsAddStageOpen(false);
		setNewStageName("");
	};

	const handleSaveStage = () => {
		const trimmedStage = newStageName.trim();
		if (!trimmedStage || !selectedPipelineId) return;

		setPipelines((prevPipelines) =>
			prevPipelines.map((pipeline) => {
				if (pipeline.id !== selectedPipelineId) return pipeline;

				const exists = pipeline.stages.some(
					(stage) => stage.toLowerCase() === trimmedStage.toLowerCase(),
				);
				if (exists) return pipeline;

				return {
					...pipeline,
					stages: [...pipeline.stages, trimmedStage],
				};
			}),
		);

		handleCloseAddStage();
	};

	const handleReorderStages = (fromIndex: number, toIndex: number) => {
		if (!selectedPipelineId || fromIndex === toIndex) return;

		setPipelines((prevPipelines) =>
			prevPipelines.map((pipeline) => {
				if (pipeline.id !== selectedPipelineId) return pipeline;
				if (
					fromIndex < 0 ||
					toIndex < 0 ||
					fromIndex >= pipeline.stages.length ||
					toIndex >= pipeline.stages.length
				) {
					return pipeline;
				}

				const nextStages = [...pipeline.stages];
				const [movedStage] = nextStages.splice(fromIndex, 1);
				nextStages.splice(toIndex, 0, movedStage);

				return {
					...pipeline,
					stages: nextStages,
				};
			}),
		);
	};

	return (
		<Box sx={{ p: 0.5 }}>
			<Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
				Sales Pipeline Configuration
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2.25 }}>
				Configure how leads flow, convert, and generate metrics across your
				business
			</Typography>

			<Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
				<Paper
					elevation={0}
					sx={{
						width: { xs: "100%", lg: 360 },
						flexShrink: 0,
						p: 1.5,
						borderRadius: 2,
						border: `1px solid ${theme.palette.grey[200]}`,
						backgroundColor: alpha(theme.palette.background.paper, 0.95),
						minHeight: "74vh",
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
						onClick={() => setIsCreateModalOpen(true)}
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

					<Stack spacing={1.5}>
						{pipelines.map((pipeline) => {
							const isSelected = selectedPipelineId === pipeline.id;

							return (
								<Box
									key={pipeline.id}
									onClick={() => setSelectedPipelineId(pipeline.id)}
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
												{pipeline.title}
											</Typography>
											<Typography
												variant="caption"
												sx={{
													textTransform: "uppercase",
													color: "text.secondary",
													letterSpacing: 0.6,
												}}
											>
												{pipeline.category}
											</Typography>
										</Box>

										<IconButton
											size="small"
											sx={{ mt: -0.25, mr: -0.75 }}
											onClick={(event) =>
												handleOpenActionMenu(event, pipeline.id)
											}
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
													key={stage}
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
													{stage}
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
						anchorEl={actionMenuAnchor}
						open={Boolean(actionMenuAnchor)}
						onClose={handleCloseActionMenu}
						anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
						transformOrigin={{ vertical: "top", horizontal: "right" }}
						PaperProps={{
							sx: {
								mt: 0.6,
								minWidth: 130,
								borderRadius: 2,
								border: `1px solid ${theme.palette.grey[200]}`,
								boxShadow: "0 12px 24px rgba(31, 41, 55, 0.12)",
							},
						}}
					>
						<MenuItem
							onClick={handleCloseActionMenu}
							sx={{ minHeight: 34, fontSize: 13.5, fontWeight: 500 }}
						>
							<ListItemIcon sx={{ minWidth: 30, color: "#4E83F1" }}>
								<EditOutlinedIcon fontSize="small" />
							</ListItemIcon>
							Edit
						</MenuItem>
						<MenuItem
							onClick={handleCloseActionMenu}
							sx={{ minHeight: 34, fontSize: 13.5, fontWeight: 500 }}
						>
							<ListItemIcon sx={{ minWidth: 30, color: "#4E83F1" }}>
								<ContentCopyOutlinedIcon fontSize="small" />
							</ListItemIcon>
							Duplicate
						</MenuItem>
						<MenuItem
							onClick={handleCloseActionMenu}
							sx={{ minHeight: 34, fontSize: 13.5, fontWeight: 500 }}
						>
							<ListItemIcon sx={{ minWidth: 30, color: "#4E83F1" }}>
								<ArchiveOutlinedIcon fontSize="small" />
							</ListItemIcon>
							Archive
						</MenuItem>
						<MenuItem
							onClick={handleCloseActionMenu}
							sx={{ minHeight: 34, fontSize: 13.5, fontWeight: 500, color: "#EF4444" }}
						>
							<ListItemIcon sx={{ minWidth: 30, color: "#EF4444" }}>
								<DeleteOutlineOutlinedIcon fontSize="small" />
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
						minHeight: "74vh",
						borderRadius: 2,
						border: `1px solid ${theme.palette.grey[200]}`,
						backgroundColor: theme.palette.background.paper,
						backgroundImage: `radial-gradient(${alpha(
							theme.palette.grey[400],
							0.28,
						)} 0.8px, transparent 0.8px)`,
						backgroundSize: "16px 16px",
					}}
				>
					<Box
						sx={{
							height: "100%",
							minHeight: "74vh",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							textAlign: "center",
							px: 2,
						}}
					>
						{selectedPipeline && selectedPipeline.stages.length > 0 ? (
							<SalesPipeLineData
								stages={selectedPipeline.stages}
								onAddStage={handleOpenAddStage}
								onReorderStages={handleReorderStages}
							/>
						) : selectedPipeline && selectedPipeline.stages.length === 0 ? (
							<Box
								onClick={handleOpenAddStage}
								sx={{
									width: 146,
									height: 172,
									borderRadius: 2,
									border: `1px dashed ${theme.palette.grey[300]}`,
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									gap: 1,
									cursor: "pointer",
									backgroundColor: alpha(theme.palette.background.paper, 0.65),
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
								<Typography sx={{ fontSize: 26, fontWeight: 700 }}>
									Add Stage
								</Typography>
							</Box>
						) : (
							<Box>
								<Typography variant="h6" sx={{ fontWeight: 700, mb: 0.65 }}>
									No Pipeline Data Found
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Create a new pipeline or Select a pipeline to see the stages
									from left sidebar.
								</Typography>
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

			<Dialog open={isAddStageOpen} onClose={handleCloseAddStage} maxWidth="xs" fullWidth>
				<DialogTitle>Add Stage</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						margin="dense"
						label="Stage Name"
						placeholder="e.g. Registered, Counselling, Application Submitted"
						value={newStageName}
						onChange={(event) => setNewStageName(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleSaveStage();
							}
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseAddStage}>Cancel</Button>
					<Button onClick={handleSaveStage} variant="contained" disabled={!newStageName.trim()}>
						Add Stage
					</Button>
				</DialogActions>
			</Dialog>

			<CreateNewPipeline
				open={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onSave={handleCreatePipelineSave}
			/>
		</Box>
	);
};

export default SalesPipelineDashboard;
