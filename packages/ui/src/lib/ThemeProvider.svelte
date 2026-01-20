<!-- src/lib/ThemeProvider.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  type Theme = 'light' | 'dark' | 'system';
  
  interface Props {
    /** Initial theme. Defaults to stored preference or 'system' */
    initialTheme?: Theme;
    children?: import('svelte').Snippet;
  }
  
  const STORAGE_KEY = 'say2-theme';
  
  let { initialTheme = 'system', children }: Props = $props();
  let currentTheme = $state<Theme>(initialTheme);
  
  // Get stored theme on mount
  // Note: onMount only runs in browser - no check needed (Svelte 5 guarantee)
  onMount(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored) {
      currentTheme = stored;
    }
    applyTheme(currentTheme);
    
    // Remove no-transition class after initial load
    document.documentElement.classList.remove('no-transition');
  });
  
  function applyTheme(theme: Theme) {
    // Only called from onMount/$effect which are browser-only
    if (theme === 'system') {
      // Remove data-theme to let CSS handle it
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    localStorage.setItem(STORAGE_KEY, theme);
  }
  
  // Reactive effect when theme changes
  // Note: $effect only runs in browser after mount (Svelte 5 guarantee)
  $effect(() => {
    applyTheme(currentTheme);
  });
  
  // Export for external control
  export function setTheme(theme: Theme) {
    currentTheme = theme;
  }
  
  export function toggleTheme() {
    const isDark = currentTheme === 'dark' || 
      (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    currentTheme = isDark ? 'light' : 'dark';
  }
</script>

{@render children?.()}
