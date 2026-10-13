"""Generates `kriging-reference.json`, the PyKrige reference for `tests/kriging.test.ts`.

Run from `apps/lexvad` with PyKrige installed (`pip install pykrige`):

    python tests/fixtures/generate-kriging-reference.py

Uses a pilot question, merges duplicate coordinates into indicator shares, projects them with
the same local equirectangular projection as `app/utils/kriging.ts`, and kriges each category
separately with PyKrige's ordinary kriging and fixed exponential variograms.
"""

import json
import math
from collections import defaultdict
from pathlib import Path

import numpy as np
import pykrige
from pykrige.ok import OrdinaryKriging

QUESTION = "Gießkanne"
EARTH_RADIUS = 6_371_008.8
REFERENCE_LATITUDE = 47.5
VARIOGRAMS = [
    {"nugget": 0.1, "sill": 0.45, "range": 60_000},
    {"nugget": 0.0, "sill": 0.6, "range": 120_000},
]

root = Path(__file__).resolve().parents[2]
rows = json.loads((root / "app/assets/data/DWA_Pilot_Variablen.json").read_text())
rows = [row for row in rows if row["Item"] == QUESTION]


def project(longitude, latitude):
    scale_x = EARTH_RADIUS * math.cos(math.radians(REFERENCE_LATITUDE))
    return math.radians(longitude) * scale_x, math.radians(latitude) * EARTH_RADIUS


categories = sorted(
    {v.strip() for row in rows for v in row["Benennungsvariante"].split(";")}
)
merged = defaultdict(lambda: np.zeros(len(categories)))
for row in rows:
    variants = [v.strip() for v in row["Benennungsvariante"].split(";")]
    key = (float(row["Longitude"]), float(row["Latitude"]))
    for variant in variants:
        merged[key][categories.index(variant)] += 1 / len(variants)

locations = []
for (longitude, latitude), shares in merged.items():
    x, y = project(longitude, latitude)
    locations.append({"x": x, "y": y, "shares": (shares / shares.sum()).tolist()})

xs = np.array([location["x"] for location in locations])
ys = np.array([location["y"] for location in locations])
shares = np.array([location["shares"] for location in locations])

# Random points across the data extent, plus a few exactly on sample locations.
rng = np.random.default_rng(42)
query_xs = np.concatenate([rng.uniform(xs.min(), xs.max(), 40), xs[:5]])
query_ys = np.concatenate([rng.uniform(ys.min(), ys.max(), 40), ys[:5]])

cases = []
for variogram in VARIOGRAMS:
    estimates = []
    for k in range(len(categories)):
        model = OrdinaryKriging(
            xs,
            ys,
            shares[:, k],
            variogram_model="exponential",
            # PyKrige's exponential model is psill · (1 − exp(−3h / range)) + nugget. The list form
            # would take the *full* sill, so pass the partial sill explicitly.
            variogram_parameters={
                "psill": variogram["sill"],
                "range": variogram["range"],
                "nugget": variogram["nugget"],
            },
        )
        z, _ = model.execute("points", query_xs, query_ys)
        estimates.append(np.asarray(z))
    cases.append(
        {
            "variogram": variogram,
            "queries": [
                {"x": x, "y": y, "estimate": [float(e[i]) for e in estimates]}
                for i, (x, y) in enumerate(zip(query_xs.tolist(), query_ys.tolist()))
            ],
        }
    )

output = {
    "generator": f"pykrige {pykrige.__version__}",
    "question": QUESTION,
    "categories": categories,
    "locations": locations,
    "cases": cases,
}
(Path(__file__).parent / "kriging-reference.json").write_text(json.dumps(output) + "\n")
print(f"{len(locations)} locations, {len(categories)} categories, {len(cases)} variograms")
