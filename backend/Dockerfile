# backend/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# system deps (if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# copy and install pip deps
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# copy project
COPY . /app

# make entrypoint executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["./entrypoint.sh"]

