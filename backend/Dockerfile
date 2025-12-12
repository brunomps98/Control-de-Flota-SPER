# Imagen Base
FROM node:20-alpine

# Nuestro directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
# Primero copiar package.json y package-lock.json
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar todo el resto del codigo
COPY . .

# Exponer el puerto en el que la aplicación correra
EXPOSE 8080

# Comando de inicio de la aplicación
CMD [ "node", "src/server.js" ]