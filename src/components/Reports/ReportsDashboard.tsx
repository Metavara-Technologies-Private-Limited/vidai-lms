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
import { REPORTS_TABS } from "./reports.mockData";
import { CAMPAIGN_MODE, PLATFORMS } from "../../constants/campaigns.constants";
import { CampaignAPI } from "../../services/campaign.api";
import { LeadAPI, type Lead } from "../../services/leads.api";
import type { CampaignAPIType } from "../../types/campaigns.types";
import type {
  ReportChannelData,
  ReportTabKey,
  ReportTableRow,
} from "../../types/reports.types";
import { selectClinic } from "../../store/clinicSlice";
import { useSelector } from "react-redux";

type CampaignReportTab = Exclude<ReportTabKey, "call">;

const CAMPAIGN_REPORT_TABS: CampaignReportTab[] = [
  "facebook",
  "gmail",
  "instagram",
  "google-ads",
  "linkedin",
  "email",
];

const createEmptyReportData = (): ReportChannelData => ({
  cards: [
    { id: "impressions", label: "Total Impressions", value: "0" },
    { id: "clicks", label: "Total Clicks", value: "0" },
    { id: "conversions", label: "Conversions", value: "0" },
    { id: "spent", label: "Total Spend", value: "$0.00" },
    { id: "ctr", label: "CTR (Click-Through Rate)", value: "0.0%" },
    { id: "convRate", label: "Conversion Rate", value: "0.0%" },
    { id: "cpc", label: "CPC (Cost per Click)", value: "$0.00" },
    { id: "cpa", label: "CPA (Cost per Lead)", value: "$0.00" },
  ],
  rows: [],
});

const createInitialReportsData = (): Record<
  CampaignReportTab,
  ReportChannelData
> => {
  return CAMPAIGN_REPORT_TABS.reduce(
    (acc, tabKey) => {
      acc[tabKey] = createEmptyReportData();
      return acc;
    },
    {} as Record<CampaignReportTab, ReportChannelData>,
  );
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number): string => `$${value.toFixed(2)}`;

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const isEmailCampaign = (campaign: CampaignAPIType): boolean => {
  return (
    campaign.campaign_mode === CAMPAIGN_MODE.EMAIL ||
    (campaign.email?.length ?? 0) > 0
  );
};

const hasPlatform = (campaign: CampaignAPIType, platform: string): boolean => {
  return (campaign.social_media ?? []).some(
    (social) =>
      social.is_active !== false &&
      (social.platform_name ?? "").toLowerCase() === platform,
  );
};

const resolveSpend = (campaign: CampaignAPIType): number => {
  const budgetData = campaign.budget_data ?? {};
  const totalBudget = toNumber(budgetData.total);
  const summedBudget = Object.values(budgetData).reduce(
    (sum, value) => sum + toNumber(value),
    0,
  );
  return toNumber(campaign.total_spend) || totalBudget || summedBudget;
};

const toLeadCampaignId = (lead: Lead): string => {
  const raw = (lead as Lead & { campaign_id?: string | number | null })
    .campaign_id;
  if (raw === null || raw === undefined) return "";
  return String(raw);
};

const toLeadCampaignName = (lead: Lead): string => {
  const raw = (lead as Lead & { campaign_name?: string | null }).campaign_name;
  return String(raw ?? "")
    .trim()
    .toLowerCase();
};

const campaignMatchesTab = (
  campaign: CampaignAPIType,
  tabKey: CampaignReportTab,
): boolean => {
  if (tabKey === "gmail" || tabKey === "email")
    return isEmailCampaign(campaign);
  if (tabKey === "facebook") return hasPlatform(campaign, PLATFORMS.FACEBOOK);
  if (tabKey === "instagram") return hasPlatform(campaign, PLATFORMS.INSTAGRAM);
  if (tabKey === "linkedin") return hasPlatform(campaign, PLATFORMS.LINKEDIN);
  if (tabKey === "google-ads") return !isEmailCampaign(campaign);
  return false;
};

const mapCampaignToRow = (
  campaign: CampaignAPIType,
  leads: Lead[],
): ReportTableRow => {
  const campaignId = String(campaign.id);
  const campaignName = String(campaign.campaign_name ?? "Untitled Campaign");
  const normalizedCampaignName = campaignName.trim().toLowerCase();

  const linkedLeads = leads.filter((lead) => {
    const leadCampaignId = toLeadCampaignId(lead);
    const leadCampaignName = toLeadCampaignName(lead);
    return (
      leadCampaignId === campaignId ||
      (leadCampaignName && leadCampaignName === normalizedCampaignName)
    );
  });

  const totalImpressions =
    toNumber(campaign.impressions) || toNumber(campaign.fb_impressions);
  const totalClicks = toNumber(campaign.clicks) || toNumber(campaign.fb_clicks);
  const conversions = linkedLeads.length || toNumber(campaign.lead_generated);
  const spend = resolveSpend(campaign);

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const conversionRate =
    toNumber(campaign.conversion_rate) ||
    (totalClicks > 0 ? (conversions / totalClicks) * 100 : 0);
  const cpc =
    toNumber(campaign.cpc) || (totalClicks > 0 ? spend / totalClicks : 0);
  const cpa = conversions > 0 ? spend / conversions : 0;

  return {
    id: campaignId,
    campaignName,
    totalImpressions,
    totalClicks,
    conversions,
    totalSpend: formatCurrency(spend),
    ctr: formatPercent(ctr),
    conversionRate: formatPercent(conversionRate),
    cpc: formatCurrency(cpc),
    cpa: formatCurrency(cpa),
  };
};

