# Fuel-Forge 🚀⛽

An AI-powered fuel blending optimization platform that uses machine learning to predict fuel properties and optimize blend compositions for gasoline and diesel fuels.

## Overview

Fuel-Forge is a comprehensive solution for fuel engineers and researchers to predict and optimize fuel properties through intelligent blending. The system combines synthetic data generation, machine learning models, and an intuitive web interface to provide accurate fuel property predictions based on component compositions.

## Features

### 🔬 Synthetic Data Generation
- **Component Database**: Generates extensive databases of pure fuel components with realistic properties
- **Property Modeling**: Includes RON, MON, Cetane Number, density, heating values, and stability metrics
- **Chemical Families**: Covers n-alkanes, iso-alkanes, alkenes, aromatics, alcohols, and esters

### 🤖 AI-Powered Predictions
- **Gasoline Models**: Predicts RON, MON, AKI (Anti-Knock Index), density, and heating value
- **Diesel Models**: Predicts Cetane Number, density, heating value, and stability properties
- **Deep Learning**: Uses TensorFlow/Keras neural networks for accurate property prediction
- **GPU Acceleration**: Optimized for CUDA-enabled GPU training and inference

### 🌐 Web Interface
- **Interactive Dashboard**: React-based frontend for easy fuel blend composition
- **Real-time Predictions**: Instant property calculations as you adjust blend ratios
- **3D Visualizations**: Powered by React Three Fiber for immersive data representation
- **Export Capabilities**: Generate PDF reports and save blend configurations

### 📊 Advanced Analytics
- **Blend Optimization**: Automatically optimize component ratios for target properties
- **Property Visualization**: Interactive charts and graphs for property analysis
- **Component Search**: Filter and search through extensive component databases

## Project Structure

```
Fuel-Forge/
├── 1_generate_component_database.py    # Synthetic component data generation
├── 2_generate_training_blends.py       # Fuel blend training data generation
├── 3_train_ai_models.py               # AI model training pipeline
├── fuel_blends_training_data_v3.csv   # Generated training dataset
├── fuelai_backend/                    # Flask API backend
│   ├── app.py                         # Main Flask application
│   ├── models/                        # Trained ML models
│   └── pure_components_synthetic_data_v4.csv
└── fuelai-v2-frontend/                # React frontend
    ├── src/
    ├── public/
    ├── package.json
    └── README.md
```

## Installation

### Prerequisites

- Python 3.8+ with pip
- Node.js 16+ with npm
- CUDA-compatible GPU (optional, for faster training)

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AtharvRG/Fuel-Forge.git
   cd Fuel-Forge
   ```

2. **Install Python dependencies**:
   ```bash
   pip install pandas numpy scikit-learn tensorflow flask flask-cors joblib scipy
   ```

3. **Generate component database** (optional - pre-generated data included):
   ```bash
   python 1_generate_component_database.py
   ```

4. **Generate training blends** (optional):
   ```bash
   python 2_generate_training_blends.py
   ```

5. **Train AI models** (optional - pre-trained models included):
   ```bash
   python 3_train_ai_models.py
   ```

6. **Start the Flask backend**:
   ```bash
   cd fuelai_backend
   python app.py
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd fuelai-v2-frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the React development server**:
   ```bash
   npm start
   ```

4. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Quick Start

1. **Launch both backend and frontend** following the installation steps
2. **Navigate to the web interface** at http://localhost:3000
3. **Select fuel type** (Gasoline or Diesel)
4. **Choose components** from the available database
5. **Adjust blend ratios** using the interactive sliders
6. **View real-time predictions** of fuel properties
7. **Export results** as PDF reports

### API Endpoints

The backend provides RESTful API endpoints for integration:

- `GET /api/components` - Retrieve available fuel components
- `POST /api/predict/gasoline` - Predict gasoline properties
- `POST /api/predict/diesel` - Predict diesel properties
- `POST /api/optimize` - Optimize blend for target properties

### Data Pipeline

1. **Component Generation**: Creates realistic fuel component data with correlated properties
2. **Blend Generation**: Produces training data by mixing components in various ratios
3. **Model Training**: Trains neural networks on the synthetic blend data
4. **Prediction**: Uses trained models to predict properties of new fuel blends

## Technology Stack

### Backend
- **Python**: Core programming language
- **TensorFlow/Keras**: Deep learning framework
- **Flask**: Web framework for API
- **Pandas/NumPy**: Data manipulation and analysis
- **Scikit-learn**: Machine learning utilities

### Frontend
- **React**: User interface framework
- **React Three Fiber**: 3D visualizations
- **Ant Design**: UI component library
- **Framer Motion**: Animations
- **Axios**: HTTP client for API calls

### Machine Learning
- **Neural Networks**: Multi-layer perceptrons for property prediction
- **StandardScaler**: Feature normalization
- **OneHotEncoder**: Categorical variable encoding
- **GPU Acceleration**: CUDA support for faster training

## Model Performance

The AI models achieve high accuracy on fuel property predictions:

- **Gasoline Properties**: R² > 0.95 for RON, MON, density
- **Diesel Properties**: R² > 0.93 for Cetane Number, density
- **Training Time**: ~10-30 minutes on GPU for full dataset
- **Inference Speed**: <100ms per prediction

## Contributing

We welcome contributions to Fuel-Forge! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript/React
- Add unit tests for new features

## Acknowledgments

- **Fuel Property Correlations**: Based on established petroleum engineering relationships
- **Machine Learning**: Leverages TensorFlow and Scikit-learn ecosystems
- **Synthetic Data**: Uses realistic property bounds and chemical family trends
- **Open Source**: Built with and contributes to the open source community

## Contact

- **Project Maintainer**: AtharvRG
- **Repository**: [https://github.com/AtharvRG/Fuel-Forge](https://github.com/AtharvRG/Fuel-Forge)
- **Issues**: [https://github.com/AtharvRG/Fuel-Forge/issues](https://github.com/AtharvRG/Fuel-Forge/issues)


---

**Made with ❤️**
**Testing out PR-Bot**
**Testing this thing again**

**What Will be the output of this PR's take your guesses**
**Pls chal ja yaaaar**
