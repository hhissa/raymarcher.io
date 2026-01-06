#version 300 es
#define EPSILON 0.0001
#define MAX_STEPS 100
#define MAX_DISTANCE 1000.0
#define MIN_DISTANCE 0.1
precision highp float;
precision highp int;

out vec4 fragColor;
in vec3 rd;

uniform vec2 resolution;
uniform vec3 cameraPosition;
uniform vec3 cameraDirection;

///////////////////////////////////////////////////////////////////////////////////////
// DATA STRUCTURES //

struct Light {
    vec3 position;
    vec3 direction;
    vec4 color;
    float brightness;
    float penumbraFactor;
} light;

struct RayInfo {
    vec3 origin;
    vec3 dir;
};

// SDF struct with color
struct SDF {
    float dist;   // distance to surface
    vec3 color;   // associated color
};

///////////////////////////////////////////////////////////////////////////////////////
// INIT FUNCTIONS //

void initLight() {
    light.position = vec3(0.0, 0.0, -1.0);
    light.direction = vec3(0.0,0.0, -1.0);
}

void initRayout(out RayInfo ray) 
{
    vec2 uv = ( gl_FragCoord.xy / resolution.xy ) * 2.0 - 1.0;  // [-1,1]
    uv.x *= resolution.x / resolution.y;                        // aspect correction

    ray.origin = cameraPosition;

    // Camera frame
    vec3 forward = normalize(cameraDirection);         // camera looks along this
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(forward, worldUp));
    vec3 up = cross(right, forward);

    // Field of view
    float fovRad = radians(120.0);                      // or pass cameraFov as uniform
    float halfHeight = tan(fovRad / 2.0);
    float halfWidth = halfHeight * (resolution.x / resolution.y);

    // Ray in world space
    ray.dir = normalize(forward + uv.x * halfWidth * right + uv.y * halfHeight * up);
}

///////////////////////////////////////////////////////////////////////////////////////
// BOOLEAN OPERATORS (branchless, color-aware) //

vec3 rotatey(vec3 p, float theta) {
    return p * mat3(vec3(cos(theta), 0.0, sin(theta)),
     vec3(0.0, 1.0, 0.0), 
     vec3(-sin(theta), 0.0, cos(theta)));
}

vec3 rotatex(vec3 p, float theta) {
    return p * mat3(vec3(1.0, 0.0, 0.0), 
    vec3(0.0, cos(theta), -sin(theta)), 
    vec3(0.0, sin(theta), cos(theta)));;
}

// Union
SDF opUnion(SDF a, SDF b) {
    float k = step(b.dist, a.dist);
    SDF outSDF;
    outSDF.dist = min(a.dist, b.dist);
    outSDF.color = mix(a.color, b.color, k);
    return outSDF;
}

// Subtraction
SDF opSubtraction(SDF a, SDF b) {
    float d = max(-a.dist, b.dist);
    float k = step(b.dist, -a.dist);
    SDF outSDF;
    outSDF.dist = d;
    outSDF.color = mix(a.color, b.color, k);
    return outSDF;
}

// Intersection
SDF opIntersection(SDF a, SDF b) {
    float d = max(a.dist, b.dist);
    float k = step(b.dist, a.dist);
    SDF outSDF;
    outSDF.dist = d;
    outSDF.color = mix(a.color, b.color, k);
    return outSDF;
}

// Smooth Union
SDF opSmoothUnion(SDF a, SDF b, float k) {
    float h = clamp(0.5 + 0.5*(b.dist - a.dist)/k, 0.0, 1.0);
    SDF outSDF;
    outSDF.dist = mix(b.dist, a.dist, h) - k*h*(1.0-h);
    outSDF.color = mix(b.color, a.color, h);
    return outSDF;
}

// Smooth Subtraction
SDF opSmoothSubtraction(SDF a, SDF b, float k) {
    float h = clamp(0.5 - 0.5*(b.dist + a.dist)/k, 0.0, 1.0);
    SDF outSDF;
    outSDF.dist = mix(b.dist, -a.dist, h) + k*h*(1.0-h);
    outSDF.color = mix(b.color, a.color, h);
    return outSDF;
}

