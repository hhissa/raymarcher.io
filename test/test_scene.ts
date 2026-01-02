
// Example minimal Scene type
import { Scene } from "../src/core/domain";

export const testScene: Scene = {
  name: "test_scene",
  shader: {
    id: "test",
    src: ` 
   float sdSphere(vec3 p, float r)
   {
     return length(p)-r;
   }
   float map(vec3 p) {
      return sdSphere(p - vec3(0.0 ,0.0, 2.0), 2.0);
   }
    `,
  },
};
