import os
import math

import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.batch_prediction import run_batch_prediction
from app.scheduler import start_scheduler, stop_scheduler


# ============================================================
# APPLICATION PATHS
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


# ============================================================
# DATA FILES
# ============================================================

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

    version="2.0.0"
)


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
# STARTUP
# ============================================================

@app.on_event("startup")
def startup_event():

    try:

        start_scheduler()

        print(
            "AI batch scheduler started."
        )

    except Exception as error:

        print(
            "Scheduler startup warning:",
            error
        )


# ============================================================
# SHUTDOWN
# ============================================================

@app.on_event("shutdown")
def shutdown_event():

    try:

        stop_scheduler()

        print(
            "AI batch scheduler stopped."
        )

    except Exception as error:

        print(
            "Scheduler shutdown warning:",
            error
        )


# ============================================================
# JSON CLEANING HELPER
# ============================================================

def clean_records(records):
    """
    Convert pandas/numpy values into JSON-safe
    Python values.
    """

    cleaned = []

    for record in records:

        cleaned_record = {}

        for key, value in record.items():

            # ------------------------------------------------
            # None
            # ------------------------------------------------

            if value is None:

                cleaned_record[key] = None

                continue


            # ------------------------------------------------
            # NaN / Infinity
            # ------------------------------------------------

            if isinstance(
                    value,
                    float
            ):

                if (
                        math.isnan(value)
                        or
                        math.isinf(value)
                ):

                    cleaned_record[key] = None

                else:

                    cleaned_record[key] = value

                continue


            # ------------------------------------------------
            # Numpy / pandas scalar
            # ------------------------------------------------

            if hasattr(
                    value,
                    "item"
            ):

                try:

                    cleaned_record[key] = (
                        value.item()
                    )

                    continue

                except Exception:

                    pass


            # ------------------------------------------------
            # Timestamp
            # ------------------------------------------------

            if isinstance(
                    value,
                    pd.Timestamp
            ):

                cleaned_record[key] = (
                    value.strftime(
                        "%Y-%m-%d"
                    )
                )

                continue


            # ------------------------------------------------
            # Default
            # ------------------------------------------------

            cleaned_record[key] = value


        cleaned.append(
            cleaned_record
        )


    return cleaned


# ============================================================
# LOAD WASTE-RISK DATASET
# ============================================================

def load_risk_dataset():

    """
    Load the latest live waste-risk dataset.

    This file is generated by:
        app/waste_risk_model.py
    """

    if not os.path.exists(
            RISK_FILE
    ):

        raise HTTPException(

            status_code=404,

            detail=(
                "Waste risk dataset not available. "
                "Run waste_risk_model.py first."
            )
        )


    try:

        risk_data = pd.read_csv(
            RISK_FILE
        )

    except Exception as error:

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to read waste risk dataset: "
                f"{error}"
            )
        )


    if risk_data.empty:

        raise HTTPException(

            status_code=404,

            detail="Waste risk dataset is empty."
        )


    # --------------------------------------------------------
    # Normalize food_id
    # --------------------------------------------------------

    if "food_id" in risk_data.columns:

        risk_data["food_id"] = pd.to_numeric(

            risk_data["food_id"],

            errors="coerce"
        )


    return risk_data


# ============================================================
# LOAD REORDER DATASET
# ============================================================

def load_reorder_dataset():

    if not os.path.exists(
            REORDER_FILE
    ):

        raise HTTPException(

            status_code=404,

            detail=(
                "Reorder recommendation dataset "
                "not available."
            )
        )


    try:

        reorder_data = pd.read_csv(
            REORDER_FILE
        )

    except Exception as error:

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to read reorder recommendation "
                f"dataset: {error}"
            )
        )


    if reorder_data.empty:

        raise HTTPException(

            status_code=404,

            detail=(
                "Reorder recommendation dataset "
                "is empty."
            )
        )


    if "food_id" in reorder_data.columns:

        reorder_data["food_id"] = pd.to_numeric(

            reorder_data["food_id"],

            errors="coerce"
        )


    return reorder_data


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {

        "service":
            "AI Food Redistribution Service",

        "status":
            "running",

        "version":
            "2.0.0",

        "features": [

            "Demand Forecasting",

            "Waste Risk Prediction",

            "Smart Reorder Recommendation",

            "Batch Prediction",

            "Scheduled AI Prediction"

        ]

    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {

        "status":
            "healthy",

        "service":
            "ai-service",

        "waste_risk_dataset":
            os.path.exists(
                RISK_FILE
            ),

        "reorder_dataset":
            os.path.exists(
                REORDER_FILE
            ),

        "demand_forecast":
            os.path.exists(
                LSTM_FORECAST_FILE
            )

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

            detail=(
                "Demand forecast is not available. "
                "Run the demand forecasting model first."
            )
        )


    try:

        forecast = pd.read_csv(

            LSTM_FORECAST_FILE
        )

    except Exception as error:

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to read demand forecast: "
                f"{error}"
            )
        )


    if forecast.empty:

        raise HTTPException(

            status_code=404,

            detail="Demand forecast dataset is empty."
        )


    records = clean_records(

        forecast.to_dict(
            orient="records"
        )
    )


    return {

        "success":
            True,

        "model":
            "LSTM",

        "products":
            len(records),

        "forecast":
            records

    }


