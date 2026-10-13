/**
 * Indicator kriging for categorical variant data.
 *
 * Every category (one colour on the map) is encoded as an indicator share per location. All
 * categories share one exponential variogram, so the ordinary kriging system only has to be
 * factored once ("dual kriging"): `A = M⁻¹ · [Z; 0]`, and every grid cell is evaluated as `ẑ(x) =
 * [γ(x); 1]ᵀ · A`. Because the indicator shares of a location sum to 1 and ordinary kriging weights
 * sum to 1, the estimates of all categories sum to 1 as well; only values outside [0, 1] (from
 * negative weights) need to be clipped and renormalised.
 *
 * For more infos about indicator kriging, see https://geostatisticslessons.com/lessons/mikoverview
 *
 * References:
 *
 * - Journel, A. G. (1983). Nonparametric estimation of spatial distributions. Mathematical Geology
 *   15(3), 445–468. https://doi.org/10.1007/BF01031292 – indicator coding; one variogram shared by
 *   all categories is known as median indicator kriging.
 * - Goovaerts, P. (1997). Geostatistics for Natural Resources Evaluation. Oxford University Press –
 *   indicator kriging of categorical variables, including the order-relation corrections (clipping
 *   to [0, 1] and renormalising).
 * - Deutsch, C. V. & Journel, A. G. (1998). GSLIB: Geostatistical Software Library and User's Guide,
 *   2nd ed. Oxford University Press – Fortran reference implementations (e.g. `ik3d`).
 * - Webster, R. & Oliver, M. A. (2007). Geostatistics for Environmental Scientists, 2nd ed. Wiley –
 *   an accessible introduction to variograms and kriging.
 *
 * Developed in collaboration with Claude Opus 5.5.
 */

export interface KrigingSample {
	coordinates: [number, number];
	shares: Array<number>;
}

export interface KrigingInput {
	categories: Array<string>;
	samples: Array<KrigingSample>;
	/** `[west, south, east, north]` in degrees. */
	bounds: [number, number, number, number];
	/** Number of kriged grid columns; rows follow from the Mercator aspect ratio. */
	columns: number;
	/**
	 * Output pixels per kriged cell along each axis. Probabilities are interpolated on the GPU before
	 * picking the dominant category, so boundaries between categories stay smooth.
	 */
	upsample?: number;
	/** Polygon rings (`[longitude, latitude]`, even-odd rule); cells outside are not estimated. */
	clip?: Array<Array<[number, number]>>;
}

export interface KrigingResult {
	categories: Array<string>;
	bounds: [number, number, number, number];
	width: number;
	height: number;
	/** Index of the dominant category per pixel, row-major from the north-west corner. */
	dominant: Uint8Array;
	/** Probability of the dominant category minus that of the runner-up, per pixel; 0 outside `clip`. */
	margin: Float32Array;
}

export interface Variogram {
	nugget: number;
	sill: number;
	range: number;
}

const EARTH_RADIUS = 6_371_008.8;
// Above this many locations, samples are binned to keep the computation (O(n³)) solve fast.
const MAX_LOCATIONS = 1000;
const LAG_COUNT = 15;

export interface KrigingLocation {
	x: number;
	y: number;
	shares: Float64Array;
}

function toRadians(degrees: number) {
	return (degrees * Math.PI) / 180;
}

function mercatorY(latitude: number) {
	return Math.log(Math.tan(Math.PI / 4 + toRadians(latitude) / 2));
}

function inverseMercatorY(y: number) {
	return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
}

function createProjection(referenceLatitude: number) {
	const scaleX = EARTH_RADIUS * Math.cos(toRadians(referenceLatitude));
	return (longitude: number, latitude: number): [number, number] => [
		toRadians(longitude) * scaleX,
		toRadians(latitude) * EARTH_RADIUS,
	];
}

/**
 * Merges samples into cells of `cellSize` metres (0 = identical coordinates only) and renormalises
 * their shares. Duplicate locations would make the kriging matrix singular.
 */
function mergeLocations(locations: Array<KrigingLocation>, cellSize: number) {
	const cells = new Map<string, { x: number; y: number; count: number; shares: Float64Array }>();
	for (const location of locations) {
		const key =
			cellSize > 0
				? `${Math.floor(location.x / cellSize)}:${Math.floor(location.y / cellSize)}`
				: `${location.x}:${location.y}`;
		let cell = cells.get(key);
		if (!cell) {
			cell = { x: 0, y: 0, count: 0, shares: new Float64Array(location.shares.length) };
			cells.set(key, cell);
		}
		cell.x += location.x;
		cell.y += location.y;
		cell.count++;
		location.shares.forEach((share, k) => (cell.shares[k]! += share));
	}
	return [...cells.values()].map(({ x, y, count, shares }) => {
		const total = shares.reduce((sum, share) => sum + share, 0);
		return {
			x: x / count,
			y: y / count,
			shares: shares.map((share) => share / total),
		};
	});
}