// Smooth Intersection
SDF opSmoothIntersection(SDF a, SDF b, float k) {
    float h = clamp(0.5 - 0.5*(b.dist - a.dist)/k, 0.0, 1.0);
    SDF outSDF;
    outSDF.dist = mix(b.dist, a.dist, h) + k*h*(1.0-h);
    outSDF.color = mix(b.color, a.color, h);
    return outSDF;
}

///////////////////////////////////////////////////////////////////////////////////////
// PRIMITIVES //


SDF sdfSphere(vec3 p, vec3 pos, float s, vec3 color) {
    SDF sOut;
    sOut.dist = length(p - pos) - s;
    sOut.color = color;
    return sOut;
}

SDF sdfBox(vec3 p, vec3 pos, vec3 b, vec3 color) {
    vec3 q = abs(p - pos) - b;
    SDF sOut;
    sOut.dist = length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
    sOut.color = color;
    return sOut;
}

SDF sdfRoundBox(vec3 p, vec3 pos, vec3 b, float r, vec3 color) {
    vec3 q = abs(p - pos) - b + r;
    SDF sOut;
    sOut.dist = length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
    sOut.color = color;
    return sOut;
}

SDF sdfBoxFrame(vec3 p, vec3 pos, vec3 b, float e, vec3 color) {
    vec3 pp = abs(p - pos) - b;
    vec3 q = abs(pp + e) - e;
    SDF sOut;
    sOut.dist = min(min(
        length(max(vec3(pp.x,q.y,q.z),0.0))+min(max(pp.x,max(q.y,q.z)),0.0),
        length(max(vec3(q.x,pp.y,q.z),0.0))+min(max(q.x,max(pp.y,q.z)),0.0)),
        length(max(vec3(q.x,q.y,pp.z),0.0))+min(max(q.x,max(q.y,pp.z)),0.0));
    sOut.color = color;
    return sOut;
}

SDF sdfTorus(vec3 p, vec3 pos, vec2 t, vec3 color) {
    vec2 q = vec2(length((p - pos).xz)-t.x, (p - pos).y);
    SDF sOut;
    sOut.dist = length(q) - t.y;
    sOut.color = color;
    return sOut;
}

SDF sdfCappedTorus(vec3 p, vec3 pos, vec2 sc, float ra, float rb, vec3 color) {
    vec3 pp = p - pos;
    pp.x = abs(pp.x);
    float k = (sc.y*pp.x>sc.x*pp.y)? dot(pp.xy,sc) : length(pp.xy);
    SDF sOut;
    sOut.dist = sqrt(dot(pp,pp) + ra*ra - 2.0*ra*k) - rb;
    sOut.color = color;
    return sOut;
}

SDF sdfLink(vec3 p, vec3 pos, float le, float r1, float r2, vec3 color) {
    vec3 pp = p - pos;
    vec3 q = vec3(pp.x, max(abs(pp.y)-le,0.0), pp.z);
    SDF sOut;
    sOut.dist = length(vec2(length(q.xy)-r1, q.z)) - r2;
    sOut.color = color;
    return sOut;
}

SDF sdfCylinder(vec3 p, vec3 pos, vec3 c, vec3 color) {
    SDF sOut;
    sOut.dist = length((p - pos).xz - c.xy) - c.z;
    sOut.color = color;
    return sOut;
}

SDF sdfCone(vec3 p, vec3 pos, vec2 c, float h, vec3 color) {
    vec3 pp = p - pos;
    vec2 q = h*vec2(c.x/c.y,-1.0);
    vec2 w = vec2(length(pp.xz), pp.y);
    vec2 a = w - q*clamp(dot(w,q)/dot(q,q),0.0,1.0);
    vec2 b = w - q*vec2(clamp(w.x/q.x,0.0,1.0),1.0);
    float k = sign(q.y);
    float d = min(dot(a,a), dot(b,b));
    float s = max(k*(w.x*q.y - w.y*q.x), k*(w.y - q.y));
    SDF sOut;
    sOut.dist = sqrt(d)*sign(s);
    sOut.color = color;
    return sOut;
}

