
import React, { useLayoutEffect, useRef } from "react";
import { WebGLRenderer } from "../../adapters/renderers/webgl/webgl_renderer";
import { ShaderUseCases } from "../../core/usecases";
import { testScene } from "../../../test/test_scene";

export function RaymarchCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const useCasesRef = useRef<ShaderUseCases | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new WebGLRenderer();
    renderer.initialize(canvas);

    rendererRef.current = renderer;
    useCasesRef.current = new ShaderUseCases(renderer);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        renderer.resize(width, height);
        renderer.render();
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const { errors } = useCasesRef.current.compileShaderScene(testScene);
    if (errors.length === 0) {
      renderer.render(testScene.cameraPos, testScene.cameraDir);
    } else {
      console.error("Shader errors:", errors);
    }

    return () => {
      window.removeEventListener("resize", resize);
      renderer.dispose?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