# ============================================================
# ALL WASTE-RISK PREDICTIONS
# ============================================================

@app.get("/predict/waste-risk")
def predict_waste_risk():

    risk_data = load_risk_dataset()


    # --------------------------------------------------------
    # Remove duplicate food IDs.
    #
    # The generated CSV is a LIVE snapshot.
    # We keep the latest record.
    # --------------------------------------------------------

    if "food_id" in risk_data.columns:

        risk_data = (

            risk_data

            .drop_duplicates(

                subset=[
                    "food_id"
                ],

                keep="last"
            )

        )


    # --------------------------------------------------------
    # Sort by food ID
    # --------------------------------------------------------

    if "food_id" in risk_data.columns:

        risk_data = (

            risk_data

            .sort_values(
                "food_id"
            )
        )


    records = clean_records(

        risk_data.to_dict(
            orient="records"
        )
    )


    # --------------------------------------------------------
    # Calculate summary
    # --------------------------------------------------------

    high = 0

    moderate = 0

    low = 0


    if "predicted_risk_category" in risk_data.columns:

        categories = (

            risk_data[
                "predicted_risk_category"
            ]

            .astype(str)
            .str.upper()
        )


        high = int(
            (
                    categories
                    == "HIGH"
            ).sum()
        )


        moderate = int(
            (
                    categories
                    == "MODERATE"
            ).sum()
        )


        low = int(
            (
                    categories
                    == "LOW"
            ).sum()
        )


    return {

        "success":
            True,

        "model":
            "XGBoost",

        "products":
            len(records),

        "summary": {

            "high":
                high,

            "moderate":
                moderate,

            "low":
                low

        },

        "risk_predictions":
            records

    }


# ============================================================
# SINGLE PRODUCT WASTE RISK
# ============================================================

@app.get("/predict/waste-risk/{food_id}")
def product_waste_risk(
        food_id: int
):

    # --------------------------------------------------------
    # IMPORTANT:
    #
    # This uses EXACTLY the same CSV as the bulk endpoint.
    #
    # Therefore:
    #
    # /predict/waste-risk
    #
    # and
    #
    # /predict/waste-risk/19
    #
    # always return the same prediction.
    # --------------------------------------------------------

    risk_data = load_risk_dataset()


    if "food_id" not in risk_data.columns:

        raise HTTPException(

            status_code=500,

            detail=(
                "Waste risk dataset does not contain "
                "food_id column."
            )
        )


    # --------------------------------------------------------
    # Normalize IDs
    # --------------------------------------------------------

    risk_data["food_id"] = pd.to_numeric(

        risk_data["food_id"],

        errors="coerce"
    )


    # --------------------------------------------------------
    # Exact product match
    # --------------------------------------------------------

    product = risk_data[

        risk_data[
            "food_id"
        ]
        ==
        food_id

        ]


    if product.empty:

        raise HTTPException(

            status_code=404,

            detail=(
                f"Food product {food_id} "
                "not found."
            )
        )


    # --------------------------------------------------------
    # Latest record
    # --------------------------------------------------------

    prediction = (

        product

        .tail(1)

        .to_dict(
            orient="records"
        )
    )


    if not prediction:

        raise HTTPException(

            status_code=404,

            detail=(
                f"No prediction found "
                f"for food ID {food_id}."
            )
        )


    prediction = clean_records(
        prediction
    )[0]


    return {

        "success":
            True,

        "food_id":
            food_id,

        "model":
            "XGBoost",

        "prediction":
            prediction

    }


# ============================================================
# ALL REORDER RECOMMENDATIONS
# ============================================================

