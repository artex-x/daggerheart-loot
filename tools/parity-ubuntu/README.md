# Parity on ubuntu, locally

CI is the baseline for every `VISUAL_DEBT` figure (`docs/parity.md`, "Machine
variance"), which used to mean a push and a wait for any number you wanted to
record. This image runs the same suite in the same environment on your own
machine.

## Use

```sh
docker build -t dh-parity:ubuntu24 tools/parity-ubuntu
docker run --rm -v "$PWD:/work:ro" dh-parity:ubuntu24 \
  sh -c 'npm run build && node tests/parity.js "<filter>"'
```

The repository is mounted read-only and copied to `/app` inside the container,
so a run cannot touch your working tree, and `node_modules` comes from the
image - the host's is a Windows install and puppeteer's Chrome is
platform-specific.

## Calibration, and when to redo it

Verified 2026-09-09 against runs `34382722764` and `34383263349`. The four
375px anchor cells - the only states then failing - matched CI **to the
hundredth**:

| cell | container | CI |
|---|---|---|
| `#/tables/voa ~ section anchor @ ru 375` | 11.55 | 11.55 |
| `#/tables/voa ~ section anchor @ en 375` | 10.31 | 10.31 |
| `#/tables/core_item ~ row anchor @ ru 375` | 10.52 | 10.52 |
| `#/tables/core_item ~ row anchor @ en 375` | 9.92 | 9.92 |

So a number from this image may be written into `VISUAL_DEBT`. That permission
depends on the calibration holding, and it is calibrated against a moving
target: GitHub rolls `ubuntu-latest` forward, and Chrome arrives with
puppeteer's version in `package-lock.json`. **Re-run the comparison above after
any runner image change, any puppeteer bump, and before trusting it for a batch
that re-baselines many entries.** If it drifts, CI is still the referee.

It reproduces CI, not what a visitor sees. It is a measuring device for parity
numbers and says nothing about the shipped app on anyone's machine.

## Two things that will bite whoever edits the Dockerfile

- **`unzip` is required.** Chrome ships as a zip; without it the download
  succeeds and extraction fails, leaving a half-finished cache directory that
  puppeteer then refuses to install over ("the browser folder exists but the
  executable is missing"). That is why the install is one chained `RUN` that
  clears the cache first - a failed browser download does not fail `npm ci`, so
  splitting the steps bakes the broken state into a layer.
- **`executablePath()` returns a Promise** in puppeteer 25, which is why the
  verification line wraps it in `Promise.resolve`. A bare `existsSync` on it
  fails on a perfectly good image.
