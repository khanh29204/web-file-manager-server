# ---- Build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
COPY views ./views
COPY public ./public
RUN yarn build

# ---- Runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean
COPY --from=build /app/dist ./dist
COPY views ./views
COPY public ./public
RUN mkdir -p /app/drive && chown -R node:node /app
USER node
VOLUME /app/drive
EXPOSE 2345
CMD ["node", "dist/app.js"]
