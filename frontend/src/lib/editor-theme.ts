import type { BeforeMount } from '@monaco-editor/react'

// Monaco needs literal colors; keep these in step with the CSS theme tokens.
export const configureEditorThemes: BeforeMount = (monaco) => {
  const palettes = {
    light: {
      surface: '#FFFFFF', text: '#17231C', muted: '#45534B', accent: '#234B36',
      hover: '#F1F7F3', selected: '#DCEFE3', border: '#A9C2B2', focus: '#377C53',
      string: '#356850', number: '#825E28', error: '#9B4B40',
    },
    dark: {
      surface: '#222222', text: '#F5F3EF', muted: '#BCB8B1', accent: '#C89472',
      hover: '#2C2C2C', selected: '#392E28', border: '#655A52', focus: '#E1B18E',
      string: '#A2C9AE', number: '#D8BA83', error: '#E1AAA0',
    },
  }

  for (const [mode, colors] of Object.entries(palettes)) {
    monaco.editor.defineTheme(`nl2sql-${mode}`, {
      base: mode === 'dark' ? 'vs-dark' : 'vs',
      // Avoid inherited SQL-specific colors overriding the accessible palette.
      inherit: false,
      rules: [
        { token: '', foreground: colors.text.slice(1) },
        { token: 'keyword', foreground: colors.accent.slice(1), fontStyle: 'bold' },
        { token: 'operator', foreground: colors.accent.slice(1) },
        { token: 'predefined', foreground: colors.accent.slice(1) },
        { token: 'type', foreground: colors.accent.slice(1) },
        { token: 'string', foreground: colors.string.slice(1) },
        { token: 'number', foreground: colors.number.slice(1) },
        { token: 'comment', foreground: colors.muted.slice(1), fontStyle: 'italic' },
        { token: 'delimiter', foreground: colors.text.slice(1) },
      ],
      colors: {
        'editor.background': colors.surface,
        'editor.foreground': colors.text,
        'editorLineNumber.foreground': colors.muted,
        'editorLineNumber.activeForeground': colors.accent,
        'editorCursor.foreground': colors.accent,
        'editor.selectionBackground': colors.selected,
        'editor.selectionForeground': colors.text,
        'editor.inactiveSelectionBackground': colors.hover,
        'editor.lineHighlightBackground': colors.hover,
        'editorIndentGuide.background1': colors.border,
        'editorWhitespace.foreground': colors.border,
        'editorWidget.background': colors.surface,
        'editorWidget.foreground': colors.text,
        'editorWidget.border': colors.border,
        'editorSuggestWidget.background': colors.surface,
        'editorSuggestWidget.foreground': colors.text,
        'editorSuggestWidget.border': colors.border,
        'editorSuggestWidget.selectedBackground': colors.selected,
        'editorHoverWidget.background': colors.surface,
        'editorHoverWidget.foreground': colors.text,
        'editorHoverWidget.border': colors.border,
        'editorError.foreground': colors.error,
        'editorWarning.foreground': colors.number,
        'editorInfo.foreground': colors.accent,
        'editorBracketHighlight.foreground1': colors.text,
        'editorBracketHighlight.foreground2': colors.accent,
        'editorBracketHighlight.foreground3': colors.string,
        'editorBracketHighlight.foreground4': colors.text,
        'editorBracketHighlight.foreground5': colors.accent,
        'editorBracketHighlight.foreground6': colors.string,
        'editorBracketHighlight.unexpectedBracket.foreground': colors.error,
        'focusBorder': colors.focus,
      },
    })
  }
}
