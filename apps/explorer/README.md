docker build -t explorer .

docker pull mongo:8.0

docker network create mongo-network

docker run -d --name mongo-server --network mongo-network -p 27017:27017 -v /Users/lpdahito/projects/mongo/data/db:/data/db mongo --replSet rs0 --bind_ip_all

If not done...
rs.initiate()
into docker instance.

If need be:
docker exec -it mongo-server mongosh

Finally:
docker compose up -d