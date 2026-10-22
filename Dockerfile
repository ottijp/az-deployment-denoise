# build stage
FROM node:22 as build

WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build

# execution stage
FROM node:22-alpine
LABEL maintainer "Satoshi SAKAO <ottijp@users.noreply.github.com>"

WORKDIR /app
COPY package.json package-lock.json .
RUN yarn install --production --frozen-lockfile && yarn cache clean
COPY bin/ ./bin
COPY --from=build /app/dist /app/dist

ENV PATH $PATH:/app/bin
ENTRYPOINT ["az-deployment-denoise"]
