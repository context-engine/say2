import type { Preview } from '@storybook/svelte';

// Import design tokens (after Phase 0b)
// import '../src/lib/tokens/index.css';

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        },
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#ffffff' },
                { name: 'dark', value: '#1a1a1a' }
            ]
        }
    }
};

export default preview;
