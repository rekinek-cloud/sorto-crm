# Szybkie Komendy Restart - Frontend/Backend

## Restart Frontend (po zmianach konfiguracji)

```bash
# 1. Restart kontenera
docker restart crm-frontend-v1

# 2. Sprawdź logi
docker logs crm-frontend-v1 --tail 20

# 3. Test aplikacji
curl -s -o /dev/null -w "%{http_code}" http://91.99.50.80/crm/
```

## Restart Backend (po zmianach kodu)

```bash
# 1. Restart kontenera
docker restart crm-backend-v1

# 2. Sprawdź logi
docker logs crm-backend-v1 --tail 20

# 3. Test API
curl -s -o /dev/null -w "%{http_code}" http://91.99.50.80/crm/api/v1/
```

## Restart Nginx (po zmianach konfiguracji)

```bash
# 1. Test konfiguracji
nginx -t

# 2. Restart nginx
systemctl reload nginx

# 3. Test routingu
curl -s -o /dev/null -w "%{http_code}" http://91.99.50.80/crm/
```

## Pełny Restart (wszystko)

```bash
# 1. Restart wszystkich kontenerów
docker restart crm-frontend-v1 crm-backend-v1

# 2. Restart nginx
systemctl reload nginx

# 3. Test kompletnej aplikacji
curl -s -o /dev/null -w "%{http_code}" http://91.99.50.80/crm/
curl -s -o /dev/null -w "%{http_code}" http://91.99.50.80/crm/api/v1/
```

## Sprawdzenie Statusu

```bash
# Status kontenerów
docker ps | grep crm

# Status nginx
systemctl status nginx

# Test frontendu
curl -I http://91.99.50.80/crm/

# Test backendu
curl -I http://91.99.50.80/crm/api/v1/
```

## W przypadku problemów

```bash
# Sprawdź logi
docker logs crm-frontend-v1 --tail 50
docker logs crm-backend-v1 --tail 50

# Sprawdź nginx error log
tail -50 /var/log/nginx/error.log

# Sprawdź porty
netstat -tlnp | grep -E "(9025|3003)"
```