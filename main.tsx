import React, { useRef } from "react";
import ReactDOM from "react-dom/client";
import { Editor } from "./src/application/editor/editor";
import { RaymarchCanvas, RaymarchCanvasHandle } from "./src/application/canvas/raymarch_canvas";
import { testScene } from "./test/test_scene";
import { ShaderUseCases } from "./src/core/usecases";

export function App() {
  const canvasRef = useRef<RaymarchCanvasHandle>(null);

  const handleCompile = (code: string) => {
    const renderer = canvasRef.current?.renderer;
    if (!renderer) return;

    console.log("running use case");

    const usecase = new ShaderUseCases(renderer);
    const { errors } = usecase.compileShaderCode(code);

    if (errors.length > 0) console.error(errors);
    return errors;
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Fullscreen canvas */}
      <RaymarchCanvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* Editor overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "30vh", // editor height
        minHeight: 200,
        zIndex: 10,
        pointerEvents: "auto" // editor should be interactable
      }}>
        <Editor code={testScene.shader.src} onCompile={handleCompile} />
      </div>
    </div>
  );
}

const container = document.getElementById("app-root");
if (!container) throw new Error("No root element found");

const root = ReactDOM.createRoot(container);
root.render(<App />);
