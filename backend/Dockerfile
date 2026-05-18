FROM node:20-alpine
WORKDIR /app

# Copia dependências
COPY package*.json ./
RUN npm install

# Copia o resto do código
COPY . .

# Gera o cliente do Prisma
RUN npx prisma generate

EXPOSE 3333
# Podes usar "npm start" se tiveres um script de build, 
# ou "npm run dev" se quiseres manter em modo desenvolvimento no servidor.
CMD ["npm", "run", "dev"]