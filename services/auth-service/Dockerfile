# services/auth-service/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# (Não vamos compilar o TS para este exemplo simples)
EXPOSE 8001
CMD [ "npm", "start" ]