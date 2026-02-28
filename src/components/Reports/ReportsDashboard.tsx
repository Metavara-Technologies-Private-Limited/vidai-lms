import SearchIcon from "@mui/icons-material/Search";
import {
	Box,
	InputAdornment,
	Tab,
	Tabs,
	TextField,
	Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FacebookReport from "./FacebookReport";
import GmailReports from "./GmailReports";
import InstagramReports from "./InstagramReports";
import GoogleAdsReports from "./GoogleAdsReports";
import LinkedinReports from "./LinkedinReports";
import EmailReports from "./EmailReports";
import CallReports from "./CallReports";
import { REPORTS_MOCK_DATA, REPORTS_TABS } from "./reports.mockData";
import type { ReportTabKey } from "../../types/reports.types";

const ReportsDashboard = () => {
	const navigate = useNavigate();
	const { tab } = useParams<{ tab?: string }>();
	const [searchQuery, setSearchQuery] = useState("");

	const activeTab = useMemo<ReportTabKey>(() => {
		return REPORTS_TABS.find((item) => item.key === tab)?.key || "facebook";
	}, [tab]);

	const activeTabIndex = useMemo(() => {
		return REPORTS_TABS.findIndex((item) => item.key === activeTab);
	}, [activeTab]);

	useEffect(() => {
		if (!tab || !REPORTS_TABS.some((item) => item.key === tab)) {
			navigate("/reports/facebook", { replace: true });
		}
	}, [navigate, tab]);

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		const nextTab = REPORTS_TABS[newValue];
		if (nextTab) {
			navigate(`/reports/${nextTab.key}`);
		}
	};

	return (
		<Box sx={{ px: 2, pt: 1 }}>
			<Typography variant="h6" pb={2}>
				Reports
			</Typography>

			<Box
				sx={{
					backgroundColor: "background.paper",
					borderRadius: 3,
					p: 2,
					border: "none",
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: { xs: "stretch", md: "center" },
						flexDirection: { xs: "column", md: "row" },
						justifyContent: "space-between",
						gap: 2,
					}}
				>
					<Tabs
						value={activeTabIndex === -1 ? 0 : activeTabIndex}
						onChange={handleTabChange}
						variant="scrollable"
						scrollButtons={false}
						TabIndicatorProps={{ style: { display: "none" } }}
						sx={{
							minHeight: 36,
							"& .MuiTabs-flexContainer": {
								gap: "12px",
							},
						}}
					>
						{REPORTS_TABS.map((item, index) => {
							const isActive = index === activeTabIndex;
							return (
								<Tab
									key={item.key}
									label={item.label}
									sx={{
										textTransform: "none",
										minWidth: "auto",
										padding: "6px 24px",
										borderRadius: "12px",
										border: "1px solid",
										borderColor: isActive ? "#F87171" : "#E5E7EB",
										fontSize: "13px",
										fontWeight: 600,
										color: isActive ? "#F87171" : "#6B7280",
										backgroundColor: isActive ? "#FFF7F5" : "#F9FAFB",
										minHeight: "36px",
										"&.Mui-selected": {
											color: "#F87171",
										},
									}}
								/>
							);
						})}
					</Tabs>

					<TextField
						size="small"
						placeholder="Search by report name"
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						sx={{ minWidth: { xs: "100%", md: 260 } }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon fontSize="small" />
								</InputAdornment>
							),
						}}
					/>
				</Box>

				{activeTab === "facebook" && (
					<FacebookReport key={activeTab} data={REPORTS_MOCK_DATA.facebook} searchQuery={searchQuery} />
				)}
				{activeTab === "gmail" && <GmailReports searchQuery={searchQuery} />}
				{activeTab === "instagram" && <InstagramReports searchQuery={searchQuery} />}
				{activeTab === "google-ads" && <GoogleAdsReports searchQuery={searchQuery} />}
				{activeTab === "linkedin" && <LinkedinReports searchQuery={searchQuery} />}
				{activeTab === "email" && <EmailReports searchQuery={searchQuery} />}
				{activeTab === "call" && <CallReports searchQuery={searchQuery} />}
			</Box>
		</Box>
	);
};

export default ReportsDashboard;
