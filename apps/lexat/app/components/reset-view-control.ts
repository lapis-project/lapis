import type { Map as MaplibreMap } from "maplibre-gl";

export class ResetViewControl {
	protected container: HTMLElement | undefined;
	protected exportButton: HTMLButtonElement | undefined;
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
		this.exportButton = document.createElement("button");
		this.exportButton.className = "maplibregl-ctrl-icon maplibregl-ctrl-reset";
		this.exportButton.type = "button";
		this.exportButton.title = "Reset view";
		this.exportButton.onclick = () => {
			this.map?.jumpTo({
				center: this.initialCenter,
				zoom: this.initialZoom,
				bearing: 0, // Reset rotation
				pitch: 0, // Reset pitch
			});
		};

		this.container.appendChild(this.exportButton);
		return this.container;
	}

	onRemove() {
		if (this.container?.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
		this.map = undefined;
	}
}
