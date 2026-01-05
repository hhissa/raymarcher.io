import React, { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
// Monaco Web Worker fix

interface ShaderError {
  line: number;
  message: string;
}

interface Props {
  code?: string;
  errors?: ShaderError[] | null;
  onChange?: (code: string) => void;
  onCompile?: (code: string) => void;
}

const HEADER_HEIGHT = 32;
const LINE_HEIGHT = 18; // Monaco default ~18px
const COLLAPSED_LINES = 3;
const COLLAPSED_HEIGHT = HEADER_HEIGHT + COLLAPSED_LINES * LINE_HEIGHT;

export const Editor: React.FC<Props> = ({
  code = "",
  errors = [],
  onChange,
  onCompile,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [collapsed, setCollapsed] = useState(false);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    editorRef.current = monaco.editor.create(containerRef.current, {
      value: code,
      language: "glsl",
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false },
    });

    // Sync editor changes to parent
    const changeListener = editorRef.current.onDidChangeModelContent(() => {
      const value = editorRef.current?.getValue();
      if (value !== undefined && onChange) {
        onChange(value);
      }
    });

    return () => {
      changeListener.dispose();
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  // Update editor value if parent changes
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

  // Set error markers
  useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!model) return;

    if (!errors || errors.length === 0) {
      monaco.editor.setModelMarkers(model, "shader-errors", []);
      return;
    }

    const markers = errors.map((err) => ({
      startLineNumber: Math.max(1, (err.line ?? 0) + 1),
      endLineNumber: Math.max(1, (err.line ?? 0) + 1),
      startColumn: 1,
      endColumn: model.getLineLength((err.line ?? 0) + 1) + 1,
      message: err.message ?? "Shader error",
      severity: monaco.MarkerSeverity.Error,
    }));

    monaco.editor.setModelMarkers(model, "shader-errors", markers);
  }, [errors]);

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
        <button onClick={() => setCollapsed((v) => !v)}>
          {collapsed ? "▲" : "▼"}
        </button>

        <span style={{ marginLeft: 8, flex: 1, color: "white" }}>
          GLSL Editor
        </span>

        <button
          onClick={() => {
            const codeValue = editorRef.current?.getValue() ?? "";
            //validate glsl code:
            //add error lines 
            //do not compile if error is present
            onCompile?.(codeValue);
          }}
        >
          Compile
        </button>
      </div>

      {/* Editor container */}
      <div ref={containerRef} style={{ flex: 1 }} />
    </div>
  );
};;
