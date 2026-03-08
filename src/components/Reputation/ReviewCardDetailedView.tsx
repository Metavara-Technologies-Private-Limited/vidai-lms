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

const rows = [
  {
    name: "Emily Carter",
    initials: "EC",
    rating: 4.6,
    date: "19/01/2025, 11:40 AM",
    review:
      "The consultation was very smooth and informative. The doctor explained all treatment options clearly and patiently answered my questions.",
  },
  {
    name: "Sophia Davis",
    initials: "SD",
    rating: 4.7,
    date: "01/04/2024, 9:15 AM",
    review:
      "Overall a good experience. The consultation went well and the doctor was helpful. Waiting time was slightly longer than expected.",
  },
  {
    name: "Olivia Martinez",
    initials: "OM",
    rating: 4.8,
    date: "25/12/2024, 3:00 PM",
    review:
      "Very professional consultation. I felt comfortable discussing my concerns and received clear guidance.",
  },
  {
    name: "Alex Johnson",
    initials: "AJ",
    rating: 4.9,
    date: "30/11/2024, 12:45 PM",
    review:
      "The doctor explained the process clearly and addressed all my doubts. Would recommend to others.",
  },
  {
    name: "John Smith",
    initials: "JS",
    rating: 4.5,
    date: "10/10/2024, 8:00 AM",
    review:
      "Excellent experience. Staff members were polite and supportive.",
  },
];

const ReviewCardDetailedView = () => {
  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        boxShadow: "none",
      }}
    >

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
          {rows.map((row, index) => (
            <TableRow key={index}>
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
                    {row.initials}
                  </Avatar>

                  <Typography sx={{ fontSize: 14 }}>
                    {row.name}
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
                {row.date}
              </TableCell>

              <TableCell
                sx={{
                  fontSize: 13,
                  color: "#4B5563",
                  maxWidth: 500,
                }}
              >
                {row.review}
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
        <Typography>Showing 1 to 8 of 100 entries</Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Typography
            sx={{
              background: "#111827",
              color: "#fff",
              px: 1,
              borderRadius: 1,
            }}
          >
            1
          </Typography>
          <Typography>2</Typography>
          <Typography>3</Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default ReviewCardDetailedView;