import {
  Box,
  Typography,
  Stack,
  Avatar,
  Card,
  Chip,
  Grid,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { mockData } from "./mockData";
import type { TimeRange } from "./TimeRangeSelector";
import { selectLeads } from "../../store/leadSlice";
import { selectCampaign } from "../../store/campaignSlice";
import type { Lead } from "../../services/leads.api";
import type{
  TeamMember,
  MedalType,
  MemberStats,
  PerformanceChartPoint,
} from "../../types/dashboard.types";

type CampaignItem = {
  id?: string | number;
  campaign_name?: string;
  campaign_mode?: number;
  assigned_to_id?: number;
  assigned_to_name?: string;
  status?: string;
  is_active?: boolean;
};

type DerivedMemberStats = MemberStats & {
  campaigns: number;
  conversionRate: number;
  revenueValue: number;
  slaValue: number;
  lostLeads: number;
};

const normalizeLeadStatus = (status?: string | null): string => {
  if (!status) return "";
  const value = status.toLowerCase().trim().replace(/[_\s]+/g, "-");
  if (value === "new" || value === "new-lead" || value === "new-leads") return "new";
  if (value === "appointment" || value === "appointments") return "appointment";
  if (value.includes("follow")) return "follow-ups";
  if (value === "converted") return "converted";
  if (value === "cycle-conversion" || value === "cycleconversion") return "cycle-conversion";
  if (value === "lost") return "lost";
  return value;
};

const monthKeys = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatInteger = (value: number): string => value.toLocaleString("en-US");

// Medal Icon Component
const MedalIcon = ({ type }: { type: MedalType }) => {

  const colors = {
    gold: "#FFD467",
    silver: "#C0C0C0",
    bronze: "#CD7F32"
  };
  
  const color = type === "1st" ? colors.gold : type === "2nd" ? colors.silver : colors.bronze;
  
  return (
    <Box
      sx={{
        position: "relative",
        width: "16px",
        height: "16px",
        boxShadow: "inset 0px -2px 4px rgba(255, 255, 255, 0.4)",
        filter: `drop-shadow(0px 8px 10px ${type === "1st" ? "rgba(255, 212, 103, 0.3)" : "rgba(0, 0, 0, 0.2)"})`,
        borderRadius: "0px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        mr: 0.5
      }}
    >
      {/* Top Circle (Medal) */}
      <Box
        sx={{
          position: "absolute",
          left: "21.88%",
          right: "21.88%",
          top: "8.33%",
          bottom: "37.5%",
          background: color,
          borderRadius: "50%",
          boxShadow: `inset 0px -1px 2px rgba(0, 0, 0, 0.2)`
        }}
      />
      {/* Ribbon */}
      <Box
        sx={{
          position: "absolute",
          left: "31.25%",
          right: "31.25%",
          top: "64.81%",
          bottom: "8.29%",
          background: color,
          clipPath: "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)"
        }}
      />
    </Box>
  );
};

interface TeamPerformanceTabProps {
  timeRange: TimeRange;
}

const TeamPerformanceTab = ({ timeRange }: TeamPerformanceTabProps) => {
  const leads = useSelector(selectLeads) as Lead[];
  const campaigns = useSelector(selectCampaign) as CampaignItem[];
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const { members, overview, memberStatsMap, memberPerformanceMap } = useMemo(() => {
    const activeLeads = (leads || []).filter((lead) => lead.is_active !== false);

    if (activeLeads.length === 0) {
      return {
        members: mockData.overview.teamPerformance.members,
        overview: mockData.overview.teamPerformance.overview,
        memberStatsMap: {} as Record<string, DerivedMemberStats>,
        memberPerformanceMap: {} as Record<string, PerformanceChartPoint[]>,
      };
    }

    const memberMap = new Map<string, DerivedMemberStats & { name: string; role: string; img: string }>();

    activeLeads.forEach((lead) => {
      const memberName = (lead.assigned_to_name || "Unassigned").trim() || "Unassigned";
      const memberId = lead.assigned_to_id ? String(lead.assigned_to_id) : memberName.toLowerCase();
      const key = `${memberId}::${memberName}`;

      if (!memberMap.has(key)) {
        memberMap.set(key, {
          name: memberName,
          role: "Team Member",
          img: "",
          assignedLeads: 0,
          callsMade: 0,
          followUps: 0,
          appointments: 0,
          leadConverted: 0,
          revenueGenerated: "$0",
          slaCompliance: "0%",
          campaigns: 0,
          conversionRate: 0,
          revenueValue: 0,
          slaValue: 0,
          lostLeads: 0,
        });
      }

      const stats = memberMap.get(key)!;
      stats.assignedLeads += 1;

      const normalizedStatus = normalizeLeadStatus(lead.lead_status);
      if (normalizedStatus === "appointment") stats.appointments += 1;
      if (normalizedStatus === "follow-ups") stats.followUps += 1;
      if (normalizedStatus === "converted" || normalizedStatus === "cycle-conversion") stats.leadConverted += 1;
      if (normalizedStatus === "lost") stats.lostLeads += 1;

      const actionType = (lead.next_action_type || "").toLowerCase();
      if (actionType.includes("call") || normalizedStatus === "follow-ups") {
        stats.callsMade += 1;
      }

      const referenceDate = new Date(lead.modified_at || lead.created_at);
      if (!Number.isNaN(referenceDate.getTime())) {
        // eslint-disable-next-line react-hooks/purity
        const hoursSinceTouch = (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceTouch <= 24) {
          stats.slaValue += 1;
        }
      }
    });

    (campaigns || []).forEach((campaign) => {
      const ownerName = (campaign.assigned_to_name || "").trim();
      if (!ownerName) return;

      const matchedEntry = Array.from(memberMap.entries()).find(([, stats]) => stats.name === ownerName);
      if (!matchedEntry) return;

      const [key, stats] = matchedEntry;
      memberMap.set(key, { ...stats, campaigns: stats.campaigns + 1 });
    });

    const membersWithStats = Array.from(memberMap.values()).map((stats) => {
      const conversionRate = stats.assignedLeads > 0 ? (stats.leadConverted / stats.assignedLeads) * 100 : 0;
      const growthBase = stats.assignedLeads > 0
        ? ((stats.leadConverted - stats.lostLeads) / stats.assignedLeads) * 100
        : 0;
      const slaPercent = stats.assignedLeads > 0 ? (stats.slaValue / stats.assignedLeads) * 100 : 0;
      const revenueValue = stats.leadConverted * 750 + stats.campaigns * 120;

      const growth = `${growthBase >= 0 ? "+" : ""}${growthBase.toFixed(1)}%`;

      return {
        ...stats,
        role: stats.campaigns > 0 ? "Campaign + Leads" : "Leads",
        conversionRate,
        growth,
        slaValue: slaPercent,
        revenueValue,
        revenueGenerated: `$${revenueValue.toLocaleString("en-US")}`,
        slaCompliance: `${slaPercent.toFixed(1)}%`,
      };
    });

    membersWithStats.sort((a, b) =>
      b.leadConverted - a.leadConverted || b.assignedLeads - a.assignedLeads
    );

    const rankedMembers: TeamMember[] = membersWithStats.map((member, index) => ({
      name: member.name,
      role: member.role,
      img: member.img,
      growth: member.growth,
      rank: index === 0 ? "1st (Top)" : index === 1 ? "2nd" : index === 2 ? "3rd" : undefined,
    }));

    const totals = membersWithStats.reduce(
      (acc, member) => {
        acc.calls += member.callsMade;
        acc.followUps += member.followUps;
        acc.appointments += member.appointments;
        acc.converted += member.leadConverted;
        acc.assigned += member.assignedLeads;
        acc.revenue += member.revenueValue;
        acc.sla += member.slaValue;
        return acc;
      },
      { calls: 0, followUps: 0, appointments: 0, converted: 0, assigned: 0, revenue: 0, sla: 0 },
    );

    const teamOverview = {
      calls: formatInteger(totals.calls),
      followUps: formatInteger(totals.followUps),
      appointments: formatInteger(totals.appointments),
      converted: formatInteger(totals.converted),
      rate: `${totals.assigned > 0 ? ((totals.converted / totals.assigned) * 100).toFixed(1) : "0.0"}%`,
      revenue: `$${totals.revenue.toLocaleString("en-US")}`,
      sla: `${membersWithStats.length > 0 ? (totals.sla / membersWithStats.length).toFixed(1) : "0.0"}%`,
    };

    const derivedMemberStatsMap: Record<string, DerivedMemberStats> = {};
    membersWithStats.forEach((member) => {
      derivedMemberStatsMap[member.name] = {
        assignedLeads: member.assignedLeads,
        callsMade: member.callsMade,
        followUps: member.followUps,
        appointments: member.appointments,
        leadConverted: member.leadConverted,
        revenueGenerated: member.revenueGenerated,
        slaCompliance: member.slaCompliance,
        campaigns: member.campaigns,
        conversionRate: member.conversionRate,
        revenueValue: member.revenueValue,
        slaValue: member.slaValue,
        lostLeads: member.lostLeads,
      };
    });

    const memberPerformance: Record<string, PerformanceChartPoint[]> = {};
    membersWithStats.forEach((member) => {
      const monthlyTotals = new Array<number>(12).fill(0);
      const monthlyConverted = new Array<number>(12).fill(0);

      activeLeads
        .filter((lead) => (lead.assigned_to_name || "Unassigned") === member.name)
        .forEach((lead) => {
          const date = new Date(lead.modified_at || lead.created_at);
          if (Number.isNaN(date.getTime())) return;
          const month = date.getMonth();
          monthlyTotals[month] += 1;

          const status = normalizeLeadStatus(lead.lead_status);
          if (status === "converted" || status === "cycle-conversion") {
            monthlyConverted[month] += 1;
          }
        });

      memberPerformance[member.name] = monthKeys.map((month, index) => {
        const total = monthlyTotals[index];
        const converted = monthlyConverted[index];
        const value = total > 0 ? Math.round((converted / total) * 100) : 0;
        return { month, value };
      });
    });

    return {
      members: rankedMembers,
      overview: teamOverview,
      memberStatsMap: derivedMemberStatsMap,
      memberPerformanceMap: memberPerformance,
    };
  }, [leads, campaigns]);

  const topPerformer = members.find((m) => m.rank === "1st (Top)");
  const otherTops = members.filter((m) => m.rank === "2nd" || m.rank === "3rd");
  const lowPerformers = members.filter((m) => m.growth.startsWith("-"));

const fullPerformanceData: PerformanceChartPoint[] =
  selectedMember ? (memberPerformanceMap[selectedMember.name] || []) : [];

const pointsToShow =
  timeRange === "today"
    ? 1
    : timeRange === "week"
      ? 3
      : timeRange === "month"
        ? 6
        : 12;

const performanceData: PerformanceChartPoint[] = fullPerformanceData.slice(
  Math.max(0, fullPerformanceData.length - pointsToShow),
);

const memberStats: MemberStats | null =
  selectedMember ? (memberStatsMap[selectedMember.name] || null) : null;
const stats = memberStats!;
const pointDivisor = Math.max(1, performanceData.length - 1);

  return (
    <Box sx={{ p: 2, height: "calc(100vh - 200px)", overflowY: "auto" }}>
      
      {/* 1. Member Avatar Bar */}
      <Stack direction="row" spacing={3} sx={{ mb: 4, overflowX: "auto", pb: 1 }}>
        <Stack alignItems="center" spacing={1} sx={{ cursor: "pointer" }} onClick={() => setSelectedMember(null)}>
          <Avatar
            sx={{
              bgcolor: selectedMember === null ? "#fff5f5" : "#f5f5f5",
              border: selectedMember === null ? "2px solid #ff6b6b" : "2px solid transparent",
              width: 56,
              height: 56,
              color: "#ff6b6b",
            }}
          >
            <Box component="span" sx={{ fontSize: "20px" }}>👥</Box>
          </Avatar>
          <Typography variant="caption" color="error" fontWeight={600}>All</Typography>
        </Stack>
        {members.map((member) => (
          <Stack 
            key={member.name} 
            alignItems="center" 
            spacing={1} 
            sx={{ cursor: "pointer", position: "relative" }}
            onClick={() => setSelectedMember(member)}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={member.img}
                sx={{
                  width: 56,
                  height: 56,
                  border: selectedMember?.name === member.name ? "2px solid #1976d2" : "2px solid transparent",
                  opacity: selectedMember && selectedMember?.name !== member.name ? 0.5 : 1,
                }}
              />
              {member.rank && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -2,
                    right: 8,
                    width: "20px",
                    height: "20px",
                    bgcolor: "white",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0px 2px 4px rgba(0,0,0,0.1)"
                  }}
                >
                  <MedalIcon 
                    type={member.rank === "1st (Top)" ? "1st" : member.rank === "2nd" ? "2nd" : "3rd"} 
                  />
                </Box>
              )}
            </Box>
            <Typography variant="caption" sx={{ whiteSpace: "nowrap", fontSize: "10px" }}>
              {member.name}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
        {selectedMember ? `${selectedMember.name}'s Performance Overview` : "Team Performance Overview"}
      </Typography>

      {/* INDIVIDUAL MEMBER VIEW */}
      {selectedMember ? (
        <>
          {/* Member Stats Card */}
          <Card sx={{ p: 2, mb: 3, borderRadius: "12px", border: "1px solid #fff0f0", bgcolor: "#fffcfc", boxShadow: 'none' }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {selectedMember.rank && <MedalIcon type={selectedMember.rank === "1st (Top)" ? "1st" : selectedMember.rank === "2nd" ? "2nd" : "3rd"} />}
                <Typography variant="caption" color="success.main" fontWeight={700}>{selectedMember.growth}</Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-around"
              divider={<Box sx={{ width: "1px", bgcolor: "#f0f0f0", height: 40 }} />}
              sx={{ flexWrap: "wrap" }}
            >
              <Box sx={{ textAlign: "center", minWidth: "100px" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", display: "block" }}>Assigned Leads</Typography>
                <Typography variant="h6" fontWeight={700}>{stats.assignedLeads}
</Typography>
              </Box>
              <Box sx={{ textAlign: "center", minWidth: "100px" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", display: "block" }}>Calls Made</Typography>
                <Typography variant="h6" fontWeight={700}>{stats.callsMade}</Typography>
              </Box>
              <Box sx={{ textAlign: "center", minWidth: "100px" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", display: "block" }}>Follow-Ups</Typography>
                <Typography variant="h6" fontWeight={700}>{stats.followUps}</Typography>
              </Box>
              <Box sx={{ textAlign: "center", minWidth: "100px" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", display: "block" }}>Appointments</Typography>
                <Typography variant="h6" fontWeight={700}>{stats.appointments}</Typography>
              </Box>
              <Box sx={{ textAlign: "center", minWidth: "100px" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", display: "block" }}>Lead Converted</Typography>
                <Typography variant="h6" fontWeight={700}>{stats.leadConverted}</Typography>
              </Box> 
              <Box sx={{ textAlign: "center", minWidth: "100px" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", display: "block" }}>Revenue Generated</Typography>
                <Typography variant="h6" fontWeight={700}>{stats.revenueGenerated}</Typography>
              </Box>
              <Box sx={{ textAlign: "center", minWidth: "100px" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", display: "block" }}>SLA Compliance</Typography>
                <Typography variant="h6" fontWeight={700}>{stats.slaCompliance}</Typography>
              </Box>
            </Stack>
          </Card>

          {/* Performance Chart */}
          <Card sx={{ p: 3, borderRadius: "12px", border: "1px solid #f0f0f0", boxShadow: 'none' }}>
            <Box sx={{ height: 300, position: "relative" }}>
              {/* Y-axis labels */}
              <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 30, display: "flex", flexDirection: "column", justifyContent: "space-between", pr: 1 }}>
                {[100, 80, 60, 40, 20, 0].map(val => (
                  <Typography key={val} variant="caption" sx={{ fontSize: "10px", color: "text.secondary" }}>{val}</Typography>
                ))}
              </Box>

              {/* Chart area */}
              <Box sx={{ position: "absolute", left: 30, right: 0, top: 0, bottom: 0 }}>
                <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 20, 40, 60, 80, 100].map((val) => (
                    <line
                      key={val}
                      x1="0"
                      y1={300 - (val * 2.7)}
                      x2="800"
                      y2={300 - (val * 2.7)}
                      stroke="#f0f0f0"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Line chart */}
                  <polyline
                    points={performanceData.map((d, i) => `${(i * 800) / pointDivisor},${300 - (d.value * 2.7)}`).join(" ")}
                    fill="none"
                    stroke="#5b8def"
                    strokeWidth="3"
                  />

                  {/* Data points */}
                  {performanceData.map((d, i) => (
                    <g key={i}>
                      <circle
                        cx={(i * 800) / pointDivisor}
                        cy={300 - (d.value * 2.7)}
                        r="5"
                        fill="#5b8def"
                      />
                      {/* Show percentage on some points */}
                      {i % 3 === 1 && (
                        <text
                          x={(i * 800) / pointDivisor}
                          y={300 - (d.value * 2.7) - 10}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#666"
                        >
                          {d.value}%
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                {/* X-axis labels */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                  {performanceData.map((d, i) => (
                    <Typography key={i} variant="caption" sx={{ fontSize: "10px", color: "text.secondary" }}>
                      {d.month}
                    </Typography>
                  ))}
                </Box>
                <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 1, fontSize: "10px", color: "text.secondary" }}>
                  Time Period
                </Typography>
              </Box>
            </Box>
          </Card>
        </>
      ) : (
        /* TEAM OVERVIEW */
        <>
          {/* 2. Horizontal Stats Overview Card */}
          <Card sx={{ p: 2, mb: 4, borderRadius: "12px", border: "1px solid #fff0f0", bgcolor: "#fffcfc", boxShadow: 'none' }}>
            <Stack
              direction="row"
              justifyContent="space-around"
              divider={<Box sx={{ width: "1px", bgcolor: "#f0f0f0", height: 30 }} />}
            >
              {Object.entries(overview).map(([key, val]) => (
                <Box key={key} sx={{ textAlign: "left" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px", display: "block" }}>
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>{val}</Typography>
                </Box>
              ))}
            </Stack>
          </Card>

          {/* 3 & 4. Performance Content Grid */}
          {/* Note: In MUI v6/Grid2, container prop is optional but used for spacing */}
          <Grid container spacing={3}>
        {/* Left Column: Top Performers */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Top Performers</Typography>

          {topPerformer && (
            <Card sx={{ p: 3, mb: 3, borderRadius: "16px", position: "relative", border: "1px solid #f0f0f0", boxShadow: 'none' }}>
              <Chip
                icon={<MedalIcon type="1st" />}
                label="1st (Top)"
                size="small"
                sx={{ 
                  position: "absolute", 
                  right: 20, 
                  top: 20, 
                  bgcolor: "#fff9c4", 
                  color: "#fbc02d", 
                  fontWeight: 700,
                  "& .MuiChip-icon": {
                    ml: 0.5,
                    mr: -0.25
                  }
                }}
              />
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Avatar src={topPerformer.img} sx={{ width: 70, height: 70 }} />
                <Box>
                  <Typography variant="h6" fontWeight={700}>{topPerformer.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{topPerformer.role}</Typography>
                  <Typography variant="caption" color="success.main" fontWeight={700}>✅ {topPerformer.growth}</Typography>
                </Box>
              </Stack>

              {/* Nested Grid for Metrics */}
              <Grid container spacing={2}>
                {[
                  { l: "Leads Generated", v: String(memberStatsMap[topPerformer.name]?.assignedLeads ?? 0) },
                  { l: "Assigned Leads", v: String(memberStatsMap[topPerformer.name]?.assignedLeads ?? 0) },
                  { l: "Calls Made", v: String(memberStatsMap[topPerformer.name]?.callsMade ?? 0) },
                  { l: "Follow-Ups", v: String(memberStatsMap[topPerformer.name]?.followUps ?? 0) },
                  { l: "Appointments", v: String(memberStatsMap[topPerformer.name]?.appointments ?? 0) },
                  { l: "Lead Converted", v: String(memberStatsMap[topPerformer.name]?.leadConverted ?? 0) },
                ].map((stat) => (
                  <Grid size={{ xs: 4 }} key={stat.l}>
                    <Box sx={{ p: 1.5, bgcolor: "#f9fafb", borderRadius: "8px" }}>
                      <Typography variant="h6" fontWeight={700}>{stat.v}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "9px" }}>{stat.l}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          )}

          {/* Secondary Top Performers */}
          <Grid container spacing={2}>
            {otherTops.map((tp) => (
              <Grid size={{ xs: 12, sm: 6 }} key={tp.name}>
                <Card sx={{ p: 2, borderRadius: "16px", border: "1px solid #f0f0f0", boxShadow: 'none', height: '100%', position: 'relative' }}>
                  <Chip
                    icon={<MedalIcon type={tp.rank === "2nd" ? "2nd" : "3rd"} />}
                    label={tp.rank}
                    size="small"
                    sx={{ 
                      position: "absolute", 
                      right: 16, 
                      top: 16, 
                      bgcolor: tp.rank === "2nd" ? "#e3f2fd" : "#f3e5f5", 
                      color: tp.rank === "2nd" ? "#1976d2" : "#7b1fa2", 
                      fontWeight: 700,
                      fontSize: "10px",
                      "& .MuiChip-icon": {
                        ml: 0.5,
                        mr: -0.25
                      }
                    }}
                  />
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1.5}>
                      <Avatar src={tp.img} sx={{ width: 45, height: 45 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{tp.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{tp.role}</Typography>
                        <Typography variant="caption" color="success.main" fontWeight={700}>✅ {tp.growth}</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ bgcolor: "#f9fafb", p: 1, borderRadius: "8px" }}>
                    <Box>
                      <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>
                        {(memberStatsMap[tp.name]?.conversionRate ?? 0).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "8px" }}>Conv. Rate</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>
                        ${Math.round(memberStatsMap[tp.name]?.revenueValue ?? 0).toLocaleString("en-US")}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "8px" }}>Revenue</Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Right Column: Low Performers */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Low Performers</Typography>

<Card sx={{ p: 2, borderRadius: "16px", border: "1px solid #f0f0f0", boxShadow: 'none' }}>
  {lowPerformers.map((lp, i) => (
    <Stack
      key={i}
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ mb: 2.5, "&:last-child": { mb: 0 } }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar src={lp.img} sx={{ width: 40, height: 40 }} />
        <Box>
          <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>
            {lp.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {lp.role}
          </Typography>
        </Box>
      </Stack>

      <Chip
        label={lp.growth}
        size="small"
        variant="outlined"
        color="error"
        sx={{ height: 20, fontSize: "10px", fontWeight: 700 }}
      />
    </Stack>
  ))}
</Card>

        </Grid>
      </Grid>
        </>
      )}
    </Box>
  );
};

export default TeamPerformanceTab;