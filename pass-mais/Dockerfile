FROM node:18

# Define o diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos de dependência primeiro (melhora o cache do Docker)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código fonte (depois do npm install pra manter cache)
COPY . .

# Gera o build da aplicação
RUN npm run build

# Expõe a porta padrão do Next.js
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
