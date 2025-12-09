FROM node:lts-alpine3.22
# Define o diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos de dependência primeiro (melhora o cache do Docker)
COPY package*.json ./

# Instala todas as dependências para build (inclui devDependencies como TypeScript)
RUN npm ci

# Copia o restante do código fonte (depois do npm install pra manter cache)
COPY . .

# Gera o build da aplicação
RUN npm run build

# Remove devDependencies para imagem final mais enxuta
RUN npm prune --production && npm cache clean --force

# Expõe a porta padrão do Next.js
EXPOSE 3000

# Define ambiente de produção e comando para iniciar a aplicação
ENV NODE_ENV=production
CMD ["npm", "start"]