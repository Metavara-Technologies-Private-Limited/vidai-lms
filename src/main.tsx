import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Provider } from "react-redux";
import { store } from "./store";
import { clearAuth } from "./store/authSlice";
import AppRoutes from "./routes";
import theme from "./theme";
import "./index.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// localStorage.removeItem("vidai_ui_logged_in");
// sessionStorage.removeItem("vidai_ui_logged_in");
// localStorage.removeItem("auth_token");
// localStorage.removeItem("authToken");

window.addEventListener("auth:logout", () => {
  store.dispatch(clearAuth());
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
          />
        </ThemeProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);
