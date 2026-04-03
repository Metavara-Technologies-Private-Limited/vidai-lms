import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  InputAdornment,
  Pagination,
  PaginationItem,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckIcon from "@mui/icons-material/Check";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import EditUser from "../../../../assets/icons/Edit_User_List.svg";
import {
  userProfileApi,
  type UserProfileRead,
} from "../../../../services/userProfile.api";
import { toast } from "react-toastify";

interface Props {
  onNewUser: () => void;
  onEditUser?: (user: UserProfileRead) => void;
  refreshKey?: number;
}

type OptionalColumnKey =
  | "gender"
  | "dateOfJoining"
  | "dateOfBirth"
  | "mobileNumber"
  | "email";

const OPTIONAL_COLUMNS: Array<{
  key: OptionalColumnKey;
  label: string;
  getValue: (user: UserProfileRead) => string;
}> = [
  { key: "gender", label: "Gender", getValue: () => "-" },
  {
    key: "dateOfJoining",
    label: "Date Of Joining",
    getValue: (user) => user.created_at?.slice(0, 10) || "-",
  },
  {
    key: "dateOfBirth",
    label: "Date Of Birth",
    getValue: (user) => user.date_of_birth?.slice(0, 10) || "-",
  },
  {
    key: "mobileNumber",
    label: "Mobile Number",
    getValue: (user) => user.mobile_no || "-",
  },
  { key: "email", label: "Email", getValue: (user) => user.email || "-" },
];

const ROWS_PER_PAGE = 8;

const FIXED_TABLE_MIN_WIDTH = 760;
const OPTIONAL_COLUMN_MIN_WIDTH = 160;

const headerCellSx = {
  color: "#505050",
  fontSize: 11,
  fontWeight: 600,
  backgroundColor: "#FAFAFA",
  borderBottom: "2px solid #FAFAFA",
  py: 1,
  borderRadius: "2px",
  whiteSpace: "nowrap",
};

const bodyCellSx = {
  color: "#4A4A4A",
  fontSize: 13,
  borderBottom: "1px solid #F8F8F8",
  py: 1.4,
  whiteSpace: "nowrap",
};

const checkboxSx = {
  p: 0,
  width: 20,
  height: 20,
  borderRadius: "6px",
  color: "#D8EEDD",
  "& .MuiSvgIcon-root": {
    fontSize: 20,
  },
  "&.Mui-checked": {
    color: "#DFF4E4",
  },
  "&.MuiCheckbox-root:hover": {
    backgroundColor: "transparent",
  },
};

const checkboxIcon = (
  <Box
    sx={{
      width: 18,
      height: 18,
      borderRadius: "6px",
      border: "1px solid #D9ECDD",
      bgcolor: "#FFFFFF",
    }}
  />
);

