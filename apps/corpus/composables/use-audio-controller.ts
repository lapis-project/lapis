// composables/use-audio-controller.ts
import { ref, computed } from "vue";
import { useRuntimeConfig, useRoute, useRouter } from "#imports";

const parseTime = (raw?: string | number | null): number | null => {
	if (raw == null) return null;
	if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
	const s = decodeURIComponent(String(raw).trim());

	// ISO 8601 duration
	const m = s.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
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

export function useAudioController() {
	const env = useRuntimeConfig();
	const route = useRoute();
	const router = useRouter();

	const audioEl = ref<HTMLAudioElement | null>(null);
	const basename = ref<string>("returnofsherlockholmes"); // no extension
	const desiredStart = ref<number | null>(null);

	const src = computed(() => {
		// backend is on another origin; URL is absolute and extensionless
		return `${env.public.apiBaseUrl.replace(/\/$/, "")}/audio/${basename.value}`;
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
