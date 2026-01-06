import { Renderer } from "../ports/renderer";
import { Scene } from "./domain";
interface ShaderError {
  line: number;
  message: string;
}
export class ShaderUseCases {

  private renderer: Renderer;
  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  parseGLSLErrors(startLine: number, log: string): ShaderError[] {
    const errors: { line: number; message: string }[] = [];

    const regex = /ERROR:\s*\d+:(\d+):\s*(.*)/g;
    let match;

    while ((match = regex.exec(log)) !== null) {
      errors.push({
        line: Number(match[1]) - startLine - 1, // editors are 0-based
        message: match[2],
      });
    }

    return errors;
  }

  compileShaderScene(scene: Scene): { errors: ShaderError[] } {
    const result = this.renderer.compile(scene);

    if (result.errors.length > 0) {
      const errorsParsed = this.parseGLSLErrors(
        result.errors[0].line,
        result.errors[0].message
      );

      return {
        errors: errorsParsed.map(e => ({ ...e })) // defensive copy
      };
    }

    this.renderer.render(scene.cameraPos, scene.cameraDir);
    return { errors: [] }; // NEVER return `result`
  }

  compileShaderCode(code: string) {
    var sceneModel: Scene = { name: "scene", shader: { id: "userModule", src: code }, cameraPos: [0.0, 0.0, 0.0], cameraDir: [0.0, 0.0, -1.0] }
    var result = this.compileShaderScene(sceneModel);
    return result;
  }
}
