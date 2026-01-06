
import React, { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";

interface ShaderError {
  line: number;      // 1-based GLSL line number
  message: string;
}

interface Props {
  code?: string;
  onChange?: (code: string) => void;
  onCompile?: (code: string) => ShaderError[];
}

/* ---- UI constants ---- */
const HEADER_HEIGHT = 32;
const LINE_HEIGHT = 18;
const COLLAPSED_LINES = 3;
const COLLAPSED_HEIGHT = HEADER_HEIGHT + COLLAPSED_LINES * LINE_HEIGHT;

/* ---- If you inject hidden GLSL above user code, set this ---- */
// const INJECTED_HEADER_LINES = 0;
const INJECTED_HEADER_LINES = 0;

export const Editor: React.FC<Props> = ({
  code = "",
  onChange,
  onCompile,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [collapsed, setCollapsed] = useState(false);
  const [errors, setErrors] = useState<ShaderError[]>([]);

  /* ------------------ INIT EDITOR ------------------ */
  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      value: code,
      language: "glsl",
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false },
    });

    editorRef.current = editor;

    const changeListener = editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      onChange?.(value);
    });

    return () => {
      changeListener.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, []);

  /* ------------------ SYNC CODE ------------------ */
  useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;

    if (model.getValue() !== code) {
      editor.pushUndoStop();
      model.setValue(code);
      editor.pushUndoStop();
    }
  }, [code]);

  /* ------------------ ERROR MARKERS ------------------ */
  useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!model) return;

    if (errors.length === 0) {
      monaco.editor.setModelMarkers(model, "shader-errors", []);
      return;
    }

    const lineCount = model.getLineCount();

    const markers: monaco.editor.IMarkerData[] = errors.map(err => {
      // Translate compiler line → editor line
      const rawLine = err.line - INJECTED_HEADER_LINES;

      // Clamp (CRITICAL: out-of-range = no markers rendered)
      const line = Math.min(
        Math.max(1, rawLine),
        lineCount
      );
      console.log(line)
      return {
        startLineNumber: line + 1,
        endLineNumber: line + 1,
        startColumn: 1,
        endColumn: model.getLineLength(line) + 1,
        message: err.message,
        severity: monaco.MarkerSeverity.Error,
      };
    });

    monaco.editor.setModelMarkers(model, "shader-errors", markers);
  }, [errors]);

  /* ------------------ COMPILE ------------------ */
  const compile = () => {
    const editor = editorRef.current;
    if (!editor || !onCompile) return;
    const codeValue = editor.getValue();
    const compileErrors = onCompile(codeValue) ?? [];

    console.log("=== COMPILE DEBUG ===");
    console.log("Errors returned:", compileErrors);
    console.log("Error count:", compileErrors.length);
    if (compileErrors.length > 0) {
      console.log("First error:", compileErrors[0]);
      console.log("Line number:", compileErrors[0].line);
    }
    console.log("Editor line count:", editor.getModel()?.getLineCount());
    console.log("===================");

    setErrors(compileErrors);
  };

  /* ------------------ RENDER ------------------ */
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: collapsed ? COLLAPSED_HEIGHT : "40vh",
        transition: "height 200ms ease",
        background: "#1e1e1e",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          borderBottom: "1px solid #333",
          userSelect: "none",
        }}
      >
        <button onClick={() => setCollapsed(v => !v)}>
          {collapsed ? "▲" : "▼"}
        </button>

        <span style={{ marginLeft: 8, flex: 1, color: "white" }}>
          GLSL Editor
        </span>

        <button onClick={compile}>Compile</button>
      </div>

      {/* Monaco */}
      <div ref={containerRef} style={{ flex: 1 }} />
    </div>
  );
};

