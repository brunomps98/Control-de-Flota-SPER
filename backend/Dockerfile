# 1. IMAGEN BASE
FROM node:20-alpine

# 2. DIRECTORIO DE TRABAJO
# Creamos y nos movemos a un directorio dentro del contenedor
WORKDIR /usr/src/app

# 3. COPIAR ARCHIVOS DE DEPENDENCIAS
# Copiamos package.json y package-lock.json PRIMERO.
COPY package.json package-lock.json ./

# 4. INSTALAR DEPENDENCIAS
RUN npm ci --only=production

# 5. COPIAR EL RESTO DEL CÓDIGO
COPY . .

# 6. EXPONER EL PUERTO
EXPOSE 8080

# 7. COMANDO DE INICIO
CMD [ "node", "src/server.js" ]