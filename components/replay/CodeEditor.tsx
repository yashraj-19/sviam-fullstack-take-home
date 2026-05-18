'use client';

import { useEffect, useRef } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';

type MonacoEditor = Parameters<OnMount>[0];

interface Props {
  code: string;
  language: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
  rust: 'rust',
};

export function CodeEditor({ code, language }: Props) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<MonacoEditor | null>(null);

  // Imperatively update editor content without re-mounting Monaco on every frame.
  // Letting Monaco animate its own re-renders during playback would cause lag.
  useEffect(() => {
    if (editorRef.current) {
      const current = editorRef.current.getValue();
      if (current !== code) {
        editorRef.current.setValue(code);
      }
    }
  }, [code]);

  function handleMount(editor: MonacoEditor, _monaco: Monaco) {
    editorRef.current = editor;
    editor.setValue(code);
  }

  return (
    <Editor
      height="100%"
      language={LANGUAGE_MAP[language] ?? 'plaintext'}
      theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs'}
      onMount={handleMount}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        fontFamily: 'var(--font-geist-mono), "JetBrains Mono", "Fira Code", monospace',
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'none',
        overviewRulerLanes: 0,
        scrollbar: { vertical: 'auto', horizontal: 'auto', alwaysConsumeMouseWheel: false },
      }}
    />
  );
}
