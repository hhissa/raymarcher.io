export interface ShaderModule {
  id: string
  src: string 
}

export interface Scene {
  name: string 
  shader: ShaderModule
}
