import { Scene } from "../core/domain"

export interface Renderer {

  initialize(canvas: HTMLCanvasElement): void
  compile(scene: Scene): ShaderDiagnostics
  render(): void
  resize(w: number, h: number): void
  dispose(): void
}

export interface ShaderDiagnostics {
  errors: { line: number; message: string }[]
}
