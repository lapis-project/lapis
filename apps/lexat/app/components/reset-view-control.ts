import type { Map as MaplibreMap } from "maplibre-gl";

export class ResetViewControl {
	protected container: HTMLElement | undefined;
	protected resetButton: HTMLButtonElement | undefined;
	protected map?: MaplibreMap;
	private initialCenter: [number, number];
	private initialZoom: number;

	constructor(initialCenter: [number, number], initialZoom: number) {
		this.initialCenter = initialCenter;
		this.initialZoom = initialZoom;
	}

	onAdd(map: MaplibreMap) {
		this.map = map;
		this.container = document.createElement("div");
		this.container.classList.add("maplibregl-ctrl");
		this.container.classList.add("maplibregl-ctrl-group");
		this.resetButton = document.createElement("button");
		this.resetButton.className = "maplibregl-ctrl-icon maplibregl-ctrl-reset";
		this.resetButton.type = "button";
		this.resetButton.title = "Reset view";
		this.resetButton.addEventListener("click", () => {
			this.map?.jumpTo({
				center: this.initialCenter,
				zoom: this.initialZoom,
				bearing: 0, // Reset rotation
				pitch: 0, // Reset pitch
			});
		});

		this.container.appendChild(this.resetButton);
		return this.container;
	}

	onRemove() {
		if (this.container?.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
		this.map = undefined;
	}
}
