import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import FilterLeadsIcon from "../../assets/icons/Filter_Leads.svg";

import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";

import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReviewListFilter, { type ReviewListFilters } from "./ReviewListFilter";

import {
  fetchReviews,
  selectReputationReviews,
} from "../../store/reputationSlice";

import type { AppDispatch } from "../../store";

type Props = {
  requestId: string;
};

type Review = {
  id: string;
  lead_name: string;
  rating: number;
  review_text: string;
  submitted_at: string;
};

const ReviewCardDetailedView = ({ requestId }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const reviews = useSelector(selectReputationReviews) as Review[];
  const [searchText, setSearchText] = useState("");
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [filters, setFilters] = useState<ReviewListFilters>({
    fromDate: null,
    toDate: null,
    minRating: null,
  });

  useEffect(() => {
    if (requestId) {
      dispatch(fetchReviews(requestId));
    }
  }, [dispatch, requestId]);

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const filteredReviews = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return reviews.filter((review) => {
      if (
        normalizedSearch &&
        !review.lead_name.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (filters.minRating !== null && review.rating < filters.minRating) {
        return false;
      }

      const submittedAt = dayjs(review.submitted_at);

      if (
        filters.fromDate &&
        submittedAt.isBefore(filters.fromDate.startOf("day"))
      ) {
        return false;
      }

      if (filters.toDate && submittedAt.isAfter(filters.toDate.endOf("day"))) {
        return false;
      }

      return true;
    });
  }, [filters, reviews, searchText]);

  const handleClearFilters = () => {
    setFilters({
      fromDate: null,
      toDate: null,
      minRating: null,
    });
  };

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        boxShadow: "none",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
          List of Reviews
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search by Patient name"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            sx={{
              width: { xs: 190, sm: 220 },
              "& .MuiOutlinedInput-root": {
                height: 40,
                borderRadius: 1,
                background: "#FFFFFF",
              },
              "& .MuiOutlinedInput-input": {
                fontSize: 14,
                padding: "9px 10px 9px 0",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.5 }}>
                  <SearchIcon sx={{ fontSize: 16, color: "#6B7280" }} />
                </InputAdornment>
              ),
            }}
          />

          <IconButton sx={{ mt: -1 }} onClick={() => setOpenFilterDialog(true)}>
            <img src={FilterLeadsIcon} alt="Filter Leads" />
          </IconButton>
        </Box>
      </Box>

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                background: "#FAFAFA",
                borderTopLeftRadius: "12px",
              }}
            >
              Patient Name
            </TableCell>

            <TableCell sx={{ background: "#FAFAFA" }}>Rating</TableCell>

            <TableCell sx={{ background: "#FAFAFA" }}>Submitted on</TableCell>

            <TableCell
              sx={{
                background: "#FAFAFA",
                borderTopRightRadius: "12px",
              }}
            >
              Review
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {filteredReviews.map((row: Review) => (
            <TableRow key={row.id}>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 12,
                      background: "#EDE9FE",
                      color: "#6D28D9",
                    }}
                  >
                    {getInitials(row.lead_name)}
                  </Avatar>

                  <Typography sx={{ fontSize: 14 }}>{row.lead_name}</Typography>
                </Box>
              </TableCell>

              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <StarIcon sx={{ color: "#F4B400", fontSize: 16 }} />
                  {row.rating}
                </Box>
              </TableCell>

              <TableCell sx={{ fontSize: 13 }}>
                {new Date(row.submitted_at).toLocaleString()}
              </TableCell>

              <TableCell
                sx={{
                  fontSize: 13,
                  color: "#4B5563",
                  maxWidth: 500,
                }}
              >
                {row.review_text}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Footer */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 2,
          fontSize: 12,
          color: "#9CA3AF",
        }}
      >
        <Typography>
          Showing {filteredReviews.length} of {reviews.length} reviews
        </Typography>
      </Box>

      <ReviewListFilter
        open={openFilterDialog}
        initialFilters={filters}
        onClose={() => setOpenFilterDialog(false)}
        onApply={setFilters}
        onClear={handleClearFilters}
      />
    </Card>
  );
};

export default ReviewCardDetailedView;
