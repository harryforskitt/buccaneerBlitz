#run with docker run -p 5173:5173 containername
FROM node:20
WORKDIR /app
#COPY * /app
RUN npm install --save three
RUN npm install --save-dev vite
RUN npm i vite-plugin-restart -D
WORKDIR /app/src
#RUN mkdir /src
EXPOSE 5173
# RUN npx vite --host 0.0.0.0