# MausamDrishti: AI/ML Architecture & Implementation Specification

## 1. Problem Formulation
Numerical Weather Prediction (NWP) models (such as the Unified Model NCUM-G and ensemble system NEPS-G operated by NCMRWF) simulate atmospheric dynamics using partial differential equations discretized on geospatial grids. While NWP forecasts are skillful on average, chaotic atmospheric dynamics, rapid convective initiation, orographic interactions, and parameterization uncertainties can cause the model forecast to fail catastrophically—a phenomenon known as a **Forecast Bust**.

MausamDrishti does **not** predict the weather; it predicts the **reliability of the NWP forecast**. Formally, given:
- An NWP forecast field $\mathbf{F}(\mathbf{x}, t, \tau)$ for variable $V$ at location $\mathbf{x}$, initialization time $t$, and lead time $\tau \in [1, 10]$ days,
- The historical verification error distribution $\mathcal{D}_{\text{hist}}(V, \mathbf{x}, \tau)$,
- The atmospheric state and ensemble perturbation spread $\mathbf{\Phi}(\mathbf{x}, t, \tau)$,

MausamDrishti estimates:
1. **Forecast Bust Probability**:
   $$P_{\text{bust}}(\mathbf{x}, t, \tau) = P\left( |\mathbf{F}(\mathbf{x}, t, \tau) - \mathbf{O}(\mathbf{x}, t+\tau)| > \Theta(V, \mathbf{x}, \tau) \mid \mathbf{\Phi} \right)$$
   where $\mathbf{O}$ is the observed atmospheric verification truth and $\Theta$ is a dynamic statistical error threshold.

2. **Forecast Confidence Index**:
   $$C(\mathbf{x}, t, \tau) = 1.0 - f\left(P_{\text{bust}}, \frac{\sigma_{\text{ensemble}}}{\mu_{\text{ensemble}}}, \Delta_{\tau}\right) \in [0.0, 1.0]$$

3. **Expected Error Envelope**:
   $$\widehat{\mathcal{E}}(\mathbf{x}, t, \tau) = \mathbb{E}\left[ |\mathbf{F} - \mathbf{O}| \mid \mathbf{\Phi} \right]$$

---

## 2. Dynamic Forecast Bust Definition
A forecast bust is defined as a situation where the forecast absolute error exceeds a lead-time and climatology-adjusted threshold:
$$\Theta(V, \mathbf{x}, \tau) = \text{Quantile}_{90}\left( |F - O| \mid V, \text{month}, \tau \right) \cdot \kappa(\text{terrain})$$

### Core Rules:
1. **No Hardcoded Static Numbers**: A 40 mm rainfall error in the arid Thar desert represents a monumental bust, whereas along the steep Western Ghats escarpment during an active monsoon surge, 40 mm is within normal sub-grid variance.
2. **Lead Time Scaling**: The permissible error envelope grows systematically from Day 1 to Day 10 due to inevitable atmospheric divergence.
3. **Multi-Variable Adaptivity**: Thresholds are defined independently for precipitation ($mm$), 2m temperature ($^\circ C$), and 10m wind speed ($km/h$).

---

## 3. Input Features & Feature Engineering

### 3.1 NWP Dynamic State Variables (Grid Level: 0.25°)
- **Surface**: 24h accumulated rainfall ($mm$), 2m temperature ($K$), mean sea level pressure ($hPa$), 10m wind vector $(u, v)$.
- **Upper-Air Multi-Level**:
  - Geopotential height ($Z500, Z200$)
  - Relative vorticity ($\zeta_{850} = \frac{\partial v}{\partial x} - \frac{\partial u}{\partial y}$)
  - Horizontal divergence ($\nabla \cdot \mathbf{v}_{200}$)
  - Precipitable water content / Total column water vapor ($kg/m^2$)
  - Mid-tropospheric relative humidity ($RH_{700}$)

