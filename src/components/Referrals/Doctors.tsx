// DoctorsList.tsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { doctorsMock } from "./doctors.mock";
import type { DoctorReferral } from "./doctors.mock";
import BackwardIcon from "../../assets/icons/Backward_icon.svg";
import {useNavigate} from "react-router-dom";

const Doctors: React.FC = () => {
  const [search, setSearch] = useState("");
const navigate = useNavigate();

  // 🔎 Filter Logic
  const filteredDoctors = doctorsMock.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

return (
<Box p={1}>
  {/* Header Row */}
  <Box
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    mb={3}
    mt={-2}
  >
    {/* Left Side */}
    <Box display="flex" alignItems="center" gap={2}>
      <Box
        component="img"
        src={BackwardIcon}
        alt="Back"
        sx={{
          width: 40,
          height: 40,
          cursor: "pointer",
        }}
        onClick={() => navigate(-1)}
      />

      <Typography variant="h6" fontWeight={600} mt={-1}>
        Doctors List ({filteredDoctors.length})
      </Typography>
    </Box>

    {/* Right Side (Search moved up) */}
    <TextField
      placeholder="Search by Partner name"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      sx={{
        width: 300,
        "& .MuiOutlinedInput-root": {
          height: 38,
        },
        "& input::placeholder": {
          fontSize: "14px",
          color: "#9E9E9E",
          opacity: 1,
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ fontSize: 20, color: "#9E9E9E" }} />
          </InputAdornment>
        ),
      }}
    />
  </Box>

      {/* Table */}
 <Paper elevation={0} sx={{  overflow: "hidden" }}>
        <Table sx={{ borderCollapse: "separate" }}>
<TableHead
  sx={{
    "& .MuiTableCell-head": {
      backgroundColor: "#f8f8f9",
      color: "#626262",
      fontSize: 14,
      borderBottom: "none",
      paddingY: 1,
    },
    // Top Left
    "& .MuiTableCell-head:first-of-type": {
      borderTopLeftRadius: "12px",
      borderBottomLeftRadius: "12px",
    },
    // Top Right
    "& .MuiTableCell-head:last-of-type": {
      borderTopRightRadius: "12px",
      borderBottomRightRadius: "12px",
    },
  }}
>   
      <TableRow>
              <TableCell>Doctors Name</TableCell>
              <TableCell>Email | Contact No.</TableCell>
              <TableCell>Referrals</TableCell>
              <TableCell>Clinic Name</TableCell>
            </TableRow>
          </TableHead>

<TableBody
  sx={{
    "& .MuiTableCell-body": {
      color: "#232323",
      fontSize: "13px",
      py: 1.5,
    },
        "& .MuiTableCell-body .MuiTypography-root": {
      color: "#232323",
      fontSize: "13px",
    },
  
  }}
>            {filteredDoctors.map((doctor: DoctorReferral) => (
              <TableRow key={doctor.id} hover>
                {/* Doctor Info */}
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
  sx={{
    bgcolor: "#E7F1FF",
    color: "#1D4ED8",
    fontWeight: 600,
    width: 36,
    height: 36,
  }}
>
  {doctor.name.charAt(0).toUpperCase()}
</Avatar>
                    <Typography>{doctor.name}</Typography>
                  </Box>
                </TableCell>

                {/* Email + Phone */}
                <TableCell>
                  <Typography>{doctor.email}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {doctor.phone}
                  </Typography>
                </TableCell>

                {/* Referrals */}
                <TableCell>{doctor.referrals}</TableCell>

                {/* Clinic */}
                <TableCell>{doctor.clinicName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Doctors;