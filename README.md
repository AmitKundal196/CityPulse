# City Pulse — Live Civic Health & Urban Intelligence Dashboard

[![Platform](https://img.shields.io/badge/Platform-Web-blue.svg)](https://github.com/AmitKundal196/CityPulse)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB.svg)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-47A248.svg)](https://www.mongodb.com/)

**City Pulse** (Neighborhood Pulse) is a real-time civic intelligence and urban monitoring platform designed to aggregate multi-source empirical civic data (air quality, weather, traffic incidents, and public citizen grievances) into localized, actionable community insights across monitored zones (Jaipur, Delhi, and Mumbai).

---

## 🌟 Key Features

- **📊 Live Civic Overview**: Real-time aggregated city health metrics, composite pulse scores, environmental indices, and live feeds.
- **🗺️ Interactive Geospatial Map**: Leaflet-powered multi-city map with layer filters for air quality monitoring stations, weather indicators, traffic incidents, and geo-located citizen complaints.
- **🛡️ Municipal Desk (Admin Console)**: Restricted administrative console protected by passkey authorization (`admin@123`), enabling municipal staff to manage citizen complaints through strict lifecycle states (`OPEN` → `IN_REVIEW` → `RESOLVED` / `REJECTED`), assign dispatch wards, log resolution notes, and audit workflows.
- **📝 Citizen Grievance Portal**: Empirical, citizen-facing reporting form with zero synthetic generation, supporting category tagging, severity assignment, and status tracking.
- **🌤️ Atmospheric & Air Quality Monitoring**: Integrated live Open-Meteo feeds for real-time PM2.5, PM10, AQI levels, temperature, humidity, and wind velocity.
- **🔔 Civic Alerts & Intelligence**: Dynamic rule-based alert triggering on adverse environmental and infrastructural hazards.
- **🌓 Dark / Light Theme**: High-contrast, accessibility-tested themes tailored for operations centers and citizen accessibility.

---

## 🏛️ System Architecture

```
[ Frontend: React 18 + Vite + Tailwind CSS ]
           │
           │  (REST API + Socket.IO)
           ▼
[ Backend: Node.js + Express Service ]
     ├── Ingestion Manager (Multi-City: Jaipur, Delhi, Mumbai)
     │     ├── Weather & AQI Connector (Open-Meteo)
     │     ├── Traffic Incident Connector
     │     └── Grievance Workflow Processor
     │
     └── [ Database: MongoDB via Mongoose ]
           ├── Complaints & Resolutions
           ├── City Health Records & History
           └── Feed Statuses & Audit Logs
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally on port 27017 (or MongoDB Atlas connection string)
- npm or yarn

---

### Step 1: Clone Repository

```bash
git clone https://github.com/AmitKundal196/CityPulse.git
cd CityPulse
```

---

### Step 2: Environment Configuration

Copy the provided sample configurations to set up your environment variables without exposing sensitive credentials:

```bash
# In repository root
cp .env.example .env

# In backend directory
cp backend/.env.example backend/.env
```

#### Backend Environment Variables (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/neighborhood-pulse
CORS_ORIGIN=http://localhost:5173

# Multi-City Baseline Configuration
DEMO_CITY=Jaipur
LATITUDE=26.9124
LONGITUDE=75.7873
RADIUS_KM=25

# Ingestion Intervals (in milliseconds)
WEATHER_INTERVAL_MS=300000
AIR_QUALITY_INTERVAL_MS=300000
SIMULATION_INTERVAL_MS=5000

# Optional API Keys (Leave blank for standard mock/Open-Meteo mode)
OPENAQ_API_KEY=
LLM_API_KEY=
TRAFFIC_API_KEY=
MAPPLS_CLIENT_ID=
MAPPLS_CLIENT_SECRET=
```

---

### Step 3: Install & Start Backend

```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`.*

---

### Step 4: Install & Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🔐 Administrative Access

Access to the **Municipal Desk** is restricted. When clicking **Municipal Desk** in the navigation bar or accessing the operator dispatch console:
- **Prompt**: `Enter password for access`
- **Default Admin Password**: `admin@123`
- Session includes **Lock Desk** controls for security audit compliance.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Leaflet, Recharts
- **Backend**: Node.js, Express.js, Socket.IO, CORS, dotenv
- **Database**: MongoDB, Mongoose
- **APIs**: Open-Meteo (Weather & AQI), Mappls (Traffic optional)

---

## 📄 License

This project is licensed under the MIT License.
