// composables/use-audio-controller.ts
import { $fetch } from "ofetch";
import { computed, onScopeDispose, ref, watch } from "vue";

import { useRoute, useRouter, useRuntimeConfig } from "#imports";
import type { WaveformData } from "@/types/api";

const parseTime = (raw?: string | number | null): number | null => {
	if (raw == null) return null;
	if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
	const s = decodeURIComponent(String(raw).trim());

	// ISO 8601 duration
	const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(s);
	if (m) {
		const [_, d, h, mi, se] = m;
		return +(d || 0) * 86400 + +(h || 0) * 3600 + +(mi || 0) * 60 + (se ? +se : 0);
	}
	// HH:MM:SS(.sss) | MM:SS(.sss) | SS(.sss)
	const parts = s.split(":").map(Number);
	if (parts.every(Number.isFinite)) {
		if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
		if (parts.length === 2) return parts[0] * 60 + parts[1];
		return parts[0];
	}
	const num = Number(s);
	return Number.isFinite(num) ? num : null;
};

const formatClock = (sec: number) => {
	const s = Math.max(0, sec);
	const hh = Math.floor(s / 3600);
	const mm = Math.floor((s % 3600) / 60);
	const ss = Math.floor(s % 60);
	return [hh, mm, ss].map((n) => String(n).padStart(2, "0")).join(":");
};

export function useAudioStream() {
	const env = useRuntimeConfig();
	const route = useRoute();
	const router = useRouter();

	const audioEl = ref<HTMLAudioElement | null>(null);
	const basename = ref<string>("returnofsherlockholmes"); // no extension
	const desiredStart = ref<number | null>(null);

	const src = computed(() => {
		// backend is on another origin; URL is absolute and extensionless
		return `${env.public.apiBaseUrl.replace(/\/$/, "")}/audio/stream/${basename.value}`;
	});

	function bind(el: HTMLAudioElement | null) {
		audioEl.value = el;
		if (!el) return;
		el.preload = "metadata";
		// if there’s a queued start time, seek once metadata is ready
		const once = () => {
			if (desiredStart.value != null) {
				el.currentTime = desiredStart.value;
				desiredStart.value = null;
			}
			el.removeEventListener("loadedmetadata", once);
		};
		el.addEventListener("loadedmetadata", once);
	}

	function play() {
		audioEl.value?.play().catch(() => {});
	}
	function pause() {
		audioEl.value?.pause();
	}

	function seekTo(t: number | string, autoplay = true, syncUrl = false) {
		const secs = typeof t === "number" ? t : parseTime(t);
		if (secs == null || secs < 0) return;

		const el = audioEl.value;
		const doSeek = () => {
			el!.currentTime = secs; // <- THIS triggers Range to backend
			if (autoplay) el!.play().catch(() => {});
			if (syncUrl) router.replace({ query: { ...route.query, t: formatClock(secs) } });
		};

		if (el && el.readyState >= 1)
			doSeek(); // HAVE_METADATA
		else {
			desiredStart.value = secs;
			el?.load(); // fetch metadata so we can seek
			// actual seek happens in 'bind' via loadedmetadata
		}
	}

	function loadTrack(newBasename: string, startAt?: string | number) {
		basename.value = newBasename;
		// switching src resets readyState; queue an initial seek if provided
		const secs = parseTime(startAt as any);
		desiredStart.value = secs == null ? null : secs;
		// The <audio> element will pick up the new :src from `src` computed.
		// We don't call el.src = … here to keep it declarative in the component.
	}

	return { audioRef: audioEl, src, bind, play, pause, seekTo, loadTrack, parseTime };
}

export function useAudioWaveform(instanceId: () => number | null) {
	const env = useRuntimeConfig();

	const response = ref<WaveformData | null>(null);
	const status = ref<"idle" | "pending" | "success" | "error">("idle");
	const error = ref<string | null>(null);
	let abortController: AbortController | null = null;
	let requestSequence = 0;

	const getWaveform = async () => {
		const id = instanceId();
		const sequence = ++requestSequence;
		abortController?.abort();
		abortController = null;
		response.value = null;
		error.value = null;

		if (id == null) {
			status.value = "idle";
			return null;
		}

		const controller = new AbortController();
		abortController = controller;
		status.value = "pending";

		try {
			const waveformUrl = new URL(
				"/audio/waveform/" + String(id),
				env.public.apiBaseUrl,
			).toString();
			const data = await $fetch<unknown>(waveformUrl, {
				method: "GET",
				credentials: "include",
				signal: controller.signal,
			});

			if (controller.signal.aborted || sequence !== requestSequence) return null;

			response.value = parseWaveform(data);
			status.value = "success";
			return response.value;
		} catch (err) {
			if (controller.signal.aborted || sequence !== requestSequence) return null;

			response.value = null;
			error.value = err instanceof Error ? err.message : "Could not load waveform.";
			status.value = "error";
			return null;
		}
	};

	watch(instanceId, () => void getWaveform(), { immediate: true });

	onScopeDispose(() => {
		requestSequence += 1;
		abortController?.abort();
		abortController = null;
	});

	const isPending = computed(() => status.value === "pending");
	const hasError = computed(() => status.value === "error");

	return {
		response,
		status,
		error,
		isPending,
		hasError,
		getWaveform,
	};
}

function parseWaveform(value: unknown): WaveformData {
	if (typeof value !== "object" || value == null) throw new Error("Invalid waveform response.");

	const candidate = value as Record<string, unknown>;
	if (
		candidate.version !== 1 ||
		typeof candidate.duration !== "number" ||
		!Number.isFinite(candidate.duration) ||
		candidate.duration <= 0 ||
		!Array.isArray(candidate.channels)
	) {
		throw new Error("Invalid waveform response.");
	}

	const channels = candidate.channels.slice(0, 2);
	if (
		channels.length === 0 ||
		channels.some(
			(channel) =>
				!Array.isArray(channel) ||
				channel.length === 0 ||
				channel.some((peak) => typeof peak !== "number" || !Number.isFinite(peak)),
		)
	) {
		throw new Error("Invalid waveform channels.");
	}

	const left = channels[0] as Array<number>;
	const right = (channels[1] ?? [...left]) as Array<number>;
	return { version: 1, duration: candidate.duration, channels: [left, right] };
}
