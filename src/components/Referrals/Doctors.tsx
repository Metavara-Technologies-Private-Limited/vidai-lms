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

const DoctorsList: React.FC = () => {
  const [search, setSearch] = useState("");

  // 🔎 Filter Logic
  const filteredDoctors = doctorsMock.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={3}>
      {/* Header */}
      <Typography variant="h5" fontWeight={600} mb={3}  mt={-3}>
        Doctors List ({filteredDoctors.length})
      </Typography>

      {/* Search */}
      <Box display="flex" justifyContent="flex-end" mb={2} mt={-7}>
        <TextField
          placeholder="Search by Doctor name"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f7f7f7" }}>
            <TableRow>
              <TableCell><b>Doctors Name</b></TableCell>
              <TableCell><b>Email | Contact No.</b></TableCell>
              <TableCell><b>Referrals</b></TableCell>
              <TableCell><b>Clinic Name</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredDoctors.map((doctor: DoctorReferral) => (
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
                  <Typography variant="body2" color="text.secondary">
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

export default DoctorsList;