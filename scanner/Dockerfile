FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

COPY scanner/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY scanner/ scanner/

WORKDIR /app/scanner

CMD ["python", "scanner.py"]
