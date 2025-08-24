import "./index.ts";

import ReactDOM from "react-dom/client";
import { ReactFlowProvider } from "@xyflow/react";

import App from "./graph/graph-manager.tsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>,
);
