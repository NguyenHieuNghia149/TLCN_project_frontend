import React from 'react'
import Editor from '@monaco-editor/react'

interface MonacoEditorProps {
  value: string
  onChange: (val: string) => void
  language?: string
  readOnly?: boolean
  height?: string | number
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'cpp',
  readOnly = false,
  height = '100%',
}) => {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }

  return (
    <div className="h-full w-full">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        theme="vs-dark"
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

          monaco.editor.setTheme('custom-dark')
        }}
      />
    </div>
  )
}

export default MonacoEditor
