# MausamDrishti: End-to-End System Data Flow

## 1. High-Level Architecture Flowchart

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│       NWP FORECAST STREAM       │       │    HISTORICAL ERROR ARCHIVES    │
│  - Unified Model (NCUM-G)       │       │  - 10-Year Verification Pairs   │
│  - 21-Member Ensemble (NEPS-G)  │       │  - Synoptic Analogue Database   │
│  - Global/Regional 0.25° Grids  │       │  - Climatological P90 Error Map │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 └───────────────────┬─────────────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────┐
                      │     FEATURE ENGINEERING     │
                      │  - Multi-level Vorticity    │
                      │  - Circulation Tendencies   │
                      │  - Ensemble Spread / IQR    │
                      │  - Terrain Roughness Index  │
                      └──────────────┬──────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────┐
                      │    ML INFERENCE PIPELINE    │
                      │  - Gradient Boosted Trees   │
                      │  - Probability Calibration  │
                      │  - TreeSHAP Explainability  │
                      └──────────────┬──────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────┐
                      │  RELIABILITY INTELLIGENCE   │
                      │  - Forecast Confidence Map  │
                      │  - Bust Probabilities P_90  │
                      │  - Expected Error (± mm)    │
                      │  - Meteorological Drivers   │
                      └──────────────┬──────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────┐
                      │    OPERATIONAL REST API     │
                      │  - GET /api/forecast        │
                      │  - GET /api/confidence      │
                      │  - GET /api/bust-probability│
                      │  - GET /api/high-risk-reg.  │
                      │  - GET /api/explanation     │
                      └──────────────┬──────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────┐
                      │   MAUSAMDRISHTI DASHBOARD   │
                      │  - Interactive 0.25° Map    │
                      │  - 3 Core Operational Stats │
                      │  - Areas Requiring Attention│
                      │  - Lead-Time Decay Curves   │
                      │  - XAI Factor Breakdown     │
                      └─────────────────────────────┘
```

---

## 2. Detailed Data Flow Stages

### Stage 1: Ingestion of Operational Forecasts & Verification Archives
1. **NWP Ingestion**:
   - NCUM-G deterministic GRIB2/NetCDF forecast fields ingested every 12 hours (00Z & 12Z runs).
   - NEPS-G 21-member ensemble perturbation fields ingested for lead days 1 to 10 (+24h to +240h).
2. **Ground Truth & Reanalysis Archive**:
   - High-resolution gridded observational datasets (IMD-NCMRWF merged daily precipitation, AWS network, ERA5/IMDAA reanalysis).
   - Historical verification pairs $(F_{t,\tau}, O_{t+\tau})$ compiled over a rolling 10-year baseline.

### Stage 2: Feature Engineering & Preprocessing
1. **Physical Feature Extraction**:
   - Computation of horizontal divergence $\nabla \cdot \mathbf{v}$ at 200 hPa and relative vorticity $\zeta$ at 850 hPa.
   - Calculation of 24h pressure tendency $\Delta P_{\text{msl}} / 24\text{h}$.
2. **Ensemble Aggregation**:
   - Mean, standard deviation, interquartile range (IQR), and member kurtosis across the 21 ensemble members.
3. **Analogue Retrieval**:
   - The current atmospheric state vector is compared against synoptic archives using Euclidean/Mahalanobis similarity to identify the top 10–20 closest historical analogues.

### Stage 3: AI/ML Inference & Probability Calibration
1. **Model Execution**:
   - Trained LightGBM models evaluate each 0.25° grid cell.
   - Model 1 predicts the continuous expected absolute error $\widehat{\mathcal{E}}$.
   - Model 2 computes the raw log-odds of exceeding the local dynamic bust threshold $\Theta(V, \mathbf{x}, \tau)$.
2. **Calibration**:
   - Isotonic scaling converts raw scores into verified empirical probabilities $P(\text{Bust})$.
3. **Confidence Inversion**:
   - High bust probability and high ensemble spread translate to lower forecast confidence.

### Stage 4: Explainability Generation
1. **TreeSHAP Attribution**:
   - Local Shapley values $\phi_i$ calculated for each feature.
2. **Translation Layer**:
   - Top 4 contributing features converted into plain-language meteorological statements (e.g. ensemble disagreement, rapid vorticity changes, historical analogue failure, upper-air jet shear).

### Stage 5: REST API Distribution
- The results are cached and exposed via JSON endpoints:
  - `/api/forecast`: Base NWP fields and grid definitions.
  - `/api/confidence`: Domain and cell-level confidence ratings.
  - `/api/bust-probability`: Gridded bust probabilities.
  - `/api/high-risk-regions`: Ranked list of error-prone areas exceeding risk thresholds.
  - `/api/explanation`: Meteorological reasoning and SHAP decomposition.
  - `/api/historical-errors`: Analogue verification data.

### Stage 6: Client Dashboard Presentation
- The MausamDrishti frontend retrieves data through asynchronous client services.
- The map renders 0.25° polygon grid cells with color-coded reliability states.
- The dashboard highlights the top 3 metrics, attention table, lead-time curves, and interactive side panels for forecaster decision support.
