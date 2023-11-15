FROM python:3-alpine3.16
WORKDIR /app
COPY app.py requirements.txt /app/
RUN pip install -r requirements.txt
EXPOSE 5000
CMD flask run --host 0.0.0.0