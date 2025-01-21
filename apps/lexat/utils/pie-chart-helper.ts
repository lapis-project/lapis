/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as THREE from "three";

import type { WebGLContext } from "@/components/geo-map.client.vue";

export const generatePieChartWebGL = (
	data: Array<number>,
	colors: Array<string>,
	size: number,
	context: WebGLContext,
) => {
	const total = data.reduce((sum, value) => sum + value, 0);
	let startAngle = 0;

	// calculate outline thickness (5% of the adjusted size)
	const outlineThickness = size * 0.05;

	// create outer circle (outline)
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

export const parseString = (input: string): { ids: Array<number>; hexcodes: Array<string> } => {
	// Remove "-id" from the start of the string
	const cleanedInput = input.replace(/^id-/, "");

	// Split the string at the first occurrence of '#'
	const firstHashIndex = cleanedInput.indexOf("#");
	const idPart = cleanedInput.slice(0, firstHashIndex);
	const hexPart = cleanedInput.slice(firstHashIndex);
	// console.log("hexPart", hexPart);

	// Split the idPart by '-'
	const idStrings = idPart.split("-");

	// Convert the ids from strings to numbers
	const ids = idStrings.map(Number);

	// Extract the hexcodes
	const hexcodes = hexPart.split("-").map((code) => code);

	return {
		ids,
		hexcodes,
	};
};