function insideColumns(
	rings: Array<Array<[number, number]>>,
	latitude: number,
	west: number,
	east: number,
	width: number,
) {
	const crossings: Array<number> = [];
	for (const ring of rings) {
		for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
			const [x1, y1] = ring[i]!;
			const [x2, y2] = ring[j]!;
			if (y1 > latitude !== y2 > latitude)
				crossings.push(x1 + ((latitude - y1) / (y2 - y1)) * (x2 - x1));
		}
	}
	crossings.sort((a, b) => a - b);
	const inside = new Uint8Array(width);
	for (let c = 0; c + 1 < crossings.length; c += 2) {
		const from = Math.floor(((crossings[c]! - west) / (east - west)) * width) - 1;
		const to = Math.ceil(((crossings[c + 1]! - west) / (east - west)) * width) + 1;
		inside.fill(1, Math.max(0, from), Math.min(width, to));
	}
	return inside;
}

/**
 * Exponential variogram, analogous to PyKrige:
 * https://github.com/GeoStat-Framework/PyKrige/blob/main/src/pykrige/variogram_models.py#L48
 */
function exponentialVariogram({ nugget, sill, range }: Variogram) {
	const factor = -3 / range;
	return (distance: number) =>
		distance === 0 ? 0 : nugget + sill * (1 - Math.exp(factor * distance));
}

/**
 * Fits a shared exponential variogram to the pooled indicator semivariance `½ Σₖ (Iₖ(i) − Iₖ(j))²`
 * by weighted least squares over a grid of candidate ranges.
 *
 * Lags are weighted by their number of point pairs `N_j`, like `fit.method = 1` in gstat's
 * `fit.variogram` (https://github.com/r-spatial/gstat/blob/main/R/fit.variogram.R). Cressie, N.
 * (1985). Fitting variogram models by weighted least squares. Mathematical Geology 17(5), 563–586
 * (https://doi.org/10.1007/BF01032109) discusses this and the `N_j / γ(h_j)²` weights it
 * recommends.
 */
export function fitVariogram(locations: Array<KrigingLocation>): Variogram {
	const xs = locations.map((l) => l.x);
	const ys = locations.map((l) => l.y);
	const maxDistance =
		Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2;
	if (maxDistance === 0) return { nugget: 0, sill: 1, range: 1 };

	const lagWidth = maxDistance / LAG_COUNT;
	const sums = new Float64Array(LAG_COUNT);
	const distances = new Float64Array(LAG_COUNT);
	const counts = new Float64Array(LAG_COUNT);

	for (let i = 0; i < locations.length; i++) {
		const a = locations[i]!;
		for (let j = i + 1; j < locations.length; j++) {
			const b = locations[j]!;
			const distance = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
			const lag = Math.floor(distance / lagWidth);
			if (lag >= LAG_COUNT) continue;
			let semivariance = 0;
			for (let k = 0; k < a.shares.length; k++) {
				const difference = a.shares[k]! - b.shares[k]!;
				semivariance += difference * difference;
			}
			sums[lag]! += semivariance / 2;
			distances[lag]! += distance;
			counts[lag]!++;
		}
	}

	const lags = [...counts.keys()]
		.filter((lag) => counts[lag]! > 0)
		.map((lag) => ({
			distance: distances[lag]! / counts[lag]!,
			gamma: sums[lag]! / counts[lag]!,
			weight: counts[lag]!,
		}));
	if (lags.length === 0) return { nugget: 0, sill: 1, range: maxDistance };

	let best: Variogram & { error: number } = {
		nugget: 0,
		sill: 1,
		range: maxDistance,
		error: Infinity,
	};
	for (let step = 0; step < 40; step++) {
		const range = (maxDistance / 50) * Math.pow(100, step / 39);
		const fs = lags.map((lag) => 1 - Math.exp((-3 * lag.distance) / range));

		// Weighted linear least squares for γ = nugget + sill · f, both non-negative.
		let sw = 0,
			sf = 0,
			sg = 0,
			sff = 0,
			sfg = 0;
		lags.forEach((lag, l) => {
			const f = fs[l]!;
			sw += lag.weight;
			sf += lag.weight * f;
			sg += lag.weight * lag.gamma;
			sff += lag.weight * f * f;
			sfg += lag.weight * f * lag.gamma;
		});
		const determinant = sw * sff - sf * sf;
		let nugget = determinant > 0 ? (sg * sff - sf * sfg) / determinant : 0;
		let sill = determinant > 0 ? (sw * sfg - sf * sg) / determinant : sfg / sff;
		if (nugget < 0) {
			nugget = 0;
			sill = sfg / sff;
		}
		if (sill <= 0) continue;

		const error = lags.reduce((sum, lag, l) => {
			const residual = lag.gamma - nugget - sill * fs[l]!;
			return sum + lag.weight * residual * residual;
		}, 0);
		if (error < best.error) best = { nugget, sill, range, error };
	}

	return { nugget: best.nugget, sill: best.sill, range: best.range };
}

