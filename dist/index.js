(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Menu = {}));
})(this, (function (exports) { 'use strict';

    function animate(options) {
        const { element, animationClass, onReady, maxExecutionTime } = options;
        // Apply the animation.
        element.classList.add(animationClass);
        let isReadyCallbackRun = false;
        function endAnimation() {
            element.removeEventListener('animationend', endAnimation, false);
            if (typeof onReady === 'function') {
                isReadyCallbackRun = true;
                onReady(element, animationClass);
            }
        }
        // Detect when the animation ends.
        element.addEventListener('animationend', endAnimation, false);
        // Run setTimeout to ensure the animation ends.
        if (typeof onReady === 'function' && maxExecutionTime) {
            setTimeout(() => {
                if (!isReadyCallbackRun) {
                    isReadyCallbackRun = true;
                    onReady(element, animationClass);
                    element.removeEventListener('animationend', endAnimation, false);
                }
            }, maxExecutionTime);
        }
    }

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
    function menuFromHTML(element, options) {
        // Elements.
        const $ulRoot = element;
        let hoverTimeoutIndex = [];
        // Validate element.
        if (!(element instanceof HTMLElement)) {
            throw new Error('Menu element must be an valid HTMLElement');
        }
        const defaults = {
            action: 'click',
            subMenuAnchorSelector: '.menu-item-has-children > a',
            subMenuListItemSelector: '.menu-item-has-children',
            openSubMenuClass: 'is-open',
            buttonClass: '',
            visuallyHiddenClass: 'screen-reader-text',
            expandChildMenuText: 'Sub menu',
            hoverTimeout: 750,
            buttonIcon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z"></path></svg>',
            shouldWrapAnchorToButton: null,
            activeListItemSelector: '.current-menu-item',
            openActiveSubMenuOnCreate: false,
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
        const settings = Object.assign(Object.assign({}, defaults), options);
        const $subMenuAnchors = Array.from($ulRoot.querySelectorAll(settings.subMenuAnchorSelector));
        const $subMenuListItems = Array.from($ulRoot.querySelectorAll(settings.subMenuListItemSelector));
        /**
         * Create the menu.
         */
        const create = () => {
            /**
             * Protect agains multiple initializations with checking data-menu="root" attribute.
             */
            const isInitialized = $ulRoot.getAttribute('data-menu') === 'root';
            if (isInitialized) {
                console.log('menuFromHTML: Menu already initialized.', $ulRoot);
                return;
            }
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
                var _a;
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
                button.setAttribute('aria-controls', `sub-menu-${uniqueId}-${index}`);
                // Add matching id for next sub-sub-menu.
                const ul = (_a = a.closest('li')) === null || _a === void 0 ? void 0 : _a.querySelector('ul');
                if (ul) {
                    ul.id = `sub-menu-${uniqueId}-${index}`;
                    ul.setAttribute('data-menu', 'sub-menu');
                }
                button.className = getButtonClass(ul, level);
                button.type = 'button';
                const buttonIcon = getButtonIcon(ul, level);
                if (shouldWrapAnchorToButton(a, level)) {
                    const span = document.createElement('span');
                    // Move all child nodes of `a` to the span and keep any existing event listeners
                    while (a.childNodes.length > 0) {
                        span.appendChild(a.childNodes[0]);
                    }
                    button.appendChild(span);
                    button.insertAdjacentHTML('beforeend', buttonIcon);
                    button.setAttribute('data-toggle-type', 'cover');
                    a.after(button);
                    // Hide link in JS to avoid cumulative layout shift (CLS).
                    a.setAttribute('hidden', '');
                }
                else {
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
        const handleSubMenu = (event) => {
            const target = event.target;
            const button = target.closest('[data-menu="sub-toggle"]');
            if (!button) {
                return;
            }
            const ul = $ulRoot.querySelector(`#${button.getAttribute('aria-controls')}`);
            if (!ul) {
                return;
            }
            if (isOpenSubMenu(ul)) {
                closeSubMenu(ul, event);
            }
            else {
                // Get all sub menus that are not the closest sub menu or its parents.
                const subMenusToClose = getOpenSubMenus().filter((subMenu) => {
                    return subMenu !== ul && !subMenu.contains(ul);
                });
                if (subMenusToClose.length) {
                    subMenusToClose.forEach((subMenu) => {
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
        const handleOutsideClick = (event) => {
            const target = event.target;
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
        const handleCloseSubMenu = (event) => {
            var _a, _b, _c;
            const target = event.target;
            const closestSubButtonToChild = (_b = (_a = target
                .closest('[data-menu="sub-menu"]')) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.querySelector('[data-menu="sub-toggle"]');
            const closestSubButtonToParent = target.closest('[data-menu="sub-toggle"]');
            let closestSubButton;
            if (target.getAttribute('data-menu') === 'sub-toggle') {
                closestSubButton = target;
            }
            else if (closestSubButtonToChild) {
                closestSubButton = closestSubButtonToChild;
            }
            else {
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
            const lastFocusableElement = relevantFocusableElements[relevantFocusableElements.length - 1];
            // Last Tab closes sub-menu.
            if (TAB_KEY === event.key &&
                !event.shiftKey &&
                event.target === lastFocusableElement) {
                const closableSubMenus = getOpenSubMenus().filter((subMenu) => {
                    const subMenuFocusableElements = getFocusableElements(subMenu);
                    const isLastFocusableElement = subMenuFocusableElements[subMenuFocusableElements.length - 1] === event.target;
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
            if (closestSubButton &&
                TAB_KEY === event.key &&
                event.shiftKey &&
                event.target === closestSubButton) {
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
                const closestParentListItem = (_c = target
                    .closest('[data-menu="sub-menu"]')) === null || _c === void 0 ? void 0 : _c.closest('li');
                if (closestParentListItem) {
                    const focusableElements = getFocusableElements(closestParentListItem);
                    if (focusableElements.length) {
                        focusableElements[0].focus();
                    }
                    const closestParentSubMenu = closestParentListItem.querySelector('[data-menu="sub-menu"]');
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
        const openSubMenu = (ul, event) => {
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
            }
            else {
                openReady();
            }
        };
        /**
         * Close sub menu.
         *
         * @param ul
         * @param event
         */
        const closeSubMenu = (ul, event) => {
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
            }
            else {
                closeReady();
            }
        };
        /**
         * Handle mouse enter list item.
         *
         * @param event
         */
        const handleMouseEnter = (event) => {
            const currentTarget = event.currentTarget;
            const ul = currentTarget.querySelector('[data-menu="sub-menu"]');
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
                return (subMenu !== ul && !subMenu.contains(ul) && !ul.contains(subMenu));
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
        const handleMouseLeave = (event) => {
            const currentTarget = event.currentTarget;
            const ul = currentTarget.querySelector('[data-menu="sub-menu"]');
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
                    id: setTimeout((refUl) => {
                        closeSubMenu(refUl);
                    }, settings.hoverTimeout, ul),
                    ul,
                });
            }
        };
        /*
         * Is open sub menu.
         */
        const isOpenSubMenu = (ul) => {
            return ul.classList.contains(settings.openSubMenuClass);
        };
        /**
         * Get open sub menus.
         */
        const getOpenSubMenus = () => {
            return Array.from($ulRoot.querySelectorAll(`.${settings.openSubMenuClass}[data-menu="sub-menu"]`));
        };
        /**
         * Get focusable elements-
         *
         * @param targetEl
         */
        const getFocusableElements = (targetEl) => {
            const focusableElements = Array.from(targetEl.querySelectorAll(FOCUSABLE_ELEMENTS));
            // filter out all that have parent sub-menu that is not open
            const focusableElementsFiltered = focusableElements.filter((focusableElement) => {
                const closestParentSubMenu = focusableElement.closest('[data-menu="sub-menu"]');
                if (!closestParentSubMenu) {
                    return true;
                }
                return isOpenSubMenu(closestParentSubMenu);
            });
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
            const liActive = $ulRoot.querySelector(settings.activeListItemSelector);
            if (liActive) {
                let ulActive = liActive.closest('[data-menu="sub-menu"]');
                if (!ulActive) {
                    ulActive = liActive.querySelector('[data-menu="sub-menu"]');
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
        const shouldWrapAnchorToButton = (a, level) => {
            const href = a.getAttribute('href');
            let should = true;
            if (href && href !== '#') {
                should = false;
            }
            if (typeof settings.shouldWrapAnchorToButton === 'boolean') {
                should = settings.shouldWrapAnchorToButton;
            }
            else if (typeof settings.shouldWrapAnchorToButton === 'function') {
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
        const getButtonClass = (ul, level) => {
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
        const getButtonIcon = (ul, level) => {
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

    exports.menuFromHTML = menuFromHTML;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
