import { describe, it, expect } from 'bun:test';
import { renderComponent, screen } from '../../../../tests/utils';
import Badge from './Badge.svelte';
import { createRawSnippet } from 'svelte';

describe('Badge', () => {
    const textSnippet = createRawSnippet(() => ({ render: () => 'Label' }));
    const successSnippet = createRawSnippet(() => ({ render: () => 'Connected' }));

    it('renders with default props', () => {
        renderComponent(Badge, { children: textSnippet });
        const badge = screen.getByText('Label');
        expect(badge).toBeTruthy();
        expect(badge.className).toContain('badge--default');
        expect(badge.className).toContain('badge--md');
    });

    it('renders success variant', () => {
        renderComponent(Badge, { variant: 'success', children: successSnippet });
        const badge = screen.getByText('Connected');
        expect(badge).toBeTruthy();
        expect(badge.className).toContain('badge--success');
    });

    it('renders warning variant', () => {
        const snippet = createRawSnippet(() => ({ render: () => 'Pending' }));
        renderComponent(Badge, { variant: 'warning', children: snippet });
        const badge = screen.getByText('Pending');
        expect(badge.className).toContain('badge--warning');
    });

    it('renders error variant', () => {
        const snippet = createRawSnippet(() => ({ render: () => 'Failed' }));
        renderComponent(Badge, { variant: 'error', children: snippet });
        const badge = screen.getByText('Failed');
        expect(badge.className).toContain('badge--error');
    });

    it('renders info variant', () => {
        const snippet = createRawSnippet(() => ({ render: () => 'Info' }));
        renderComponent(Badge, { variant: 'info', children: snippet });
        const badge = screen.getByText('Info');
        expect(badge.className).toContain('badge--info');
    });

    it('renders count', () => {
        renderComponent(Badge, { count: 5 });
        const badge = screen.getByText('5');
        expect(badge).toBeTruthy();
    });

    it('renders 99+ for large counts', () => {
        renderComponent(Badge, { count: 150 });
        const badge = screen.getByText('99+');
        expect(badge).toBeTruthy();
    });

    it('renders dot mode', () => {
        const { container } = renderComponent(Badge, { variant: 'success', dot: true });
        const badge = container.querySelector('.badge--dot');
        expect(badge).toBeTruthy();
        expect(badge?.className).toContain('badge--success');
        // Dot should have no text content
        expect(badge?.textContent?.trim()).toBe('');
    });

    it('renders small size', () => {
        const smallSnippet = createRawSnippet(() => ({ render: () => 'Small Badge' }));
        const { container } = renderComponent(Badge, { size: 'sm', children: smallSnippet });
        const badge = container.querySelector('.badge--sm');
        expect(badge).toBeTruthy();
        expect(badge?.textContent).toContain('Small Badge');
    });

    it('uses span element for semantic correctness', () => {
        const { container } = renderComponent(Badge, { children: textSnippet });
        const badge = container.querySelector('.badge');
        expect(badge?.tagName.toLowerCase()).toBe('span');
    });
});
