import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import logo from "../assets/icons/Vidai-logo.svg";
import loginLogo from "../assets/icons/Login_Logo_Vidai.webp";
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
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { toast } from "react-toastify";

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

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(
    resolveInitialLanguage,
  );
  const [error, setError] = useState("");
  const t = TRANSLATIONS[language];

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.trim().length > 0,
    [username, password],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!canSubmit) {
      const msg = t.validationError;
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      const loginRes = await authApi.login({
        username: username.trim(),
        password: password.trim(),
      });

      dispatch(
        setAuth({
          access: loginRes.token,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
      );
      localStorage.setItem(STORAGE_LANGUAGE_KEY, language);
      toast.success("Login successful!");

      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      let msg = t.genericError;

      const error = (
        err as {
          response?: {
            data?: {
              errors?: Array<{
                code?: string;
                detail?: string;
              }>;
            };
          };
        }
      )?.response?.data?.errors?.[0];

      const code = error?.code;

      if (code === "no_active_account") {
        msg = t.loginFailed;
      } else if (err instanceof Error) {
        msg = err.message;
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (event: SelectChangeEvent<LanguageCode>) => {
    const nextLanguage = event.target.value as LanguageCode;
    setLanguage(nextLanguage);
    localStorage.setItem(STORAGE_LANGUAGE_KEY, nextLanguage);
    setError("");
  };

  return (
    <div className={styles.loginPage}>
      <section className={styles.heroPanel}>
        <img className={styles.heroImage} src={loginLogo} alt="" />
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

            <button type="button" className={styles.forgotButton}>
              {t.forgotPassword}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
