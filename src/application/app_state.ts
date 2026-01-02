import { Scene } from "../core/domain"
import { Renderer } from "../ports/renderer"

export class AppState {
  scene: Scene
  renderer: Renderer

  renderFrame() {
    this.renderer.render()
  }
}

