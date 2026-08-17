import os
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.batch_prediction import run_batch_prediction
from app.scheduler import start_scheduler, stop_scheduler


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

PROCESSED_DIR = os.path.join(
    BASE_DIR,
    "data",
    "processed"
)

RISK_FILE = os.path.join(
    PROCESSED_DIR,
    "waste_risk_scores.csv"
)

REORDER_FILE = os.path.join(
    PROCESSED_DIR,
    "reorder_recommendations.csv"
)

LSTM_FORECAST_FILE = os.path.join(
    PROCESSED_DIR,
    "lstm_forecast.csv"
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Food Redistribution Service",
    description=(
        "AI service for demand forecasting, "
        "waste-risk prediction and smart "
        "reorder recommendations."
    ),
    version="1.0.0"
)


# ============================================================
# SCHEDULER STARTUP / SHUTDOWN
# ============================================================

@app.on_event("startup")
def startup_event():

    start_scheduler()


@app.on_event("shutdown")
def shutdown_event():

    stop_scheduler()


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "service": "AI Food Redistribution Service",
        "status": "running",
        "version": "1.0.0"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "ai-service"
    }


# ============================================================
# DEMAND FORECAST
# ============================================================

@app.get("/predict/demand")
def predict_demand():

    if not os.path.exists(
            LSTM_FORECAST_FILE
    ):

        raise HTTPException(
            status_code=404,
            detail="Demand forecast not available."
        )

    forecast = pd.read_csv(
        LSTM_FORECAST_FILE
    )

    records = forecast.to_dict(
        orient="records"
    )

    return {
        "model": "LSTM",
        "forecast_days": len(records),
        "forecast": records
    }


# ============================================================
# WASTE RISK
# ============================================================

@app.get("/predict/waste-risk")
def predict_waste_risk():

    if not os.path.exists(
            RISK_FILE
    ):

        raise HTTPException(
            status_code=404,
            detail="Waste risk dataset not available."
        )

    risk_data = pd.read_csv(
        RISK_FILE
    )

    risk_data["date"] = pd.to_datetime(
        risk_data["date"]
    )

    latest = (
        risk_data
        .sort_values("date")
        .groupby(
            "food_id",
            as_index=False
        )
        .tail(1)
    )

    records = latest.to_dict(
        orient="records"
    )

    return {
        "model": "XGBoost",
        "products": len(records),
        "risk_predictions": records
    }


# ============================================================
# REORDER RECOMMENDATION
# ============================================================

@app.get("/recommend/reorder")
def recommend_reorder():

    if not os.path.exists(
            REORDER_FILE
    ):

        raise HTTPException(
            status_code=404,
            detail=(
                "Reorder recommendations "
                "not available."
            )
        )

    recommendations = pd.read_csv(
        REORDER_FILE
    )

    records = recommendations.to_dict(
        orient="records"
    )

    return {
        "recommendations": records,
        "products": len(records)
    }


# ============================================================
# PRODUCT-SPECIFIC WASTE RISK
# ============================================================

@app.get("/predict/waste-risk/{food_id}")
def product_waste_risk(
        food_id: int
):

    if not os.path.exists(
            RISK_FILE
    ):

        raise HTTPException(
            status_code=404,
            detail="Risk dataset not available."
        )

    risk_data = pd.read_csv(
        RISK_FILE
    )

    risk_data["date"] = pd.to_datetime(
        risk_data["date"]
    )

    product = risk_data[
        risk_data["food_id"] == food_id
        ]

    if product.empty:

        raise HTTPException(
            status_code=404,
            detail="Food product not found."
        )

    latest = (
        product
        .sort_values("date")
        .tail(1)
    )

    return {
        "food_id": food_id,
        "prediction": latest.to_dict(
            orient="records"
        )[0]
    }


# ============================================================
# PRODUCT-SPECIFIC REORDER
# ============================================================

@app.get("/recommend/reorder/{food_id}")
def product_reorder(
        food_id: int
):

    if not os.path.exists(
            REORDER_FILE
    ):

        raise HTTPException(
            status_code=404,
            detail=(
                "Reorder recommendations "
                "not available."
            )
        )

    recommendations = pd.read_csv(
        REORDER_FILE
    )

    product = recommendations[
        recommendations["food_id"] == food_id
        ]

    if product.empty:

        raise HTTPException(
            status_code=404,
            detail="Food product not found."
        )

    return {
        "food_id": food_id,
        "recommendation": product.iloc[
            0
        ].to_dict()
    }


# ============================================================
# BATCH SUMMARY
# ============================================================

@app.get("/batch/summary")
def batch_summary():

    result = {
        "demand_forecast": os.path.exists(
            LSTM_FORECAST_FILE
        ),
        "waste_risk": os.path.exists(
            RISK_FILE
        ),
        "reorder_recommendation": os.path.exists(
            REORDER_FILE
        )
    }

    return {
        "batch_prediction_status": result
    }


# ============================================================
# RUN BATCH PREDICTION
# ============================================================

@app.post("/batch/run")
def run_batch():

    try:

        run_batch_prediction()

        return {
            "status": "success",
            "message": (
                "Batch prediction completed successfully."
            )
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )