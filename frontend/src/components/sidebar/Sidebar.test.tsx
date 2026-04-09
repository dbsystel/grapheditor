import { useSettingsStore } from 'src/stores/settings';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Sidebar } from './Sidebar';

describe('Components - Sidebar', () => {
	it('renders expanded by default when defaultIsCollapsed is false', async () => {
		const screen = await render(
			<Sidebar defaultIsCollapsed={false} headerContent={<span>My Header</span>}>
				<p>Body content</p>
			</Sidebar>
		);

		expect(screen.getByText('My Header')).toBeInTheDocument();
		expect(screen.getByText('Body content')).toBeInTheDocument();

		const root = screen.container.querySelector('.sidebar');
		expect(root).not.toBeNull();
		expect(root?.classList.contains('sidebar--collapsed')).toBe(false);
	});

	it('renders collapsed by default and hides content', async () => {
		const screen = await render(
			<Sidebar defaultIsCollapsed={true} headerContent={<span>Header</span>}>
				<p>Hidden content</p>
			</Sidebar>
		);

		const root = screen.container.querySelector('.sidebar');
		expect(root).not.toBeNull();
		expect(root!.classList.contains('sidebar--collapsed')).toBe(true);
		expect(root?.querySelector('p')).not.toBeVisible();
	});

	it('toggles between collapsed and expanded on collapse button click', async () => {
		const onExpand = vi.fn();
		const onCollapse = vi.fn();

		const screen = await render(
			<Sidebar
				defaultIsCollapsed={true}
				onExpand={onExpand}
				onCollapse={onCollapse}
				headerContent={<span>Header</span>}
			/>
		);

		const root = screen.container.querySelector('.sidebar');

		const collapseButton = screen.container.querySelector('.sidebar__header-collapse-button')!;

		if (!root || !collapseButton || !(collapseButton instanceof HTMLElement)) {
			throw new Error('Missing proper elements');
		}
		// Initially collapsed
		expect(collapseButton).toBeVisible();
		expect(root.classList.contains('sidebar--collapsed')).toBe(true);

		// Click to expand;
		// Playwright can't match that garbled accessible name, so it times out looking for the element — not trying to click it. This fixes that issue.
		await collapseButton.click();
		expect(root.classList.contains('sidebar--collapsed')).toBe(false);
		expect(onExpand).toHaveBeenCalledOnce();
		expect(onCollapse).not.toHaveBeenCalled();

		// Click to collapse again
		await collapseButton.click();
		expect(root.classList.contains('sidebar--collapsed')).toBe(true);
		expect(onCollapse).toHaveBeenCalledOnce();
	});

	it('calls onCloseButtonClick when the close button is clicked', async () => {
		const onClose = vi.fn();

		const screen = await render(
			<Sidebar defaultIsCollapsed={false} onCloseButtonClick={onClose} />
		);

		const closeButton = screen.container.querySelector('.sidebar__header-close-button');

		if (!closeButton || !(closeButton instanceof HTMLElement)) {
			throw new Error('Close button not valid');
		}

		// Playwright can't match that garbled accessible name, so it times out looking for the element — not trying to click it. This fixes that issue.
		await closeButton.click();

		expect(onClose).toHaveBeenCalledOnce();
	});

	it('hides close button when shouldHideCloseButton is true', async () => {
		const screen = await render(
			<Sidebar defaultIsCollapsed={false} shouldHideCloseButton={true} />
		);

		const closeButton = screen.container.querySelector('.sidebar__header-close-button');
		expect(closeButton).toBeNull();
	});

	it('resizes the sidebar on horizontal drag and persists width to settings store', async () => {
		const sidebarId = 'test-sidebar';

		// Reset store before the test
		useSettingsStore.getState().reset();

		const screen = await render(
			<Sidebar
				defaultIsCollapsed={false}
				isHorizontalResizeable={true}
				sidebarId={sidebarId}
				direction="right"
			>
				<p>Resizable content</p>
			</Sidebar>
		);

		const resizeHandle = screen.container.querySelector('.sidebar__horizontal-resize')!;
		expect(resizeHandle).not.toBeNull();

		const root = screen.container.querySelector('.sidebar') as HTMLElement;

		// Simulate a drag sequence: mousedown → mousemove → mouseup
		const startX = 300;
		const dragDelta = -50;

		resizeHandle.dispatchEvent(
			new MouseEvent('mousedown', { clientX: startX, clientY: 0, bubbles: true })
		);

		window.document.dispatchEvent(
			new MouseEvent('mousemove', { clientX: startX + dragDelta, clientY: 0, bubbles: true })
		);

		window.document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

		// After mouseup the sidebar width should be persisted in the settings store
		const storedWidth = useSettingsStore.getState().getSidebarWidth(sidebarId);
		expect(storedWidth).toBeDefined();
		expect(storedWidth).toContain('px');

		// The inline style should also reflect the resized width
		expect(root.style.inlineSize).toContain('px');
	});
});
