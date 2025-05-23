# This Dockerfile leverages multi-stage builds so
# only necessary build artifacts and resources are
# included in the final image.

# Define Angular major version used by the app, used to install
# corresponding Angular CLI globally.
ARG ANGULAR_MAJOR_VERSION=19

# Enable passing the tag of the Node.js image as a build argument,
# and define a default tag in case the build argument is not passed.
# The Node.js image is used as the build image of the app,
# https://hub.docker.com/_/node/.
ARG NODE_IMAGE_TAG=22-alpine

# Enable passing the tag of the nginx image as a build argument,
# and define a default tag in case the build argument is not passed.
# The nginx image is used as the final image of the app,
# https://hub.docker.com/_/nginx.
ARG NGINX_IMAGE_TAG=1.28.0-alpine

# 1. Create intermediate build image from official Node.js image.
FROM node:${NODE_IMAGE_TAG} AS build
# Redeclare ARG-variable to make it available in this stage.
ARG ANGULAR_MAJOR_VERSION
# Change working directory.
WORKDIR /digital-edition-cms-vincent
# Copy all files to the working directory.
COPY . .
# Install the Angular CLI globally.
RUN npm install -g @angular/cli@${ANGULAR_MAJOR_VERSION}
# Install app dependencies.
RUN npm install
# Build the Angular app.
RUN npm run build

# 2. Create final image from official nginx image.
FROM nginx:${NGINX_IMAGE_TAG} AS final
# Copy the dist/browser folder from the build image to the final, runtime image.
COPY --from=build /digital-edition-cms-vincent/dist/vincent-cms/browser /usr/share/nginx/html
# Copy custom nginx configuration file.
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port 80 to the outside world
EXPOSE 80
# Start nginx server
CMD ["nginx", "-g", "daemon off;"]
