# MausamDrishti: System Component Architecture & UI Documentation

## Overview
**MausamDrishti** is an AI/ML-based prototype decision-support system designed to detect forecast uncertainty and large forecast errors ("busts") in medium-range numerical weather predictions (NWP), addressing the problem scope defined by the Ministry of Earth Sciences (MoES) and the National Centre for Medium Range Weather Forecasting (NCMRWF).

This document details every major frontend and interface component, its purpose, what the user sees, the data required, the data source, and user interactions.

---

## 1. Global Navigation & Layout Components

### 1.1 Sidebar (`src/components/layout/Sidebar.jsx`)
- **Purpose**: Provides primary navigation across the six core operational views of MausamDrishti while reinforcing the scientific brand identity.
- **What User Sees**:
  - Brand header: MausamDrishti with deep scientific teal icon.
  - Subtitle: "Forecast Reliability Intelligence".
  - Six distinct navigation buttons with icons:
    1. **Overview** (Compass)
    2. **Forecast** (TrendingUp)
    3. **Bust Detection** (AlertTriangle)
    4. **Explainability** (HelpCircle)
    5. **Historical** (Archive)
    6. **API** (Code2)
  - Active tab indicated by a subtle teal background (`#EBF3F1`) and a 3px vertical accent bar.
  - Attribution footer: "Research Prototype • MoES / NCMRWF Problem Scope • Medium-Range NWP Verification".
- **Data Required**: Active route/page ID (`activePage`).
- **Interactions**: Clicking any item switches the primary view instantly with zero page reloads.

### 1.2 Header (`src/components/layout/Header.jsx`)
- **Purpose**: Displays operational model run metadata and establishes spatial precision transparency.
- **What User Sees**:
  - System label: "NWP RELIABILITY LAYER | Evaluating NWP Forecast Uncertainty & Bust Probability".
  - Resolution Transparency Pill: **Forecast Res: 0.25° (~25km)** • **Map Res: Vector**.
  - Operational Status Pill: "00Z Operational Stream (Simulated)".
- **Data Required**: Forecast run metadata (`FORECAST_METADATA`).

### 1.3 Disclaimer Banner (`src/components/layout/DisclaimerBanner.jsx`)
- **Purpose**: Enforces scientific honesty by explicitly informing the user that the system is a research prototype rather than an official operational forecast.
- **What User Sees**: Dismissible neutral alert banner specifying that outputs are calibrated demonstration data.
- **Interactions**: "X" button to dismiss.

---

## 2. Interactive Map Components

### 2.1 Reliability Map (`src/components/map/ReliabilityMap.jsx`)
- **Purpose**: The primary visual component of the application. Displays fine-grained NWP grid cells across the Indian subcontinent rather than arbitrary broad regions.
- **What User Sees**:
  - High-performance Leaflet geospatial map with Carto Positron light neutral tiles.
  - Individual 0.25° x 0.25° (~27 km) NWP model grid polygons plotted with authentic coordinates.
  - Dynamic polygon colors corresponding to the selected layer mode (Confidence, Bust Probability, or NWP Rainfall).
  - High-risk cells (>70% bust probability) marked with distinct dashed borders and contrast outlines.
  - Selected cell highlighted with an outer focus ring.
- **Data Required**: Array of `ForecastGridCell` objects with latitude, longitude, bounding box, confidence, bust probability, expected error, and NWP rainfall.
- **Interactions**:
  - **Pan & Zoom**: Smooth geospatial navigation.
  - **Hover**: Displays a clean, scientific tooltip with Location ID, District/State, Coordinates, Confidence %, Bust Probability %, and Expected Error (± mm).
  - **Click**: Selects the grid cell, triggers automatic map re-centering, and opens the compact Region Side Panel.

### 2.2 Map Floating Toolbar (`src/components/map/MapToolbar.jsx`)
- **Purpose**: Provides lightweight, floating controls to switch layers and lead days without obscuring the map.
- **What User Sees**:
  - Layer Switcher: **Confidence** | **Bust Risk** | **NWP Rainfall**.
  - Lead Day Switcher: **DAY 1  2  3  4  5  6  7  8  9  10**.
- **Interactions**: Single-click toggle immediately refreshes all map colors, metrics, and side panel data.

