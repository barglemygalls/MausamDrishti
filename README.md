# MausamDrishti (मौसम दृष्टि): AI/ML-Powered NWP Reliability & Bust Detection

> **An AI/ML-driven decision-support system designed to quantify forecast uncertainty and detect large numerical forecast errors ("busts") in medium-range Numerical Weather Predictions (NWP), directly aligned with the Ministry of Earth Sciences (MoES), Mission Mausam, and NCMRWF.**

---

## 🛰️ Mission Alignment: MoES & Mission Mausam

Under the aegis of the **Ministry of Earth Sciences (MoES)** and the goals of **Mission Mausam**, **MausamDrishti** serves as an intelligent evaluation and reliability layer operating on top of medium-range NWP models (such as NCUM / Unified Model and NEPS).

Rather than attempting to replace numerical models, **MausamDrishti** diagnoses when, where, and why NWP forecasts are susceptible to significant forecast busts (severe under-prediction or over-prediction of precipitation and extreme events).

---

## 🌟 Key Capabilities

- **Grid-Level Reliability & Bust Probability**: Evaluates forecast confidence across 0.25° (~27 km) model grid cells spanning the Indian subcontinent.
- **7-Day Advance Bust Detection**: Machine learning classifiers predict the likelihood of extreme forecast error thresholds 1–7 days ahead.
- **SHAP-Based Meteorological Explainability (XAI)**: Identifies the underlying dynamic and thermodynamic drivers of forecast uncertainty (e.g., CAPE anomalies, 500 hPa vorticity, moisture flux convergence, baroclinic shear, and ensemble spread).
- **Interactive Geospatial Visualizer**: High-performance Leaflet-based geospatial explorer with vector cell inspection, confidence overlays, and spatial query tools.
- **Machine-Readable API**: Standardized JSON endpoints for downstream integration into disaster response systems, state-level SDMAs, and agricultural advisories.

---

## 🏗️ Architecture & Tech Stack

- **Frontend Core**: React 18, Vite
- **Geospatial Mapping**: Leaflet with custom dynamic vector raster rendering
- **Icons & Visuals**: Lucide React
- **Design System**: Vanilla CSS adhering to modern scientific design tokens, accessible color palettes, and responsive layouts
- **System Specifications**: Full architectural specifications available in:
  - [`AI_ML_IMPLEMENTATION.md`](./AI_ML_IMPLEMENTATION.md)
  - [`DATA_FLOW.md`](./DATA_FLOW.md)
  - [`WEBSITE_COMPONENTS.md`](./WEBSITE_COMPONENTS.md)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/mausam-drishti.git
cd mausam-drishti

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

---

## 📁 Repository Structure

```
mausam-drishti/
├── src/
│   ├── components/      # Modular UI components (Map, Toolbar, Panels, Explainability, etc.)
│   ├── data/            # Simulated NWP grids, meteorological features, and forecast metadata
│   ├── services/        # Client API and calculation services (Bust, Confidence, Explainability)
│   ├── styles/          # Design tokens, variables, and responsive layout styling
│   ├── App.jsx          # Root component & page router
│   └── main.jsx         # Vite entry point
├── AI_ML_IMPLEMENTATION.md  # Detailed AI/ML architecture & feature importance spec
├── DATA_FLOW.md             # Operational NWP pipeline & data ingestion flow
├── WEBSITE_COMPONENTS.md    # UI component inventory & interaction specs
├── package.json
└── vite.config.js
```

---

## 📜 Disclaimer

*MausamDrishti is an AI/ML research and decision-support prototype developed for evaluating NWP forecast uncertainty and medium-range forecast verification.*
