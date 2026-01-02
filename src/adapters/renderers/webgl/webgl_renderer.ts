
import { Scene } from "../../../core/domain";
import { Renderer } from "../../../ports/renderer";
import raymarcher from "./raymarcher.glsl?raw";

export class WebGLRenderer implements Renderer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vbo: WebGLBuffer | null = null;

  initialize(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext("webgl2");
    if (!this.gl) throw new Error("WebGL2 not supported");

    // Create full-screen quad
    const vertices = new Float32Array([
      -1, -1, 0,
      1, -1, 0,
      -1, 1, 0,
      1, 1, 0,
    ]);
    this.vbo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
  }

  compile(scene: Scene) {
    if (!this.gl) return { errors: [{ line: 0, message: "GL context not initialized" }] };

    const gl = this.gl;
    const sdfShader = scene.shader.src;
    const fragSource = raymarcher.replace("{{USER_MAP}}", sdfShader);

    const vertSource = `#version 300 es 
      in vec3 aPosition;
      void main() {
          gl_Position = vec4(aPosition, 1.0);
      }
    `;

    // Compile shaders
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
    if (vert.error) return { errors: [{ line: 0, message: "Vertex shader error: " + vert.error }] };

    const frag = compileShader(gl.FRAGMENT_SHADER, fragSource);
    if (frag.error) return { errors: [{ line: 0, message: "Fragment shader error: " + frag.error }] };

    // Link program
    const program = gl.createProgram()!;
    gl.attachShader(program, vert.shader!);
    gl.attachShader(program, frag.shader!);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) || "";
      gl.deleteProgram(program);
      return { errors: [{ line: 0, message: "Program link error: " + info }] };
    }

    // Cleanup old program if exists
    if (this.program) gl.deleteProgram(this.program);
    this.program = program;

    // Cleanup shaders
    gl.deleteShader(vert.shader!);
    gl.deleteShader(frag.shader!);

    // Bind attributes
    gl.useProgram(this.program);
    const aPos = gl.getAttribLocation(this.program, "aPosition");
    gl.enableVertexAttribArray(aPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    return { errors: [] };
  }

  resize(width: number, height: number) {
    if (!this.gl) return;
    this.gl.viewport(0, 0, width, height);
  }

  render() {
    if (!this.gl || !this.program) return;

    const gl = this.gl;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    if (!this.gl) return;
    if (this.program) this.gl.deleteProgram(this.program);
    if (this.vbo) this.gl.deleteBuffer(this.vbo);
    this.program = null;
    this.vbo = null;
  }
}

