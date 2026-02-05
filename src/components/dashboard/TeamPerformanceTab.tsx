import { Box, Typography, Stack, Avatar, Card, Grid, Chip } from "@mui/material";
import { mockData } from "./mockData";

const TeamPerformanceTab = () => {
  const { members, overview } = mockData.overview.teamPerformance;
  
  // Separate members based on your specific design requirements
  const topPerformer = members.find(m => m.rank === "1st (Top)");
  const otherTops = members.filter(m => m.rank === "2nd" || m.rank === "3rd");
  const lowPerformers = members.filter(m => m.growth.startsWith("-"));

  return (
    <Box sx={{ p: 2, height: "calc(100vh - 200px)", overflowY: 'auto' }}>
      {/* 1. Member Avatar Bar */}
      <Stack direction="row" spacing={3} sx={{ mb: 4, overflowX: 'auto', pb: 1 }}>
        <Stack alignItems="center" spacing={1}>
          <Avatar sx={{ bgcolor: '#fff5f5', border: '2px solid #ff6b6b', width: 56, height: 56, color: '#ff6b6b' }}>
            <Box component="span" sx={{ fontSize: '20px' }}>👥</Box>
          </Avatar>
          <Typography variant="caption" color="error" fontWeight={600}>All</Typography>
        </Stack>
        {members.map((member) => (
          <Stack key={member.name} alignItems="center" spacing={1} sx={{ cursor: 'pointer' }}>
            <Avatar src={member.img} sx={{ width: 56, height: 56, border: member.rank ? '2px solid #FFD700' : 'none' }} />
            <Typography variant="caption" sx={{ whiteSpace: 'nowrap', fontSize: '10px' }}>{member.name}</Typography>
          </Stack>
        ))}
      </Stack>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Team Performance Overview</Typography>
      
      {/* 2. Horizontal Stats Overview */}
      <Card sx={{ p: 2, mb: 4, borderRadius: '12px', border: '1px solid #fff0f0', bgcolor: '#fffcfc' }}>
        <Stack direction="row" justifyContent="space-around" divider={<Box sx={{ width: '1px', bgcolor: '#f0f0f0', height: 30 }} />}>
          {Object.entries(overview).map(([key, val]) => (
            <Box key={key} sx={{ textAlign: 'left' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px', display: 'block' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700}>{val}</Typography>
            </Box>
          ))}
        </Stack>
      </Card>

      <Grid container spacing={3}>
        {/* 3. Top Performers Left Column */}
        <Grid item xs={8}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Top Performers</Typography>
          
          {/* Main Top Performer Card (Emilia Fox) */}
          {topPerformer && (
            <Card sx={{ p: 3, mb: 3, borderRadius: '16px', position: 'relative', border: '1px solid #f0f0f0' }}>
              <Chip label="1st (Top)" size="small" sx={{ position: 'absolute', right: 20, top: 20, bgcolor: '#fff9c4', color: '#fbc02d', fontWeight: 700 }} />
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Avatar src={topPerformer.img} sx={{ width: 70, height: 70 }} />
                <Box>
                  <Typography variant="h6" fontWeight={700}>{topPerformer.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{topPerformer.role}</Typography>
                  <Typography variant="caption" color="success.main" fontWeight={700}>✅ {topPerformer.growth}</Typography>
                </Box>
              </Stack>
              
              {/* Detailed Metrics Grid */}
              <Grid container spacing={2}>
                {[
                  { l: "Leads Generated", v: "21" }, { l: "Assigned Leads", v: "46" }, 
                  { l: "Calls Made", v: "146" }, { l: "Follow-Ups", v: "92" },
                  { l: "Appointments", v: "38" }, { l: "Lead Converted", v: "14" }
                ].map((stat) => (
                  <Grid item xs={4} key={stat.l}>
                    <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: '8px' }}>
                      <Typography variant="h6" fontWeight={700}>{stat.v}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9px' }}>{stat.l}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          )}

          {/* Secondary Top Performers (Cody & Wade) */}
          <Stack direction="row" spacing={2}>
            {otherTops.map(tp => (
              <Card key={tp.name} sx={{ p: 2, flex: 1, borderRadius: '16px', border: '1px solid #f0f0f0' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1.5}>
                    <Avatar src={tp.img} sx={{ width: 45, height: 45 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{tp.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{tp.role}</Typography>
                      <Typography variant="caption" color="success.main" fontWeight={700}>✅ {tp.growth}</Typography>
                    </Box>
                  </Stack>
                  <Chip label={tp.rank} size="small" sx={{ height: 20, fontSize: '10px' }} />
                </Stack>
                <Stack direction="row" spacing={2} sx={{ bgcolor: '#f9fafb', p: 1, borderRadius: '8px' }}>
                   <Box><Typography variant="caption" fontWeight={700} sx={{ display: 'block' }}>60.3%</Typography><Typography variant="caption" sx={{ fontSize: '8px' }}>Conv. Rate</Typography></Box>
                   <Box><Typography variant="caption" fontWeight={700} sx={{ display: 'block' }}>$1452</Typography><Typography variant="caption" sx={{ fontSize: '8px' }}>Revenue</Typography></Box>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Grid>

        {/* 4. Low Performers Right Column */}
        <Grid item xs={4}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Low Performers</Typography>
          <Card sx={{ p: 2, borderRadius: '16px', border: '1px solid #f0f0f0',   }}>
            {lowPerformers.map((lp, i) => (
              <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5, "&:last-child": { mb: 0 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar src={lp.img} sx={{ width: 40, height: 40 }} />
                  <Box>
                    <Typography variant="caption" fontWeight={700} sx={{ display: 'block' }}>{lp.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{lp.role}</Typography>
                  </Box>
                </Stack>
                <Chip label={lp.growth} size="small" variant="outlined" color="error" sx={{ height: 20, fontSize: '10px', fontWeight: 700 }} />
              </Stack>
            ))}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamPerformanceTab;