FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && \
    npm install typescript ts-node @types/node

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
