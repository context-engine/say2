import type { Meta, StoryObj } from "@storybook/svelte";
import Welcome from "./Welcome.svelte";
declare const meta: Meta<typeof Welcome>;
export default meta;
type Story = StoryObj<typeof Welcome>;
export declare const Introduction: Story;
