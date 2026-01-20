// src/lib/theme.ts
import { getContext, setContext } from 'svelte';

const THEME_KEY = Symbol('theme');

export interface ThemeContext {
    current: 'light' | 'dark' | 'system';
    set: (theme: 'light' | 'dark' | 'system') => void;
    toggle: () => void;
}

export function setThemeContext(context: ThemeContext) {
    setContext(THEME_KEY, context);
}

export function getThemeContext(): ThemeContext {
    return getContext(THEME_KEY);
}