const buildReportDataByTab = (
  campaigns: CampaignAPIType[],
  leads: Lead[],
): Record<CampaignReportTab, ReportChannelData> => {
  return CAMPAIGN_REPORT_TABS.reduce(
    (acc, tabKey) => {
      const rows = campaigns
        .filter((campaign) => campaignMatchesTab(campaign, tabKey))
        .map((campaign) => mapCampaignToRow(campaign, leads));

      const totals = rows.reduce(
        (sum, row) => {
          sum.impressions += row.totalImpressions;
          sum.clicks += row.totalClicks;
          sum.conversions += row.conversions;
          sum.spend += toNumber(row.totalSpend.replace(/[^0-9.-]+/g, ""));
          return sum;
        },
        { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
      );

      const totalCtr =
        totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      const totalConversionRate =
        totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
      const totalCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
      const totalCpa =
        totals.conversions > 0 ? totals.spend / totals.conversions : 0;

      acc[tabKey] = {
        cards: [
          {
            id: "impressions",
            label: "Total Impressions",
            value: totals.impressions.toLocaleString(),
          },
          {
            id: "clicks",
            label: "Total Clicks",
            value: totals.clicks.toLocaleString(),
          },
          {
            id: "conversions",
            label: "Conversions",
            value: totals.conversions.toLocaleString(),
          },
          {
            id: "spent",
            label: "Total Spend",
            value: formatCurrency(totals.spend),
          },
          {
            id: "ctr",
            label: "CTR (Click-Through Rate)",
            value: formatPercent(totalCtr),
          },
          {
            id: "convRate",
            label: "Conversion Rate",
            value: formatPercent(totalConversionRate),
          },
          {
            id: "cpc",
            label: "CPC (Cost per Click)",
            value: formatCurrency(totalCpc),
          },
          {
            id: "cpa",
            label: "CPA (Cost per Lead)",
            value: formatCurrency(totalCpa),
          },
        ],
        rows,
      };

      return acc;
    },
    {} as Record<CampaignReportTab, ReportChannelData>,
  );
};

const ReportsDashboard = () => {
  const navigate = useNavigate();
  const clinic = useSelector(selectClinic);
  const { tab } = useParams<{ tab?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [reportsData, setReportsData] = useState<
    Record<CampaignReportTab, ReportChannelData>
  >(createInitialReportsData);
  const [reportsLoading, setReportsLoading] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setReportsLoading(true);
        const [campaignResponse, leadsResponse] = await Promise.all([
          CampaignAPI.list(clinic?.id),
          clinic?.id ? LeadAPI.list(clinic.id) : Promise.resolve([]),
        ]);

        if (!isMounted) return;
        const campaigns = Array.isArray(campaignResponse.data)
          ? campaignResponse.data
          : [];
        const leads = Array.isArray(leadsResponse) ? leadsResponse : [];
        setReportsData(buildReportDataByTab(campaigns, leads));
      } catch (error) {
        console.error("Failed to fetch reports data:", error);
        if (!isMounted) return;
        setReportsData(createInitialReportsData());
      } finally {
        if (isMounted) {
          setReportsLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [clinic?.id]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const nextTab = REPORTS_TABS[newValue];
    if (nextTab) {
      navigate(`/reports/${nextTab.key}`);
    }
  };

  return (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="h6" pb={2}>
        Reports
      </Typography>

      <Box
        sx={{
          backgroundColor: "background.paper",
          borderRadius: 3,
          p: 0,
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
            placeholder="Search by campaign name"
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

        {reportsLoading && activeTab !== "call" && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading reports...
          </Typography>
        )}

        {activeTab === "facebook" && (
          <FacebookReport
            key={activeTab}
            data={reportsData.facebook ?? createEmptyReportData()}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "gmail" && (
          <GmailReports
            key={activeTab}
            data={reportsData.gmail ?? createEmptyReportData()}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "instagram" && (
          <InstagramReports
            key={activeTab}
            data={reportsData.instagram ?? createEmptyReportData()}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "google-ads" && (
          <GoogleAdsReports
            key={activeTab}
            data={reportsData["google-ads"] ?? createEmptyReportData()}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "linkedin" && (
          <LinkedinReports
            key={activeTab}
            data={reportsData.linkedin ?? createEmptyReportData()}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "email" && (
          <EmailReports
            key={activeTab}
            data={reportsData.email ?? createEmptyReportData()}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "call" && <CallReports searchQuery={searchQuery} />}
      </Box>
    </Box>
  );
};

export default ReportsDashboard;
