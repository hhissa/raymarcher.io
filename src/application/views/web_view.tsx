import { Editor } from "../editor/editor";

export function App() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "50%", height: "100%", flexShrink: 0 }}>
        <Editor />
      </div>

      <div style={{ width: "50%", height: "100%", flexShrink: 0 }}>
        <canvas id="raymarch-canvas" style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

