# ShopFlow — Microservices on Kubernetes

A production-style e-commerce backend built with a microservices architecture, containerised with Docker, and deployed to Kubernetes. Built from scratch as a full-stack infrastructure project covering service design, inter-service communication, event-driven messaging, and cloud-native deployment.

---

## Architecture Overview

```
                        ┌─────────────────────────────────────┐
  Client Request        │         Nginx Ingress Controller      │
  ─────────────────────►│         (shopflow.local)              │
                        └──────────────┬──────────────────────-┘
                                       │ routes by path
               ┌───────────────────────┼───────────────────────────┐
               │                       │                           │
               ▼                       ▼                           ▼
        /api/auth              /api/users, /api/products    /api/orders
        auth-service           user-service                 order-service
        (Node.js)              product-service              (Spring Boot)
                               (Node.js)                         │
                                                                  ▼
                                                            Kafka Topic
                                                         (order.placed)
                                                                  │
                                                                  ▼
                                                     notification-service
                                                           (Node.js)

        ┌─────────────────────────────────────────────────────────────┐
        │                   shopflow-infra namespace                   │
        │         PostgreSQL (PVC)   Kafka      Zookeeper              │
        └─────────────────────────────────────────────────────────────┘
```

---

## Services

| Service | Language | Port | Responsibility |
|--------|----------|------|----------------|
| `auth-service` | Node.js | 3005 | JWT login & token validation |
| `user-service` | Node.js | 3001 | User management |
| `product-service` | Node.js | 3002 | Product catalogue |
| `order-service` | Java / Spring Boot | 3003 | Order creation & persistence |
| `notification-service` | Node.js | 3004 | Kafka consumer — order events |

**Infrastructure**
| Component | Technology | Namespace |
|-----------|-----------|-----------|
| Database | PostgreSQL 15 | `shopflow-infra` |
| Message broker | Apache Kafka | `shopflow-infra` |
| Coordination | Zookeeper | `shopflow-infra` |
| Gateway | Nginx Ingress | `ingress-nginx` |

---

## Tech Stack

- **Runtime:** Node.js, Java 17 / Spring Boot 3.5
- **Database:** PostgreSQL 15 with JPA / Hibernate
- **Messaging:** Apache Kafka
- **Containerisation:** Docker
- **Orchestration:** Kubernetes (Minikube for local)
- **Ingress:** Nginx Ingress Controller
- **Auth:** JWT (jsonwebtoken)
- **Build tool:** Maven (order-service), npm (Node services)

---

## Project Structure

```
ShopFlow/
├── auth-service/               # JWT auth — Node.js
├── user-service/               # User CRUD — Node.js
├── product-service/            # Product catalogue — Node.js
├── order-service/              # Order management — Spring Boot
│   └── src/main/java/com/shopflow/order/
│       ├── controller/         # REST endpoints
│       ├── entity/             # JPA entities
│       └── service/            # Business logic + Kafka producer
├── notification-service/       # Kafka consumer — Node.js
├── shopflow-k8s/               # All Kubernetes manifests
│   ├── namespaces/
│   ├── configmaps/
│   ├── secrets/
│   ├── statefulsets/           # PostgreSQL, Kafka, Zookeeper
│   ├── deployments/            # All 5 app services
│   ├── services/
│   └── ingress/
└── docker-compose.yml          # Local Docker Compose setup
```

---

## Kubernetes Setup

### Namespaces
```
shopflow          → all application services
shopflow-infra    → PostgreSQL, Kafka, Zookeeper
```

### Resources Created
- **2 Namespaces**
- **1 ConfigMap** — shared env config (DB host, Kafka address, service URLs)
- **1 Secret** — DB password, JWT secret
- **3 StatefulSets** — PostgreSQL (with PVC), Kafka, Zookeeper
- **5 Deployments** — one per app service
- **8 Services** — ClusterIP for internal routing
- **1 Ingress** — Nginx path-based routing

---

## API Endpoints

### Auth Service
```
POST   /api/auth/login       → returns JWT token
GET    /api/auth/validate    → validates token (used internally)
GET    /api/auth/health      → health check
```

### User Service
```
GET    /api/users            → list all users
```

### Product Service
```
GET    /api/products         → list all products
```