const checkedCheckboxIcon = (
  <Box
    sx={{
      width: 18,
      height: 18,
      borderRadius: "6px",
      bgcolor: "#E8F7EB",
      color: "#73C686",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CheckIcon sx={{ fontSize: 12 }} />
  </Box>
);

const EditActionIcon = ({
  alt = "Edit user",
  size = 18,
}: {
  alt?: string;
  size?: number;
}) => (
  <Box
    component="img"
    src={EditUser}
    alt={alt}
    sx={{
      width: size,
      height: size,
      display: "block",
    }}
  />
);

const UsersList: React.FC<Props> = ({ onNewUser, onEditUser, refreshKey = 0 }) => {
  const [users, setUsers] = useState<UserProfileRead[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [columnPickerAnchor, setColumnPickerAnchor] =
    useState<HTMLElement | null>(null);
  const [visibleOptionalColumns, setVisibleOptionalColumns] = useState<
    Record<OptionalColumnKey, boolean>
  >({
    gender: false,
    dateOfJoining: false,
    dateOfBirth: false,
    mobileNumber: false,
    email: false,
  });

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const data = await userProfileApi.list();
        if (!cancelled) {
          setUsers(data);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load users.");
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleToggleUserFlag = async (
    userId: number,
    field: "locked" | "status",
  ) => {
    if (field === "locked") return;

    const target = users.find((user) => user.id === userId);
    if (!target) return;

    const nextStatus = !target.is_active;
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, is_active: nextStatus } : user,
      ),
    );

    try {
      const updated = await userProfileApi.update(userId, { is_active: nextStatus });
      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === userId ? updated : user)),
      );
    } catch {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId ? { ...user, is_active: target.is_active } : user,
        ),
      );
      toast.error("Failed to update user status.");
    }
  };

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) =>
      [
        user.username,
        user.first_name,
        user.last_name,
        user.email,
        user.role_name,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [searchTerm, users]);

  const activeOptionalColumns = useMemo(
    () =>
      OPTIONAL_COLUMNS.filter((column) => visibleOptionalColumns[column.key]),
    [visibleOptionalColumns],
  );

  const isColumnPickerOpen = Boolean(columnPickerAnchor);

  const handleOpenColumnPicker = (event: React.MouseEvent<HTMLElement>) => {
    setColumnPickerAnchor(event.currentTarget);
  };

  const handleCloseColumnPicker = () => {
    setColumnPickerAnchor(null);
  };

  const handleToggleOptionalColumn = (key: OptionalColumnKey) => {
    setVisibleOptionalColumns((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const pageCount = Math.max(
    1,
    Math.ceil(filteredUsers.length / ROWS_PER_PAGE),
  );
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * ROWS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE,
  );
  const showingFrom = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const showingTo = startIndex + paginatedUsers.length;
  const tableMinWidth =
    FIXED_TABLE_MIN_WIDTH +
    activeOptionalColumns.length * OPTIONAL_COLUMN_MIN_WIDTH;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2.5,
          flexWrap: "wrap",
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#212121" }}>
          List Of Users
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <TextField
            size="small"
            placeholder="search By User Name"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            sx={{
              width: 240,
              "& .MuiOutlinedInput-root": {
                height: 31,
                borderRadius: "8px",
                fontSize: 12,
                bgcolor: "#FFFFFF",
                "& fieldset": { borderColor: "#E6E6E6" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: "#B5B5B5" }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            onClick={onNewUser}
            startIcon={<AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: "#505050",
              color: "#FFFFFF",
              textTransform: "none",
              borderRadius: "6px",
              px: 2,
              minWidth: 86,
              height: 31,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { bgcolor: "#232323", boxShadow: "none" },
            }}
          >
            New
          </Button>
        </Box>
      </Box>

      <TableContainer sx={{ overflowX: "auto", borderRadius: "8px" }}>
        {loadingUsers ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Table
            sx={{
              minWidth: tableMinWidth,
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
          <TableHead
            sx={{
              "& .MuiTableRow-root .MuiTableCell-head:first-of-type": {
                borderTopLeftRadius: "2px",
              },
              "& .MuiTableRow-root .MuiTableCell-head:last-of-type": {
                borderTopRightRadius: "2px",
              },
            }}
          >
            <TableRow>
              <TableCell sx={{ ...headerCellSx, minWidth: 170 }}>
                Username
              </TableCell>
              <TableCell sx={{ ...headerCellSx, minWidth: 180 }}>
                Name
              </TableCell>
              <TableCell sx={{ ...headerCellSx, minWidth: 120 }}>
                Role
              </TableCell>
              {activeOptionalColumns.map((column) => (
                <TableCell
                  key={column.key}
                  sx={{ ...headerCellSx, minWidth: OPTIONAL_COLUMN_MIN_WIDTH }}
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell sx={{ ...headerCellSx, minWidth: 90 }}>
                Locked
              </TableCell>
              <TableCell sx={{ ...headerCellSx, minWidth: 90 }}>
                Status
              </TableCell>
              <TableCell sx={{ ...headerCellSx, minWidth: 48 }} align="right">
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton
                    onClick={handleOpenColumnPicker}
                    size="small"
                    sx={{ p: 0 }}
                    aria-label="Configure visible columns"
                  >
                    <EditActionIcon alt="Configure columns" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell sx={{ ...bodyCellSx, minWidth: 170 }}>
                  {user.username}
                </TableCell>
                <TableCell
                  sx={{ ...bodyCellSx, minWidth: 180 }}
                >{`${user.first_name} ${user.last_name}`.trim() || "-"}</TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 120 }}>
                  {user.role_name || "-"}
                </TableCell>
                {activeOptionalColumns.map((column) => (
                  <TableCell
                    key={`${user.id}-${column.key}`}
                    sx={{ ...bodyCellSx, minWidth: OPTIONAL_COLUMN_MIN_WIDTH }}
                  >
                    {column.getValue(user)}
                  </TableCell>
                ))}
                <TableCell sx={{ ...bodyCellSx, minWidth: 90 }}>
                  <Checkbox
                    checked={false}
                    onChange={() => handleToggleUserFlag(user.id, "locked")}
                    disabled
                    icon={checkboxIcon}
                    checkedIcon={checkedCheckboxIcon}
                    sx={checkboxSx}
                    inputProps={{
                      "aria-label": `Toggle locked for ${user.username}`,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 90 }}>
                  <Checkbox
                    checked={user.is_active}
                    onChange={() => handleToggleUserFlag(user.id, "status")}
                    icon={checkboxIcon}
                    checkedIcon={checkedCheckboxIcon}
                    sx={checkboxSx}
                    inputProps={{
                      "aria-label": `Toggle status for ${user.username}`,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, minWidth: 48 }} align="right">
                  <Button
                    onClick={() => onEditUser?.(user)}
                    sx={{ minWidth: "auto", p: 0 }}
                  >
                    <EditActionIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {paginatedUsers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6 + activeOptionalColumns.length}
                  sx={{ ...bodyCellSx, textAlign: "center", py: 4 }}
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        )}
      </TableContainer>

      <Popover
        open={isColumnPickerOpen}
        anchorEl={columnPickerAnchor}
        onClose={handleCloseColumnPicker}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ p: 2, minWidth: 220 }}>
          <Typography
            sx={{ fontSize: 12, fontWeight: 700, color: "#3F3F3F", mb: 1.2 }}
          >
            Select Columns
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#8A8A8A", mb: 1.2 }}>
            Fixed: Username, Name, Role, Locked, Status
          </Typography>
          {OPTIONAL_COLUMNS.map((column) => (
            <Box
              key={column.key}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 0.2,
              }}
            >
              <Typography sx={{ fontSize: 12, color: "#4A4A4A" }}>
                {column.label}
              </Typography>
              <Checkbox
                size="small"
                checked={visibleOptionalColumns[column.key]}
                onChange={() => handleToggleOptionalColumn(column.key)}
                inputProps={{ "aria-label": `Toggle ${column.label} column` }}
              />
            </Box>
          ))}
        </Box>
      </Popover>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mt: 6,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography sx={{ fontSize: 12, color: "#9A9A9A" }}>
          {`Showing ${showingFrom} to ${showingTo} of ${filteredUsers.length} entries`}
        </Typography>

        <Pagination
          size="small"
          count={pageCount}
          page={safePage}
          onChange={(_, value) => setPage(value)}
          shape="rounded"
          siblingCount={1}
          boundaryCount={1}
          renderItem={(item) => (
            <PaginationItem
              slots={{ previous: ChevronLeftIcon, next: ChevronRightIcon }}
              {...item}
            />
          )}
          sx={{
            "& .MuiPagination-ul": { gap: 0.5 },
            "& .MuiPaginationItem-root": {
              minWidth: 28,
              height: 28,
              fontSize: 12,
              color: "#8A8F98",
              borderRadius: "8px",
              margin: 0,
            },
            "& .MuiPaginationItem-page.Mui-selected": {
              bgcolor: "#707070",
              color: "#FFFFFF",
              fontWeight: 700,
            },
            "& .MuiPaginationItem-page.Mui-selected:hover": {
              bgcolor: "#707070",
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default UsersList;
