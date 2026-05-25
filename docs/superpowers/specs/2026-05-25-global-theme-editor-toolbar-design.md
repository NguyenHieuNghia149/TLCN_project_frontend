# Global Theme Control For Challenge Workspace

## Goal

Replace the editor-only light/dark toggle with one application theme control on the practice challenge workspace. The code editor must always follow the shared application theme, as the exam workspace already does for its surrounding UI.

`Wrap` remains in the editor toolbar because it controls code line wrapping, not theme:

- `On`: long code lines wrap visually in the editor.
- `Off`: long code lines remain single-line and can be scrolled horizontally.
- It never changes the submitted source code.

## Current Behavior

- `ThemeProvider` owns the application theme and persists it in `theme-preference`.
- `ExamChallengeDetail` already exposes `toggleTheme` in its top toolbar.
- `ProblemDetailPage` uses `ProblemHeader`, which currently has no application theme button.
- `CodeEditorSection` initializes its visual theme from `ThemeProvider`, but exposes a local `Light/Dark` button that can make the editor disagree with the rest of the page.

## Chosen Design

### Editor

Remove the local `Light/Dark` control and local editor-theme override behavior from `CodeEditorSection`. The editor shell colors and Monaco theme derive directly from `useTheme().theme`:

- global `dark` maps to the existing dark shell variables and `custom-dark`;
- global `light` maps to the existing light shell variables and `custom-light`.

Keep the language selector, `Wrap` control, font size controls, reset, copy, fullscreen, and console behavior unchanged.

### Practice Workspace Header

Add a theme toggle button to `ProblemHeader`, using `useTheme()` and the existing `Sun`/`Moon` icon convention. Place it in the right-hand utility/user area so it is visible on the practice challenge page and changes the entire UI, including the editor.

The button must expose an accessible label describing the next action: `Switch to light mode` or `Switch to dark mode`.

### Exam Workspace

Retain the existing application-level theme toggle in `ExamChallengeDetail`. Removing the editor-only toggle means the exam page has one theme control rather than both a global control and a conflicting editor override.

## Data Flow

1. User clicks the theme control in `ProblemHeader` or the existing exam toolbar.
2. `ThemeProvider.toggleTheme()` updates the shared mode and persists it.
3. The document theme selectors update the surrounding UI.
4. `CodeEditorSection` re-renders from the same mode and passes the matching custom theme to Monaco.

No new theme state, storage key, or provider is introduced.

## Testing

- Update `CodeEditorSection` unit tests to assert there is no editor-only theme toggle and that Monaco changes theme when the shared context value changes.
- Add or extend a `ProblemHeader` unit test to assert the global theme button invokes `toggleTheme` and shows the correct next-action label/icon state.
- Run targeted Vitest coverage for affected components, then run frontend type-check/build.
- Visually check the challenge workspace in both themes: header, problem panel, editor shell, Monaco surface, and console switch together while `Wrap` remains available.

## Scope Boundaries

- Do not remove or redesign the `Wrap` feature.
- Do not merge the separate admin theme context in this change.
- Do not redesign toolbar layout outside placement of the new global theme button and removal of the editor theme button.
