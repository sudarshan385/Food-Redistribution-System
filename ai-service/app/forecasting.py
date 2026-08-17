import os
import pickle
import pandas as pd
import numpy as np

from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

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

MODELS_DIR = os.path.join(
    BASE_DIR,
    "models"
)

os.makedirs(MODELS_DIR, exist_ok=True)


DAILY_DEMAND_FILE = os.path.join(
    PROCESSED_DIR,
    "daily_demand.csv"
)


# ---------------------------------------------------------
# Load Data
# ---------------------------------------------------------

def load_daily_demand():

    data = pd.read_csv(
        DAILY_DEMAND_FILE
    )

    data["date"] = pd.to_datetime(
        data["date"]
    )

    return data


# ---------------------------------------------------------
# Train Prophet Model
# ---------------------------------------------------------

def train_prophet_model(
        food_id,
        food_name,
        category,
        food_data
):

    print()
    print("----------------------------------------")
    print(f"Training Prophet for: {food_name}")
    print("----------------------------------------")

    # Prophet requires:
    # ds = date
    # y  = target value

    prophet_data = food_data[
        ["date", "quantity_sold"]
    ].copy()

    prophet_data = prophet_data.rename(
        columns={
            "date": "ds",
            "quantity_sold": "y"
        }
    )

    prophet_data = prophet_data.sort_values(
        "ds"
    )

    # -----------------------------------------------------
    # Train/Test Split
    # Last 30 days = test data
    # -----------------------------------------------------

    if len(prophet_data) < 60:

        print(
            f"Not enough data for {food_name}"
        )

        return None

    train_data = prophet_data.iloc[:-30]
    test_data = prophet_data.iloc[-30:]

    # -----------------------------------------------------
    # Create Prophet Model
    # -----------------------------------------------------

    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=True,
        seasonality_mode="additive"
    )

    # Fit model
    model.fit(train_data)

    # -----------------------------------------------------
    # Test Prediction
    # -----------------------------------------------------

    test_forecast = model.predict(
        test_data[["ds"]]
    )

    actual = test_data["y"].values

    predicted = (
        test_forecast["yhat"]
        .values
    )

    predicted = np.maximum(
        predicted,
        0
    )

    # -----------------------------------------------------
    # Evaluation
    # -----------------------------------------------------

    mae = mean_absolute_error(
        actual,
        predicted
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual,
            predicted
        )
    )

    print(
        f"MAE  : {mae:.2f}"
    )

    print(
        f"RMSE : {rmse:.2f}"
    )

    # -----------------------------------------------------
    # Retrain using complete dataset
    # -----------------------------------------------------

    final_model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=True,
        seasonality_mode="additive"
    )

    final_model.fit(
        prophet_data
    )

    # -----------------------------------------------------
    # Save Model
    # -----------------------------------------------------

    model_file = os.path.join(
        MODELS_DIR,
        f"prophet_food_{food_id}.pkl"
    )

    with open(
            model_file,
            "wb"
    ) as file:

        pickle.dump(
            final_model,
            file
        )

    print(
        f"Model saved: {model_file}"
    )

    return {
        "food_id": int(food_id),
        "food_name": food_name,
        "category": category,
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "model_file": model_file
    }


# ---------------------------------------------------------
# Generate Future Forecast
# ---------------------------------------------------------

def generate_forecast(
        model,
        days=7
):

    future = model.make_future_dataframe(
        periods=days,
        freq="D"
    )

    forecast = model.predict(
        future
    )

    forecast = forecast[
        [
            "ds",
            "yhat",
            "yhat_lower",
            "yhat_upper"
        ]
    ].tail(days)

    forecast["yhat"] = forecast[
        "yhat"
    ].clip(lower=0)

    forecast["yhat_lower"] = forecast[
        "yhat_lower"
    ].clip(lower=0)

    forecast["yhat_upper"] = forecast[
        "yhat_upper"
    ].clip(lower=0)

    return forecast


# ---------------------------------------------------------
# Train All Food Models
# ---------------------------------------------------------

def train_all_models():

    print()
    print("========================================")
    print("PROPHET DEMAND FORECASTING")
    print("========================================")

    data = load_daily_demand()

    results = []

    # Train separate model for every food item

    for food_id in sorted(
            data["food_id"].unique()
    ):

        food_data = data[
            data["food_id"] == food_id
            ].copy()

        food_name = food_data[
            "food_name"
        ].iloc[0]

        category = food_data[
            "category"
        ].iloc[0]

        result = train_prophet_model(
            food_id,
            food_name,
            category,
            food_data
        )

        if result:

            results.append(result)

    # -----------------------------------------------------
    # Save Evaluation Results
    # -----------------------------------------------------

    results_df = pd.DataFrame(
        results
    )

    evaluation_file = os.path.join(
        PROCESSED_DIR,
        "prophet_evaluation.csv"
    )

    results_df.to_csv(
        evaluation_file,
        index=False
    )

    print()
    print("========================================")
    print("PROPHET TRAINING COMPLETE")
    print("========================================")

    print(
        f"Models trained: {len(results)}"
    )

    print(
        f"Evaluation file: {evaluation_file}"
    )

    print()
    print(results_df)


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------

if __name__ == "__main__":

    train_all_models()