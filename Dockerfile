# Frontend Dockerfile for React/Vite application
#
# To build the image:
# docker build -t docker-sample-frontend .
#
# To run the container:
# docker run -p 5173:5173 docker-sample-frontend
#
# To run with environment variables:
# docker run -p 5173:5173 -e VITE_API_URL=http://localhost:3000 docker-sample-frontend
#
# Access the application at: http://localhost:5173

# Use Node.js 24 as the base image
FROM node:24

# Set the working directory inside the container
WORKDIR /app

# curl is required by the backend health check
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*


# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose port 5173 for Vite development server
EXPOSE 3000
EXPOSE 5173

# Start the Vite development server
CMD ["npm", "run", "dev"]