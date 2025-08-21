// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes.jsx";
import { UIProvider } from "./context/UIContext.jsx";
import "./styles/style.css";
import "./styles/variables.css";
import "./styles/base.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/layout.css";
import "./styles/vehicle_List.css";
import "./styles/vehicle_Detail.css";



ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UIProvider>
      <RouterProvider router={router} />
    </UIProvider>
  </React.StrictMode>
);
