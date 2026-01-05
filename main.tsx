import React, { useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

import { Editor } from "./src/application/editor/editor";
import { WebGLRenderer } from "./src/adapters/renderers/webgl/webgl_renderer";
import { testScene } from "./test/test_scene";
import { ShaderUseCases } from "./src/core/usecases";


const canvas = document.getElementById("raymarch-canvas") as HTMLCanvasElement;
const renderer = new WebGLRenderer();
renderer.initialize(canvas);

// Optional: set viewport
renderer.resize(canvas.width, canvas.height);
function resizeCanvas(canvas: HTMLCanvasElement, renderer: WebGLRenderer) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    renderer.resize(width, height);
    renderer.render();
  }
}
resizeCanvas(canvas, renderer);
window.addEventListener("resize", () => requestAnimationFrame(() => resizeCanvas(canvas, renderer)));
const result = renderer.compile(testScene);

if (result.errors.length > 0) {
  console.error("Shader compilation failed:", result.errors);
} else {
  console.log("Shader compiled successfully!");
}

renderer.render(testScene.cameraPos, testScene.cameraDir);
