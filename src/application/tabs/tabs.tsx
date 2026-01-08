import React, { useState } from "react";
import { Editor } from "../editor/editor";
import { ShaderError } from "../../core/error";

// Example SDF data
const sdfReference = `
mat3 rotatey(float theta) 

mat3 rotatex(float theta)

,at3 rotatez(float theta)
// Union
SDF opUnion(SDF a, SDF b) 

// Subtraction
SDF opSubtraction(SDF a, SDF b)

// Intersection
SDF opIntersection(SDF a, SDF b) 

// Smooth Union
SDF opSmoothUnion(SDF a, SDF b, float k) 

// Smooth Subtraction
SDF opSmoothSubtraction(SDF a, SDF b, float k) 

// Smooth Intersection
SDF opSmoothIntersection(SDF a, SDF b, float k) 

///////////////////////////////////////////////////////////////////////////////////////
// PRIMITIVES //

SDF sdfSphere(vec3 p, vec3 pos, mat3 rot, float s, vec3 color)

SDF sdfBox(vec3 p, vec3 pos, mat3 rot, vec3 b, vec3 color)

SDF sdfRoundBox(vec3 p, vec3 pos, mat3 rot, vec3 b, float r, vec3 color)

SDF sdfBoxFrame(vec3 p, vec3 pos, mat3 rot, vec3 b, float e, vec3 color)

SDF sdfTorus(vec3 p, vec3 pos, mat3 rot, vec2 t, vec3 color)

SDF sdfCappedTorus(vec3 p, vec3 pos, mat3 rot, vec2 sc, float ra, float rb, vec3 color)

SDF sdfLink(vec3 p, vec3 pos, mat3 rot, float le, float r1, float r2, vec3 color)

SDF sdfCylinder(vec3 p, vec3 pos, mat3 rot, vec3 c, vec3 color)

SDF sdfCone(vec3 p, vec3 pos, mat3 rot, vec2 c, float h, vec3 color)

SDF sdfPlane(vec3 p, vec3 pos, mat3 rot, vec3 n, float h, vec3 color)

SDF sdfHexPrism(vec3 p, vec3 pos, mat3 rot, vec2 h, vec3 color)

SDF sdfTriPrism(vec3 p, vec3 pos, mat3 rot, vec2 h, vec3 color)

SDF sdfCapsule(vec3 p, vec3 pos, mat3 rot, vec3 a, vec3 b, float r, vec3 color)

SDF sdfVerticalCapsule(vec3 p, vec3 pos, mat3 rot, float h, float r, vec3 color)

SDF sdfCappedCylinder(vec3 p, vec3 pos, mat3 rot, float r, float h, vec3 color)

SDF sdfRoundedCylinder(vec3 p, vec3 pos, mat3 rot, float ra, float rb, float h, vec3 color)

SDF sdfCappedCone(vec3 p, vec3 pos, mat3 rot, float h, float r1, float r2, vec3 color)

SDF sdfRoundCone(vec3 p, vec3 pos, mat3 rot, float r1, float r2, float h, vec3 color)

SDF sdfEllipsoid(vec3 p, vec3 pos, mat3 rot, vec3 r, vec3 color)
`;

interface Project {
  name: string;
  code: string;
}


interface ShaderTabsProps {
  initialCode?: string;
  onCompile?: (code: string) => ShaderError[]; // pass compile events up
}

export const ShaderTabs: React.FC<ShaderTabsProps> = ({
  initialCode = "",
  onCompile,
}) => {
  const [activeTab, setActiveTab] = useState<"editor" | "sdf" | "projects">(
    "editor"
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentCode, setCurrentCode] = useState<string>(initialCode);

  const saveProject = (name: string) => {
    setProjects((prev) => [...prev, { name, code: currentCode }]);
  };

  const loadProject = (project: Project) => {
    setCurrentCode(project.code);
    setActiveTab("editor");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #333" }}>
        <button
          style={{ flex: 1, color: "white", padding: 8, background: activeTab === "editor" ? "#555" : "#222" }}
          onClick={() => setActiveTab("editor")}
        >
          Editor
        </button>
        <button
          style={{ flex: 1, color: "white", padding: 8, background: activeTab === "sdf" ? "#555" : "#222" }}
          onClick={() => setActiveTab("sdf")}
        >
          SDF Reference
        </button>
        <button
          style={{ flex: 1, color: "white", padding: 8, background: activeTab === "projects" ? "#555" : "#222" }}
          onClick={() => setActiveTab("projects")}
        >
          Projects
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {activeTab === "editor" && (
          <Editor
            code={currentCode}
            onChange={setCurrentCode}
            onCompile={(code) => {
              // Propagate to parent
              if (onCompile) {
                return onCompile(code);
              } else {
                return []
              }
            }}
          />
        )}

        {activeTab === "sdf" && (
          <div
            style={{
              padding: 12,
              color: "#eee",
              background: "#1e1e1e",
              height: "100%",
              overflowY: "auto",
              whiteSpace: "pre",
              fontFamily: "monospace",
            }}
          >
            {sdfReference}
          </div>
        )}

        {activeTab === "projects" && (
          <div
            style={{
              padding: 12,
              color: "#eee",
              background: "#1e1e1e",
              height: "100%",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <button onClick={() => saveProject(`Project ${projects.length + 1}`)}>
              Save Current Shader
            </button>

            {projects.length === 0 && <div>No projects yet</div>}
            {projects.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: 8,
                  border: "1px solid #444",
                  cursor: "pointer",
                  background: "#222",
                }}
                onClick={() => loadProject(p)}
              >
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
;
