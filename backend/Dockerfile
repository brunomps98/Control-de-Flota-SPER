# IMAGEN BASE
FROM node:20-alpine

# DIRECTORIO DE TRABAJO
WORKDIR /usr/src/app

# COPIAR ARCHIVOS DE DEPENDENCIAS
# Copiamos package.json y package-lock.json PRIMERO
COPY package.json package-lock.json ./

# INSTALAR DEPENDENCIAS
RUN npm ci --only=production

# COPIAR EL RESTO DEL CÓDIGO
COPY . .

# EXPONER EL PUERTO
EXPOSE 8080

# COMANDO DE INICIO
CMD [ "node", "src/server.js" ]