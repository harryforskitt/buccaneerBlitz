#run with --env-file variables.env
FROM python:3-alpine3.16
WORKDIR /app/src
COPY src/* /app/src
RUN pip install -r requirements.txt
EXPOSE 5000
CMD flask run --debug --host 0.0.0.0