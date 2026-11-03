import type { KrigingInput, KrigingResult } from "@/utils/kriging";

export function useKriging() {
	const result = shallowRef<KrigingResult | null>(null);
	const computing = ref(false);
	let worker: Worker | null = null;
	let latestId = 0;

	function onMessage(event: MessageEvent<{ id: number; result?: KrigingResult; error?: string }>) {
		if (event.data.id !== latestId) return;
		computing.value = false;
		if (event.data.error) console.error(event.data.error);
		result.value = event.data.result ?? null;
	}

	function run(input: KrigingInput) {
		if (!worker) {
			worker = new Worker(new URL("../workers/kriging.worker.ts", import.meta.url), {
				type: "module",
			});
			worker.addEventListener("message", onMessage);
		}
		computing.value = true;
		// oxlint-disable-next-line unicorn/require-post-message-target-origin -- worker messages have no origin
		worker.postMessage({ id: ++latestId, input });
	}

	onBeforeUnmount(() => {
		worker?.terminate();
		worker = null;
	});

	return { result, computing, run };
}
