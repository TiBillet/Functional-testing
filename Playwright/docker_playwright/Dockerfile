FROM ubuntu:22.04

RUN apt-get update

RUN apt-get install curl nano iputils-ping gcc g++ make apt-transport-https -yq \
    && curl -sL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@9.2.0

WORKDIR /Playwright-tests

RUN npm init -y \
    && npm install @playwright/test@1.29.1 \
    && npx playwright install \
    && npx playwright install-deps \
    && npm install dotenv@16.0.3 \
    && npm install moment@2.29.4 \
