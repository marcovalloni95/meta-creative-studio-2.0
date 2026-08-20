# Immagine con Node + le librerie di sistema che Puppeteer/Chromium richiedono
# per girare in un ambiente headless come Render.
FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Usa il Chromium di sistema invece di farlo riscaricare da Puppeteer (build piu' veloce)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Contesto di build = radice del repo (vedi render.yaml: dockerContext "."),
# cosi' possiamo copiare anche /templates che il backend legge a runtime
# risalendo 4 livelli da dist/templates/loader.js (vedi src/backend/src/templates/loader.ts).
COPY src/backend ./
COPY templates ../templates

RUN npm install && npm run build && npm prune --omit=dev

EXPOSE 4000
CMD ["node", "dist/index.js"]
