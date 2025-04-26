# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install

# Install additional dependencies using apk (Alpine's package manager)
# Add git as well, needed for fetching docs and pushing results
RUN apk add --no-cache \
    pandoc \
    git

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (for webhook listener)
EXPOSE 3000

# Define the command to run the application (make sure this is the desired default command)
CMD [ "node", "src/server.js" ] # Runs the webhook server by default 