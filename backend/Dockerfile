#run with --env-file variables.env
FROM python:3-alpine3.16
WORKDIR /app/src
COPY src/* /app/src
RUN pip install -r requirements.txt
EXPOSE 5000
#use no reload to get aspscheduler to work
CMD flask run --debug --host 0.0.0.0 --no-reload