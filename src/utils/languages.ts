
export type LanguageCode = "en" | "hi" | "es" | "pt";

export const STORAGE_LANGUAGE_KEY = "language";

export const LANGUAGE_OPTIONS: Array<{ code: LanguageCode; label: string }> = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Espanol" },
  { code: "pt", label: "Portugues" },
];

export const TRANSLATIONS: Record<
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
    loginFailed: "Invalid credentials",
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
    loginFailed: "अमान्य क्रेडेंशियल्स",
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
    loginFailed: "Credenciales inválidas",
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
    loginFailed: "Credenciais inválidas",
    genericError: "Algo deu errado",
    showPassword: "Mostrar senha",
    hidePassword: "Ocultar senha",
    heroPrefix: "Desbloqueie o potencial do",
    heroAccent: "Vidai EMR com tecnologia de IA",
  },
};