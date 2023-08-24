# Menu Toolkit

Menu Toolkit provides functionality to help create accessible and usable menus. Toolkit provides JavaScript functions to create the menu and it's up to you to style it and extend it.

## Menu from HTML

**Demos**

* ["Click" interaction](https://evermade.github.io/menu-toolkit/)
* ["Hover" interaction](https://evermade.github.io/menu-toolkit/hover.html)
* [Animating sub menus](https://evermade.github.io/menu-toolkit/animation.html)

Function `menuFromHTML` adds accessible enhancements and events for WordPress navigation menus (although you can use it for different menus).

Two different interaction modes are supported:

1. `click`: sub menus are opened only on click
2. `hover`: sub menus open also with hover

Things to note:

* This function only handles the `<ul>` part of your menu. You may need additional logic for example toggles or displaying mobile menu in modal
* It's recommended to have separate menu markup for mobile menu at least when hover is used (and regardless often different configuration makes sense for smaller screens)
* This is not plug-and-play library and you still need to properly style the menu

### Usage

If you’re using a bundler (such as Webpack or Rollup), you can install through npm:

```bash
npm install @evermade/menu-toolkit
```

Import the `menuFromHTML` and create a menu.

```js
import { menuFromHTML } from "@evermade/menu-toolkit";

const menuEl = document.querySelector('.js-main-menu');
if (menuEl) {
	const menu = menuFromHTML(
		menuEl,
		{
			action: 'click'
		}
	);
}
```

### Markup

In general it's recommended to wrap the menu in `<nav>` element but we'll show just the parts this function needs.

```html
<ul class="js-main-menu">
	<li><a href="/">Home</a></li>
	<li class="menu-item-has-children">
		<a href="#">Work</a>
		<ul class="sub-menu">
			<li><a href="/websites">Websites</a></li>
			<li><a href="/e-commerce">E-commerce</a></li>
			<li><a href="/apps">Apps</a></li>
	</li>
	<li class="menu-item-has-children">
		<a href="#">Services</a>
		<ul class="sub-menu">
			<li><a href="/design">Design</a></li>
			<li><a href="/development">Development</a></li>
			<li class="menu-item-has-children">
				<a href="#">Care</a>
				<ul class="sub-menu">
					<li><a href="/upkeep">Upkeep</a></li>
					<li><a href="/monitoring">Monitoring</a></li>
				</ul>
			</ul>
	</li>
	<li><a href="/blog">Blog</a></li>
</ul>
```

### Changes to markup

This functions adds toggles to open/close menus.

Before:

```html
<li class="menu-item-has-children">
	<a href="/services">Services</a>
</li>
```

After (if `shouldWrapAnchorToButton` is true):

```html
<li class="menu-item-has-children">
	<a href="/services" hidden>Services</a>
	<button aria-expanded="false" data-toggle-type="cover">
		<span>Services</span>
		<svg></svg>
	</button>
</li>
```

After (if `shouldWrapAnchorToButton` is false):

```html
<li class="menu-item-has-children">
	<a href="/services">Services</a>
	<button aria-expanded="false" data-toggle-type="icon">
		<span class="screen-reader-text">Sub menu</span>
		<svg></svg>
	</button>
</li>
```

### Functional CSS

There's much more you'll actually need but here's functional things that you need so that opening and closing sub menus work:

```CSS
[hidden] {
	display: none !important;
}

.sub-menu {
	opacity: 0;
	pointer-events: none;
	visibility: hidden;
}

.sub-menu.is-open {
	opacity: 1;
	visibility: visible;
	pointer-events: auto;
}
```

Tips and tricks:

* It's recommended not to open sub menus with `:hover` because hovering will already add `is-open` class to sub menu
* You can use selctors for toggles: `[data-toggle-type="cover"]` and `[data-toggle-type="icon"]`
* You probably want to have all the same styling for `[data-toggle-type="cover"]` than for `<a>`
* If you use animation you can do CSS animations or just transition with `.sub-menu.animate-open` and `.sub-menu.animate-close` (or whatever classes you configure)
* If you want to animate caret without delay of animation you can target it with `[data-toggle-type="cover"][aria-expanded="true"]` because aria-expanded is updated without any delay
* Remember to check that you have proper `:focus` style in place for both `<a>` and `<button>` elements

### Options

There are many settings (in object format) that can be passed as 2nd argument with following types:

```js
const menu = menuFromHTML( menuEl, {
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
});
```

#### action (string)

Either `click` or `hover`.

#### subMenuAnchorSelector (string)

Targets main `<a>` elements of menu items that have children. If using WordPress menus or WordPress-like markup, no changes needed.

Defaults to `.menu-item-has-children > a`.

#### subMenuListItemSelector (string)

Targets main `<li>`  elements of menu items that have children. If using WordPress menus or WordPress-like markup, no changes needed.

Defaults to `.menu-item-has-children`.

#### openSubMenuClass (string)

Class to be added when sub menu is open. CSS styles to show/hide sub menu should be based on this class.

Defaults to `is-open`.

#### buttonClass (string)

Class to be added to toggle buttons. Even without class you can use data-attributes as selectors.

Defaults to no added class.

#### visuallyHiddenClass (string)

Class to be added to visually hidden elements. This is used for screen readers.

Defaults to `screen-reader-text`.

#### expandChildMenuText (string)

Text to be added to toggle buttons. This is used for screen readers.

Defaults to `Sub menu`.

#### hoverTimeout (number)

Time in milliseconds to wait before closing sub menu after hover moves outside of element. This is used to prevent accidental closing of sub menus.

Defaults to `750`.

#### buttonIcon (string)

HTML string to be used as toggle button icon.

Defaults to SVG icon.

#### shouldWrapAnchorToButton (boolean | function)

Weather `<a>` elements should be wrapped inside `<button>` elements (that act as toggles). Alternatively toggle button can be separate element next to `<a>` element.

Example:

```js
shouldWrapAnchorToButton: true
```

```js
shouldWrapAnchorToButton: ( should, a, level ) => {
	return level === 1;
}
```

Defaults to wrapping when href is "#".

#### activeListItemSelector (string)

Targets active menu item. If using WordPress menus or WordPress-like markup, no changes needed.

Defaults to `.current-menu-item`.

#### openActiveSubMenuOnCreate (boolean)

If active menu item has sub menu, should it be opened on create. This should usually only be used in mobile menus or menus that are not visible on page load.

Defaults to `false`.

#### closeSubMenuOnOutsideClick (boolean)

Should sub menus be closed when clicking outside of menu. This should usually not be used on mobile menus because it may cause accidental closing of menu levels.

Defaults to `true`.

#### animateOpen (boolean)

Should sub menus be animated when opening.

Defaults to `false`.

#### animateClose (boolean)

Should sub menus be animated when closing.

Defaults to `false`.

#### animateOpenClass (string)

Class to be added when sub menu is opening. CSS styles to animate opening of sub menu should be based on this class. You can use for example animation or transitions to animate opening.

Defaults to `animate-open`.

#### animateCloseClass (string)

Class to be added when sub menu is closing. CSS styles to animate closing of sub menu should be based on this class. You can use for example animation or transitions to animate closing.

Defaults to `animate-close`.

#### animateOpenMaxExecutionTime (number)

Maximum time in milliseconds to wait for opening animation to finish. This is fallback in case animation eventhandler is not triggered.

Defaults to `250`.

#### animateCloseMaxExecutionTime (number)

Maximum time in milliseconds to wait for closing animation to finish. This is fallback in case animation eventhandler is not triggered.

Defaults to `250`.

#### onBeforeCreate (function)

Callback function to be called before menu is created. This is called only once. If you need to modify markup before menu is created, this is the place to do it.

Example:

```js
onBeforeCreate: ( menu ) => {
	// wrap all anchors to span
	const anchors = menu.querySelectorAll('a');
	anchors.forEach((anchor) => {
		const span = document.createElement('span');
		anchor.parentNode.insertBefore(span, anchor);
		span.appendChild(anchor);
	});
}
```

Defaults to `null`.

#### onAfterCreate (function)

Callback function to be called after menu is created. This is called only once. If you need to modify markup after menu is created, this is the place to do it.

Example:

```js
onAfterCreate: ( menu ) => {}
```

Defaults to `null`.

#### onBeforeOpenSubMenu (function)

Callback function to be called before sub menu is opened. This is called every time sub menu is opened. If you need to modify markup or styling in a way that could cause flickering after sub menu is opened, this is the place to do it.

Example:

```js
onBeforeOpenSubMenu: (ul) => {
	// check that sub-menu fits on right side of parent
	if (ul.getBoundingClientRect().right > (window.innerWidth || document.documentElement.clientWidth)) {
		ul.classList.add('is-out-of-bounds');
	} else {
		ul.classList.remove('is-out-of-bounds');
	}
}
```

Defaults to `null`.

#### onAfterOpenSubMenu (function)

Callback function to be called after sub menu is opened. This is called every time sub menu is opened.

Example:

```js
onAfterOpenSubMenu: (ul) => {}
```

Defaults to `null`.

#### onBeforeCloseSubMenu (function)

Callback function to be called before sub menu is closed. This is called every time sub menu is closed.

Example:

```js
onBeforeCloseSubMenu: (ul) => {}
```

Defaults to `null`.

#### onAfterCloseSubMenu (function)

Callback function to be called after sub menu is closed. This is called every time sub menu is closed. If you need to modify markup or styling in a way that could cause flickering before sub menu is closed, this is the place to do it.

Example:

```js
onAfterCloseSubMenu: (ul) => {
	// remove out of bounds class
	ul.classList.remove('is-out-of-bounds');
}
```

Defaults to `null`.

## Acknowledgements

This library has taken a lot from [MEOM/navigation](https://github.com/MEOM/navigation). Although we have a different approach to many things, it has been a great source of inspiration and ideas.

## Development

Install tools `npm install` and build `npm run build` or develop with `npm run watch`.
