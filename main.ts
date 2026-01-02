import { WebGLRenderer } from "./src/adapters/renderers/webgl/webgl_renderer";
import { testScene } from "./test/test_scene";

const canvas = document.getElementById("raymarch-canvas") as HTMLCanvasElement;
const renderer = new WebGLRenderer();
renderer.initialize(canvas);

// Optional: set viewport
renderer.resize(canvas.width, canvas.height);
const result = renderer.compile(testScene);

if (result.errors.length > 0) {
  console.error("Shader compilation failed:", result.errors);
} else {
  console.log("Shader compiled successfully!");
}

renderer.render();


