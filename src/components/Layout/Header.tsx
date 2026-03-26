import { useEffect, useMemo, useState } from "react";
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
  // selectClinic,
  // setSelectedClinic,
  syncClinic,
  // selectClinic
} from "../../store/clinicSlice";
import type { AppDispatch } from "../../store";
import { clearAuth, selectUser } from "../../store/authSlice";
import { fetchCampaign } from "../../store/campaignSlice";
import { fetchAllTemplates } from "../../store/templateSlice";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";
import LogoutIcon from "@mui/icons-material/Logout";
import { clinicApi } from "../../services/clinic.api";

const Header = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const clinics = useMemo(() => user?.clinics ?? [], [user]);
  // const dbClinic = useSelector(selectClinic);

  const selectedClinic = useMemo(() => clinics[0], [clinics]);
  const [manualClinic, setManualClinic] = useState<(typeof clinics)[0] | null>(
    null,
  );

  const [clinicAnchor, setClinicAnchor] = useState<null | HTMLElement>(null);

  const handleClinicOpen = (e: React.MouseEvent<HTMLElement>) =>
    setClinicAnchor(e.currentTarget);

  const handleClinicClose = () => setClinicAnchor(null);

  /* ================= ICON MENU STATE ================= */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMenu, setActiveMenu] = useState<
    "calendar" | "notification" | "help" | null
  >(null);

  // fire-and-forget on mount only; avoid looping when server returns empty arrays
  useEffect(() => {
    const current = manualClinic || selectedClinic;

    if (!current) return;

    const initClinic = async () => {
      await syncClinic(current, user?.email || "");

      const res = await clinicApi.searchByName(current.clinic__name);

      if (res.data.length > 0) {
        dispatch(fetchClinic(res.data[0].id));
      }
    };

    initClinic();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinic]);

  useEffect(() => {
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
                Clinic:{" "}
                <b>{(manualClinic || selectedClinic)?.clinic__name || "-"}</b>
              </Typography>
              <ArrowDropDownIcon />
            </Box>

            <Menu
              anchorEl={clinicAnchor}
              open={Boolean(clinicAnchor)}
              onClose={handleClinicClose}
            >
              {clinics.map((c) => (
                <MenuItem
                  key={c.clinic_id}
                  onClick={async () => {
                    setManualClinic(c);
                    handleClinicClose();

                    await syncClinic(c, user?.email || "");

                    const res = await clinicApi.searchByName(c.clinic__name);

                    if (res.data.length > 0) {
                      dispatch(fetchClinic(res.data[0].id));
                    }
                  }}
                >
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
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
            onClick={handleUserMenuOpen}
          >
            <Box
              component="img"
              src={user?.photo || UserAvatarIcon}
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
            <IconButton size="small">
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
        <MenuItem disabled>
          <PersonIcon sx={{ mr: 1 }} />
          {user ? `${user.first_name} ${user.last_name}` : "-"}
        </MenuItem>

        <MenuItem disabled>
          <EmailIcon sx={{ mr: 1 }} />
          {user?.email || "-"}
        </MenuItem>

        <MenuItem disabled>
          <BusinessIcon sx={{ mr: 1 }} />
          {user?.clinics?.[0]?.clinic__name || "-"}
        </MenuItem>

        <MenuItem disabled>
          <WorkIcon sx={{ mr: 1 }} />
          {user?.designation_label || "-"}
        </MenuItem>

        <MenuItem onClick={handleLogout} sx={{ color: "red", fontWeight: 600 }}>
          <LogoutIcon sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header;