### 2.3 Map Dynamic Legend (`src/components/map/MapLegend.jsx`)
- **Purpose**: Transparently interprets map colors using dual visual cues (continuous color gradient and descriptive text labels).
- **What User Sees**:
  - For **Confidence**: Muted Coral (Low Confidence) to Deep Scientific Teal (High Confidence).
  - For **Bust Risk**: Soft Green (Low <30%), Amber (Moderate), Muted Orange (High), Muted Red (Very High >70%).
  - For **NWP Rainfall**: Cyan to Deep Teal precipitation totals (0 to 100+ mm).

### 2.4 Region Side Panel (`src/components/map/RegionSidePanel.jsx`)
- **Purpose**: Compact floating panel showing deep-dive metrics for a clicked location.
- **What User Sees**:
  - Location title: Grid Code and District.
  - Synoptic regime and terrain context.
  - Two dominant numerical cards: **Confidence %** and **Bust Probability %**.
  - NWP Predicted Rainfall and Expected Error (± mm).
  - Assessed Risk Level Badge.
  - Primary meteorological driver summary.
  - Primary Action Button: **"Examine Meteorological Drivers [WHY?]"**.
- **Interactions**:
  - Close button ("X").
  - Clicking "[WHY?]" transfers the user directly to the **Explainability** page with this specific location and lead day pre-selected.

### 2.5 Attention Table (`src/components/map/AttentionTable.jsx`)
- **Purpose**: Dynamically surfaces all grid cells exceeding operational bust risk thresholds for the active day.
- **What User Sees**:
  - Count of high-risk grid units.
  - Columns: Location Identifier, District/Terrain, Lead Day, Variable, Bust Probability, Expected Error, Risk Badge, Action.
- **Interactions**: Clicking any row focuses the map directly on that cell and opens the side panel.

---

## 3. Dedicated Page Views

### 3.1 Overview Page (`src/pages/Overview.jsx`)
- **Purpose**: The primary operational dashboard.
- **Key Metrics Displayed**: Exactly three dominant summary metrics:
  1. **Forecast Confidence** (%)
  2. **Bust Probability** (%)
  3. **High-Risk Areas** (count)
- **Included Elements**: Floating toolbar, Leaflet map, dynamic legend, region side panel, and attention table.

### 3.2 Forecast Page (`src/pages/Forecast.jsx`)
- **Purpose**: Analyzes how forecast reliability evolves across lead time (Day 1 to Day 10).
- **Key Visualization**: **"Confidence vs Forecast Lead Time"** interactive decay curve and error growth envelope.
- **Interactions**: Clicking any column in the lead time chart updates the active forecast day and refreshes the map.

### 3.3 Bust Detection Page (`src/pages/BustDetection.jsx`)
- **Purpose**: Dedicated view answering *"Where and when is the forecast most likely to experience a large error?"*
- **Key Features**:
  - Map defaults to Bust Probability mode.
  - Dynamic risk ranking table with configurable probability cutoff filters (≥30%, ≥50%, ≥70%).
  - **Bust Threshold Config Panel**: Demonstrates how operational bust thresholds adapt dynamically to weather variable, lead time, and climatological error percentiles.

### 3.4 Explainability Page (`src/pages/Explainability.jsx`)
- **Purpose**: Answers *"WHY is the AI uncertain?"*
- **Key Features**:
  - Interactive selector for Grid Location, Lead Day (1–10), and Variable.
  - AI Assessment summary card.
  - Four Core Meteorological Factor Cards:
    1. Ensemble Disagreement
    2. Rapidly Evolving System
    3. Historical Forecast-Error Pattern
    4. Upper-Air Uncertainty
  - 21-member ensemble spread distribution plot.
  - SHAP feature attribution bars with plain-language meteorological translations.

### 3.5 Historical Page (`src/pages/Historical.jsx`)
- **Purpose**: Compares current synoptic setups with verified historical forecast-error archives.
- **Key Features**:
  - Filter by Synoptic Weather Event (Monsoon Depression BOB-04, Western Disturbance, Orographic Surge, Active-to-Break Transition).
  - Verification lead day selector.
  - 3 Summary Metrics: Similar Situations Found, Day N Mean Error, Historical Bust Frequency.
  - Lead-time error growth chart.
  - Verified Analogue Cases table with documented forecast errors and bust outcomes.

### 3.6 API Page (`src/pages/API.jsx`)
- **Purpose**: Live interactive documentation and test bench for external decision-support consumers.
- **Endpoints Supported**:
  - `GET /api/forecast`
  - `GET /api/confidence`
  - `GET /api/bust-probability`
  - `GET /api/high-risk-regions`
  - `GET /api/explanation`
  - `GET /api/historical-errors`
- **Features**: Live parameter adjustment, request execution, formatted JSON inspector, and copyable cURL commands.
