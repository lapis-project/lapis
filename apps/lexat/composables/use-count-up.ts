import { onMounted, onUnmounted, ref } from "vue";

export function useCountUp(targetValue: number, duration = 1000) {
	const count = ref(0);
	const elementRef = ref<HTMLElement | null>(null);
	let observer: IntersectionObserver | null = null;
	let startTime: number | null = null;

	// Ease-out quadratic function for a smoother animation
	const easeOutQuad = (t: number) => t * (2 - t);

	const updateCount = (timestamp: number) => {
		if (startTime === null) startTime = timestamp;
		const elapsed = timestamp - startTime;
		let progress = Math.min(elapsed / duration, 1);
		// Apply easing function
		progress = easeOutQuad(progress);
		count.value = Math.floor(progress * targetValue);
		if (elapsed < duration) {
			requestAnimationFrame(updateCount);
		}
	};

	const startCounting = () => {
		requestAnimationFrame(updateCount);
	};

	onMounted(() => {
		if (elementRef.value) {
			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							startCounting();
							observer?.disconnect();
						}
					});
				},
				{ threshold: 0.5 },
			);
			observer.observe(elementRef.value);
		}
	});

	onUnmounted(() => {
		observer?.disconnect();
	});

	return { count, elementRef };
}
