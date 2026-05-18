FROM node:20-alpine
WORKDIR /app

# Copia os ficheiros de dependências
COPY package*.json ./
RUN npm install

# Copia o resto do código
COPY . .

# Argumento para a API (importante para o Next.js build)
ARG NEXT_PUBLIC_API_URL=https://api.smsregulacao.com.br
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Faz o build do projeto
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]