SDF sdfPlane(vec3 p, vec3 pos, vec3 n, float h, vec3 color) {
    SDF sOut;
    sOut.dist = dot(p - pos, n) + h;
    sOut.color = color;
    return sOut;
}

SDF sdfHexPrism(vec3 p, vec3 pos, vec2 h, vec3 color) {
    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    vec3 pp = abs(p - pos);
    pp.xy -= 2.0*min(dot(k.xy, pp.xy),0.0)*k.xy;
    vec2 d = vec2(
        length(pp.xy - vec2(clamp(pp.x,-k.z*h.x,k.z*h.x), h.x))*sign(pp.y - h.x),
        pp.z - h.y
    );
    SDF sOut;
    sOut.dist = min(max(d.x,d.y),0.0) + length(max(d,0.0));
    sOut.color = color;
    return sOut;
}

SDF sdfTriPrism(vec3 p, vec3 pos, vec2 h, vec3 color) {
    vec3 pp = abs(p - pos);
    SDF sOut;
    sOut.dist = max(pp.z-h.y, max(pp.x*0.866025 + pp.y*0.5, -pp.y) - h.x*0.5);
    sOut.color = color;
    return sOut;
}

SDF sdfCapsule(vec3 p, vec3 pos, vec3 a, vec3 b, float r, vec3 color) {
    vec3 pp = p - pos;
    vec3 pa = pp - a;
    vec3 ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
    SDF sOut;
    sOut.dist = length(pa - ba*h) - r;
    sOut.color = color;
    return sOut;
}

SDF sdfVerticalCapsule(vec3 p, vec3 pos, float h, float r, vec3 color) {
    vec3 pp = p - pos;
    pp.y -= clamp(pp.y,0.0,h);
    SDF sOut;
    sOut.dist = length(pp) - r;
    sOut.color = color;
    return sOut;
}

SDF sdfCappedCylinder(vec3 p, vec3 pos, float r, float h, vec3 color) {
    vec3 pp = p - pos;
    vec2 d = abs(vec2(length(pp.xz), pp.y)) - vec2(r,h);
    SDF sOut;
    sOut.dist = min(max(d.x,d.y),0.0) + length(max(d,0.0));
    sOut.color = color;
    return sOut;
}

SDF sdfRoundedCylinder(vec3 p, vec3 pos, float ra, float rb, float h, vec3 color) {
    vec3 pp = p - pos;
    vec2 d = vec2(length(pp.xz)-ra+rb, abs(pp.y)-h+rb);
    SDF sOut;
    sOut.dist = min(max(d.x,d.y),0.0) + length(max(d,0.0)) - rb;
    sOut.color = color;
    return sOut;
}

SDF sdfCappedCone(vec3 p, vec3 pos, float h, float r1, float r2, vec3 color) {
    vec3 pp = p - pos;
    vec2 q = vec2(length(pp.xz), pp.y);
    vec2 k1 = vec2(r2,h);
    vec2 k2 = vec2(r2-r1, 2.0*h);
    vec2 ca = vec2(q.x - min(q.x, (q.y<0.0)?r1:r2), abs(q.y)-h);
    vec2 cb = q - k1 + k2*clamp(dot(k1-q,k2)/dot(k2,k2),0.0,1.0);
    float s = (cb.x<0.0 && ca.y<0.0)? -1.0: 1.0;
    SDF sOut;
    sOut.dist = s*sqrt(min(dot(ca,ca),dot(cb,cb)));
    sOut.color = color;
    return sOut;
}

SDF sdfRoundCone(vec3 p, vec3 pos, float r1, float r2, float h, vec3 color) {
    vec3 pp = p - pos;
    float b = (r1-r2)/h;
    float a = sqrt(1.0-b*b);
    vec2 q = vec2(length(pp.xz), pp.y);
    float k = dot(q, vec2(a,b));
    SDF sOut;
    if(k<0.0) sOut.dist = length(q)-r1;
    else if(k>a*h) sOut.dist = length(q-vec2(0.0,h)) - r2;
    else sOut.dist = dot(q, vec2(a,b)) - r1;
    sOut.color = color;
    return sOut;
}

