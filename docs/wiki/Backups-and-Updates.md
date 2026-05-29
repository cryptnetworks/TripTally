# Backups and Updates

## SQLite Backup

```bash
mkdir -p backups
docker run --rm \
  -v triptally_data:/data \
  -v "$PWD/backups:/backup" \
  alpine sh -c 'cp /data/triptally.db /backup/triptally-$(date +%Y%m%d-%H%M%S).db'
```

## SQLite Restore

Stop SeddleUp before restoring:

```bash
docker stop triptally
docker run --rm \
  -v triptally_data:/data \
  -v "$PWD/backups:/backup" \
  alpine sh -c 'cp /backup/triptally.db /data/triptally.db'
docker start triptally
```

## Update a Single Docker Container

```bash
docker pull ghcr.io/cryptnetworks/triptally:sha-292a632@sha256:9a2387e29e29bf862a056619192a3cf3256b74a5d4fc67e97467321c43957207
docker rm -f triptally
docker run --name triptally \
  -p 3000:3000 \
  -v triptally_data:/app/data \
  --env-file .env \
  ghcr.io/cryptnetworks/triptally:sha-292a632@sha256:9a2387e29e29bf862a056619192a3cf3256b74a5d4fc67e97467321c43957207
```

The startup entrypoint applies database migrations automatically.

## Update Compose Deployment

```bash
docker compose pull
docker compose up -d --build
```

If your Compose deployment builds locally, `--build` rebuilds the app image from the checked-out source.
