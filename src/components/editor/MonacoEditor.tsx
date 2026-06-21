import React, { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

interface MonacoEditorProps {
  value: string
  onChange: (val: string) => void
  language?: string
  readOnly?: boolean
  height?: string | number
  editorTheme?: string
  fontSize?: number
  lineHeight?: number
  wordWrap?: 'on' | 'off'
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'cpp',
  readOnly = false,
  height = '100%',
  editorTheme = 'custom-dark',
  fontSize = 16,
  lineHeight = 26,
  wordWrap = 'on',
}) => {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }

  const monacoRef = useRef<
    | Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[1]
    | null
  >(null)

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
          fontSize,
          lineHeight,
          fontFamily:
            "'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
          fontLigatures: true,
          fontWeight: '500',
          letterSpacing: 0.2,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap,
          wrappingIndent: 'indent',
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          renderLineHighlight: 'line',
          renderWhitespace: 'selection',
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly,
          cursorStyle: 'line',
          cursorBlinking: 'phase',
          cursorSmoothCaretAnimation: 'on',
          cursorWidth: 2,
          hideCursorInOverviewRuler: true,
          smoothScrolling: true,
          mouseWheelZoom: true,
          padding: {
            top: 22,
            bottom: 24,
          },
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
              { token: 'comment', foreground: '788191', fontStyle: 'italic' },
              { token: 'keyword', foreground: '62B0FF', fontStyle: 'bold' },
              { token: 'string', foreground: 'F6B17A' },
              { token: 'number', foreground: 'D9A5FF' },
              { token: 'operator', foreground: 'D8DDE6' },
              { token: 'delimiter', foreground: 'D8DDE6' },
              { token: 'type', foreground: '43D1C0' },
              { token: 'function', foreground: 'F8D774' },
              { token: 'identifier', foreground: 'F3F4F6' },
            ],
            colors: {
              'editor.background': '#232323',
              'editor.foreground': '#F3F4F6',
              'editorLineNumber.foreground': '#6B7280',
              'editorLineNumber.activeForeground': '#CBD5E1',
              'editor.selectionBackground': '#29446f',
              'editor.inactiveSelectionBackground': '#26354d',
              'editor.lineHighlightBackground': '#2c2c2c',
              'editorCursor.foreground': '#F8D774',
              'editorWhitespace.foreground': '#3a3a3a',
              'editorIndentGuide.background1': '#323232',
              'editorIndentGuide.activeBackground1': '#4b5563',
              'editorBracketMatch.background': '#243b62',
              'editorBracketMatch.border': '#62B0FF',
            },
          })

          monaco.editor.defineTheme('custom-light', {
            base: 'vs',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
              { token: 'keyword', foreground: '2563EB', fontStyle: 'bold' },
              { token: 'string', foreground: 'C2410C' },
              { token: 'number', foreground: '7C3AED' },
              { token: 'operator', foreground: '0F172A' },
              { token: 'delimiter', foreground: '0F172A' },
              { token: 'type', foreground: '0F766E' },
              { token: 'function', foreground: '9A3412' },
              { token: 'identifier', foreground: '0F172A' },
            ],
            colors: {
              'editor.background': '#FFFFFF',
              'editor.foreground': '#0F172A',
              'editorLineNumber.foreground': '#94A3B8',
              'editorLineNumber.activeForeground': '#334155',
              'editor.selectionBackground': '#BFDBFE',
              'editor.inactiveSelectionBackground': '#DBEAFE',
              'editor.lineHighlightBackground': '#F8FAFC',
              'editorCursor.foreground': '#2563EB',
              'editorWhitespace.foreground': '#E2E8F0',
              'editorIndentGuide.background1': '#E2E8F0',
              'editorIndentGuide.activeBackground1': '#94A3B8',
              'editorBracketMatch.background': '#DBEAFE',
              'editorBracketMatch.border': '#60A5FA',
            },
          })

          monaco.editor.setTheme(editorTheme)
        }}
      />
    </div>
  )
}

export default MonacoEditor
