# 🍱 AI-Based Food Redistribution System

An intelligent food inventory and redistribution platform designed to reduce food waste by managing food inventory, generating QR codes and barcodes, importing inventory through CSV, integrating with POS systems, and maintaining transaction history.

This project is being developed as a Final Year Engineering Project with future AI capabilities including demand forecasting, waste prediction, and smart reorder recommendations.

---

# 📌 Project Overview

The AI-Based Food Redistribution System enables organizations, NGOs, restaurants, supermarkets, and food donors to efficiently manage surplus food inventory.

The system provides:

- Secure user authentication
- Food inventory management
- QR Code generation
- Barcode generation
- QR Code scanning
- CSV bulk upload
- POS integration
- Transaction history
- Expiry status monitoring

Future milestones will introduce Artificial Intelligence for demand forecasting, waste prediction, and smart inventory recommendations.

---

# 🚀 Features (Milestone 1)

### Authentication
- User Registration
- User Login
- JWT Authentication
- Role-based Authorization

### Inventory Management
- Add Food
- Update Food
- Delete Food
- View Inventory
- Search Food

### Barcode & QR Code
- Automatic Barcode Generation
- Automatic QR Code Generation
- QR Code Display
- Barcode Search
- QR Scanner

### CSV Upload
- Bulk Food Upload
- CSV Validation
- Error Handling

### POS Integration
- Fetch Products
- Synchronize Inventory

### Transaction History
- Inventory Activity Logs
- Food Addition History
- Update History
- Delete History

### Inventory Monitoring
- Expiry Status
- Quantity Tracking
- Storage Conditions

---

# 🛠 Technology Stack

## Frontend

- React.js
- React Router DOM
- Axios
- Bootstrap 5
- HTML5 QR Code Scanner
- React Icons

## Backend

- Node.js
- Express.js
- JWT Authentication
- Multer
- CSV Parser
- UUID

## Database

- PostgreSQL

## Development Tools

- IntelliJ IDEA
- Visual Studio Code
- Git
- GitHub
- Postman

---

# 🏗 Project Structure

```
Food-Redistribution-System
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── utils
│   │   └── app.js
│   │
│   ├── uploads
│   ├── package.json
│   └── server.js
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/sudarshan385/Food-Redistribution-System.git
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
PORT=5000

DB_HOST=localhost

DB_PORT=5432

DB_USER=postgres

DB_PASSWORD=your_password

DB_NAME=food_redistribution

JWT_SECRET=your_secret_key
```

---

# Database

Database Used

- PostgreSQL

Tables Included

- users
- food_item
- transaction_history

---

# Workflow

```
User Login
      │
      ▼
Dashboard
      │
      ▼
Food Inventory
      │
 ┌────┼───────────┐
 ▼    ▼           ▼
Add Update Delete
 │
 ▼
Generate Barcode
 │
 ▼
Generate QR Code
 │
 ▼
Inventory Display
 │
 ▼
QR Scan / Barcode Search
 │
 ▼
Food Details
```

---

# Screenshots

## Login Page

(Add Screenshot)

---

## Dashboard

(Add Screenshot)

---

## Inventory

(Add Screenshot)

---

## Food Details

(Add Screenshot)

---

## QR Code

(Add Screenshot)

---

## Barcode Search

(Add Screenshot)

---

## CSV Upload

(Add Screenshot)

---

# API Endpoints

## Authentication

| Method | Endpoint |
|----------|----------------|
| POST | /auth/register |
| POST | /auth/login |

---

## Inventory

| Method | Endpoint |
|----------|---------------------------|
| GET | /inventory |
| POST | /inventory |
| GET | /inventory/:id |
| PUT | /inventory/:id |
| DELETE | /inventory/:id |

---

## Barcode

| Method | Endpoint |
|----------|--------------------------------|
| GET | /inventory/barcode/:barcode |

---

## CSV

| Method | Endpoint |
|----------------|----------------|
| POST | /upload/csv |

---

## POS

| Method | Endpoint |
|-----------|-------------|
| GET | /pos/products |

---

## Transaction History

| Method | Endpoint |
|---------|---------------|
| GET | /history |

---

# Milestone Progress

## ✅ Milestone 1 (Completed)

- Authentication
- Inventory Management
- Barcode Generation
- QR Code Generation
- QR Scanner
- CSV Upload
- POS Integration
- Transaction History
- PostgreSQL Integration

---

## 🚧 Milestone 2 (In Progress)

- Historical Data Collection
- Data Preprocessing
- Demand Forecasting (Prophet/LSTM)
- Waste Risk Prediction
- Smart Reorder Recommendation
- FastAPI AI Microservice

---

## 🎯 Milestone 3 (Planned)

- AI Food Matching
- Donation Recommendation Engine
- NGO Request Management
- Volunteer Module
- Analytics Dashboard
- Notifications
- Reports

---

# Future Enhancements

- Artificial Intelligence Demand Forecasting
- Waste Prediction
- Smart Reordering
- Email Notifications
- SMS Alerts
- Interactive Analytics Dashboard
- Mobile Application
- Cloud Deployment

---

# Author

**Sudarshan Singe**

Final Year Computer Science & Engineering Student

Rajarajeswari College of Engineering

GitHub:
https://github.com/sudarshan385

---

# License

This project is developed for academic and educational purposes as a Final Year Engineering Project.
