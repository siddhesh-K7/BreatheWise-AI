# AirWise Impact Methodology & Calculation Models (METHODOLOGY.md)

This document provides mathematical formulations, empirical coefficients, and peer-reviewed literature citations powering the deterministic impact calculations in **AirWise**.

---

## 1. Principles of Impact Calculation

In compliance with the system design principle **"The LLM explains; code calculates"**, all quantification of health risks, inhaled particle mass reductions, cigarette equivalents, and greenhouse gas mitigations are calculated deterministically by pure TypeScript routines in `src/services/impact-calculator.ts`. Generative AI provides contextual synthesis, human-readable explanations, and personalized habit guidance without generating ungrounded mathematical claims.

---

## 2. Particulate Matter Exposure Reduction

### 2.1 Inhaled Particulate Dose
The inhaled daily dose of $PM_{2.5}$ is calculated via the standard inhalation dosimetry equation:

$$D_{PM2.5} = \sum_{k=1}^{N} \left[ C_k \times (1 - \eta_k) \times V_{in} \times t_k \right]$$

Where:
- $D_{PM2.5}$ = Cumulative inhaled fine particulate mass ($\mu\text{g}$).
- $C_k$ = Ambient or indoor $PM_{2.5}$ concentration during activity segment $k$ ($\mu\text{g/m}^3$).
- $\eta_k$ = Effective fractional filtration or intervention efficiency ($0.0 \le \eta_k < 1.0$).
- $V_{in}$ = Minute ventilation rate normalized to hourly volume ($\text{m}^3/\text{hour}$).
  - At rest / indoor desk work: $0.45\text{–}0.60\text{ m}^3/\text{h}$.
  - Moderate urban walking / transit: $1.0\text{–}1.4\text{ m}^3/\text{h}$.
  - Strenuous outdoor exertion / cycling: $2.0\text{–}3.0\text{ m}^3/\text{h}$.
- $t_k$ = Duration of exposure segment in hours.

### 2.2 Intervention Filtration Efficiencies ($\eta$)
| Intervention | Efficiency ($\eta$) | Citations & Empirical Basis |
|---|---|---|
| **True HEPA Air Purifier (CADR-matched)** | $0.80$ (80% indoor reduction) | Shaughnessy & Sextro (2006); EPA Residential Air Cleaners Guide (2018). Assumes closed room boundaries and appropriate Clean Air Delivery Rate (CADR). |
| **DIY Box Fan + MERV 13 Filter (Under INR 500)** | $0.65$ (65% indoor reduction) | Corsi-Rosenthal Foundation Studies; Sublett et al. (2020). Low-cost alternative to commercial purifiers. |
| **Certified N95 / FFP2 Mask Outdoors** | $0.85$ (85% reduction) | Dahlke et al. (2021); CDC NIOSH Testing Protocols. Reflects realistic human facial fit factor in real-world commuting. |
| **Shift Outdoor Exercise to Low-Smog Window** | $0.40$ (40% exposure drop) | Central Pollution Control Board (CPCB) Diurnal Winter Pollution Profiles (peak inversion between 06:00–09:00 and 19:00–22:00 vs afternoon dip 13:00–16:00). |
| **Wet Mopping & Door Seal Draft Stoppers** | $0.20$ (20% coarse/fine particle reduction) | WHO Indoor Air Quality Guidelines (2021). Damp cleaning prevents secondary particle resuspension. |

---

## 3. Cigarette Equivalence Model

To make invisible, microscopic particulate matter intuitively understandable for families, AirWise utilizes the peer-reviewed **Berkeley Earth Cigarette Equivalence Metric** formulated by Muller & Muller (2015):

$$\text{Cigarettes/day} = \frac{\text{Daily Mean } PM_{2.5} \text{ Exposure } (\mu\text{g/m}^3)}{22}$$

