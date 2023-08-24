import animate from './utils/animate';

type El = HTMLElement;

export type MenuActionType = 'click' | 'hover';

export type MenuSettings = {
	action: MenuActionType;
	subMenuAnchorSelector: string;
	subMenuListItemSelector: string;
	openSubMenuClass: string;
	buttonClass: ((el: El, subMenu: El, level: number) => string) | string;
	visuallyHiddenClass: string;
	expandChildMenuText: string;
	hoverTimeout: number;
	buttonIcon: ((el: El, subMenu: El, level: number) => string) | string;
	shouldWrapAnchorToButton:
		| ((should: boolean, anchor: El, level: number) => boolean)
		| boolean
		| null;
	activeListItemSelector: string;
	openActiveSubMenuOnCreate: boolean;
	closeSubMenuOnOutsideClick: boolean;
	animateOpen: boolean;
	animateClose: boolean;
	animateOpenClass: string;
	animateCloseClass: string;
	animateOpenMaxExecutionTime: number;
	animateCloseMaxExecutionTime: number;
	onBeforeCreate: (() => void) | null;
	onAfterCreate: (() => void) | null;
	onBeforeOpenSubMenu: ((ul: El, event?: Event) => void) | null;
	onAfterOpenSubMenu: ((ul: El, event?: Event) => void) | null;
	onBeforeCloseSubMenu: ((ul: El, event?: Event) => void) | null;
	onAfterCloseSubMenu: ((ul: El, event?: Event) => void) | null;
};

export type MenuSettingsArgs = Partial<MenuSettings>;

const TAB_KEY = 'Tab';
const ESC_KEY = 'Escape';

const FOCUSABLE_ELEMENTS = `
a[href]:not([hidden]),
area[href],
input:not([disabled]),
select:not([disabled]),
textarea:not([disabled]),
button:not([disabled])
`;

