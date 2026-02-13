
import React, { useEffect, useRef, useState } from "react";
import {
  EditorState,
  StateField,
  StateEffect,
} from "@codemirror/state";
import {
  EditorView,
  ViewUpdate,
  Decoration,
  DecorationSet,
  lineNumbers,
  highlightActiveLine,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  keymap,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
} from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";

/* ------------------ TYPES ------------------ */
export interface ShaderError {
  line: number; // 1-based GLSL line
  message: string;
}

interface Props {
  code?: string;
  onChange?: (code: string) => void;
  onCompile?: (code: string) => ShaderError[];
}

/* ------------------ UI CONSTANTS ------------------ */
const HEADER_HEIGHT = 32;
const LINE_HEIGHT = 18;
const COLLAPSED_LINES = 3;
const COLLAPSED_HEIGHT = HEADER_HEIGHT + COLLAPSED_LINES * LINE_HEIGHT;
const INJECTED_HEADER_LINES = 0;

/* ------------------ CODEMIRROR EFFECT ------------------ */
const setErrorsEffect = StateEffect.define<ShaderError[]>();

/* ------------------ ERROR DECORATION FIELD ------------------ */
const errorField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },

  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setErrorsEffect)) {
        const ranges: ReturnType<Decoration["range"]>[] = [];

        for (const err of effect.value) {
          const lineNumber = err.line - INJECTED_HEADER_LINES;
          if (lineNumber < 1 || lineNumber > tr.state.doc.lines) continue;

          const line = tr.state.doc.line(lineNumber);

          const deco = Decoration.line({
            attributes: {
              style: "background: rgba(255, 0, 0, 0.18)",
              title: err.message,
            },
          });

          ranges.push(deco.range(line.from));
        }

        return Decoration.set(ranges, true);
      }
    }

    return decorations;
  },

  provide: (field) => EditorView.decorations.from(field),
});

/* ------------------ COMPONENT ------------------ */
export const Editor: React.FC<Props> = ({
  code = "",
  onChange,
  onCompile,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  /* ------------------ INIT CODEMIRROR ------------------ */
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightSpecialChars(),
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        crosshairCursor(),

        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),

        cpp(),

        EditorView.lineWrapping,

        EditorView.updateListener.of((v: ViewUpdate) => {
          if (v.docChanged) onChange?.(v.state.doc.toString());
        }),

        /* THEME */
        EditorView.theme({
          "&": {
            height: "100%",
            backgroundColor: "#1e1e1e",
            color: "white",
            fontSize: "14px",
          },
          ".cm-content": {
            fontFamily: "monospace",
          },
          ".cm-scroller": {
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            minHeight: 0, // important for flex scrolling on mobile
          },
          ".cm-gutters": {
            backgroundColor: "#1e1e1e",
            color: "#888",
            border: "none",
          },
        }),

        errorField,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  /* ------------------ SYNC EXTERNAL CODE ------------------ */
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (current !== code) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: code },
      });
    }
  }, [code]);

  /* ------------------ COMPILE ------------------ */
  const compile = () => {
    const view = viewRef.current;
    if (!view || !onCompile) return;

    const src = view.state.doc.toString();
    const compileErrors = onCompile(src) ?? [];

    view.dispatch({
      effects: setErrorsEffect.of(compileErrors),
    });
  };

  /* ------------------ RENDER ------------------ */
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: collapsed ? COLLAPSED_HEIGHT : "100%",
        transition: "height 200ms ease",
        display: "flex",
        flexDirection: "column",
        background: "#1e1e1e",
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
          flexShrink: 0,
        }}
      >
        <button onClick={() => setCollapsed((v) => !v)}>
          {collapsed ? "▲" : "▼"}
        </button>

        <span style={{ marginLeft: 8, flex: 1, color: "white" }}>
          GLSL Editor
        </span>

        <button onClick={compile}>Compile</button>
      </div>

      {/* Editor */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0, // ✅ critical for flex scrolling on mobile
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
        }}
      />
    </div>
  );
};

