
import React from "react";
import { Editor } from "./src/application/editor/editor";
import { RaymarchCanvas } from "./src/application/canvas/raymarch_canvas";
import ReactDOM from "react-dom/client";

export function App() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column", // stack vertically
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Editor at the top */}
      <div style={{ height: "40vh", minHeight: 200 }}>
        <Editor />
      </div>

      {/* Canvas fills the rest */}
      <div style={{ flex: 1, position: "relative" }}>
        <RaymarchCanvas />
      </div>
    </div>
  );
}

const container = document.getElementById("app-root");
if (!container) throw new Error("No root element found");

const root = ReactDOM.createRoot(container);
root.render(<App />);

