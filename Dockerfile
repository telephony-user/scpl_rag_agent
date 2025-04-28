# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install

# Install additional dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
 && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (for webhook listener)
EXPOSE 3000

# Define the command to run the application (make sure this is the desired default command)
CMD [ "node", "src/server.js" ] # Runs the webhook server by default 