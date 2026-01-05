export interface ShaderModule {
  id: string
  src: string
}

export interface Scene {
  name: string
  shader: ShaderModule
  cameraPos: [number, number, number]
  cameraDir: [number, number, number]
}
