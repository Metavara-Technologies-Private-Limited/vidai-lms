import { useState, useEffect, type SyntheticEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import logo from "../assets/icons/Vidai-logo.svg";
import loginLogo from "../assets/icons/Login_Logo_Vidai.webp";
import referaStdLogo from "../assets/icons/refera_std.png";
import styles from "../styles/VidaiLogin.module.css";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
import { setAuth } from "../store/authSlice";
import { authApi } from "../services/auth.api";
import {
  LANGUAGE_OPTIONS,
  STORAGE_LANGUAGE_KEY,
  TRANSLATIONS,
  type LanguageCode,
} from "../utils/languages";
import {
  clearDisplayNameOverride,
  parseAutoLoginParams,
  readLoginThemeMode,
  setDisplayNameOverride,
  setLoginThemeMode,
  splitDisplayName,
} from "../utils/autoLogin";
import {
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { toast } from "react-toastify";

import { buildAuthUserFromLogin } from "../utils/auth";

function resolveInitialLanguage(): LanguageCode {
  const raw = (localStorage.getItem(STORAGE_LANGUAGE_KEY) || "").trim();
  const byCode = LANGUAGE_OPTIONS.find((opt) => opt.code === raw)?.code;
  if (byCode) return byCode;

  const normalized = raw.toLowerCase();
  const legacyMap: Record<string, LanguageCode> = {
    english: "en",
    hindi: "hi",
    espanol: "es",
    portugues: "pt",
  };

  return legacyMap[normalized] || "en";
}

export default function VidaiLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const hasAutoLoginParams = Boolean(
    searchParams.get("t") || (searchParams.get("u") && searchParams.get("p")),
  );
  const persistedThemeMode = readLoginThemeMode();
  const isAutoLoginTheme = hasAutoLoginParams || persistedThemeMode === "auto";
  const isStandardVisit = !isAutoLoginTheme;

  const [loading, setLoading] = useState(hasAutoLoginParams);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(
    resolveInitialLanguage,
  );
  const [error, setError] = useState("");
  const [isExternalLogin, setIsExternalLogin] = useState<boolean>(false);
  const t = TRANSLATIONS[language];

  // Auto-login from URL params: ?t=<token> or legacy ?u=&p=&name=
  useEffect(() => {
    const credentials = parseAutoLoginParams(searchParams);
    if (!credentials) {
      if (hasAutoLoginParams) setLoading(false);
      return;
    }

    const { username: decodedUser, password: decodedPass, displayName } = credentials;

    setLoginThemeMode("auto");

    const doAutoLogin = async () => {
      try {
        setLoading(true);

        const loginRes = await authApi.login(
          { username: decodedUser.trim(), password: decodedPass.trim() },
          "INT",
        );

        const authUser = buildAuthUserFromLogin(
          loginRes.token,
          decodedUser,
          loginRes.role,
          loginRes.permissions,
          loginRes.user as Record<string, unknown>,
        );

        // Override display name if passed in URL
        if (displayName) {
          const { first, last } = splitDisplayName(displayName);
          authUser.first_name = first;
          authUser.last_name = last;
          setDisplayNameOverride(displayName);
        } else {
          clearDisplayNameOverride();
        }

        dispatch(
          setAuth({
            token: loginRes.token,
            refresh: loginRes.refresh,
            user: authUser,
            loginType: "INT",
          }),
        );

        navigate("/dashboard", { replace: true });
      } catch (err: unknown) {
        setLoading(false);
        const msg =
          err instanceof Error ? err.message : "Auto-login failed";
        setError(msg);
        toast.error(msg);
      }
    };

    void doAutoLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: SyntheticEvent) => {
    // Sanitize
    if (loading) return;
    event.preventDefault();
    setError("");

    // Validations
    if (!username.trim() || !password.trim()) {
      const msg = t.emptyFields;
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      // Manual login should always switch the login page back to standalone (green) mode.
      setLoginThemeMode("normal");
      clearDisplayNameOverride();
      const mode = isExternalLogin ? "EXT" : "INT";
      const loginRes = await authApi.login(
        { username: username.trim(), password: password.trim() },
        mode,
      );

      const authUser = buildAuthUserFromLogin(
        loginRes.token,
        username,
        loginRes.role,
        loginRes.permissions,
        loginRes.user as Record<string, unknown>,
      );

      dispatch(
        setAuth({
          token: loginRes.token,
          refresh: loginRes.refresh,
          user: authUser,
          loginType: mode,
        }),
      );

      localStorage.setItem(STORAGE_LANGUAGE_KEY, language);
      toast.success("Login successful!");

      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      let msg = t.genericError;

      const responseData = (
        err as {
          response?: {
            data?: {
              message?: string;
              detail?: string;
              errors?: Array<{
                code?: string;
                detail?: string;
              }>;
            };
          };
        }
      )?.response?.data;

      const error = responseData?.errors?.[0];

      const code = error?.code;

      if (code === "no_active_account") {
        msg = t.loginFailed;
      } else if (responseData?.message) {
        msg = responseData.message;
      } else if (responseData?.detail) {
        msg = responseData.detail;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      toast.error(msg);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthModeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsExternalLogin(e.target.checked);
  };

  const handleLanguageChange = (event: SelectChangeEvent<LanguageCode>) => {
    const nextLanguage = event.target.value as LanguageCode;
    setLanguage(nextLanguage);
    localStorage.setItem(STORAGE_LANGUAGE_KEY, nextLanguage);
    setError("");
  };

  if (hasAutoLoginParams && loading) {
    return (
      <div className={styles.loginPage} style={{ display: "grid", placeItems: "center" }}>
        <CircularProgress size={36} />
      </div>
    );
  }

  return (
    <div className={styles.loginPage}>
      <section className={styles.heroPanel}>
        <img
          className={styles.heroImage}
          src={isStandardVisit ? referaStdLogo : loginLogo}
          alt=""
        />
        <p className={styles.heroTagline}>
          {t.heroPrefix}
          {t.heroAccent ? (
            <>
              {" "}
              <span className={styles.heroTaglineAccent}>{t.heroAccent}</span>
            </>
          ) : null}
        </p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.topSection}>
          <div className={styles.languageWrap}>
            <FormControl
              size="small"
              variant="outlined"
              className={styles.languageSelect}
            >
              <InputLabel id="language-label">{t.languageLabel}</InputLabel>

              <Select
                labelId="language-label"
                id="language-select"
                value={language}
                onChange={handleLanguageChange}
                label={t.languageLabel}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {t.languageOptions[option.code]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <img className={styles.logo} src={logo} alt="Vidai" />
        </div>

        <div className={styles.formContent}>
          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <User size={18} className={styles.inputIcon} aria-hidden="true" />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t.usernamePlaceholder}
                autoComplete="username"
                className={styles.inputField}
              />
            </div>

            <div className={styles.inputGroup}>
              <Lock size={18} className={styles.inputIcon} aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.passwordPlaceholder}
                autoComplete="current-password"
                className={styles.inputField}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? t.hidePassword : t.showPassword}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error ? <p className={styles.errorText}>{error}</p> : null}

            <FormControlLabel
              control={
                <Checkbox
                  checked={isExternalLogin}
                  onChange={handleAuthModeToggle}
                  size="small"
                />
              }
              label="Use client portal login"
            />

            <button
              className={styles.loginButton}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress
                    size={16}
                    color="inherit"
                    style={{ marginRight: 8 }}
                  />
                  Logging in...
                </>
              ) : (
                t.loginButton
              )}
            </button>

            <button
              type="button"
              className={styles.forgotButton}
              onClick={() => {
                toast.info(
                  "Please contact your administrator to reset your password.",
                );
              }}
            >
              {t.forgotPassword}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
