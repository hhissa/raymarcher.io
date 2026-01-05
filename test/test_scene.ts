
// Example minimal Scene type
import { Scene } from "../src/core/domain";

export const testScene: Scene = {
  name: "test_scene",
  shader: {
    id: "test",
    src: ` 
   SDF map(vec3 p) {
    // Example primitives
    SDF sphere = sdfSphere(p, vec3(0.0,0.0,-3.0), 1.0, vec3(1.0,0.0,0.0)); // red
    SDF box    = sdfBox(p, vec3(1.0,0.0,-2.0), vec3(0.5), vec3(0.0,0.0,1.0)); // blue

    // Combine primitives (example: smooth union)
    SDF scene = opSmoothUnion(sphere, box, 0.2);

    return scene;
}
    `,
  },
  cameraPos: [0.0, 0.0, 0.0],
  cameraDir: [0.0, 0.0, -1.0]
};
