/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as THREE from "three";

import type { WebGLContext } from "@/components/geo-map.client.vue";

/**
 * Replicates the "icon-size" expression in MapLibre.
 *
 * "icon-size": [
 *   "interpolate", ["linear"],
 *   ["/", ["ln", ["max", ["get", "answerCount"], 1]], ["ln", 10]],
 *   0,    0.09,
 *   0.5,  0.1,
 *   1,    0.2,
 *   2,    0.3,
 *   3,    0.5
 * ]
 *
 * @param {number} answerCount - The answer count value.
 * @returns {number} - The corresponding scale factor.
 */
function computeScaleFromAnswerCount(answerCount: number) {
	// 1. Compute log base 10 of answerCount (clamp at min 1 to avoid negative or zero)
	const logCount = Math.log(Math.max(answerCount, 1)) / Math.log(10);

	// 2. Define the domain (input) and range (output) breakpoints
	const domain = [0, 0.5, 1, 2, 3];
	const range = [0.09, 0.1, 0.2, 0.3, 0.5];

	// 3. Handle values below the first domain breakpoint
	if (logCount <= domain[0]!) {
		return range[0];
	}

	// 4. Handle values above the last domain breakpoint
	if (logCount >= domain[domain.length - 1]!) {
		return range[range.length - 1];
	}

	// 5. Perform piecewise linear interpolation between breakpoints
	for (let i = 0; i < domain.length - 1; i++) {
		const x0 = domain[i];
		const x1 = domain[i + 1];
		const y0 = range[i];
		const y1 = range[i + 1];

		if (logCount >= x0 && logCount <= x1) {
			const t = (logCount - x0) / (x1 - x0); // Normalized position between x0 and x1
			return y0 + t * (y1 - y0); // Linear interpolation
		}
	}

	// Fallback (shouldn't reach here due to earlier conditions)
	return range[range.length - 1];
}

export const generatePieChartWebGL = (
	data: Array<number>,
	colors: Array<string>,
	size: number,
	context: WebGLContext,
	answerCount: number,
) => {
	const total = data.reduce((sum, value) => sum + value, 0);
	let startAngle = 0;

	// 1. Compute the scale factor matching MapLibre's "icon-size"
	const scaleFactor = computeScaleFromAnswerCount(answerCount) ?? 1;

	// 2. Desired on-screen outline thickness in pixels
	const desiredOnScreenThickness = 1;

	// 3. Invert the scale factor to get texture outline thickness
	const outlineThickness = desiredOnScreenThickness / scaleFactor;

	// DEBGUGGING
	// console.log("total:", total, "scaleFactor:", scaleFactor, "outlineThickness:", outlineThickness);

	const outerRadius = size / 2;
	const innerRadius = outerRadius - outlineThickness;
	// create pie slices with outline
	const pieSlices = data.map((value, index) => {
		const sliceAngle = (value / total) * 2 * Math.PI;

		// inner filled slice
		const innerGeometry = new THREE.CircleGeometry(innerRadius, 32, startAngle, sliceAngle);
		const innerMaterial = new THREE.MeshBasicMaterial({ color: colors[index] });
		const innerSlice = new THREE.Mesh(innerGeometry, innerMaterial);

		// outer outline ring
		const ringGeometry = new THREE.RingGeometry(
			innerRadius,
			outerRadius,
			32,
			1,
			startAngle,
			sliceAngle,
		);
		const outlineMaterial = new THREE.MeshBasicMaterial({
			color: 0x000000, // black outline
			side: THREE.DoubleSide,
		});
		const outlineRing = new THREE.Mesh(ringGeometry, outlineMaterial);

		// group the slice and its outline
		const sliceGroup = new THREE.Group();
		sliceGroup.add(innerSlice);
		sliceGroup.add(outlineRing);

		startAngle += sliceAngle;
		return sliceGroup;
	});

	// add all slices to the scene
	pieSlices.forEach((slice) => context.scene.add(slice));

	// render the scene
	context.renderer.render(context.scene, context.camera);

	// read pixels
	const gl = context.renderer.getContext();
	const pixels = new Uint8Array(size * size * 4);
	gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

	// clean up
	pieSlices.forEach((slice) => context.scene.remove(slice));

	return pixels;
};

export const parseString = (
	input: string,
): { ids: Array<number>; hexcodes: Array<string>; answerCount: number } => {
	const cleanedInput = input.replace(/^id-/, "");

	const parts = cleanedInput.split(";");

	if (parts.length !== 3) {
		throw new Error(`Invalid icon-image format: ${input}`);
	}

	const [chartDataStr, colorsStr, answerCountStr] = parts;

	// Parse chartData
	const ids = chartDataStr?.split("-").map((str) => {
		const num = Number(str);
		return num;
	});

	// Parse colors
	const hexcodes = colorsStr?.split("-").map((str) => {
		if (!/^#?[0-9A-F]{6}$/i.test(str)) {
			throw new Error(`Invalid hex code: ${str}`);
		}
		return str.startsWith("#") ? str : `#${str}`;
	});

	// Parse answerCount
	const answerCount = Number(answerCountStr);

	return { ids: ids ?? [], hexcodes: hexcodes ?? [], answerCount };
};