export default function menuFromHTML(
	element: El,
	options?: MenuSettingsArgs | null
) {
	// Elements.
	const $ulRoot: El = element;

	let hoverTimeoutIndex: { id: ReturnType<typeof setTimeout>; ul: El }[] = [];

	// Validate element.
	if (!(element instanceof HTMLElement)) {
		throw new Error('Menu element must be an valid HTMLElement');
	}

	const defaults: MenuSettings = {
		action: 'click',
		subMenuAnchorSelector: '.menu-item-has-children > a',
		subMenuListItemSelector: '.menu-item-has-children',
		openSubMenuClass: 'is-open',
		buttonClass: '',
		visuallyHiddenClass: 'screen-reader-text',
		expandChildMenuText: 'Sub menu',
		hoverTimeout: 750,
		buttonIcon:
			'<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z"></path></svg>',
		shouldWrapAnchorToButton: null,
		activeListItemSelector: '.current-menu-item',
		openActiveSubMenuOnCreate: false, // should be used only for mobile menus
		closeSubMenuOnOutsideClick: true,
		animateOpen: false,
		animateClose: false,
		animateOpenClass: 'animate-open',
		animateCloseClass: 'animate-close',
		animateOpenMaxExecutionTime: 250,
		animateCloseMaxExecutionTime: 250,
		onBeforeCreate: null,
		onAfterCreate: null,
		onBeforeOpenSubMenu: null,
		onAfterOpenSubMenu: null,
		onBeforeCloseSubMenu: null,
		onAfterCloseSubMenu: null,
	};

	// Merge options to defaults.
	const settings: MenuSettings = { ...defaults, ...options };

	const $subMenuAnchors: El[] = Array.from(
		$ulRoot.querySelectorAll(settings.subMenuAnchorSelector)
	) as El[];
	const $subMenuListItems: El[] = Array.from(
		$ulRoot.querySelectorAll(settings.subMenuListItemSelector)
	) as El[];

	/**
	 * Create the menu.
	 */
	const create = () => {
		/**
		 * Called before the component is initialized.
		 */
		if (typeof settings.onBeforeCreate === 'function') {
			settings.onBeforeCreate();
		}

		// Set data value for nav element. This is for targeting without a class name.
		$ulRoot.setAttribute('data-menu', 'root');

		// Setup sub menu toggle buttons.
		let uniqueId = 1;
		$subMenuAnchors.forEach((a, index) => {
			const button = document.createElement('button');
			button.setAttribute('data-menu', 'sub-toggle');
			button.setAttribute('aria-expanded', 'false');

			// Add level as data attribute by counting the number of parents.
			let level = 1;
			let parent = a.parentElement;
			while (parent && parent !== $ulRoot) {
				if (parent.tagName === 'UL') {
					level++;
				}
				parent = parent.parentElement;
			}
			button.setAttribute('data-menu-level', `${level}`);

			while (document.getElementById(`sub-menu-${uniqueId}-${index}`)) {
				uniqueId++;
			}
			button.setAttribute(
				'aria-controls',
				`sub-menu-${uniqueId}-${index}`
			);

			// Add matching id for next sub-sub-menu.
			const ul = a.closest('li')?.querySelector('ul') as El;
			if (ul) {
				ul.id = `sub-menu-${uniqueId}-${index}`;
				ul.setAttribute('data-menu', 'sub-menu');
			}

			button.className = getButtonClass(ul, level);
			button.type = 'button';

			const buttonIcon = getButtonIcon(ul, level);

			if (shouldWrapAnchorToButton(a, level)) {
				button.innerHTML = `<span>${a.textContent}</span>${buttonIcon}`;
				button.setAttribute('data-toggle-type', 'cover');
				a.after(button);
				// Hide link in JS to avoid cumulative layout shift (CLS).
				a.setAttribute('hidden', '');
			} else {
				button.innerHTML = `<span class="${settings.visuallyHiddenClass}">${settings.expandChildMenuText}</span>${buttonIcon}`;
				button.setAttribute('data-toggle-type', 'icon');
				a.after(button);
			}
		});

		// Open active sub menu on create.
		if (settings.openActiveSubMenuOnCreate) {
			openActiveSubMenu();
		}

		// Set event listeners.
		$ulRoot.addEventListener('click', handleSubMenu, false);
		$ulRoot.addEventListener('keydown', handleCloseSubMenu, false);

		if (settings.closeSubMenuOnOutsideClick) {
			document.addEventListener('click', handleOutsideClick, false);
		}

		if (settings.action === 'hover') {
			$subMenuListItems.forEach((li) => {
				li.addEventListener('mouseenter', handleMouseEnter, false);
				li.addEventListener('mouseleave', handleMouseLeave, false);
			});
		}

		/**
		 * Called after the component is initialized.
		 */
		if (typeof settings.onAfterCreate === 'function') {
			settings.onAfterCreate();
		}

		$ulRoot.classList.add('is-ready');
	};

	/**
	 * Handle sub menu toggle button click.
	 *
	 * @param event
	 */
	const handleSubMenu = (event: Event) => {
		const target = event.target as El;

		const button = target.closest('[data-menu="sub-toggle"]');
		if (!button) {
			return;
		}

		const ul = $ulRoot.querySelector(
			`#${button.getAttribute('aria-controls')}`
		) as El;
		if (!ul) {
			return;
		}

		if (isOpenSubMenu(ul)) {
			closeSubMenu(ul, event);
		} else {
			// Get all sub menus that are not the closest sub menu or its parents.
			const subMenusToClose = getOpenSubMenus().filter((subMenu) => {
				return subMenu !== ul && !subMenu.contains(ul);
			});
			if (subMenusToClose.length) {
				subMenusToClose.forEach((subMenu: El) => {
					closeSubMenu(subMenu);
				});
			}
			openSubMenu(ul, event);
		}
	};

	/**
	 * Handle closing sub-navs when clicking outside of nav.
	 *
	 * @param event
	 */
	const handleOutsideClick = (event: MouseEvent) => {
		const target = event.target as El;
		// Bail if clicking inside the nav.
		if (target.closest('[data-menu="root"]')) {
			return;
		}

		closeAllSubMenus();
	};

	/**
	 * Handle close sub menu with Tab or Esc key.
	 *
	 * @param event
	 */
	const handleCloseSubMenu = (event: KeyboardEvent) => {
		const target = event.target as El;

		const closestSubButtonToChild = target
			.closest('[data-menu="sub-menu"]')
			?.parentElement?.querySelector('[data-menu="sub-toggle"]');
		const closestSubButtonToParent = target.closest(
			'[data-menu="sub-toggle"]'
		);
		let closestSubButton;
		if (target.getAttribute('data-menu') === 'sub-toggle') {
			closestSubButton = target;
		} else if (closestSubButtonToChild) {
			closestSubButton = closestSubButtonToChild;
		} else {
			closestSubButton = closestSubButtonToParent;
		}

		const closestListItem = closestSubButton
			? closestSubButton.closest('li')
			: target.closest('li');
		if (!closestListItem) {
			return;
		}

		// Focusable elements.
		const relevantFocusableElements = getFocusableElements(closestListItem);
		const lastFocusableElement =
			relevantFocusableElements[relevantFocusableElements.length - 1];

		// Last Tab closes sub-menu.
		if (
			TAB_KEY === event.key &&
			!event.shiftKey &&
			event.target === lastFocusableElement
		) {
			const closableSubMenus = getOpenSubMenus().filter((subMenu: El) => {
				const subMenuFocusableElements = getFocusableElements(subMenu);
				const isLastFocusableElement =
					subMenuFocusableElements[
						subMenuFocusableElements.length - 1
					] === event.target;
				if (isLastFocusableElement) {
					return true;
				}
				if (!subMenu.contains(closestListItem)) {
					return true;
				}
				return false;
			});
			if (closableSubMenus.length) {
				closableSubMenus.forEach((subMenu) => {
					closeSubMenu(subMenu);
				});
			}
		}

		// First Shift + Tab closes sub-menu.
		if (
			closestSubButton &&
			TAB_KEY === event.key &&
			event.shiftKey &&
			event.target === closestSubButton
		) {
			const closableSubMenus = getOpenSubMenus().filter((subMenu) => {
				return !subMenu.contains(closestListItem);
			});
			if (closableSubMenus.length) {
				closableSubMenus.forEach((subMenu) => {
					closeSubMenu(subMenu);
				});
			}
		}

		// Esc closes sub-menu.
		if (ESC_KEY === event.key) {
			const closestParentListItem = target
				.closest('[data-menu="sub-menu"]')
				?.closest('li');
			if (closestParentListItem) {
				const focusableElements = getFocusableElements(
					closestParentListItem
				);
				if (focusableElements.length) {
					focusableElements[0].focus();
				}
				const closestParentSubMenu =
					closestParentListItem.querySelector(
						'[data-menu="sub-menu"]'
					) as El;
				if (closestParentSubMenu) {
					// if is open => close
					if (isOpenSubMenu(closestParentSubMenu)) {
						closeSubMenu(closestParentSubMenu);
					}
				}
			}
		}
	};

	/**
	 * Open sub menu.
	 *
	 * @param ul
	 * @param event
	 */
	const openSubMenu = (ul: El, event?: Event) => {
		// Bail if already open.
		if (isOpenSubMenu(ul)) {
			return;
		}

		/**
		 * Called before the sub menu is opened.
		 */
		if (typeof settings.onBeforeOpenSubMenu === 'function') {
			settings.onBeforeOpenSubMenu(ul, event);
		}

		const button = $ulRoot.querySelector(`[aria-controls="${ul.id}"]`);

		if (button) {
			button.setAttribute('aria-expanded', 'true');
		}

		// Remove animation class if exists.
		if (settings.animateCloseClass) {
			ul.classList.remove(settings.animateCloseClass);
		}

		ul.classList.add(settings.openSubMenuClass);

		const openReady = () => {
			// Remove animation class if exists.
			if (settings.animateOpenClass) {
				ul.classList.remove(settings.animateOpenClass);
			}
			/**
			 * Called after the sub menu is opened.
			 */
			if (typeof settings.onAfterOpenSubMenu === 'function') {
				settings.onAfterOpenSubMenu(ul, event);
			}
		};

		if (settings.animateOpen) {
			animate({
				element: ul,
				animationClass: settings.animateOpenClass,
				onReady: () => {
					openReady();
				},
				maxExecutionTime: settings.animateOpenMaxExecutionTime,
			});
		} else {
			openReady();
		}
	};

	/**
	 * Close sub menu.
	 *
	 * @param ul
	 * @param event
	 */
	const closeSubMenu = (ul: El, event?: Event) => {
		// Bail if already closed.
		if (!isOpenSubMenu(ul)) {
			return;
		}

		const button = $ulRoot.querySelector(`[aria-controls="${ul.id}"]`);

		if (button) {
			button.setAttribute('aria-expanded', 'false');
		}

		const closeReady = () => {
			ul.classList.remove(settings.openSubMenuClass);

			// Remove animation class if exists.
			if (settings.animateCloseClass) {
				ul.classList.remove(settings.animateCloseClass);
			}

			/**
			 * Called after the sub menu is closed.
			 */
			if (typeof settings.onAfterCloseSubMenu === 'function') {
				settings.onAfterCloseSubMenu(ul, event);
			}
		};

		if (settings.animateClose) {
			animate({
				element: ul,
				animationClass: settings.animateCloseClass,
				onReady: () => {
					closeReady();
				},
				maxExecutionTime: settings.animateCloseMaxExecutionTime,
			});
		} else {
			closeReady();
		}
	};

	/**
	 * Handle mouse enter list item.
	 *
	 * @param event
	 */
	const handleMouseEnter = (event: MouseEvent) => {
		const currentTarget = event.currentTarget as El;

		const ul = currentTarget.querySelector('[data-menu="sub-menu"]') as El;

		// Clear any previously set closing timeout for this element or its parents.
		hoverTimeoutIndex = hoverTimeoutIndex.filter((timeout) => {
			if (timeout.ul === ul || timeout.ul.contains(ul)) {
				clearTimeout(timeout.id);
				return false;
			}
			// Remove this sub menu from the array.
			return true;
		});

		// close any open sub menus that are not parents or children of the current target
		const subMenusToClose = getOpenSubMenus().filter((subMenu) => {
			return (
				subMenu !== ul && !subMenu.contains(ul) && !ul.contains(subMenu)
			);
		});
		subMenusToClose.forEach((subMenu) => {
			closeSubMenu(subMenu, event);
		});

		if (ul) {
			openSubMenu(ul, event);
		}
	};

	/**
	 * Handle mouse leave list item.
	 *
	 * @param event
	 */
	const handleMouseLeave = (event: MouseEvent) => {
		const currentTarget = event.currentTarget as El;
		const ul = currentTarget.querySelector('[data-menu="sub-menu"]') as El;
		if (ul) {
			hoverTimeoutIndex = hoverTimeoutIndex.filter((timeout) => {
				// Clear any previously set closing timeout for this sub menu.
				if (timeout.ul === ul) {
					clearTimeout(timeout.id);
					return false;
				}
				return true;
			});
			// Set a new closing timeout for this sub menu.
			hoverTimeoutIndex.push({
				id: setTimeout(
					(refUl) => {
						closeSubMenu(refUl);
					},
					settings.hoverTimeout,
					ul
				),
				ul,
			});
		}
	};

	/*
	 * Is open sub menu.
	 */
	const isOpenSubMenu = (ul: El): boolean => {
		return ul.classList.contains(settings.openSubMenuClass);
	};

	/**
	 * Get open sub menus.
	 */
	const getOpenSubMenus = (): Array<El> => {
		return Array.from(
			$ulRoot.querySelectorAll(
				`.${settings.openSubMenuClass}[data-menu="sub-menu"]`
			)
		) as El[];
	};

	/**
	 * Get focusable elements-
	 *
	 * @param targetEl
	 */
	const getFocusableElements = (targetEl: El): Array<El> => {
		const focusableElements = Array.from(
			targetEl.querySelectorAll(FOCUSABLE_ELEMENTS)
		) as El[];
		// filter out all that have parent sub-menu that is not open
		const focusableElementsFiltered = focusableElements.filter(
			(focusableElement) => {
				const closestParentSubMenu = focusableElement.closest(
					'[data-menu="sub-menu"]'
				) as El;
				if (!closestParentSubMenu) {
					return true;
				}
				return isOpenSubMenu(closestParentSubMenu);
			}
		);
		return focusableElementsFiltered;
	};

	/**
	 * Close all sub menus.
	 */
	const closeAllSubMenus = () => {
		const openSubMenus = getOpenSubMenus();
		if (openSubMenus.length) {
			openSubMenus.forEach((subMenu) => {
				closeSubMenu(subMenu);
			});
		}
	};

	/**
	 * Open active sub menu.
	 */
	const openActiveSubMenu = () => {
		const liActive = $ulRoot.querySelector(
			settings.activeListItemSelector
		) as El;
		if (liActive) {
			let ulActive = liActive.closest('[data-menu="sub-menu"]') as El;
			if (!ulActive) {
				ulActive = liActive.querySelector(
					'[data-menu="sub-menu"]'
				) as El;
			}
			if (ulActive) {
				const ulActiveParents = [];
				let parent = ulActive.parentElement;
				while (parent && parent !== $ulRoot) {
					if (parent.tagName === 'UL') {
						ulActiveParents.push(parent);
					}
					parent = parent.parentElement;
				}
				const ulActiveEls = [...ulActiveParents, ulActive];
				ulActiveEls.forEach((ul) => {
					openSubMenu(ul);
				});
			}
		}
	};

	/**
	 * Should wrap anchor in button.
	 *
	 * @param a
	 * @param level
	 */
	const shouldWrapAnchorToButton = (a: El, level: number): boolean => {
		const href = a.getAttribute('href');
		let should = true;
		if (href && href !== '#') {
			should = false;
		}
		if (typeof settings.shouldWrapAnchorToButton === 'boolean') {
			should = settings.shouldWrapAnchorToButton;
		} else if (typeof settings.shouldWrapAnchorToButton === 'function') {
			should = settings.shouldWrapAnchorToButton(should, a, level);
		}
		return should;
	};

	/**
	 * Get button class.
	 *
	 * @param ul
	 * @param level
	 */
	const getButtonClass = (ul: El, level: number): string => {
		return typeof settings.buttonClass === 'function'
			? settings.buttonClass($ulRoot, ul, level)
			: settings.buttonClass;
	};

	/**
	 * Get button icon.
	 *
	 * @param ul
	 * @param level
	 */
	const getButtonIcon = (ul: El, level: number): string => {
		return typeof settings.buttonIcon === 'function'
			? settings.buttonIcon($ulRoot, ul, level)
			: settings.buttonIcon;
	};

	create();

	return {
		openSubMenu,
		closeSubMenu,
		closeAllSubMenus,
		openActiveSubMenu,
		getOpenSubMenus,
		getButtonClass,
		getButtonIcon,
	};
}
