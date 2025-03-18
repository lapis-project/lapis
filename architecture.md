# Architecture

## LAPIS as a meta platform

LAPIS is structured as a **pnpm workspace** and functions as a meta platform for multiple
applications and packages.

## Frontend

Each frontend application is written in Nuxt 3 and provides an interface to interact with a specific
data set (e.g. Lexat21, WBÖ, DWA).

### Lexat21

The LexAT21 project investigates lexical variation in contemporary spoken German in Austria on the
basis of select variables. Its respective data points are visualized using
[MapLibre](https://maplibre.org/). Each point on the map is rendered via
[three.js](https://threejs.org/), in order to deal with the magnitude of pie charts that have to be
shown simultaneously.

All other charts on the website are rendered with [Chart.js](https://www.chartjs.org/) and
[vue-chartjs](https://vue-chartjs.org/).

There is a **dedidacted CMS** powered by [Tiptap](https://tiptap.dev/) to manage and edit
user-generated content on the website. The CMS can only be accessed by authenticated users.

### Code sharing

Since all applications share similar architectures, certain functionalities will be shared through a
[Nuxt Layer](https://nuxt.com/docs/getting-started/layers).

Especially in cases like `shadcn-vue` (where SFCs are copied into the repo), Nuxt Layers come in
handy to prevent duplicate code between applications.
