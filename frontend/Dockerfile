#run with docker run -p 5173:5173 containername
FROM node:16
WORKDIR /app
COPY * /app
RUN npm install --save three
RUN npm install --save-dev vite
EXPOSE 5173
CMD npx vite --host 0.0.0.0