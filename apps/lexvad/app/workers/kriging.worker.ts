import { type KrigingInput, krige } from "@/utils/kriging";

self.addEventListener("message", (event: MessageEvent<{ id: number; input: KrigingInput }>) => {
	const { id, input } = event.data;
	try {
		const result = krige(input);
		self.postMessage({ id, result }, { transfer: [result.dominant.buffer, result.margin.buffer] });
	} catch (error) {
		// oxlint-disable-next-line unicorn/require-post-message-target-origin -- worker messages have no origin
		self.postMessage({ id, error: String(error) });
	}
});
