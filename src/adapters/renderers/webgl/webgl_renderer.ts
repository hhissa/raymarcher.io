import { Scene } from "../../../core/domain";
import { Renderer } from "../../../ports/renderer";
import raymarcher from "./raymarcher.glsl?raw";


export class WebGLRenderer implements Renderer {
  public gl: WebGL2RenderingContext | null = null;

  private program: WebGLProgram | null = null;
  private vbo: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;

  private uniforms: Record<string, WebGLUniformLocation> = {};

  initialize(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext("webgl2");
    if (!this.gl) throw new Error("WebGL2 not supported");

    const gl = this.gl;

    // Fullscreen quad
    const vertices = new Float32Array([
      -1, -1, 0,
      1, -1, 0,
      -1, 1, 0,
      1, 1, 0,
    ]);

    // --- VAO ---
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // --- VBO ---
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Global state
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
  }

  compile(scene: Scene) {
    if (!this.gl) {
      return { errors: [{ line: 0, message: "GL context not initialized" }] };
    }

    const gl = this.gl;

    const fragSource = raymarcher.replace(
      "{{USER_MAP}}",
      scene.shader.src
    );

    const vertSource = `#version 300 es
    in vec3 aPosition;
    void main() {
      gl_Position = vec4(aPosition, 1.0);
    }`;

    const compileShader = (type: GLenum, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader) || "";
        gl.deleteShader(shader);
        return { shader: null, error: info };
      }
      return { shader, error: null };
    };

    const vert = compileShader(gl.VERTEX_SHADER, vertSource);
    if (vert.error) {
      return { errors: [{ line: 0, message: "Vertex shader: " + vert.error }] };
    }

    const frag = compileShader(gl.FRAGMENT_SHADER, fragSource);
    if (frag.error) {
      return { errors: [{ line: 0, message: "Fragment shader: " + frag.error }] };
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vert.shader!);
    gl.attachShader(program, frag.shader!);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) || "";
      gl.deleteProgram(program);
      return { errors: [{ line: 0, message: "Program link: " + info }] };
    }

    // Replace old program
    if (this.program) gl.deleteProgram(this.program);
    this.program = program;

    // Cleanup shaders
    gl.deleteShader(vert.shader!);
    gl.deleteShader(frag.shader!);

    // --- Bind VAO + attributes ---
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const aPos = gl.getAttribLocation(this.program, "aPosition");
    gl.enableVertexAttribArray(aPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    // --- Uniform locations ---
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, "resolution")!,
      cameraPosition: gl.getUniformLocation(this.program, "cameraPosition")!,
      cameraDirection: gl.getUniformLocation(this.program, "cameraDirection")!,
    };

    return { errors: [] };
  }

  resize(width: number, height: number) {
    if (!this.gl) return;
    this.gl.viewport(0, 0, width, height);
  }

  private setUniforms(
    cameraPos?: [number, number, number],
    cameraDir?: [number, number, number]
  ) {
    if (!this.gl || !this.program) return;

    const gl = this.gl;
    gl.useProgram(this.program);

    if (this.uniforms.resolution) {
      gl.uniform2f(
        this.uniforms.resolution,
        gl.canvas.width,
        gl.canvas.height
      );
    }

    if (this.uniforms.cameraPosition && cameraPos) {
      gl.uniform3f(
        this.uniforms.cameraPosition,
        cameraPos[0],
        cameraPos[1],
        cameraPos[2]
      );
    }

    if (this.uniforms.cameraDirection && cameraDir) {
      gl.uniform3f(
        this.uniforms.cameraDirection,
        cameraDir[0],
        cameraDir[1],
        cameraDir[2]
      );
    }
  }

  render(
    cameraPos?: [number, number, number],
    cameraDir?: [number, number, number]
  ) {
    if (!this.gl || !this.program) return;

    const gl = this.gl;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.setUniforms(cameraPos, cameraDir);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    if (!this.gl) return;

    if (this.program) this.gl.deleteProgram(this.program);
    if (this.vbo) this.gl.deleteBuffer(this.vbo);
    if (this.vao) this.gl.deleteVertexArray(this.vao);

    this.program = null;
    this.vbo = null;
    this.vao = null;
  }
}

