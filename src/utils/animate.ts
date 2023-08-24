export type AnimateArgs = {
	element: HTMLElement;
	animationClass: string;
	onReady?: (element: HTMLElement, animationClass: string) => void;
	maxExecutionTime?: number;
};

export default function animate(options: AnimateArgs) {
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
				element.removeEventListener(
					'animationend',
					endAnimation,
					false
				);
			}
		}, maxExecutionTime);
	}
}
