import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useDispatch } from "react-redux";

import type { AppDispatch } from "../store";

import { setAuth } from "../store/authSlice";

import { authApi } from "../services/auth.api";
import { buildAuthUserFromLogin } from "../utils/auth";

export default function AutoLogin() {
  const navigate = useNavigate();

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const login = async () => {
      try {
        const token = new URLSearchParams(window.location.search).get("token");

        if (!token) {
          navigate("/login", {
            replace: true,
          });

          return;
        }

        const loginRes = await authApi.autoLogin(token);

        const authUser = buildAuthUserFromLogin(
          loginRes.token,
          loginRes.user.username,
          loginRes.role,
          loginRes.permissions,
          loginRes.user as Record<string, unknown>,
        );

        dispatch(
          setAuth({
            token: loginRes.token,

            refresh: loginRes.refresh,

            user: authUser,

            loginType: "INT",
          }),
        );

        navigate("/dashboard", {
          replace: true,
        });
      } catch (e) {
        console.error(e);

        navigate("/login", {
          replace: true,
        });
      }
    };

    login();
  }, [dispatch, navigate]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <CircularProgress />
    </Box>
  );
}
