# SignFlow 🇲🇾

**SignFlow** is an interactive, browser-based AI tutor for **Malaysian Sign Language (Bahasa Isyarat Malaysia – BIM)** fingerspelling.

Acting as a real-time **driving instructor for your hands**, SignFlow tracks hand landmarks directly via your webcam, compares your pose against a benchmark dataset of BIM signs, evaluates individual finger positions, and provides instant, encouraging feedback powered by **Cikgu AI**.

---

## Key Numbers & Specifications

| Metric | Value | Description |
| :--- | :--- | :--- |
| **Supported Signs** | **33 classes** | 9 digits (`1–9`) + 24 static alphabet letters (`A–Y`, excluding dynamic signs `J` & `Z`) |
| **Dataset Size** | **25,946 samples** | Benchmark BIM landmark dataset (`landmarks.csv`) |
| **Dataset Splits** | **20,848 / 2,526 / 2,572** | Train (80.4%), Validation (9.7%), and Test (9.9%) splits |
| **In-Browser Model** | **4,950 vectors** | 150 curated prototype vectors per sign in `model.json` (6.4 MB) |
| **Feature Dimensions** | **63 coordinates** | 21 hand landmarks × 3 spatial axes ($x, y, z$) |
| **Classifier** | **k-NN ($k = 5$)** | Sub-millisecond cosine & Euclidean distance classification in WebAssembly/JS |
| **Tracking Pipeline** | **21 3D landmarks** | Real-time palm and finger joint extraction via MediaPipe Vision Bundle |
| **Frame Rate** | **Up to 60 FPS** | Zero-latency client-side tracking running entirely in the browser |
| **Hold-to-Master** | **~1,000 ms** | Required continuous correct hold duration before sign registers as mastered |
| **AI Coach Latency** | **< 400 ms** | Fast natural-language feedback via Groq LPUs (`qwen/qwen3.8-27b` / `llama-3.3-70b-versatile`) |
| **Coaching Cooldown** | **4,000 ms** | Rate-limiting interval to prevent cognitive fatigue and coaching spam |
| **Curriculum Scope** | **7 structured levels** | Progressive learning groups (5 signs per level) |
| **User Privacy** | **100% Client-Side** | Zero video frames sent to servers; progress saved in local `localStorage` |

---

## The Problem

Malaysian Sign Language (BIM) learners frequently practice alone between classes without access to a certified instructor. Without real-time corrections:
1. Subtle errors (e.g., thumb tucked under fingers in `E` vs. across knuckles in `S`) go unnoticed.
2. Learners build muscle memory around incorrect hand postures.
3. Traditional static diagrams fail to convey finger depth, thumb opposition, and orientation.

SignFlow bridges this gap with an automated, responsive learning loop.

---

## Core System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER (Zero Install)                   │
│                                                                        │
│   Webcam Stream (60 FPS)                                               │
│         │                                                              │
│         ▼                                                              │
│   MediaPipe Vision ──► 21 3D Hand Landmarks                            │
│         │                                                              │
│         ├──────────────► 63D Coordinate Normalization                  │
│         │                     │                                        │
│         │                     ▼                                        │
│         │               k-NN Classifier (k=5, 4,950 samples)           │
│         │                     │                                        │
│         │                     ▼                                        │
│         │               Predicted Sign + Confidence Score              │
│         │                                                              │
│         └──────────────► 5-Finger Geometric Rule Engine (T, I, M, R, P)│
│                               │                                        │
│                               ▼                                        │
│                         Per-Finger Error Detection                     │
│                               │                                        │
│    ┌──────────────────────────┴──────────────────────────┐             │
│    ▼                                                     ▼             │
│ Visual Stage UI                                    Cikgu AI Engine     │
│ • Ghost Hand Overlay (25% opacity)                 • Single-finger fix │
│ • Dual-View Reference Skeleton                     • Rate-limited POST │
│ • 5-Dot Finger Status Bar                                │             │
└──────────────────────────────────────────────────────────┼─────────────┘
                                                           │
                                             POST /api/coach (<400ms)
                                                           │
                                                           ▼
                                               ┌───────────────────────┐
                                               │      Groq Cloud       │
                                               │   LLM Inference LPU   │
                                               │ (Qwen / Llama-3.3-70B)│
                                               └───────────────────────┘