@app.get("/recommend/reorder")
def recommend_reorder():

    reorder_data = (
        load_reorder_dataset()
    )


    if "food_id" in reorder_data.columns:

        reorder_data = (

            reorder_data

            .drop_duplicates(

                subset=[
                    "food_id"
                ],

                keep="last"
            )

            .sort_values(
                "food_id"
            )
        )


    records = clean_records(

        reorder_data.to_dict(
            orient="records"
        )
    )


    return {

        "success":
            True,

        "products":
            len(records),

        "recommendations":
            records

    }


# ============================================================
# SINGLE PRODUCT REORDER
# ============================================================

@app.get("/recommend/reorder/{food_id}")
def product_reorder(
        food_id: int
):

    reorder_data = (
        load_reorder_dataset()
    )


    if "food_id" not in reorder_data.columns:

        raise HTTPException(

            status_code=500,

            detail=(
                "Reorder dataset does not contain "
                "food_id column."
            )
        )


    reorder_data["food_id"] = pd.to_numeric(

        reorder_data["food_id"],

        errors="coerce"
    )


    product = reorder_data[

        reorder_data[
            "food_id"
        ]
        ==
        food_id

        ]


    if product.empty:

        raise HTTPException(

            status_code=404,

            detail=(
                f"Food product {food_id} "
                "not found."
            )
        )


    recommendation = (

        product

        .tail(1)

        .to_dict(
            orient="records"
        )
    )


    recommendation = clean_records(

        recommendation
    )[0]


    return {

        "success":
            True,

        "food_id":
            food_id,

        "recommendation":
            recommendation

    }


# ============================================================
# BATCH SUMMARY
# ============================================================

@app.get("/batch/summary")
def batch_summary():

    waste_risk_exists = os.path.exists(
        RISK_FILE
    )

    reorder_exists = os.path.exists(
        REORDER_FILE
    )

    demand_exists = os.path.exists(
        LSTM_FORECAST_FILE
    )


    summary = {

        "waste_risk":
            waste_risk_exists,

        "reorder_recommendation":
            reorder_exists,

        "demand_forecast":
            demand_exists

    }


    # --------------------------------------------------------
    # Risk statistics
    # --------------------------------------------------------

    if waste_risk_exists:

        try:

            risk_data = pd.read_csv(
                RISK_FILE
            )


            if (
                    "predicted_risk_category"
                    in
                    risk_data.columns
            ):

                categories = (

                    risk_data[
                        "predicted_risk_category"
                    ]

                    .astype(str)

                    .str.upper()
                )


                summary[
                    "risk_statistics"
                ] = {

                    "total":
                        len(risk_data),

                    "high":
                        int(
                            (
                                    categories
                                    ==
                                    "HIGH"
                            ).sum()
                        ),

                    "moderate":
                        int(
                            (
                                    categories
                                    ==
                                    "MODERATE"
                            ).sum()
                        ),

                    "low":
                        int(
                            (
                                    categories
                                    ==
                                    "LOW"
                            ).sum()
                        )

                }

        except Exception as error:

            summary[
                "risk_statistics_error"
            ] = str(error)


    return {

        "success":
            True,

        "batch_prediction_status":
            summary

    }


# ============================================================
# RUN BATCH PREDICTION
# ============================================================

@app.post("/batch/run")
def run_batch():

    try:

        result = (
            run_batch_prediction()
        )


        return {

            "success":
                True,

            "status":
                "success",

            "message":
                "Batch prediction completed successfully.",

            "result":
                result

        }


    except Exception as error:

        raise HTTPException(

            status_code=500,

            detail=(
                "Batch prediction failed: "
                f"{error}"
            )
        )


# ============================================================
# APPLICATION INFORMATION
# ============================================================

@app.get("/info")
def service_info():

    return {

        "service":
            "AI Food Redistribution Service",

        "version":
            "2.0.0",

        "status":
            "running",

        "modules": {

            "demand_forecasting":
                os.path.exists(
                    LSTM_FORECAST_FILE
                ),

            "waste_risk":
                os.path.exists(
                    RISK_FILE
                ),

            "smart_reorder":
                os.path.exists(
                    REORDER_FILE
                ),

            "batch_scheduler":
                True

        },

        "endpoints": [

            "/",

            "/health",

            "/predict/demand",

            "/predict/waste-risk",

            "/predict/waste-risk/{food_id}",

            "/recommend/reorder",

            "/recommend/reorder/{food_id}",

            "/batch/summary",

            "/batch/run",

            "/info"

        ]

    }