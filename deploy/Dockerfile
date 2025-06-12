FROM python:3.11-slim

# Avoid interactive prompts when installing packages
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Copy requirements from scanner folder
COPY scanner/requirements.txt requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

# Copy the scanner source code into the image
COPY scanner/ scanner/

# Change working directory to scanner code
WORKDIR /app/scanner

# Run the scanner
CMD ["python", "scanner.py"]