### 3.1 Empirical Basis
- Inhaling $22\text{ }\mu\text{g/m}^3$ of $PM_{2.5}$ continuously over a 24-hour period produces systemic inflammatory, vascular, and oxidative stress biomarkers roughly equivalent to directly smoking **one conventional tobacco cigarette**.
- For an episodic ambient $PM_{2.5}$ level of $220\text{ }\mu\text{g/m}^3$ (frequent during severe North Indian winter smog), staying outdoors unprotected is roughly equivalent to smoking **10 cigarettes per day**.

### 3.2 Avoided Exposure Equivalence
The daily avoided cigarette equivalence achieved by adopting recommended interventions is:

$$\Delta\text{Cigarettes} = \frac{\sum_k \left[ C_k \times \eta_k \times t_k \right]}{24 \times 22}$$

---

## 4. Carbon Dioxide ($CO_2$) & Emissions Avoidance

Sustainable routines not only shield individual lungs but also suppress community-level emissions.

### 4.1 Urban Transit Emission Factors
Based on India GHG Programme emission factor databases and Central Pollution Control Board (CPCB) urban transport studies:

| Commute Mode | Emission Factor ($EF$) | Assumed Fuel / Tech |
|---|---|---|
| **Solo Petrol Car (Sedan/SUV)** | $160\text{ g } CO_2/\text{passenger-km}$ | BS-VI 1.5L Petrol, single occupant |
| **Solo Two-Wheeler (Motorcycle/Scooter)** | $55\text{ g } CO_2/\text{passenger-km}$ | BS-VI 125cc Petrol 2-wheeler |
| **Carpool (3 occupants)** | $53\text{ g } CO_2/\text{passenger-km}$ | Split occupancy shared sedan |
| **Electric Urban Metro Rail** | $18\text{ g } CO_2/\text{passenger-km}$ | Grid-average Indian electricity mix |
| **Electric Bus / Shared Transit** | $25\text{ g } CO_2/\text{passenger-km}$ | Urban EV transit fleet |
| **Bicycle / Walking** | $0\text{ g } CO_2/\text{passenger-km}$ | Zero tailpipe and lifecycle operations |

$$\Delta CO_2\text{ (kg)} = \frac{D_{\text{commute}} \times \left( EF_{\text{current}} - EF_{\text{alternative}} \right)}{1000}$$

For a standard $20\text{ km}$ daily round-trip commute, transitioning from a solo petrol car ($160\text{ g/km}$) to the metro ($18\text{ g/km}$) saves:

$$\Delta CO_2 = \frac{20 \times (160 - 18)}{1000} = 2.84\text{ kg } CO_2/\text{day}$$

---

## 5. Winter Inversion & Atmospheric Dispersion

During North Indian winter conditions (November–January), ground-level radiational cooling triggers a **temperature inversion**: warm air caps cooler air at the surface, suppressing vertical atmospheric mixing (Boundary Layer Height $< 250\text{ m}$). Combined with calm surface wind speeds ($< 5\text{ km/h}$), local emissions from vehicular exhaust, heating, and agricultural residue burning remain trapped near breathing height.

AirWise queries real-time Open-Meteo meteorological parameters (wind speed, boundary layer height, temperature, surface pressure) to calculate a **Smog Dispersion Index (SDI)**:

$$\text{SDI} = \frac{v_{\text{wind}}\text{ (m/s)} \times H_{\text{boundary}}\text{ (m)}}{100}$$

- **SDI $< 2.0$**: Critical Inversion — Trapped severe smog; strict indoor confinement advised.
- **SDI $2.0\text{–}6.0$**: Moderate Dispersion — Intermittent afternoon ventilation window.
- **SDI $> 6.0$**: Favorable Dispersion — Lower stagnant accumulation.

---

## 6. Verification & Test Harness

All equations are codified as pure TypeScript functions with zero side-effects in `src/services/impact-calculator.ts` and exhaustively verified against known test fixtures in `tests/unit/impact-calculator.test.ts`.
