import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import CalendarIcon from "@/assets/icons/calendar.svg";
import NotificationIcon from "@/assets/icons/notification.svg";
import MessageQuestionIcon from "@/assets/icons/message-question.svg";
import UserAvatarIcon from "@/assets/icons/Ellipse_12.svg";
import { DynamicBreadcrumbs } from "../../utils/BreadCrumbs";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClinic,
  // selectClinic
} from "../../store/clinicSlice";
import type { AppDispatch } from "../../store";
import { clearAuth, selectUser } from "../../store/authSlice";
import { fetchCampaign } from "../../store/campaignSlice";
import { fetchAllTemplates } from "../../store/templateSlice";

const Header = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  // we intentionally only need the clinic name in the header;
  // other state is loaded by thunks but not read here.
  const clinics = user?.clinics || [];
  const selectedClinic = clinics.find((c) => c.is_default) || clinics[0];
  const [clinicAnchor, setClinicAnchor] = useState<null | HTMLElement>(null);

  const handleClinicOpen = (e: React.MouseEvent<HTMLElement>) =>
    setClinicAnchor(e.currentTarget);

  const handleClinicClose = () => setClinicAnchor(null);
  // const clinic = useSelector(selectClinic);
  // const clinicName = clinic?.name || "";

  /* ================= ICON MENU STATE ================= */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMenu, setActiveMenu] = useState<
    "calendar" | "notification" | "help" | null
  >(null);

  // fire-and-forget on mount only; avoid looping when server returns empty arrays
  useEffect(() => {
    dispatch(fetchClinic(1));
    dispatch(fetchCampaign());
    dispatch(fetchAllTemplates());
  }, [dispatch]);

  const handleIconClick = (
    event: React.MouseEvent<HTMLElement>,
    type: "calendar" | "notification" | "help",
  ) => {
    setAnchorEl(event.currentTarget);
    setActiveMenu(type);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveMenu(null);
  };

  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);
  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setUserAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setUserAnchorEl(null);
  const handleLogout = () => {
    handleUserMenuClose();
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  };

  const iconMenus = [
    { icon: CalendarIcon, type: "calendar" },
    { icon: NotificationIcon, type: "notification" },
    { icon: MessageQuestionIcon, type: "help" },
  ] as const;

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "background.default",
        borderRadius: 2,
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", py: 2 }}>
        {/* LEFT: Breadcrumbs */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <DynamicBreadcrumbs />
        </Box>

        {/* RIGHT */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box>
            <Box
              onClick={handleClinicOpen}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                background: "#f3f4f6",
                px: 2,
                py: 1,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2">
                Clinic: <b>{selectedClinic?.clinic__name || "—"}</b>
              </Typography>
              <ArrowDropDownIcon />
            </Box>

            <Menu
              anchorEl={clinicAnchor}
              open={Boolean(clinicAnchor)}
              onClose={handleClinicClose}
            >
              {clinics.map((c) => (
                <MenuItem key={c.clinic_id} onClick={handleClinicClose}>
                  {c.clinic__name}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {iconMenus.map(({ icon, type }) => (
            <IconButton
              key={type}
              onClick={(e) => handleIconClick(e, type)}
              sx={{
                width: 48,
                height: 48,
                backgroundColor: "#fff",
                borderRadius: 1,
              }}
            >
              <Box component="img" src={icon} width={24} />
            </IconButton>
          ))}

          {/* USER */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              component="img"
              src={UserAvatarIcon}
              sx={{ width: 36, height: 36, borderRadius: "10px" }}
            />
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography fontWeight={600}>
                {user ? `${user.first_name} ${user.last_name}` : "—"}
              </Typography>

              <Typography fontSize={12} color="#6b7280">
                {user?.designation_label || user?.designation || "—"}
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleUserMenuOpen}>
              <ArrowDropDownIcon />
            </IconButton>
          </Box>
        </Box>
      </Toolbar>

      {/* ICON MENU */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {activeMenu === "calendar" && (
          <MenuItem disabled>No events for today</MenuItem>
        )}
        {activeMenu === "notification" && (
          <MenuItem disabled>No notifications</MenuItem>
        )}
        {activeMenu === "help" && <MenuItem disabled>No messages</MenuItem>}
      </Menu>

      {/* USER MENU */}
      <Menu
        anchorEl={userAnchorEl}
        open={Boolean(userAnchorEl)}
        onClose={handleUserMenuClose}
      >
        <MenuItem>My Account</MenuItem>
        <MenuItem>Change Password</MenuItem>
        <MenuItem>Settings</MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: "red", fontWeight: 600 }}>
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header;
