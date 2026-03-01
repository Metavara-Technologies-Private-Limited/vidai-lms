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
import { practoMock } from "./practo.mock";
import BackwardIcon from "../../assets/icons/Backward_icon.svg";
import {useNavigate} from "react-router-dom";

const Practo: React.FC = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredData = practoMock.filter((item) =>
    item.accountManager.toLowerCase().includes(search.toLowerCase())
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
        Practo Referrals ({filteredData.length})
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
              <TableCell>Account Manager</TableCell>
              <TableCell>Email | Contact</TableCell>
              <TableCell>Referrals</TableCell>
              <TableCell>Campaign</TableCell>
              <TableCell>City</TableCell>
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
>            {filteredData.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      {item.accountManager.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography>{item.accountManager}</Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography>{item.email}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {item.phone}
                  </Typography>
                </TableCell>

                <TableCell>{item.referrals}</TableCell>
                <TableCell>{item.campaign}</TableCell>
                <TableCell>{item.city}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Practo;