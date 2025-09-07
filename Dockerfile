dockerfile
# Use Node 18 as base
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Expose port (Railway expects this)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
```
