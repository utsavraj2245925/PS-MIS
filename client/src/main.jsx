import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import "@fontsource/ibm-plex-sans";

import "@fontsource/ibm-plex-mono";

import "antd/dist/reset.css";

import "./index.css";

import App from "./App.jsx";

import { AuthProvider } from "./context/AuthContext";

createRoot(
document.getElementById("root")
).render(

  <StrictMode>


<AuthProvider>
  <App />
</AuthProvider>


  </StrictMode>
);