/**
 * Solves `M · X = B` in place for all columns of B (row-major, `columns` wide) via LU with partial
 * pivoting.
 */
function solve(matrix: Float64Array, size: number, rhs: Float64Array, columns: number) {
	for (let col = 0; col < size; col++) {
		let pivot = col;
		let pivotValue = Math.abs(matrix[col * size + col]!);
		for (let row = col + 1; row < size; row++) {
			const value = Math.abs(matrix[row * size + col]!);
			if (value > pivotValue) {
				pivot = row;
				pivotValue = value;
			}
		}
		if (pivotValue === 0) throw new Error("Kriging matrix is singular");
		if (pivot !== col) {
			for (let k = 0; k < size; k++) {
				const tmp = matrix[col * size + k]!;
				matrix[col * size + k] = matrix[pivot * size + k]!;
				matrix[pivot * size + k] = tmp;
			}
			for (let k = 0; k < columns; k++) {
				const tmp = rhs[col * columns + k]!;
				rhs[col * columns + k] = rhs[pivot * columns + k]!;
				rhs[pivot * columns + k] = tmp;
			}
		}
		const diagonal = matrix[col * size + col]!;
		for (let row = col + 1; row < size; row++) {
			const factor = matrix[row * size + col]! / diagonal;
			if (factor === 0) continue;
			const rowOffset = row * size;
			const colOffset = col * size;
			for (let k = col + 1; k < size; k++)
				matrix[rowOffset + k]! -= factor * matrix[colOffset + k]!;
			for (let k = 0; k < columns; k++) rhs[row * columns + k]! -= factor * rhs[col * columns + k]!;
		}
	}
	for (let row = size - 1; row >= 0; row--) {
		const diagonal = matrix[row * size + row]!;
		for (let k = 0; k < columns; k++) {
			let value = rhs[row * columns + k]!;
			for (let j = row + 1; j < size; j++) value -= matrix[row * size + j]! * rhs[j * columns + k]!;
			rhs[row * columns + k] = value / diagonal;
		}
	}
}

/**
 * Solves the ordinary kriging system once for all categories and returns an estimator that writes
 * the raw (unclipped) estimate of every category at `(x, y)` into `estimate`.
 *
 * The system matches PyKrige's `OrdinaryKriging._get_kriging_matrix`
 * (https://github.com/GeoStat-Framework/PyKrige/blob/main/src/pykrige/ok.py), which
 * `tests/kriging.test.ts` checks against. Evaluating `[γ(x); 1]ᵀ · A` per cell is dual kriging:
 * Galli, A., Murillo, E. & Thomann, J. (1984). Dual kriging – its properties and its uses in direct
 * contouring. In Verly, G. et al. (eds.), Geostatistics for Natural Resources Characterization,
 * Reidel. https://doi.org/10.1007/978-94-009-3699-7
 */
export function createKrigingModel(
	locations: Array<KrigingLocation>,
	variogramParameters: Variogram,
	categoryCount: number,
) {
	const variogram = exponentialVariogram(variogramParameters);
	const n = locations.length;
	const size = n + 1;

	// Ordinary kriging system [Γ 1; 1ᵀ 0] with one right-hand side [Iₖ; 0] per category.
	const matrix = new Float64Array(size * size);
	const weights = new Float64Array(size * categoryCount);
	for (let i = 0; i < n; i++) {
		const a = locations[i]!;
		for (let j = i + 1; j < n; j++) {
			const b = locations[j]!;
			const gamma = variogram(Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2));
			matrix[i * size + j] = gamma;
			matrix[j * size + i] = gamma;
		}
		matrix[i * size + n] = 1;
		matrix[n * size + i] = 1;
		for (let k = 0; k < categoryCount; k++) weights[i * categoryCount + k] = a.shares[k]!;
	}
	solve(matrix, size, weights, categoryCount);

	const xs = Float64Array.from(locations, (l) => l.x);
	const ys = Float64Array.from(locations, (l) => l.y);
	return (x: number, y: number, estimate: Float64Array) => {
		for (let k = 0; k < categoryCount; k++) estimate[k] = weights[n * categoryCount + k]!;
		for (let i = 0; i < n; i++) {
			const dx = x - xs[i]!;
			const dy = y - ys[i]!;
			const gamma = variogram(Math.sqrt(dx * dx + dy * dy));
			const offset = i * categoryCount;
			for (let k = 0; k < categoryCount; k++) estimate[k]! += gamma * weights[offset + k]!;
		}
	};
}