### Order Service
```
GET    /api/orders           → list all orders
POST   /api/orders/create    → create a new order
GET    /api/orders/{id}      → get order by ID
```

### Notification Service
```
Kafka consumer — listens on topic: order.placed
```

---

## Running Locally

### Prerequisites
- Docker Desktop
- Minikube
- kubectl
- Bruno (or any API client) for POST requests

### 1. Start the cluster
```bash
minikube start --memory=3500 --cpus=2 --driver=docker
minikube addons enable ingress
```

### 2. Apply Kubernetes manifests
```bash
kubectl apply -f shopflow-k8s/namespaces/
kubectl apply -f shopflow-k8s/configmaps/
kubectl apply -f shopflow-k8s/secrets/
kubectl apply -f shopflow-k8s/statefulsets/
kubectl apply -f shopflow-k8s/deployments/
kubectl apply -f shopflow-k8s/services/
kubectl apply -f shopflow-k8s/ingress/
```

### 3. Build service images inside Minikube
```bash
eval $(minikube docker-env)   # Linux/Mac
# OR
minikube docker-env | Invoke-Expression   # Windows PowerShell

docker build -t shopflow/auth-service:latest ./auth-service
docker build -t shopflow/user-service:latest ./user-service
docker build -t shopflow/product-service:latest ./product-service
docker build -t shopflow/order-service:latest ./order-service
docker build -t shopflow/notification-service:latest ./notification-service
```

### 4. Add hosts entry
Add this line to your hosts file:
```
# Windows: C:\Windows\System32\drivers\etc\hosts
# Mac/Linux: /etc/hosts
127.0.0.1  shopflow.local
```

### 5. Start minikube tunnel (keep this running)
```bash
minikube tunnel
```

### 6. Verify all pods are running
```bash
kubectl get pods -n shopflow
kubectl get pods -n shopflow-infra
```

All pods should show `1/1 Running`.

---

## Testing the API

### Login
```bash
POST http://shopflow.local/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Create an Order
```bash
POST http://shopflow.local/api/orders/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": 2,
  "productId": 1,
  "quantity": 2,
  "totalPrice": 199.98
}
```

### View Orders
```
GET http://shopflow.local/api/orders
GET http://shopflow.local/api/products
GET http://shopflow.local/api/users
```

---

## Key Engineering Decisions

**Cross-namespace DNS** — Services in `shopflow` communicate with `shopflow-infra` using fully qualified Kubernetes DNS names:
```
postgres.shopflow-infra.svc.cluster.local
kafka.shopflow-infra.svc.cluster.local
```

**Environment-driven config** — Spring Boot and Node.js services read all connection details from Kubernetes ConfigMaps and Secrets via environment variables, with no hardcoded hostnames.

**Persistent storage** — PostgreSQL runs as a StatefulSet with a 1GB PersistentVolumeClaim, so data survives pod restarts.

**Event-driven orders** — When an order is created, order-service publishes a JSON event to the `order.placed` Kafka topic. notification-service consumes this asynchronously, decoupling the two services completely.

**Ingress routing** — A single Nginx Ingress resource replaces the old nginx.conf gateway, routing traffic by URL path to the correct service inside the cluster.

---

## What I Learned

- Designing and running a multi-service system end to end
- Kubernetes resource types: Deployments, StatefulSets, Services, ConfigMaps, Secrets, Ingress, PersistentVolumeClaims
- Namespace isolation and cross-namespace DNS resolution
- Debugging pod failures with `kubectl logs`, `kubectl describe`, and `--previous`
- Event-driven architecture with Kafka producers and consumers
- Spring Boot configuration via environment variables for Kubernetes compatibility
- Minikube networking on Windows with `minikube tunnel`

---

## Future Improvements

- [ ] Add user registration endpoint backed by PostgreSQL
- [ ] Add JWT middleware to protect order and user routes
- [ ] Deploy to a managed cloud cluster (GKE / EKS / AKS)
- [ ] Package manifests with Helm
- [ ] Add Prometheus + Grafana monitoring
- [ ] Add a React frontend
- [ ] CI/CD pipeline with GitHub Actions

---

## Local Docker Compose (Alternative)

To run without Kubernetes:
```bash
docker-compose up --build
```
Services will be available via the Nginx gateway on `http://localhost`.

---

*Built as a portfolio project demonstrating microservices architecture and Kubernetes deployment.*
