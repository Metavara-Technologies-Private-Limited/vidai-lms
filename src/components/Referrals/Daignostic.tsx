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
import { diagnosticMock } from "./diagnostic.mock";

const DiagnosticList: React.FC = () => {
  const [search, setSearch] = useState("");

  const filteredData = diagnosticMock.filter((item) =>
    item.labName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Diagnostic Labs ({filteredData.length})
      </Typography>

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <TextField
          placeholder="Search by Lab name"
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

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f7f7f7" }}>
            <TableRow>
              <TableCell><b>Lab Name</b></TableCell>
              <TableCell><b>Email | Contact</b></TableCell>
              <TableCell><b>Referrals</b></TableCell>
              <TableCell><b>City</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      {item.labName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography>{item.labName}</Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography>{item.email}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.phone}
                  </Typography>
                </TableCell>

                <TableCell>{item.referrals}</TableCell>

                <TableCell>{item.city}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default DiagnosticList;