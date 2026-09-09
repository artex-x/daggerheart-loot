# An approximation of the GitHub Actions ubuntu-latest runner, for parity runs.
# ubuntu-latest is 24.04; .nvmrc pins node 24.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Two groups: Chrome's runtime libs, and fonts. Fonts are the calibration
# variable - the app declares Inter, -apple-system, Segoe UI, Roboto,
# Helvetica Neue, Arial, sans-serif with no @font-face, so what is installed
# decides what every glyph run measures. Both sides of a parity comparison use
# the same fallback, so the choice mostly cancels; it still moves wrap points.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl xz-utils unzip git \
      fontconfig fonts-liberation fonts-dejavu-core fonts-noto-core \
      fonts-noto-color-emoji fonts-freefont-ttf \
      libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libatspi2.0-0t64 \
      libcairo2 libcups2t64 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0t64 \
      libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 \
      libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ARG NODE_VERSION=24.15.0
RUN curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
      | tar -xJ -C /usr/local --strip-components=1 \
    && node -v && npm -v

# node_modules lives in the image, not in the mount: the host tree carries a
# Windows install, and puppeteer's Chrome download is platform specific.
WORKDIR /deps
COPY package.json package-lock.json ./

# One RUN, deliberately. A failed browser download does NOT fail the install
# step, so splitting these bakes a half-finished /root/.cache/puppeteer into
# the layer - puppeteer then refuses to reinstall over it ("the browser folder
# exists but the executable is missing"), which is how this image failed the
# first time it was built. Chaining makes a failed download fail the build.
RUN npm ci \
    && rm -rf /root/.cache/puppeteer \
    && npx puppeteer browsers install chrome \
    && node -e "Promise.resolve(require('puppeteer').executablePath()).then(p=>{if(!require('fs').existsSync(p))throw new Error('no chrome at '+p);console.log('chrome at',p)})"

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
WORKDIR /app
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
