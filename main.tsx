import React, { useRef } from "react";
import ReactDOM from "react-dom/client";
import { Editor } from "./src/application/editor/editor";
import { RaymarchCanvas, RaymarchCanvasHandle } from "./src/application/canvas/raymarch_canvas";
import { testScene } from "./test/test_scene";
import { ShaderUseCases } from "./src/core/usecases";

export function App() {
  const canvasRef = useRef<RaymarchCanvasHandle>(null);

  // Handler for Editor compile button
  const handleCompile = (code: string) => {
    const renderer = canvasRef.current?.renderer;



    console.log("running use case"); // <-- this will now fire

    const usecase = new ShaderUseCases(renderer!)
    const { errors } = usecase.compileShaderCode(code);


  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ height: "30vh", minHeight: 200 }}>
        <Editor code={testScene.shader.src} onCompile={handleCompile} />
      </div>

      <div style={{ flex: 1 }}>
        <RaymarchCanvas ref={canvasRef} />
      </div>
    </div>
  );
}

const container = document.getElementById("app-root");
if (!container) throw new Error("No root element found");

const root = ReactDOM.createRoot(container);
root.render(<App />);

