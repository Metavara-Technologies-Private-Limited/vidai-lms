import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import logo from "../assets/icons/Vidai-logo.svg";
import loginLogo from "../assets/icons/Login_Logo_Vidai.webp";
import styles from "../styles/VidaiLogin.module.css";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
import { setAuth } from "../store/authSlice";

// const AUTH_TOKEN_KEY = "auth_token";
// const AUTH_TOKEN_ALT_KEY = "authToken";
// const UI_AUTH_KEY = "vidai_ui_logged_in";
// const TEMP_USERNAME = "root";
// const TEMP_PASSWORD = "root";

type LanguageCode = "en" | "hi" | "es" | "pt";

const STORAGE_LANGUAGE_KEY = "language";

const LANGUAGE_OPTIONS: Array<{ code: LanguageCode; label: string }> = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Espanol" },
  { code: "pt", label: "Portugues" },
];

const TRANSLATIONS: Record<
  LanguageCode,
  {
    languageLabel: string;
    languageOptions: {
      en: string;
      hi: string;
      es: string;
      pt: string;
    };
    usernamePlaceholder: string;
    passwordPlaceholder: string;
    loginButton: string;
    forgotPassword: string;
    validationError: string;
    loginFailed: string;
    genericError: string;
    showPassword: string;
    hidePassword: string;
    heroPrefix: string;
    heroAccent: string;
  }
> = {
  en: {
    languageLabel: "Language",
    languageOptions: {
      en: "English",
      hi: "Hindi",
      es: "Espanol",
      pt: "Portugues",
    },
    usernamePlaceholder: "Username",
    passwordPlaceholder: "Password",
    loginButton: "Login",
    forgotPassword: "Forgot Password?",
    validationError: "Please enter username and password.",
    loginFailed: "Login failed",
    genericError: "Something went wrong",
    showPassword: "Show password",
    hidePassword: "Hide password",
    heroPrefix: "Unlock the potential of the",
    heroAccent: "AI-Powered Vidai EMR",
  },
  hi: {
    languageLabel: "भाषा",
    languageOptions: {
      en: "अंग्रेजी",
      hi: "हिंदी",
      es: "स्पेनिश",
      pt: "पुर्तगाली",
    },
    usernamePlaceholder: "यूजरनेम",
    passwordPlaceholder: "पासवर्ड",
    loginButton: "लॉगिन",
    forgotPassword: "पासवर्ड भूल गए?",
    validationError: "कृपया यूजरनेम और पासवर्ड दर्ज करें।",
    loginFailed: "लॉगिन असफल रहा",
    genericError: "कुछ गलत हो गया",
    showPassword: "पासवर्ड दिखाएं",
    hidePassword: "पासवर्ड छिपाएं",
    heroPrefix: "AI-सक्षम Vidai EMR की क्षमता खोलें",
    heroAccent: "",
  },
  es: {
    languageLabel: "Idioma",
    languageOptions: {
      en: "Ingles",
      hi: "Hindi",
      es: "Espanol",
      pt: "Portugues",
    },
    usernamePlaceholder: "Usuario",
    passwordPlaceholder: "Contrasena",
    loginButton: "Iniciar sesion",
    forgotPassword: "Olvidaste tu contrasena?",
    validationError: "Ingresa usuario y contrasena.",
    loginFailed: "Error de inicio de sesion",
    genericError: "Algo salio mal",
    showPassword: "Mostrar contrasena",
    hidePassword: "Ocultar contrasena",
    heroPrefix: "Desbloquea el potencial de",
    heroAccent: "Vidai EMR impulsado por IA",
  },
  pt: {
    languageLabel: "Idioma",
    languageOptions: {
      en: "Ingles",
      hi: "Hindi",
      es: "Espanhol",
      pt: "Portugues",
    },
    usernamePlaceholder: "Usuario",
    passwordPlaceholder: "Senha",
    loginButton: "Entrar",
    forgotPassword: "Esqueceu a senha?",
    validationError: "Informe usuario e senha.",
    loginFailed: "Falha no login",
    genericError: "Algo deu errado",
    showPassword: "Mostrar senha",
    hidePassword: "Ocultar senha",
    heroPrefix: "Desbloqueie o potencial do",
    heroAccent: "Vidai EMR com tecnologia de IA",
  },
};

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
    if (!canSubmit) {
      setError(t.validationError);
      return;
    }

    try {
      const response = await fetch("/stage-api/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || t.loginFailed);

      dispatch(setAuth(data));
      localStorage.setItem(STORAGE_LANGUAGE_KEY, language);

      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.genericError);
    }
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
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
            <label className={styles.languageLabel} htmlFor="language-select">
              {t.languageLabel}
            </label>
            <select
              id="language-select"
              value={language}
              onChange={handleLanguageChange}
              className={styles.languageSelect}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {t.languageOptions[option.code]}
                </option>
              ))}
            </select>
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

            <button className={styles.loginButton} type="submit">
              {t.loginButton}
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
