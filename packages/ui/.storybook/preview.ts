import type { Preview } from "@storybook/svelte";

// Import tokens (includes typography)
import '../src/lib/tokens/index.css';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		backgrounds: {
			default: "light",
			values: [
				{ name: "light", value: "#ffffff" },
				{ name: "dark", value: "#1a1a1a" },
			],
		},
	},
	decorators: [
		// Ensure fonts are loaded
		(Story, context) => {
			// Add Google Fonts link if not present
			if (typeof document !== 'undefined') {
				const linkId = 'google-fonts';
				if (!document.getElementById(linkId)) {
					const link = document.createElement('link');
					link.id = linkId;
					link.rel = 'stylesheet';
					link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
					document.head.appendChild(link);
				}

				// Sync data-theme with Storybook background
				const bgName = context.globals?.backgrounds?.value;
				const theme = bgName === '#1a1a1a' ? 'dark' : 'light';
				document.documentElement.setAttribute('data-theme', theme);
			}
			return Story();
		}
	]
};

export default preview;
