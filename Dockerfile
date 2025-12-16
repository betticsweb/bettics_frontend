# FROM node:16-alpine3.17 AS angular
# WORKDIR /app
# COPY package*.json ./
# RUN npm install --force

# COPY . .
# RUN echo "$ENVIROMENT"
# # RUN npm run heroku-prebuild

# # RUN if [ "$ENVIROMENT" = "production" ] ; then npm run build-prod ; else npm run build ; fi
# RUN npm run build

# FROM nginx:1.17.1-alpine

# COPY --from=angular /app/dist/front-solbet /usr/share/nginx/html

# EXPOSE 3000

FROM node:16-alpine3.17 AS angular

WORKDIR /app
RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json /usr/src/app/

RUN npm install  --force

COPY . /usr/src/app

EXPOSE 3000

CMD [ "npm", "start" ]