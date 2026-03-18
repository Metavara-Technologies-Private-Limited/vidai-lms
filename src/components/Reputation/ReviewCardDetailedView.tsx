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

import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import FilterListIcon from "@mui/icons-material/FilterList";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

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
            sx={{
              width: 240,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                background: "#F9FAFB",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />

          <IconButton
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: 2,
              width: 36,
              height: 36,
            }}
          >
            <FilterListIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow sx={{ background: "#F9FAFB" }}>
            <TableCell>Patient Name</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Submitted on</TableCell>
            <TableCell>Review</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
{reviews.map((row: Review, index: number) => (            <TableRow key={index}>
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

                  <Typography sx={{ fontSize: 14 }}>
                    {row.lead_name}
                  </Typography>
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
        <Typography>Showing {reviews.length} reviews</Typography>
      </Box>
    </Card>
  );
};

export default ReviewCardDetailedView;