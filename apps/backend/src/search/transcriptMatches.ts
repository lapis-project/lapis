export type NoSketchError = { status: number | null; message: string };
export type TranscriptMatchesResult = {
	data: Map<number, number> | null;
	error: NoSketchError | null;
};

type FrequencyResponse = {
	concsize: number;
	lastpage?: number | boolean;
	error?: string;
	Blocks?: Array<{
		total: number;
		Items: Array<{ Word: Array<{ n: string }>; frq: number }>;
	}>;
};

const isCount = (value: unknown): value is number =>
	typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

/** Resolve the complete document list; partial frequency pages are never returned. */
export async function requestTranscriptMatches(cql: string): Promise<TranscriptMatchesResult> {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_resolve, reject) => {
		timer = setTimeout(() => {
			reject(new Error("NoSketch transcript frequency lookup timed out"));
			controller.abort();
		}, 30_000);
	});
	const collect = async (): Promise<TranscriptMatchesResult> => {
		const baseUrl = process.env.NOSKE_INTERNAL_URL ?? "http://localhost:8080/bonito/run.cgi/";
		const corpus = process.env.NOSKE_CORPUS_NAME ?? "dioedbcorpus";
		const matches = new Map<number, number>();
		let total: number | undefined;
		let concsize: number | undefined;
		let hitCount = 0;
		for (let page = 1; ; page++) {
			controller.signal.throwIfAborted();
			const response = await fetch(`${baseUrl}freqs`, {
				method: "POST",
				signal: controller.signal,
				body: new URLSearchParams({
					corpname: corpus,
					q: `q${cql}`,
					format: "json",
					fcrit: "doc.id 0",
					flimit: "1",
					fmaxitems: "1000",
					fpage: String(page),
				}),
			});
			if (!response.ok) {
				return {
					data: null,
					error: {
						status: response.status,
						message: response.statusText || "NoSketch frequency request failed",
					},
				};
			}

			const data = (await response.json()) as FrequencyResponse | null;
			if (
				!data ||
				data.error ||
				!isCount(data.concsize) ||
				(data.Blocks !== undefined && !Array.isArray(data.Blocks))
			) {
				throw new Error(data?.error || "Invalid NoSketch frequency response");
			}
			const block = data.Blocks?.[0];
			if (page === 1 && data.concsize === 0 && block === undefined) {
				return { data: matches, error: null };
			}
			if (
				!block ||
				!isCount(block.total) ||
				!Array.isArray(block.Items) ||
				![0, 1, false, true].includes(data.lastpage!)
			) {
				throw new Error("Invalid NoSketch frequency block or pagination");
			}
			total ??= block.total;
			concsize ??= data.concsize;
			if (block.total !== total || data.concsize !== concsize) {
				throw new Error("NoSketch frequency totals changed during pagination");
			}
			for (const item of block.Items) {
				const name = item?.Word?.[0]?.n;
				if (typeof name !== "string" || !/^transcript_\d+$/.test(name) || !isCount(item.frq)) {
					throw new Error("Invalid NoSketch transcript frequency item");
				}
				const id = Number(name.slice("transcript_".length));
				if (!Number.isSafeInteger(id) || matches.has(id)) {
					throw new Error("Invalid or repeated NoSketch transcript ID");
				}
				matches.set(id, item.frq);
				hitCount += item.frq;
			}
			if (matches.size > total || hitCount > concsize) {
				throw new Error("NoSketch frequency results exceed reported totals");
			}
			if (data.lastpage) {
				if (matches.size !== total || hitCount !== concsize) {
					throw new Error("Incomplete NoSketch frequency results");
				}
				return { data: matches, error: null };
			}
			if (!block.Items.length || matches.size === total) {
				throw new Error("NoSketch frequency pagination made no progress");
			}
		}
	};
	try {
		return await Promise.race([collect(), timeout]);
	} catch (error) {
		return {
			data: null,
			error: {
				status: null,
				message: error instanceof Error ? error.message : "NoSketch frequency request failed",
			},
		};
	} finally {
		clearTimeout(timer);
	}
}