### 3.2 Ensemble Perturbation Metrics (NEPS-G: 21 Members)
- **Ensemble Mean ($\mu_e$) & Spread ($\sigma_e$)**: Spread-to-error ratio analysis.
- **Interquartile Range (IQR)**: Resilient measure of ensemble member divergence.
- **Bimodal Track Index**: Quantifies if ensemble trajectories branch into distinct bimodal paths (e.g. cyclonic landfall vs offshore recurvature).

### 3.3 Rapid Circulation Change Features ($\Delta / \Delta t$)
- 24-hour pressure tendency: $\frac{\partial P_{\text{msl}}}{\partial t}$
- Vorticity intensification rate: $\frac{\partial \zeta_{850}}{\partial t}$
- Deep layer vertical wind shear: $|\mathbf{v}_{200} - \mathbf{v}_{850}|$

### 3.4 Historical & Analogue Predictors
- Climatological error percentile for matching synoptic classification.
- Spatially lagged regional model bias over the preceding 14-day initialization window.
- Synoptic analogue distance: Mahalanobis distance to top-$K$ historical bust cases.

---

## 4. Machine Learning Model Architecture
For the initial baseline implementation, tree-based gradient boosted models are the selected architecture:
1. **LightGBM / XGBoost Regressor**:
   - Predicts continuous expected error $\widehat{\mathcal{E}}(\mathbf{x}, t, \tau)$.
   - Loss function: Huber Loss or Quantile Loss ($\alpha \in \{0.5, 0.9\}$) to handle heavy-tailed extreme meteorological errors.
2. **LightGBM Classifier**:
   - Predicts binary probability of threshold exceedance $P(|F - O| > \Theta)$.
   - Objective: Binary log-loss with focal loss reweighting for imbalanced bust events (busts represent ~10–15% of all verification days).

*Note: Graph Neural Networks (GNNs) or spatial CNNs can be incorporated in future phases to explicitly model spatial neighborhood dependencies across adjacent grid cells.*

---

## 5. Model Training & Validation Protocol
- **Temporal Split**: Strict rolling forward-chaining validation (e.g., train on 2015–2021 archives, validate on 2022, test on 2023–2024 seasons). **Random k-fold cross-validation is strictly avoided** to eliminate spatial and temporal leakage.
- **Spatial Stratification**: Validation across distinct synoptic zones (Monsoon Trough, Orographic Coastal strip, Peninsular Rain-Shadow, Gangetic Basin, Himalayan Foothills).

---

## 6. Model Calibration
Raw probabilities from gradient-boosted trees are often uncalibrated for extreme outliers.
- **Isotonic Regression / Platt Scaling**: Applied post-training on a held-out calibration partition.
- **Verification via Brier Score & Reliability Diagrams**: Ensures that when MausamDrishti states a 70% bust probability, approximately 70 out of 100 historical instances actually suffered an operational bust.

---

## 7. Explainable AI (XAI) & Meteorological Translation
Explainability is a core requirement of the decision-support system. Raw machine learning weights or technical feature names must not be presented to meteorological duty officers without context.

1. **TreeSHAP (Shapley Additive Explanations)**:
   Computes local additive feature attributions for every individual grid cell prediction:
   $$\text{BustProbability}(\mathbf{x}) = \phi_0 + \sum_{i=1}^M \phi_i(\mathbf{x})$$

2. **Plain-Language Translation Engine**:
   - `ensemble_spread > threshold` $\rightarrow$ *"Individual ensemble members disagree significantly on rainfall magnitude and pinpoint trajectory."*
   - `vorticity_tendency > threshold` $\rightarrow$ *"Atmospheric circulation is changing rapidly (high vorticity gradient at 850hPa)."*
   - `historical_analogue_bust_rate > threshold` $\rightarrow$ *"Current synoptic setup strongly resembles past forecast bust episodes."*
   - `upper_air_divergence > threshold` $\rightarrow$ *"Upper-tropospheric wave dynamics (200hPa jet anomalies) introduce growing medium-range uncertainty."*
