// src/application/validation/shaderValidator.ts
export function validateShaderCode(src: string) {
  const errors: { line: number; message: string }[] = [];

  if (/void\s+main\s*\(/.test(src)) {
    errors.push({ line: 0, message: "Shader must define `mainImage`, not `main`" });
  }
  if (src.includes("#version")) {
    errors.push({ line: 0, message: "Do not use #version in user code" });
  }
  if (src.includes("uniform")) {
    errors.push({ line: 0, message: "User code cannot declare uniforms" });
  }

  return errors;
}

function parseGLSLErrors(log: string) {
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
