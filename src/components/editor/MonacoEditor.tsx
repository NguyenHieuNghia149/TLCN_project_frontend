import React, { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

interface MonacoEditorProps {
  value: string
  onChange: (val: string) => void
  language?: string
  readOnly?: boolean
  height?: string | number
  editorTheme?: string
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'cpp',
  readOnly = false,
  height = '100%',
  editorTheme = 'custom-dark',
}) => {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }

  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(editorTheme)
    }
  }, [editorTheme])

  return (
    <div className="h-full w-full">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        theme={editorTheme === 'custom-light' ? 'vs-light' : 'vs-dark'}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          renderLineHighlight: 'line',
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly,
          cursorStyle: 'line',
          cursorBlinking: 'blink',
          cursorWidth: 0,
          hideCursorInOverviewRuler: true,
          smoothScrolling: true,
          mouseWheelZoom: true,
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
        onMount={(editor, monaco) => {
          monacoRef.current = monaco
          // Configure C++ language
          monaco.languages.setLanguageConfiguration('cpp', {
            comments: {
              lineComment: '//',
              blockComment: ['/*', '*/'],
            },
            brackets: [
              ['{', '}'],
              ['[', ']'],
              ['(', ')'],
            ],
            autoClosingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '"', close: '"' },
              { open: "'", close: "'" },
            ],
            surroundingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '"', close: '"' },
              { open: "'", close: "'" },
            ],
          })

          // Add custom theme
          monaco.editor.defineTheme('custom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
              { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
              { token: 'string', foreground: 'CE9178' },
              { token: 'number', foreground: 'B5CEA8' },
              { token: 'operator', foreground: 'D4D4D4' },
              { token: 'delimiter', foreground: 'D4D4D4' },
              { token: 'type', foreground: '4EC9B0' },
              { token: 'function', foreground: 'DCDCAA' },
            ],
            colors: {
              'editor.background': '#1a1a1a',
              'editor.foreground': '#d4d4d4',
              'editorLineNumber.foreground': '#858585',
              'editorLineNumber.activeForeground': '#d4d4d4',
              'editor.selectionBackground': '#264f78',
              'editor.inactiveSelectionBackground': '#3a3d41',
              'editor.lineHighlightBackground': '#2d2d30',
              'editorCursor.foreground': '#aeafad',
              'editorWhitespace.foreground': '#404040',
            },
          })

          monaco.editor.defineTheme('custom-light', {
            base: 'vs',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '008000', fontStyle: 'italic' },
              { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
              { token: 'string', foreground: 'A31515' },
              { token: 'number', foreground: '09885A' },
              { token: 'operator', foreground: '000000' },
              { token: 'delimiter', foreground: '000000' },
              { token: 'type', foreground: '267f99' },
              { token: 'function', foreground: '795E26' },
            ],
            colors: {
              'editor.background': '#ffffff',
              'editor.foreground': '#1f1f1f',
              'editorLineNumber.foreground': '#858585',
              'editorLineNumber.activeForeground': '#1f1f1f',
              'editor.selectionBackground': '#aad6ff',
              'editor.inactiveSelectionBackground': '#e5f0fb',
              'editor.lineHighlightBackground': '#f0f0f0',
              'editorCursor.foreground': '#000000',
              'editorWhitespace.foreground': '#d3d3d3',
            },
          })

          monaco.editor.setTheme(editorTheme)
        }}
      />
    </div>
  )
}

export default MonacoEditor