SDF sdfEllipsoid(vec3 p, vec3 pos, vec3 r, vec3 color) {
    vec3 pp = p - pos;
    float k0 = length(pp / r);
    float k1 = length(pp / (r * r));
    SDF sOut;
    sOut.dist = k0 * (k0 - 1.0) / k1;
    sOut.color = color;
    return sOut;
}
///////////////////////////////////////////////////////////////////////////////////////
// SCENE MAP FUNCTION //

{{USER_MAP}}

///////////////////////////////////////////////////////////////////////////////////////
// NORMAL FUNCTION //

vec3 normal(in vec3 p, float d) {
    float offset = 0.001;
    vec3 distances = vec3(
        map(p + vec3(offset,0.0,0.0)).dist - d,
        map(p + vec3(0.0,offset,0.0)).dist - d,
        map(p + vec3(0.0,0.0,offset)).dist - d
    );
    return normalize(distances);
}

///////////////////////////////////////////////////////////////////////////////////////
// LIGHTING FUNCTIONS //

float calcShadow(in vec3 ro, in vec3 rd, float k) {
    float res = 1.0;
    float t = EPSILON;
    for( int i =0; i < MAX_STEPS && t < MAX_DISTANCE; i++) {
        float h = map(ro + rd * t).dist;
        if(h<MIN_DISTANCE) return 0.0;
        res = min(res, k*h/t);
        t += h;
    }
    return res;
}

float calcOcclusion(vec3 p, vec3 norm) {
    float occ = 0.0;
    float sca = 1.0;
    for (int i = 1; i <= 5; i++) {
        float h = float(i) * 0.02;
        float d = map(p + norm*h).dist;
        occ += (h - d) * sca;
        sca *= 0.5;
    }
    return clamp(1.0 - occ, 0.0, 1.0);
}

void calcLighting(inout vec3 color, in vec3 p, in vec3 norm) {
    float occ = calcOcclusion(p, norm);
    float sha = calcShadow(p, light.direction, 4.);
    float sunLighting = clamp(dot(norm, light.direction), 0.0, 1.0);
    float skyLighting = clamp(0.5 + 0.5*norm.y, 0.0, 1.0);
    float indirectLighting = clamp(dot(norm, normalize(light.direction*vec3(-1.0,0.0,-1.0))), 0.0, 1.0);

    vec3 lin = sunLighting*vec3(5.64, 1.27, 0.99) * pow(vec3(sha), vec3(1.0, 1.2, 1.5));
    lin += skyLighting * vec3(1.16, 0.20, 0.28)*occ;
    lin += indirectLighting*vec3(0.40,0.28,0.20)*occ;
    color *= lin;
}

///////////////////////////////////////////////////////////////////////////////////////
// MARCHING FUNCTION //

SDF march(out vec3 p, in RayInfo ray) {
    float distance = 0.0;
    SDF hit;
    for(int i = 0; i < MAX_STEPS && distance < MAX_DISTANCE; i++) {
        p = ray.origin + ray.dir * distance;
        hit = map(p);
        if(hit.dist <= MIN_DISTANCE) return hit;
        distance += hit.dist;
    }
    // Return background SDF
    SDF bg;
    bg.dist = -1.0;
    bg.color = vec3(1.0);
    return bg;
}

///////////////////////////////////////////////////////////////////////////////////////
// DRAW FUNCTION //

void draw(inout vec4 color, in RayInfo ray) {
    vec3 p;
    SDF hit = march(p, ray);
    if(hit.dist != -1.0) {
        vec3 norm = normal(p, hit.dist);
        vec3 col = hit.color;
        calcLighting(col, p, norm);
        color = vec4(col, 1.0);
    } else {
        color = vec4(1.0,1.0,1.0,1.0);
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// MAIN //

void main() {
    RayInfo ray;
    vec4 color = vec4(0.0);
    initRayout(ray);
    initLight();
    draw(color, ray);
    fragColor = color;
}
