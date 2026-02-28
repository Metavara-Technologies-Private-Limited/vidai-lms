import {
  Box,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { ReportChannelData } from "../../types/reports.types";
import EyeIcon from "../../assets/icons/eye.svg";
import MouseCircleIcon from "../../assets/icons/mouse-circle.svg";
import MouseCircleGreenIcon from "../../assets/icons/mouse-circle-green.svg";
import ProfileTwoUserIcon from "../../assets/icons/profile-2user.svg";
import DollarCircleIcon from "../../assets/icons/dollar-circle.svg";
import UserTickIcon from "../../assets/icons/user-tick.svg";
import MoneyReciveIcon from "../../assets/icons/money-recive.svg";

interface FacebookReportProps {
  data: ReportChannelData;
  searchQuery: string;
}

const PAGE_SIZE = 10;

const tableStyles = {
  container: {
    mt: 2,
    border: "none",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "none",
  },
  headRow: {
    backgroundColor: "#F5F6F8",
  },
  headCell: {
    borderBottom: "none",
    fontSize: "12px",
    color: "#7A7F87",
    fontWeight: 600,
    py: 1.25,
    px: 1.25,
    whiteSpace: "nowrap",
  },
  bodyCell: {
    borderBottom: "1px solid #F0F1F3",
    fontSize: "13px",
    color: "#2A2D32",
    py: 1.5,
    px: 1.25,
    whiteSpace: "nowrap",
  },
  firstBodyCell: {
    borderBottom: "1px solid #F0F1F3",
    fontSize: "13px",
    color: "#2A2D32",
    fontWeight: 600,
    py: 1.5,
    px: 1.25,
    minWidth: 220,
  },
};

const cardIcons = [
  EyeIcon,
  MouseCircleIcon,
  ProfileTwoUserIcon,
  DollarCircleIcon,
  MouseCircleGreenIcon,
  UserTickIcon,
  MoneyReciveIcon,
  DollarCircleIcon,
];

const cardBackgrounds = [
  "#F8FAFF",
  "#F7FCF9",
  "#FFF9F9",
  "#FFFCF7",
  "#F8FAFF",
  "#F8FDF5",
  "#F9F7FF",
  "#FFF9F6",
];

const cardBorderColors = [
  "#EEF3FF",
  "#EAF7EE",
  "#FDEEEF",
  "#FDF3E4",
  "#EEF3FF",
  "#EDF8E7",
  "#EFEAFC",
  "#FBECE6",
];

const FacebookReport = ({ data, searchQuery }: FacebookReportProps) => {
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return data.rows;
    }

    const term = searchQuery.toLowerCase();
    return data.rows.filter((row) => row.campaignName.toLowerCase().includes(term));
  }, [data.rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);

  const startIndex = filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(safePage * PAGE_SIZE, filteredRows.length);

  return (
    <>
      <Box
        sx={{
          mt: 2,
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(1, minmax(0, 1fr))",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
            lg: "repeat(8, minmax(0, 1fr))",
          },
        }}
      >
        {data.cards.map((card, index) => (
          <Box
            key={card.id}
            sx={{
              borderRadius: "16px",
              border: "1px solid",
              borderColor: cardBorderColors[index],
              backgroundImage: `linear-gradient(180deg, ${cardBackgrounds[index]} 0%, #FFFFFF 72%)`,
              px: 2,
              py: 1.75,
              minHeight: 126,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ width: 24, height: 24, display: "flex", alignItems: "center" }}>
              <Box
                component="img"
                src={cardIcons[index]}
                alt={card.label}
                sx={{
                  width: 24,
                  height: 24,
                  filter: "drop-shadow(0px 12px 16px rgba(80, 107, 180, 0.24)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))",
                }}
              />
            </Box>
            <Typography
              sx={{
                fontSize: "20px",
                lineHeight: 1.1,
                fontWeight: 700,
                color: "#1F2328",
                mt: 1.25,
              }}
            >
              {card.value}
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                lineHeight: 1.2,
                fontWeight: 500,
                color: "#8A8F98",
                mt: 0.5,
              }}
            >
              {card.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <TableContainer sx={tableStyles.container}>
        <Table size="small">
          <TableHead>
            <TableRow sx={tableStyles.headRow}>
              <TableCell sx={tableStyles.headCell}>Campaign Name</TableCell>
              <TableCell sx={tableStyles.headCell}>Total Impressions</TableCell>
              <TableCell sx={tableStyles.headCell}>Total Clicks</TableCell>
              <TableCell sx={tableStyles.headCell}>Conversions</TableCell>
              <TableCell sx={tableStyles.headCell}>Total Spend</TableCell>
              <TableCell sx={tableStyles.headCell}>CTR (Click-Through Rate)</TableCell>
              <TableCell sx={tableStyles.headCell}>Conversion Rate</TableCell>
              <TableCell sx={tableStyles.headCell}>CPC (Cost per Click)</TableCell>
              <TableCell sx={tableStyles.headCell}>CPA (Cost per Lead)</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ ...tableStyles.bodyCell, py: 6 }}>
                  <Typography color="text.secondary">No report data found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    "&:last-of-type td": { borderBottom: "none" },
                  }}
                >
                  <TableCell sx={tableStyles.firstBodyCell}>{row.campaignName}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.totalImpressions}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.totalClicks}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.conversions}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.totalSpend}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.ctr}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.conversionRate}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.cpc}</TableCell>
                  <TableCell sx={tableStyles.bodyCell}>{row.cpa}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          mt: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {startIndex} to {endIndex} of {filteredRows.length} entries
        </Typography>
        <Pagination
          size="small"
          count={totalPages}
          page={safePage}
          onChange={(_, value) => setPage(value)}
          shape="rounded"
          sx={{
            "& .MuiPaginationItem-root": {
              fontSize: "12px",
              color: "#8A8F98",
            },
            "& .MuiPaginationItem-page.Mui-selected": {
              fontWeight: 700,
              backgroundColor: "#000000",
              color: "#FFFFFF",
            },
            "& .MuiPaginationItem-page.Mui-selected:hover": {
              backgroundColor: "#000000",
            },
          }}
        />
      </Box>
    </>
  );
};

export default FacebookReport;
