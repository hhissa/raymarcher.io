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

  parseGLSLErrors(log: string): ShaderError[] {
    const errors: { line: number; message: string }[] = [];

    const regex = /ERROR:\s*\d+:(\d+):\s*(.*)/g;
    let match;

    while ((match = regex.exec(log)) !== null) {
      errors.push({
        line: Number(match[1]) - 1, // editors are 0-based
        message: match[2],
      });
    }

    return errors;
  }

  compileShaderScene(scene: Scene): { errors: ShaderError[] } {
    const result = this.renderer.compile(scene);

    if (result.errors.length > 0) {
      console.log("errors present")
      var errorsParsed = this.parseGLSLErrors(result.errors[0].message);
      return { errors: errorsParsed };
    } else {
      console.log("Shader compiled successfully!");
      this.renderer.render(scene.cameraPos, scene.cameraDir)
    }
    return result;
  }

  compileShaderCode(code: string) {
    var sceneModel: Scene = { name: "scene", shader: { id: "userModule", src: code }, cameraPos: [0.0, 0.0, 0.0], cameraDir: [0.0, 0.0, -1.0] }
    var result = this.compileShaderScene(sceneModel);
    return result;
  }
}
