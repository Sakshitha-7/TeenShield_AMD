
# TeenShield – AI-Powered Financial Protection for Teens

## 🚀 Overview

TeenShield is a full-stack AI-driven financial safety platform designed to protect teenagers from becoming victims — or accidental participants — in digital financial fraud.

With the rapid rise of crypto scams, quick-profit trading apps, and cross-state mule account traps, teenagers are increasingly exposed to financial risks. TeenShield proactively detects risky patterns before transactions are completed.

The system combines:
- Machine Learning risk detection
- Real-time transaction evaluation
- Teen & Parent dashboards
- Preventive alert mechanisms
- Simulated parental approval workflow

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Bun** (optional, for faster package management) - [Download](https://bun.sh/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **Git** - [Download](https://git-scm.com/)

---

## 📁 Project Structure

```
TeenShield_Modified_Project/
├── frontend/                 # React + Vite web application
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                  # FastAPI Python server
│   ├── main.py              # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   ├── data/                # Training datasets
│   └── saved_models/        # Pre-trained ML models
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/TeenShield.git
cd TeenShield_Modified_Project
```

### 2️⃣ Backend Setup (FastAPI + ML Models)

#### Step 1: Create Python Virtual Environment

```bash
cd backend

# On Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Step 3: Run Backend Server

```bash
# From the backend directory
python main.py

# OR using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: **http://localhost:8000**

API Documentation available at: **http://localhost:8000/docs** (Swagger UI)

---

### 3️⃣ Frontend Setup (React + Vite)

#### Step 1: Navigate to Project Root

```bash
# From backend directory, go back to root
cd ..
```

#### Step 2: Install Node Dependencies

```bash
# Using npm
npm install

# OR using bun (faster)
bun install
```

#### Step 3: Start Development Server

```bash
# Using npm
npm run dev

# OR using bun
bun run dev
```

The frontend will be available at: **http://localhost:8080**

---

## 🔧 Environment Configuration

### Frontend Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=TeenShield
```

### Backend Environment Variables (Optional)

If needed, create a `.env` file in the `backend` directory:

```env
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:8080,http://localhost:3000
```

---

## 📊 Available Scripts

### Frontend Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Watch mode for tests
npm run test:watch

# Lint code
npm run lint
```

### Backend Scripts

```bash
# Run with auto-reload
python main.py

# Run with uvicorn directly
uvicorn main:app --reload

# Run in production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🧠 System Architecture

### Frontend (Web Application)
- React 18 with TypeScript
- Vite for fast bundling
- Tailwind CSS for styling
- React Router for navigation
- React Query for API calls
- Shadcn/ui components for UI

**Features:**
- Teen Login
- Parent Login
- Teen Dashboard
- Parent Monitoring Dashboard
- Send Money Interface
- Alerts & Notifications
- Risk Meter Visualization

### Backend (FastAPI)
- FastAPI for REST API
- Uvicorn as ASGI server
- Scikit-learn for ML models
- Pandas & NumPy for data processing
- Pydantic for validation

**Endpoints:**
- `/predict-transaction` - Risk assessment
- `/health` - Health check
- Full API documentation at `/docs`

---

## 📈 ML Models

The backend loads pre-trained machine learning models from `backend/saved_models/`:
- **Model 1:** Mule Account Detection
- **Model 2:** Crypto Scam Risk Assessment
- **Model 3:** Transaction Pattern Analysis
- **Model 4:** Fraud Risk Classification

Models are trained on synthetic datasets:
- `sender_behavior_dataset.csv`
- `teen_behavior_dataset.csv`
- `transaction_pattern_dataset.csv`

---

## 🧪 Testing

### Run Frontend Tests

```bash
npm run test
npm run test:watch
```

### Test API Endpoints

Use Swagger UI documentation at: **http://localhost:8000/docs**

---

## 🚀 Production Deployment

### Frontend Build

```bash
npm run build
```

Output is in the `dist/` folder, ready for deployment to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

### Backend Deployment

```bash
# Using gunicorn (recommended for production)
pip install gunicorn
gunicorn main:app -w 4 -b 0.0.0.0:8000

# Or deploy to:
# - Railway
# - Heroku
# - AWS Lambda (with serverless)
# - Google Cloud Run
```

---

## 🔐 Security Notes

- ✅ CORS enabled for API communication
- ✅ Request validation with Pydantic
- ✅ Input sanitization on frontend
- ⚠️ For production, set proper CORS origins
- ⚠️ Enable HTTPS in production
- ⚠️ Use environment variables for sensitive data

---

## 📱 Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 🛠️ Troubleshooting

### Backend Fails to Start

```bash
# Check Python version
python --version

# Check if port 8000 is available
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows
```

### Frontend Build Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### CORS Issues

Ensure both services are running:
- Backend: http://localhost:8000
- Frontend: http://localhost:8080

Check `.env.local` environment variables.

### Port Already in Use

```bash
# Change port in vite.config.ts or use different port
npm run dev -- --port 3000
```

---

## 📚 Documentation

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui Components](https://ui.shadcn.com/)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open-source. Check the LICENSE file for details.

---

## 📌 Disclaimer

TeenShield is developed as a financial safety tool. It provides risk assessments based on ML models and should not be considered as financial advice. Always consult with actual financial institutions for critical decisions.

---

## 👥 Authors & Contributors

Developed as part of a hackathon project focused on AI-driven financial protection for teenagers.

---

## 💡 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation at `/docs` endpoint

---

**Made with ❤️ for Teen Financial Safety**

- Returns structured risk prediction
- Supports fallback rule engine for demo resilience

---

### 3️⃣ Machine Learning Engine

Three-model stacked architecture:

1. Mule Risk Model  
   Detects likelihood of mule account behavior.

2. Freeze Risk Model  
   Predicts probability of account freeze based on behavioral signals.

3. Meta Risk Model  
   Combines outputs of previous models to compute final risk score and level.

The models are trained on synthetic datasets simulating:
- Teen behavioral patterns
- Sender behavioral patterns
- Transaction velocity & cross-state risk indicators

---

## ⚙ Features

- Real-time risk scoring before transaction completion
- Teen-friendly risk visualization
- Parent oversight simulation
- Cross-state transaction flagging
- Cooldown mechanism for high-risk behavior
- Fallback rule engine for uninterrupted demo

---

## 📊 Machine Learning Highlights

- XGBoost-based classification models
- Stratified Cross-Validation
- Hyperparameter tuning
- Class imbalance handling
- Feature importance tracking
- Model stacking approach

---

## 🔒 Why TeenShield Matters

Instead of reacting to fraud after damage occurs, TeenShield introduces an early-warning and education-based approach to financial safety for teenagers.

The goal is not only fraud detection — but financial awareness and prevention.

---

## 🛠 Tech Stack

Frontend:
- React
- Vite
- TailwindCSS

Backend:
- FastAPI
- Python
- XGBoost
- scikit-learn

---

## 🌐 Deployment

Backend can be deployed on:
- Render
- Railway
- AWS

Frontend can be deployed on:
- Netlify
- Vercel

---

## 📌 Disclaimer

All datasets used are synthetic and generated for research and demonstration purposes only. No real financial or personal data is used.

---

## 👩‍💻 Author

Developed as part of a hackathon project focused on AI-driven financial protection for teenagers.