```

---

## Detailed Features

### 1. Real-Time Computer Vision & Ghost Overlay
- **21-Point Hand Skeleton**: Visualizes thumb, index, middle, ring, and pinky joints with color-coded bones and fingertip badges.
- **Ghost Stencil Guide**: Semi-transparent 25% opacity target silhouette overlaid on the webcam box to guide hand positioning and scale.
- **Adaptive Normalization**: Translates wrist coordinate $(x_0, y_0, z_0)$ to origin and normalizes palm span to ensure tracking works regardless of hand size or camera distance.

### 2. Dual-Engine Pose Verification
- **k-NN Landmark Classifier**: Matches current 63D landmark vector against 4,950 canonical samples across all 33 signs.
- **Geometric Finger Check**: Checks each of the 5 fingers independently:
  - **T** (Thumb): Base abduction, tip tuck, and knuckle opposition.
  - **I** (Index): Extension angle, MCP curl, and lateral deviation.
  - **M** (Middle): Extension vs. tuck relative to index.
  - **R** (Ring): Extension vs. curl.
  - **P** (Pinky): Full extension (e.g., `I`, `Y`) vs. compact fist.
- **No False Positives**: Both the landmark classifier and geometric finger checks must pass before the sign progress ring begins filling.

### 3. Cikgu AI — Focused Single-Finger Tutor
- **One Fix at a Time**: When multiple fingers need adjustment, Cikgu AI identifies the single worst error to prevent cognitive overload.
- **Concise Instructions**: Delivers 1–2 actionable, encouraging sentences (e.g., *"Straighten your index finger and keep the others tucked."*).
- **Dual Language**: Seamlessly switches between English and Bahasa Malaysia (`en` / `ms`).
- **Low Latency**: Powered by Groq LPU inference, responding in under 400ms.

### 4. Interactive Target Pose Card
- **Full Anatomical Skeleton**: Features palm boundary arcs, joint nodes, and labeled badges (`T`, `I`, `M`, `R`, `P`).
- **Mirrored vs. Teacher View**: One-click toggle between mirrored view (matching user webcam) and teacher view (canonical frontal perspective).
- **Collapsible & Responsive**: Expands to match camera height on desktop displays and stacks neatly on mobile viewports.

### 5. Curriculum & Progress Tracking
- **7 Progressive Levels**:
  - **Level 1**: Numbers `1` to `5`
  - **Level 2**: Numbers `6` to `9` & Letter `A`
  - **Level 3**: Letters `B` to `F`
  - **Level 4**: Letters `G` to `L`
  - **Level 5**: Letters `M` to `Q`
  - **Level 6**: Letters `R` to `V`
  - **Level 7**: Letters `W` to `Y`
- **Streak & Mastery Engine**: Tracks daily streaks, signs mastered (out of 33), and overall accuracy percentage via browser `localStorage`.

---

## Dataset & Model Specifications

| Attribute | Specification |
| :--- | :--- |
| **Raw Dataset File** | [`landmarks.csv`](./landmarks.csv) (12.5 MB) |
| **Total Rows** | **25,946** annotated hand frames |
| **Columns** | 65 columns (`split`, `label`, `x0..z20`) |
| **Train Set** | **20,848 rows** (80.4%) |
| **Validation Set** | **2,526 rows** (9.7%) |
| **Test Set** | **2,572 rows** (9.9%) |
| **Optimized Model File**| [`model.json`](./model.json) (6.4 MB) |
| **Deployed Samples** | **4,950 vectors** (150 per class) |
| **Sign List (33)** | `1, 2, 3, 4, 5, 6, 7, 8, 9, A, B, C, D, E, F, G, H, I, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y` |

---

## API Reference: Cikgu AI

### `POST /api/coach`

Generates real-time targeted coaching tips.

#### Request Body (JSON)
```json
{
  "sign": "B",
  "cue": "Four fingers straight up and pressed together, thumb tucked across palm.",
  "predicted": "5",
  "errors": [
    { "finger": "Thumb", "issue": "Thumb not tucked across palm" },
    { "finger": "Middle", "issue": "Spread too far from index" }
  ],
  "lang": "en"
}
```

#### Response (JSON)
```json
{
  "tip": "Tuck your thumb across your palm so your hand looks like a flat paddle for B."
}
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher.
- A modern browser with WebRTC webcam support (Chrome, Edge, Firefox, Safari).
- A free [Groq API Key](https://console.groq.com/keys) (optional for AI coaching tips).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Risikesan26/AgroSignal.git
   cd AgroSignal
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=qwen/qwen3.8-27b
   PORT=8000
   ```

3. **Start the Application**:
   ```bash
   node server.mjs
   ```

4. **Open in Browser**:
   Navigate to:
   ```text
   http://localhost:8000
   ```

---

## Technology Stack

- **Frontend**: Vanilla HTML5, Modern CSS (Glassmorphism, CSS Grid, Custom Tokens), ES6+ JavaScript modules.
- **Vision Pipeline**: Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision@0.10.14`).
- **Machine Learning**: Custom in-browser k-NN classifier running on normalized 63D landmark vectors.
- **Backend / API**: Node.js HTTP microserver (`server.mjs`) & Vercel Serverless Function (`api/coach.js`).
- **AI Inference**: Groq LPU Cloud Inference API (`qwen/qwen3.8-27b` / `llama-3.3-70b-versatile`).
- **Storage**: Client-side HTML5 `localStorage` (Zero server-side database required).

---

## License

MIT License. Designed with ❤️ for the Malaysian Deaf & Hard-of-Hearing community.
