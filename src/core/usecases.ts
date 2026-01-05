import { Renderer } from "../ports/renderer";
import { Scene } from "./domain";
interface ShaderError {
  line: number;
  message: string;
}
export class ShaderUseCases {
  compileShader(renderer: Renderer, scene: Scene): { errors: ShaderError[] } {
    const result = renderer.compile(scene);

    if (result.errors.length > 0) {
      console.error("Shader compilation failed:", result.errors);
    } else {
      console.log("Shader compiled successfully!");
    }

    return result;
  }
}
