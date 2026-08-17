import os
import numpy as np
import pandas as pd

from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import EarlyStopping


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DATA_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "daily_demand.csv"
)

PROCESSED_DIR = os.path.join(
    BASE_DIR,
    "data",
    "processed"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

FORECAST_FILE = os.path.join(
    PROCESSED_DIR,
    "lstm_forecast.csv"
)

LOOKBACK = 14

FORECAST_DAYS = 7

MIN_HISTORY_DAYS = 30


# ============================================================
# CREATE DIRECTORIES
# ============================================================

os.makedirs(
    PROCESSED_DIR,
    exist_ok=True
)

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print()
    print("========================================")
    print("LSTM FOOD-SPECIFIC DEMAND FORECASTING")
    print("========================================")

    print()
    print("Loading dataset:")
    print(DATA_FILE)

    if not os.path.exists(DATA_FILE):

        raise FileNotFoundError(
            f"Dataset not found:\n{DATA_FILE}"
        )

    data = pd.read_csv(
        DATA_FILE
    )

    print()
    print("Dataset shape:", data.shape)

    print()
    print("Columns:")
    print(data.columns.tolist())

    return data


# ============================================================
# PREPARE DATA
# ============================================================

def prepare_data(data):

    data = data.copy()

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    date_column = None

    for column in [
        "date",
        "Date",
        "ds"
    ]:

        if column in data.columns:

            date_column = column
            break

    if date_column is None:

        raise ValueError(
            "Date column not found."
        )

    # --------------------------------------------------------
    # DEMAND
    # --------------------------------------------------------

    demand_column = None

    for column in [
        "quantity_sold",
        "demand",
        "quantity",
        "total_quantity",
        "sales_quantity",
        "y"
    ]:

        if column in data.columns:

            demand_column = column
            break

    if demand_column is None:

        raise ValueError(
            "Demand column not found."
        )

    # --------------------------------------------------------
    # FOOD ID
    # --------------------------------------------------------

    if "food_id" not in data.columns:

        raise ValueError(
            "food_id column is required."
        )

    # --------------------------------------------------------
    # FOOD NAME
    # --------------------------------------------------------

    if "food_name" not in data.columns:

        data["food_name"] = (
            "Food "
            + data["food_id"].astype(str)
        )

    # --------------------------------------------------------
    # CATEGORY
    # --------------------------------------------------------

    if "category" not in data.columns:

        data["category"] = "Unknown"

    # --------------------------------------------------------
    # RENAME
    # --------------------------------------------------------

    data = data.rename(

        columns={

            date_column:
                "date",

            demand_column:
                "quantity_sold"

        }

    )

    # --------------------------------------------------------
    # TYPES
    # --------------------------------------------------------

    data["date"] = pd.to_datetime(
        data["date"],
        errors="coerce"
    )

    data["food_id"] = pd.to_numeric(
        data["food_id"],
        errors="coerce"
    )

    data["quantity_sold"] = pd.to_numeric(
        data["quantity_sold"],
        errors="coerce"
    )

    data["food_name"] = (
        data["food_name"]
        .fillna("Unknown")
        .astype(str)
        .str.strip()
    )

    data["category"] = (
        data["category"]
        .fillna("Unknown")
        .astype(str)
        .str.strip()
    )

    # --------------------------------------------------------
    # REMOVE INVALID ROWS
    # --------------------------------------------------------

    data = data.dropna(
        subset=[
            "date",
            "food_id",
            "quantity_sold"
        ]
    )

    data["food_id"] = (
        data["food_id"]
        .astype(int)
    )

    data["quantity_sold"] = (
        data["quantity_sold"]
        .clip(lower=0)
    )

    return data


# ============================================================
# CREATE DAILY FOOD SERIES
# ============================================================

def create_food_daily_series(
    data
):

    daily = (

        data

        .groupby(
            [
                "food_id",
                "food_name",
                "category",
                "date"
            ],
            as_index=False
        )[
            "quantity_sold"
        ]

        .sum()

    )

    return daily.sort_values(
        [
            "food_id",
            "date"
        ]
    )


# ============================================================
# CREATE CONTINUOUS DAILY SERIES
# ============================================================

def make_continuous_series(
    food_daily
):

    food_daily = food_daily.copy()

    food_id = int(
        food_daily["food_id"].iloc[0]
    )

    food_name = str(
        food_daily["food_name"].iloc[-1]
    )

    category = str(
        food_daily["category"].iloc[-1]
    )

    start_date = (
        food_daily["date"].min()
    )

    end_date = (
        food_daily["date"].max()
    )

    all_dates = pd.date_range(
        start=start_date,
        end=end_date,
        freq="D"
    )

    series = (

        food_daily[
            [
                "date",
                "quantity_sold"
            ]
        ]

        .groupby("date")[
            "quantity_sold"
        ]

        .sum()

        .reindex(
            all_dates,
            fill_value=0
        )

    )

    series = series.astype(float)

    return (
        series,
        food_id,
        food_name,
        category,
        all_dates
    )


# ============================================================
# CREATE SEQUENCES
# ============================================================

def create_sequences(
    values
):

    X = []
    y = []

    for i in range(
        LOOKBACK,
        len(values)
    ):

        X.append(
            values[
                i - LOOKBACK:i
            ]
        )

        y.append(
            values[i]
        )

    return (
        np.array(X),
        np.array(y)
    )


# ============================================================
# BUILD LSTM MODEL
# ============================================================

def build_model():

    model = Sequential(
        [

            Input(
                shape=(
                    LOOKBACK,
                    1
                )
            ),

            LSTM(
                64,
                return_sequences=True
            ),

            Dropout(
                0.2
            ),

            LSTM(
                32
            ),

            Dropout(
                0.2
            ),

            Dense(
                16,
                activation="relu"
            ),

            Dense(
                1
            )

        ]
    )

    model.compile(
        optimizer="adam",
        loss="mse"
    )

    return model


# ============================================================
# FORECAST ONE FOOD
# ============================================================

def forecast_one_food(
    food_daily
):

    (
        series,
        food_id,
        food_name,
        category,
        all_dates
    ) = make_continuous_series(
        food_daily
    )

    print()
    print("----------------------------------------")
    print(
        f"Food: {food_name}"
    )
    print(
        f"Food ID: {food_id}"
    )
    print(
        f"Category: {category}"
    )
    print(
        f"History: {len(series)} days"
    )

    # --------------------------------------------------------
    # HISTORY CHECK
    # --------------------------------------------------------

    if len(series) < MIN_HISTORY_DAYS:

        print(
            "Not enough history for LSTM."
        )

        return None

    # --------------------------------------------------------
    # VALUES
    # --------------------------------------------------------

    values = (
        series
        .values
        .astype(float)
        .reshape(-1, 1)
    )

    # --------------------------------------------------------
    # SCALE
    # --------------------------------------------------------

    scaler = MinMaxScaler()

    scaled = scaler.fit_transform(
        values
    )

    # --------------------------------------------------------
    # SEQUENCES
    # --------------------------------------------------------

    X, y = create_sequences(
        scaled
    )

    if len(X) < 20:

        print(
            "Not enough sequences."
        )

        return None

    # --------------------------------------------------------
    # TRAIN / TEST
    # --------------------------------------------------------

    split_index = int(
        len(X) * 0.80
    )

    if split_index < 1:

        return None

    X_train = X[
        :split_index
    ]

    y_train = y[
        :split_index
    ]

    X_test = X[
        split_index:
    ]

    y_test = y[
        split_index:
    ]

    print(
        f"Training samples: {len(X_train)}"
    )

    print(
        f"Testing samples : {len(X_test)}"
    )

    # --------------------------------------------------------
    # BUILD MODEL
    # --------------------------------------------------------

    model = build_model()

    early_stopping = EarlyStopping(

        monitor="val_loss",

        patience=5,

        restore_best_weights=True

    )

    # --------------------------------------------------------
    # TRAIN
    # --------------------------------------------------------

    model.fit(

        X_train,

        y_train,

        epochs=5,

        batch_size=16,

        validation_split=0.10,

        callbacks=[
            early_stopping
        ],

        verbose=0

    )

    # --------------------------------------------------------
    # TEST METRICS
    # --------------------------------------------------------

    if len(X_test) > 0:

        predictions = model.predict(
            X_test,
            verbose=0
        )

        predictions_original = (
            scaler.inverse_transform(
                predictions
            )
        )

        actual_original = (
            scaler.inverse_transform(
                y_test.reshape(
                    -1,
                    1
                )
            )
        )

        mae = mean_absolute_error(
            actual_original,
            predictions_original
        )

        rmse = np.sqrt(
            mean_squared_error(
                actual_original,
                predictions_original
            )
        )

    else:

        mae = 0.0
        rmse = 0.0

    # --------------------------------------------------------
    # FUTURE FORECAST
    # --------------------------------------------------------

    sequence = scaled[
        -LOOKBACK:
    ].copy()

    forecasts = []

    for day in range(
        FORECAST_DAYS
    ):

        input_data = (
            sequence
            .reshape(
                1,
                LOOKBACK,
                1
            )
        )

        prediction = model.predict(
            input_data,
            verbose=0
        )[0][0]

        forecasts.append(
            float(prediction)
        )

        sequence = np.concatenate(
            [
                sequence[1:],
                np.array(
                    [
                        [prediction]
                    ]
                )
            ],
            axis=0
        )

    forecasts = np.array(
        forecasts
    ).reshape(
        -1,
        1
    )

    forecasts = (
        scaler
        .inverse_transform(
            forecasts
        )
        .flatten()
    )

    forecasts = np.maximum(
        forecasts,
        0
    )

    forecasts = np.round(
        forecasts,
        2
    )

    forecast_dates = pd.date_range(

        start=(
            all_dates.max()
            +
            pd.Timedelta(days=1)
        ),

        periods=FORECAST_DAYS,

        freq="D"

    )

    forecast_total = round(
        float(
            forecasts.sum()
        ),
        2
    )

    # --------------------------------------------------------
    # SAVE FOOD-SPECIFIC MODEL
    # --------------------------------------------------------

    safe_name = (
        food_name
        .lower()
        .replace(" ", "_")
        .replace("/", "_")
        .replace("\\", "_")
    )

    model_file = os.path.join(

        MODEL_DIR,

        f"lstm_food_{food_id}_{safe_name}.keras"

    )

    model.save(
        model_file
    )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    result = pd.DataFrame({

        "date":
            forecast_dates,

        "food_id":
            [food_id] * FORECAST_DAYS,

        "food_name":
            [food_name] * FORECAST_DAYS,

        "category":
            [category] * FORECAST_DAYS,

        "predicted_demand":
            forecasts

    })

    result[
        "forecasted_7_day_demand"
    ] = forecast_total

    result[
        "mae"
    ] = round(
        float(mae),
        2
    )

    result[
        "rmse"
    ] = round(
        float(rmse),
        2
    )

    # indicate that this forecast came from a food-specific LSTM
    result["forecast_source"] = "LSTM_FOOD"

    print()
    print(
        f"MAE: {mae:.2f}"
    )

    print(
        f"RMSE: {rmse:.2f}"
    )

    print(
        f"7-day forecast: {forecast_total:.2f}"
    )

    print(
        "Forecast:"
    )

    print(
        result[
            [
                "date",
                "predicted_demand"
            ]
        ].to_string(
            index=False
        )
    )

    print(
        f"Model saved: {model_file}"
    )

    return result


# ============================================================
# MAIN
# ============================================================

def main():

    data = load_data()

    data = prepare_data(
        data
    )

    daily_food = create_food_daily_series(
        data
    )

    food_ids = (
        daily_food[
            "food_id"
        ]
        .unique()
        .tolist()
    )

    print()
    print(
        "========================================"
    )

    print(
        "FOODS FOUND"
    )

    print(
        f"Number of food IDs: {len(food_ids)}"
    )

    print(
        food_ids
    )

    print(
        "========================================"
    )

    all_results = []

    # ========================================================
    # FOOD-SPECIFIC TRAINING
    # ========================================================

    for food_id in food_ids:

        group = daily_food[
            daily_food["food_id"] == food_id
        ].copy()

        result = forecast_one_food(
            group
        )

        if result is not None:

            all_results.append(
                result
            )

    # ========================================================
    # COMBINE ALL FOOD FORECASTS
    # ========================================================

    if not all_results:

        raise RuntimeError(
            "No food had enough historical data for LSTM forecasting."
        )

    forecast_result = pd.concat(
        all_results,
        ignore_index=True
    )

    # ========================================================
    # SORT
    # ========================================================

    forecast_result = (
        forecast_result
        .sort_values(
            [
                "food_id",
                "date"
            ]
        )
        .reset_index(
            drop=True
        )
    )

    # ========================================================
    # SAVE
    # ========================================================

    forecast_result.to_csv(

        FORECAST_FILE,

        index=False

    )

    # ========================================================
    # FINAL SUMMARY
    # ========================================================

    print()
    print(
        "========================================"
    )

    print(
        "FOOD-SPECIFIC LSTM COMPLETE"
    )

    print(
        "========================================"
    )

    print()
    print(
        "Forecast saved:"
    )

    print(
        FORECAST_FILE
    )

    print()
    print(
        "Total forecast rows:",
        len(forecast_result)
    )

    print()
    print(
        "Foods with forecasts:",
        forecast_result[
            "food_id"
        ].nunique()
    )

    print()
    print(
        "========================================"
    )

    print(
        "7-DAY FORECAST SUMMARY"
    )

    print(
        "========================================"
    )

    summary = (

        forecast_result

        .groupby(
            [
                "food_id",
                "food_name",
                "category"
            ],
            as_index=False
        )[

            "forecasted_7_day_demand"

        ]

        .first()

        .sort_values(
            "food_id"
        )

    )

    print(
        summary.to_string(
            index=False
        )
    )

    print()
    print(
        "========================================"
    )

    print(
        "CSV COLUMNS"
    )

    print(
        "========================================"
    )

    print(
        forecast_result.columns.tolist()
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    main()