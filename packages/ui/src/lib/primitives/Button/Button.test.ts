import { describe, it, expect, vi } from 'bun:test';
import { renderComponent, screen, fireEvent } from '../../../../tests/utils';
import Button from './Button.svelte';
import { createRawSnippet } from 'svelte';

describe('Button', () => {
    const textSnippet = createRawSnippet(() => ({ render: () => 'Click me' }));

    it('renders with default props', () => {
        renderComponent(Button, { children: textSnippet });
        const button = screen.getByRole('button', { name: 'Click me' });
        expect(button).toBeTruthy();
        expect(button.className).toContain('button--primary');
        expect(button.className).toContain('button--md');
    });

    it('fires onclick handler', async () => {
        const handleClick = vi.fn();
        renderComponent(Button, { children: textSnippet, onclick: handleClick });
        const button = screen.getByRole('button');
        await fireEvent.click(button);
        expect(handleClick).toHaveBeenCalled();
    });

    it('disabled state prevents click', async () => {
        const handleClick = vi.fn();
        renderComponent(Button, { children: textSnippet, onclick: handleClick, disabled: true });
        const button = screen.getByRole('button');
        expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('loading state shows spinner and prevents click', async () => {
        renderComponent(Button, { children: textSnippet, loading: true });
        const button = screen.getByRole('button');
        expect(button.hasAttribute('aria-busy')).toBe(true);
        expect(button.hasAttribute('disabled')).toBe(true);
        const spinner = button.querySelector('.spinner');
        expect(spinner).toBeTruthy();
    });
});