export function krige({
	categories,
	samples,
	bounds,
	columns,
	upsample = 1,
	clip,
}: KrigingInput): KrigingResult {
	const [west, south, east, north] = bounds;
	const project = createProjection((south + north) / 2);
	const categoryCount = categories.length;

	let locations: Array<KrigingLocation> = mergeLocations(
		samples.map(({ coordinates, shares }) => {
			const [x, y] = project(...coordinates);
			return { x, y, shares: Float64Array.from(shares) };
		}),
		0,
	);
	for (let cellSize = 1000; locations.length > MAX_LOCATIONS; cellSize *= 1.5)
		locations = mergeLocations(locations, cellSize);

	const topNorth = mercatorY(north);
	const bottomSouth = mercatorY(south);
	const width = columns;
	const height = Math.max(
		1,
		Math.round((columns * (topNorth - bottomSouth)) / toRadians(east - west)),
	);
	const result = {
		categories,
		bounds,
		width: width * upsample,
		height: height * upsample,
		dominant: new Uint8Array(width * height * upsample ** 2),
		margin: new Float32Array(width * height * upsample ** 2),
	};

	if (categoryCount <= 1 || locations.length < 2) {
		result.margin.fill(1);
		return result;
	}

	// Probabilities per category on the kriged grid; NaN marks cells outside the clip polygon.
	const probabilities = new Float32Array(width * height * categoryCount).fill(Number.NaN);
	const evaluate = createKrigingModel(locations, fitVariogram(locations), categoryCount);
	const estimate = new Float64Array(categoryCount);
	for (let row = 0; row < height; row++) {
		const latitude = inverseMercatorY(topNorth - ((row + 0.5) / height) * (topNorth - bottomSouth));
		const inside = clip ? insideColumns(clip, latitude, west, east, width) : null;
		for (let column = 0; column < width; column++) {
			if (inside && !inside[column]) continue;
			const longitude = west + ((column + 0.5) / width) * (east - west);
			const [x, y] = project(longitude, latitude);

			evaluate(x, y, estimate);

			// Order-relation correction: clip negative estimates and renormalise (Goovaerts 1997).
			let total = 0;
			for (let k = 0; k < categoryCount; k++) total += estimate[k] = Math.max(0, estimate[k]!);
			const offset = (row * width + column) * categoryCount;
			for (let k = 0; k < categoryCount; k++)
				probabilities[offset + k] = total > 0 ? estimate[k]! / total : 0;
		}
	}

	// Interpolate probabilities rather than colours, so that boundaries follow the smooth line
	// where two categories are equally likely instead of the outline of the kriged cells.
	const pixel = new Float64Array(categoryCount);
	let weight = 0;
	function addCell(cell: number, cellWeight: number) {
		const offset = cell * categoryCount;
		if (cellWeight === 0 || Number.isNaN(probabilities[offset]!)) return;
		for (let k = 0; k < categoryCount; k++) pixel[k]! += cellWeight * probabilities[offset + k]!;
		weight += cellWeight;
	}

	for (let row = 0; row < result.height; row++) {
		const v = Math.min(Math.max((row + 0.5) / upsample - 0.5, 0), height - 1);
		const row0 = Math.floor(v);
		const row1 = Math.min(row0 + 1, height - 1);
		const ty = v - row0;
		for (let column = 0; column < result.width; column++) {
			const u = Math.min(Math.max((column + 0.5) / upsample - 0.5, 0), width - 1);
			const column0 = Math.floor(u);
			const column1 = Math.min(column0 + 1, width - 1);
			const tx = u - column0;

			pixel.fill(0);
			weight = 0;
			addCell(row0 * width + column0, (1 - tx) * (1 - ty));
			addCell(row0 * width + column1, tx * (1 - ty));
			addCell(row1 * width + column0, (1 - tx) * ty);
			addCell(row1 * width + column1, tx * ty);
			if (weight === 0) continue;

			let first = 0;
			let second = 0;
			let best = 0;
			for (let k = 0; k < categoryCount; k++) {
				const probability = pixel[k]! / weight;
				if (probability > first) {
					second = first;
					first = probability;
					best = k;
				} else if (probability > second) {
					second = probability;
				}
			}
			const index = row * result.width + column;
			result.dominant[index] = best;
			result.margin[index] = first - second;
		}
	}

	return result;
}
