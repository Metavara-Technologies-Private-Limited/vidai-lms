import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import logo from "../assets/icons/Vidai-logo.svg";
import loginSpinner from "../assets/icons/Login_Spinner_Vidai.webp";
import styles from "../styles/VidaiLogin.module.css";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
import { setAuth } from "../store/authSlice";

// const AUTH_TOKEN_KEY = "auth_token";
// const AUTH_TOKEN_ALT_KEY = "authToken";
// const UI_AUTH_KEY = "vidai_ui_logged_in";
// const TEMP_USERNAME = "root";
// const TEMP_PASSWORD = "root";

const LANGUAGE_OPTIONS = ["English", "Hindi", "Espanol", "Portugues"];

export default function VidaiLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState(LANGUAGE_OPTIONS[0]);
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.trim().length > 0,
    [username, password],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Please enter username and password.");
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
      if (!response.ok) throw new Error(data?.message || "Login failed");

      dispatch(setAuth(data));
      localStorage.setItem("language", language);

      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className={styles.loginPage}>
      <section className={styles.heroPanel}>
        <img
          className={styles.heroFullImage}
          src={loginSpinner}
          alt="Vidai login spinner artwork"
        />
      </section>

      <section className={styles.formPanel}>
        <div className={styles.topSection}>
          <div className={styles.languageWrap}>
            <label className={styles.languageLabel} htmlFor="language-select">
              Language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className={styles.languageSelect}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
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
                placeholder="Username"
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
                placeholder="Password"
                autoComplete="current-password"
                className={styles.inputField}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error ? <p className={styles.errorText}>{error}</p> : null}

            <button className={styles.loginButton} type="submit">
              Login
            </button>

            <button type="button" className={styles.forgotButton}>
              Forgot Password?
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
