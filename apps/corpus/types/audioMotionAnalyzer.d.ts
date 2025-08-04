declare module "~/public/index.js" {
	interface GradientStop {
		stop: number;
		color: string;
	}

	interface AudioMotionOptions {
		source?: AudioNode | HTMLMediaElement | null;
		gradient?: string | Array<GradientStop>;
		mode?: number;
		barSpace?: number;
		smoothing?: number;
		mirror?: number;
		showBgColor?: boolean;
		bgAlpha?: number;
		alphaBars?: boolean;
		outlineBars?: boolean;
		ledBars?: boolean;
		roundBars?: boolean;
		showScaleX?: boolean;
		reflexRatio?: number;
		height?: number;
		frequencyScale?: "log" | "linear";
		showPeaks?: boolean;
		width?: number;
	}

	export default class AudioMotionAnalyzer {
		static registerGradient(name: string, gradient: Array<GradientStop>): void;

		constructor(container: HTMLElement, options?: AudioMotionOptions);

		connectInput(audioSource: AudioNode | HTMLMediaElement): void;
		disconnectInput(): void;
		destroy(): void;
	}
}
