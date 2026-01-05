import { Scene } from "../core/domain"

export interface Renderer {
  gl: WebGL2RenderingContext | null;
  initialize(canvas: HTMLCanvasElement): void
  compile(scene: Scene): ShaderDiagnostics
  render(cameraPos: [number, number, number], cameraDir: [number, number, number]): void
  resize(w: number, h: number): void
  dispose(): void
}

export interface ShaderDiagnostics {
  errors: { line: number; message: string }[]
}
