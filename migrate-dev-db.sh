# migrate-dev-db.sh
#!/bin/bash

docker exec -i oeaw-postgres-2 pg_dump -U lapis_dev lapis_dev -t user_account > user_account_dump.dump
docker exec -i oeaw-postgres-2 psql -U lapis_dev lapis_dev < ./db/lapis_dump.sql
docker exec -i oeaw-postgres-2 psql -U lapis_dev lapis_dev < ./user_account_dump.dump
rm user_account_dump.dump
