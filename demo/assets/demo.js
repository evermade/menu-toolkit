import { menuFromHTML } from '../dist/menu-toolkit.esm.js';

(function () {
	const init = () => {
		const demoId = document.body.getAttribute('data-demo');

		switch (demoId) {
			case 'click':
				demoClick();
				break;
			case 'hover':
				demoHover();
				break;
			case 'animation':
				demoAnimation();
				break;
			default:
				throw new Error(`No matching demo found. Demo ID: ${demoId}`);
		}
	};

	const demoClick = () => {
		menuFromHTML(document.querySelector('.js-menu-toolkit'), {
			action: 'click',
		});
	};

	const demoHover = () => {
		menuFromHTML(document.querySelector('.js-menu-toolkit'), {
			action: 'hover',
		});
	};

	const demoAnimation = () => {
		menuFromHTML(document.querySelector('.js-menu-toolkit'), {
			action: 'hover',
			animateOpen: true, // class 'animate-open'
			animateClose: true, // class 'animate-close'
		});
	};

	init();
})();
