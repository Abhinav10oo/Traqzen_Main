// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes.jsx";
import { UIProvider } from "./context/UIContext.jsx";
import "./styles/style.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UIProvider>
      <RouterProvider router={router} />
    </UIProvider>
  </React.StrictMode>
);
