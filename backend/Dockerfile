FROM node:20-alpine
WORKDIR /app

# Copia dependências
COPY package*.json ./
RUN npm install

# Copia o resto do código
COPY . .

# Gera o cliente do Prisma
RUN npx prisma generate

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 3333
ENTRYPOINT ["sh", "/docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]