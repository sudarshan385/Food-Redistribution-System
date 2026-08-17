# ============================================================
# app/waste_risk_model.py
# COMPLETE FIXED VERSION
# ============================================================

import os
from datetime import datetime

import numpy as np
import pandas as pd
import psycopg2

from dotenv import load_dotenv

from xgboost import XGBRegressor

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error
)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


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

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

SALES_FILE = os.path.join(
    PROCESSED_DIR,
    "processed_sales.csv"
)

WASTE_FILE = os.path.join(
    PROCESSED_DIR,
    "processed_waste.csv"
)

PURCHASE_FILE = os.path.join(
    PROCESSED_DIR,
    "processed_purchases.csv"
)

MODEL_FILE = os.path.join(
    MODEL_DIR,
    "xgboost_waste_risk.json"
)

RISK_FILE = os.path.join(
    PROCESSED_DIR,
    "waste_risk_scores.csv"
)
LSTM_FORECAST_FILE = os.path.join(
    PROCESSED_DIR,
    "lstm_forecast.csv"
)


# ============================================================
# CONFIGURATION
# ============================================================

FORECAST_DAYS = 7

ROLLING_DEMAND_DAYS = 14

RISK_LOW_LIMIT = 30

RISK_MODERATE_LIMIT = 60

FEATURE_COLUMNS = [
    "current_stock",
    "average_daily_demand",
    "forecasted_demand",
    "stock_coverage_days",
    "waste_ratio",
    "days_to_expiry"
]


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db_connection():

    return psycopg2.connect(
        host=os.getenv(
            "DB_HOST",
            "localhost"
        ),
        port=os.getenv(
            "DB_PORT",
            "5432"
        ),
        database=os.getenv(
            "DB_NAME"
        ),
        user=os.getenv(
            "DB_USER"
        ),
        password=os.getenv(
            "DB_PASSWORD"
        )
    )


# ============================================================
# NORMALIZE FOOD NAME
# ============================================================

def normalize_food_name(name):

    if name is None:
        return ""

    return (
        str(name)
        .strip()
        .lower()
        .replace(" ", "")
        .replace("-", "")
        .replace("_", "")
    )


# ============================================================
# LOAD HISTORICAL DATA
# ============================================================

def load_data():

    print()
    print("========================================")
    print("LOADING HISTORICAL AI DATA")
    print("========================================")

    required_files = [
        SALES_FILE,
        WASTE_FILE,
        PURCHASE_FILE
    ]

    for file_path in required_files:

        if not os.path.exists(file_path):

            raise FileNotFoundError(
                f"Required file not found:\n{file_path}"
            )

    sales = pd.read_csv(
        SALES_FILE
    )

    waste = pd.read_csv(
        WASTE_FILE
    )

    purchases = pd.read_csv(
        PURCHASE_FILE
    )

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    sales["date"] = pd.to_datetime(
        sales["date"],
        errors="coerce"
    )

    waste["date"] = pd.to_datetime(
        waste["date"],
        errors="coerce"
    )

    purchases["date"] = pd.to_datetime(
        purchases["date"],
        errors="coerce"
    )

    sales = sales.dropna(
        subset=["date"]
    )

    waste = waste.dropna(
        subset=["date"]
    )

    purchases = purchases.dropna(
        subset=["date"]
    )

    # --------------------------------------------------------
    # QUANTITY COLUMNS
    # --------------------------------------------------------

    if "quantity_sold" not in sales.columns:

        if "quantity" in sales.columns:

            sales["quantity_sold"] = (
                pd.to_numeric(
                    sales["quantity"],
                    errors="coerce"
                ).fillna(0)
            )

        else:

            raise ValueError(
                "processed_sales.csv does not contain "
                "'quantity_sold' or 'quantity'."
            )

    if "quantity_wasted" not in waste.columns:

        if "quantity" in waste.columns:

            waste["quantity_wasted"] = (
                pd.to_numeric(
                    waste["quantity"],
                    errors="coerce"
                ).fillna(0)
            )

        else:

            waste["quantity_wasted"] = 0.0

    if "quantity_purchased" not in purchases.columns:

        if "quantity" in purchases.columns:

            purchases["quantity_purchased"] = (
                pd.to_numeric(
                    purchases["quantity"],
                    errors="coerce"
                ).fillna(0)
            )

        else:

            purchases["quantity_purchased"] = 0.0

    sales["quantity_sold"] = pd.to_numeric(
        sales["quantity_sold"],
        errors="coerce"
    ).fillna(0)

    waste["quantity_wasted"] = pd.to_numeric(
        waste["quantity_wasted"],
        errors="coerce"
    ).fillna(0)

    purchases["quantity_purchased"] = pd.to_numeric(
        purchases["quantity_purchased"],
        errors="coerce"
    ).fillna(0)

    print(
        "Historical sales:",
        len(sales)
    )

    print(
        "Historical waste:",
        len(waste)
    )

    print(
        "Historical purchases:",
        len(purchases)
    )

    return (
        sales,
        waste,
        purchases
    )


# ============================================================
# CREATE HISTORICAL TRAINING DATASET
# ============================================================

def create_inventory_dataset(
        sales,
        waste,
        purchases
):

    print()
    print(
        "Creating historical waste-risk training dataset..."
    )

    # --------------------------------------------------------
    # PRODUCT MASTER
    # --------------------------------------------------------

    products = sales[
        [
            "food_id",
            "food_name",
            "category"
        ]
    ].drop_duplicates(
        subset=["food_id"]
    )

    # --------------------------------------------------------
    # DATE RANGE
    # --------------------------------------------------------

    start_date = sales["date"].min()

    end_date = sales["date"].max()

    if pd.isna(start_date) or pd.isna(end_date):

        raise ValueError(
            "No valid historical sales dates found."
        )

    dates = pd.date_range(
        start=start_date,
        end=end_date,
        freq="D"
    )

    # --------------------------------------------------------
    # COMPLETE FOOD × DATE CALENDAR
    # --------------------------------------------------------

    calendar = pd.MultiIndex.from_product(
        [
            products["food_id"].unique(),
            dates
        ],
        names=[
            "food_id",
            "date"
        ]
    ).to_frame(
        index=False
    )

    calendar = calendar.merge(
        products,
        on="food_id",
        how="left"
    )

    # --------------------------------------------------------
    # SALES
    # --------------------------------------------------------

    daily_sales = (
        sales
        .groupby(
            [
                "food_id",
                "date"
            ],
            as_index=False
        )[
            "quantity_sold"
        ]
        .sum()
    )

    calendar = calendar.merge(
        daily_sales,
        on=[
            "food_id",
            "date"
        ],
        how="left"
    )

    calendar["quantity_sold"] = (
        pd.to_numeric(
            calendar["quantity_sold"],
            errors="coerce"
        ).fillna(0)
    )

    # --------------------------------------------------------
    # PURCHASES
    # --------------------------------------------------------

    daily_purchases = (
        purchases
        .groupby(
            [
                "food_id",
                "date"
            ],
            as_index=False
        )[
            "quantity_purchased"
        ]
        .sum()
    )

    calendar = calendar.merge(
        daily_purchases,
        on=[
            "food_id",
            "date"
        ],
        how="left"
    )

    calendar["quantity_purchased"] = (
        pd.to_numeric(
            calendar["quantity_purchased"],
            errors="coerce"
        ).fillna(0)
    )

    # --------------------------------------------------------
    # WASTE
    # --------------------------------------------------------

    daily_waste = (
        waste
        .groupby(
            [
                "food_id",
                "date"
            ],
            as_index=False
        )[
            "quantity_wasted"
        ]
        .sum()
    )

    calendar = calendar.merge(
        daily_waste,
        on=[
            "food_id",
            "date"
        ],
        how="left"
    )

    calendar["quantity_wasted"] = (
        pd.to_numeric(
            calendar["quantity_wasted"],
            errors="coerce"
        ).fillna(0)
    )

    # --------------------------------------------------------
    # SIMULATED HISTORICAL STOCK
    # --------------------------------------------------------

    records = []

    for food_id, group in calendar.groupby(
            "food_id"
    ):

        group = group.sort_values(
            "date"
        ).copy()

        mean_demand = float(
            group["quantity_sold"].mean()
        )

        stock = max(
            100.0,
            mean_demand * FORECAST_DAYS
        )

        for _, row in group.iterrows():

            purchased = float(
                row["quantity_purchased"]
            )

            sold = float(
                row["quantity_sold"]
            )

            wasted = float(
                row["quantity_wasted"]
            )

            stock += purchased

            stock -= sold

            stock -= wasted

            stock = max(
                0.0,
                stock
            )

            records.append({
                "food_id": food_id,
                "date": row["date"],
                "food_name": row["food_name"],
                "category": row["category"],
                "quantity_sold": sold,
                "quantity_purchased": purchased,
                "quantity_wasted": wasted,
                "current_stock": stock
            })

    inventory = pd.DataFrame(
        records
    )

    inventory = inventory.sort_values(
        [
            "food_id",
            "date"
        ]
    ).reset_index(
        drop=True
    )

    # --------------------------------------------------------
    # FOOD-SPECIFIC DEMAND
    # --------------------------------------------------------

    inventory[
        "average_daily_demand"
    ] = (

        inventory
        .groupby(
            "food_id"
        )[
            "quantity_sold"
        ]
        .transform(
            lambda x:
            x.rolling(
                ROLLING_DEMAND_DAYS,
                min_periods=1
            ).mean()
        )
    )

    inventory[
        "average_daily_demand"
    ] = pd.to_numeric(
        inventory[
            "average_daily_demand"
        ],
        errors="coerce"
    ).fillna(0)

    # --------------------------------------------------------
    # 7 DAY FORECAST
    # --------------------------------------------------------

    inventory[
        "forecasted_demand"
    ] = (
            inventory[
                "average_daily_demand"
            ]
            *
            FORECAST_DAYS
    )

    # --------------------------------------------------------
    # STOCK COVERAGE
    # --------------------------------------------------------

    inventory[
        "stock_coverage_days"
    ] = np.where(

        inventory[
            "average_daily_demand"
        ] > 0,

        inventory[
            "current_stock"
        ]
        /
        inventory[
            "average_daily_demand"
        ],

        0
    )

    # --------------------------------------------------------
    # WASTE RATIO
    # --------------------------------------------------------

    inventory[
        "waste_ratio"
    ] = np.where(

        inventory[
            "quantity_purchased"
        ] > 0,

        inventory[
            "quantity_wasted"
        ]
        /
        inventory[
            "quantity_purchased"
        ],

        0
    )

    inventory[
        "waste_ratio"
    ] = (
        inventory[
            "waste_ratio"
        ]
        .replace(
            [
                np.inf,
                -np.inf
            ],
            0
        )
        .fillna(0)
        .clip(
            0,
            1
        )
    )

    # --------------------------------------------------------
    # TRAINING EXPIRY FEATURE
    # --------------------------------------------------------

    np.random.seed(
        42
    )

    inventory[
        "days_to_expiry"
    ] = np.random.randint(
        1,
        15,
        size=len(
            inventory
        )
    )

    print(
        "Training records:",
        len(inventory)
    )

    return inventory


# ============================================================
# CREATE TRAINING TARGET
# ============================================================

def calculate_risk_target(
        inventory
):

    risk = np.zeros(
        len(inventory),
        dtype=float
    )

    # Expiry
    risk += np.select(
        [
            inventory[
                "days_to_expiry"
            ] <= 2,

            inventory[
                "days_to_expiry"
            ] <= 5,

            inventory[
                "days_to_expiry"
            ] <= 7
        ],
        [
            45,
            25,
            15
        ],
        default=0
    )

    # Excess stock
    risk += np.select(
        [
            inventory[
                "current_stock"
            ]
            >
            inventory[
                "forecasted_demand"
            ] * 1.5,

            inventory[
                "current_stock"
            ]
            >
            inventory[
                "forecasted_demand"
            ]
        ],
        [
            25,
            15
        ],
        default=0
    )

    # Waste
    risk += np.select(
        [
            inventory[
                "waste_ratio"
            ] >= 0.10,

            inventory[
                "waste_ratio"
            ] >= 0.05
        ],
        [
            20,
            10
        ],
        default=0
    )

    # Low demand
    risk += np.where(
        inventory[
            "average_daily_demand"
        ] < 20,
        10,
        0
    )

    inventory[
        "risk_score"
    ] = np.clip(
        risk,
        0,
        100
    )

    inventory[
        "risk_category"
    ] = pd.cut(
        inventory[
            "risk_score"
        ],
        bins=[
            -1,
            RISK_LOW_LIMIT,
            RISK_MODERATE_LIMIT,
            100
        ],
        labels=[
            "LOW",
            "MODERATE",
            "HIGH"
        ]
    )

    return inventory


# ============================================================
# TRAIN XGBOOST
# ============================================================

def train_model(
        inventory
):

    print()
    print(
        "Training XGBoost..."
    )

    X = inventory[
        FEATURE_COLUMNS
    ].copy()

    y = inventory[
        "risk_score"
    ].copy()

    X = X.replace(
        [
            np.inf,
            -np.inf
        ],
        np.nan
    ).fillna(0)

    y = y.fillna(0)

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42
        )
    )

    model = XGBRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42
    )

    model.fit(
        X_train,
        y_train
    )

    predictions = model.predict(
        X_test
    )

    predictions = np.clip(
        predictions,
        0,
        100
    )

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            predictions
        )
    )

    print()
    print("========================================")
    print("XGBOOST PERFORMANCE")
    print("========================================")
    print(
        f"MAE  : {mae:.2f}"
    )
    print(
        f"RMSE : {rmse:.2f}"
    )

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    model.save_model(
        MODEL_FILE
    )

    print(
        "Model saved:",
        MODEL_FILE
    )

    return (
        model,
        FEATURE_COLUMNS
    )


# ============================================================
# LOAD LIVE INVENTORY
# ============================================================

def load_live_inventory():

    print()
    print(
        "Loading LIVE inventory from PostgreSQL..."
    )

    connection = None

    try:

        connection = get_db_connection()

        query = """
                SELECT
                    food_id,
                    food_name,
                    category,
                    quantity,
                    expiry_date,
                    status
                FROM food_item
                WHERE status = 'AVAILABLE'
                ORDER BY food_id \
                """

        live = pd.read_sql_query(
            query,
            connection
        )

        print(
            "Live inventory items:",
            len(live)
        )

        return live

    finally:

        if connection:
            connection.close()


# ============================================================
# BUILD LIVE DATASET
# ============================================================

# ============================================================
# BUILD LIVE PREDICTION DATASET
# ============================================================

def build_live_prediction_dataset(
        live_inventory,
        historical_inventory
):

    print()
    print(
        "Preparing live inventory for AI prediction..."
    )

    historical_inventory = historical_inventory.copy()
    live_inventory = live_inventory.copy()

    # ========================================================
    # NORMALIZE FOOD NAMES
    # ========================================================

    historical_inventory[
        "_food_name_key"
    ] = (
        historical_inventory[
            "food_name"
        ]
        .apply(normalize_food_name)
    )

    live_inventory[
        "_food_name_key"
    ] = (
        live_inventory[
            "food_name"
        ]
        .apply(normalize_food_name)
    )

    # ========================================================
    # NORMALIZE CATEGORIES
    # ========================================================

    historical_inventory[
        "_category_key"
    ] = (
        historical_inventory[
            "category"
        ]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    live_inventory[
        "_category_key"
    ] = (
        live_inventory[
            "category"
        ]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    # ========================================================
    # LOAD LSTM FORECAST
    # ========================================================

    lstm_forecast = pd.DataFrame()

    if os.path.exists(LSTM_FORECAST_FILE):

        try:

            lstm_forecast = pd.read_csv(
                LSTM_FORECAST_FILE
            )

            if not lstm_forecast.empty:

                print()
                print(
                    "LSTM forecast loaded:"
                )

                print(
                    "Rows:",
                    len(lstm_forecast)
                )

                print(
                    "Foods:",
                    lstm_forecast[
                        "food_id"
                    ].nunique()
                    if "food_id" in lstm_forecast.columns
                    else 0
                )

                # ------------------------------------------------
                # Normalize columns
                # ------------------------------------------------

                if "food_id" in lstm_forecast.columns:

                    lstm_forecast[
                        "food_id"
                    ] = pd.to_numeric(
                        lstm_forecast[
                            "food_id"
                        ],
                        errors="coerce"
                    )

                if "date" in lstm_forecast.columns:

                    lstm_forecast[
                        "date"
                    ] = pd.to_datetime(
                        lstm_forecast[
                            "date"
                        ],
                        errors="coerce"
                    )

                if "predicted_demand" in lstm_forecast.columns:

                    lstm_forecast[
                        "predicted_demand"
                    ] = pd.to_numeric(
                        lstm_forecast[
                            "predicted_demand"
                        ],
                        errors="coerce"
                    ).fillna(0)

                if "food_name" in lstm_forecast.columns:

                    lstm_forecast[
                        "_food_name_key"
                    ] = (
                        lstm_forecast[
                            "food_name"
                        ]
                        .apply(normalize_food_name)
                    )

                if "category" in lstm_forecast.columns:

                    lstm_forecast[
                        "_category_key"
                    ] = (
                        lstm_forecast[
                            "category"
                        ]
                        .astype(str)
                        .str.strip()
                        .str.lower()
                    )

        except Exception as error:

            print(
                "WARNING: Unable to load LSTM forecast:"
            )

            print(error)

            lstm_forecast = pd.DataFrame()

    else:

        print()
        print(
            "WARNING: lstm_forecast.csv not found."
        )

    # ========================================================
    # GLOBAL HISTORICAL DEMAND
    # ========================================================

    historical_inventory[
        "quantity_sold"
    ] = pd.to_numeric(
        historical_inventory[
            "quantity_sold"
        ],
        errors="coerce"
    ).fillna(0)

    global_demand = float(
        historical_inventory[
            "quantity_sold"
        ].mean()
    )

    if (
        not np.isfinite(global_demand)
        or global_demand <= 0
    ):

        global_demand = 1.0

    # ========================================================
    # CATEGORY DEMAND
    # ========================================================

    category_demand = {}

    category_groups = (
        historical_inventory
        .groupby(
            "_category_key"
        )
    )

    for category, group in category_groups:

        positive_sales = group[
            group[
                "quantity_sold"
            ] > 0
        ]

        if not positive_sales.empty:

            demand = float(
                positive_sales[
                    "quantity_sold"
                ].mean()
            )

            if (
                np.isfinite(demand)
                and demand > 0
            ):

                category_demand[
                    category
                ] = demand

    # ========================================================
    # FOOD-NAME DEMAND FROM HISTORICAL DATA
    # ========================================================

    food_name_demand = {}

    food_groups = (
        historical_inventory
        .groupby(
            "_food_name_key"
        )
    )

    for food_name_key, group in food_groups:

        positive_sales = group[
            group[
                "quantity_sold"
            ] > 0
        ]

        if not positive_sales.empty:

            demand = float(
                positive_sales[
                    "quantity_sold"
                ].mean()
            )

            if (
                np.isfinite(demand)
                and demand > 0
            ):

                food_name_demand[
                    food_name_key
                ] = demand

    # ========================================================
    # CATEGORY NAME MAPPING
    #
    # Your inventory categories are:
    #
    # Cooked Food
    # Fruits
    # Vegetables
    # Dairy
    # Bakery
    #
    # Historical data contains:
    #
    # Grains
    # Bakery
    # Cooked Food
    # Dairy
    # Prepared Food
    #
    # Map old category names into your current inventory
    # categories.
    # ========================================================

    category_alias = {

        "grains":
            "cooked food",

        "prepared food":
            "cooked food"

    }

    # ========================================================
    # PROCESS EVERY LIVE INVENTORY ITEM
    # ========================================================

    rows = []

    for _, food in live_inventory.iterrows():

        food_id = int(
            pd.to_numeric(
                food.get(
                    "food_id",
                    0
                ),
                errors="coerce"
            )
        )

        food_name = str(
            food.get(
                "food_name",
                ""
            )
        ).strip()

        category = str(
            food.get(
                "category",
                ""
            )
        ).strip()

        food_name_key = normalize_food_name(
            food_name
        )

        category_key = (
            category.lower()
        )

        mapped_category = category_alias.get(
            category_key,
            category_key
        )

        # ====================================================
        # 1. LSTM FOOD-ID MATCH
        # ====================================================

        average_daily_demand = None

        forecast_source = ""

        if not lstm_forecast.empty:

            if "food_id" in lstm_forecast.columns:

                food_rows = lstm_forecast[
                    lstm_forecast[
                        "food_id"
                    ] == food_id
                ]

                if not food_rows.empty:

                    if (
                        "predicted_demand"
                        in food_rows.columns
                    ):

                        forecast_values = pd.to_numeric(
                            food_rows[
                                "predicted_demand"
                            ],
                            errors="coerce"
                        ).dropna()

                        if not forecast_values.empty:

                            forecast_total = float(
                                forecast_values.sum()
                            )

                            average_daily_demand = (
                                forecast_total
                                /
                                FORECAST_DAYS
                            )

                            forecast_source = (
                                "LSTM_FOOD_ID"
                            )

        # ====================================================
        # 2. LSTM FOOD-NAME MATCH
        # ====================================================

        if (
            average_daily_demand is None
            and
            not lstm_forecast.empty
            and
            "_food_name_key" in lstm_forecast.columns
        ):

            food_rows = lstm_forecast[
                lstm_forecast[
                    "_food_name_key"
                ] == food_name_key
            ]

            if not food_rows.empty:

                forecast_values = pd.to_numeric(
                    food_rows[
                        "predicted_demand"
                    ],
                    errors="coerce"
                ).dropna()

                if not forecast_values.empty:

                    forecast_total = float(
                        forecast_values.sum()
                    )

                    average_daily_demand = (
                        forecast_total
                        /
                        FORECAST_DAYS
                    )

                    forecast_source = (
                        "LSTM_FOOD_NAME"
                    )

        # ====================================================
        # 3. HISTORICAL FOOD NAME
        # ====================================================

        if average_daily_demand is None:

            if food_name_key in food_name_demand:

                average_daily_demand = float(
                    food_name_demand[
                        food_name_key
                    ]
                )

                forecast_source = (
                    "FOOD_HISTORY"
                )

        # ====================================================
        # 4. CATEGORY HISTORY
        # ====================================================

        if average_daily_demand is None:

            if mapped_category in category_demand:

                average_daily_demand = float(
                    category_demand[
                        mapped_category
                    ]
                )

                forecast_source = (
                    "CATEGORY_HISTORY"
                )

        # ====================================================
        # 5. GLOBAL FALLBACK
        # ========================================================

        if average_daily_demand is None:

            average_daily_demand = (
                global_demand
            )

            forecast_source = (
                "GLOBAL_HISTORY"
            )

        # ====================================================
        # SAFETY
        # ====================================================

        if (
            not np.isfinite(
                average_daily_demand
            )
            or
            average_daily_demand < 0
        ):

            average_daily_demand = (
                global_demand
            )

            forecast_source = (
                "GLOBAL_HISTORY"
            )

        average_daily_demand = float(
            average_daily_demand
        )

        # ====================================================
        # 7-DAY FORECAST
        # ====================================================

        forecasted_demand = round(
            average_daily_demand
            *
            FORECAST_DAYS,
            2
        )

        # ====================================================
        # CURRENT STOCK
        # ====================================================

        current_stock = pd.to_numeric(
            food.get(
                "quantity",
                0
            ),
            errors="coerce"
        )

        if pd.isna(
            current_stock
        ):

            current_stock = 0.0

        current_stock = float(
            current_stock
        )

        # ====================================================
        # EXPIRY
        # ====================================================

        expiry_date = pd.to_datetime(
            food.get(
                "expiry_date"
            ),
            errors="coerce"
        )

        if pd.isna(
            expiry_date
        ):

            days_to_expiry = 999

        else:

            if getattr(
                expiry_date,
                "tzinfo",
                None
            ) is not None:

                expiry_date = (
                    expiry_date
                    .tz_localize(None)
                )

            today = pd.Timestamp(
                datetime.now()
            )

            days_to_expiry = int(
                np.ceil(
                    (
                        expiry_date
                        -
                        today
                    ).total_seconds()
                    /
                    86400
                )
            )

        # ====================================================
        # STOCK COVERAGE
        # ====================================================

        if average_daily_demand > 0:

            stock_coverage_days = (
                current_stock
                /
                average_daily_demand
            )

        else:

            stock_coverage_days = 0.0

        # ====================================================
        # WASTE RATIO
        #
        # Use historical food-name waste if available.
        # Otherwise use category waste.
        # ====================================================

        waste_ratio = 0.0

        same_food_waste = historical_inventory[
            historical_inventory[
                "_food_name_key"
            ] == food_name_key
        ]

        if not same_food_waste.empty:

            purchased = float(
                same_food_waste[
                    "quantity_purchased"
                ].sum()
            )

            wasted = float(
                same_food_waste[
                    "quantity_wasted"
                ].sum()
            )

            if purchased > 0:

                waste_ratio = (
                    wasted
                    /
                    purchased
                )

        if waste_ratio == 0.0:

            category_rows = historical_inventory[
                historical_inventory[
                    "_category_key"
                ] == mapped_category
            ]

            if not category_rows.empty:

                purchased = float(
                    category_rows[
                        "quantity_purchased"
                    ].sum()
                )

                wasted = float(
                    category_rows[
                        "quantity_wasted"
                    ].sum()
                )

                if purchased > 0:

                    waste_ratio = (
                        wasted
                        /
                        purchased
                    )

        waste_ratio = float(
            np.clip(
                waste_ratio,
                0,
                1
            )
        )

        # ====================================================
        # PRINT AI MATCH
        # ====================================================

        print(
            f"{food_name} "
            f"(ID {food_id}) -> "
            f"{forecast_source} | "
            f"daily demand = "
            f"{average_daily_demand:.2f} | "
            f"7-day demand = "
            f"{forecasted_demand:.2f}"
        )

        # ====================================================
        # ADD RESULT
        # ====================================================

        rows.append({

            "date":
                pd.Timestamp(
                    datetime.now()
                ).normalize(),

            "food_id":
                food_id,

            "food_name":
                food_name,

            "category":
                category,

            "current_stock":
                current_stock,

            "average_daily_demand":
                round(
                    average_daily_demand,
                    2
                ),

            "forecasted_demand":
                round(
                    forecasted_demand,
                    2
                ),

                "forecast_source":
                    forecast_source,

            "stock_coverage_days":
                round(
                    stock_coverage_days,
                    4
                ),

            "waste_ratio":
                round(
                    waste_ratio,
                    6
                ),

            "days_to_expiry":
                days_to_expiry

        })

    # ========================================================
    # CREATE DATAFRAME
    # ========================================================

    live_data = pd.DataFrame(
        rows
    )

    return live_data


# ============================================================
# EXPIRY RISK
# ============================================================

def calculate_expiry_risk(
        days
):

    d = float(days)

    if d <= 0:
        return 100.0

    if d <= 2:
        return 90.0

    if d <= 5:
        return 70.0

    if d <= 7:
        return 50.0

    if d <= 14:
        return 25.0

    return 5.0


# ============================================================
# STOCK / DEMAND RISK
# ============================================================

def calculate_stock_demand_risk(
        current_stock,
        forecasted_demand
):

    # Based on the given stock/demand mapping
    if forecasted_demand <= 0:
        return 10.0

    ratio = float(current_stock) / float(forecasted_demand)

    if ratio >= 1.5:
        return 100.0

    if ratio >= 1.0:
        return 80.0

    if ratio >= 0.75:
        return 60.0

    if ratio >= 0.50:
        return 40.0

    if ratio >= 0.25:
        return 20.0

    return 10.0


# ============================================================
# COVERAGE RISK
# ============================================================

def calculate_coverage_risk(
        coverage
):

    coverage = float(
        coverage
    )

    if coverage >= 21:
        return 15.0

    if coverage >= 14:
        return 12.0

    if coverage >= 10:
        return 9.0

    if coverage >= 7:
        return 6.0

    return 0.0


# ============================================================
# WASTE HISTORY RISK
# ============================================================

def calculate_waste_history_risk(
        waste_ratio
):

    ratio = float(
        waste_ratio
    )

    if ratio >= 0.20:
        return 15.0

    if ratio >= 0.10:
        return 10.0

    if ratio >= 0.05:
        return 5.0

    return 0.0


# ============================================================
# GENERATE LIVE PREDICTIONS
# ============================================================

def generate_live_predictions(
        model,
        live_data,
        feature_columns
):

    X_live = live_data[
        feature_columns
    ].copy()

    X_live = X_live.replace(
        [
            np.inf,
            -np.inf
        ],
        np.nan
    ).fillna(0)

    # --------------------------------------------------------
    # Compute deterministic actionable risk score per item
    # using expiry risk, stock/demand risk, historical waste ratio.
    # final = expiry*0.45 + stock_demand*0.40 + historical_waste*0.15
    # --------------------------------------------------------

    final_scores = []

    for _, row in live_data.iterrows():

        current_stock = float(row.get("current_stock", 0.0))
        average_daily_demand = float(row.get("average_daily_demand", 0.0))
        forecasted_demand = float(row.get("forecasted_demand", 0.0))
        stock_coverage_days = float(row.get("stock_coverage_days", 0.0))
        waste_ratio = float(row.get("waste_ratio", 0.0))
        days_to_expiry = float(row.get("days_to_expiry", 999))

        # expiry risk
        expiry_r = calculate_expiry_risk(days_to_expiry)

        # stock/demand risk
        stock_r = calculate_stock_demand_risk(current_stock, forecasted_demand)

        # historical waste risk: waste_ratio * 100 capped
        hist_waste_r = min(max(float(waste_ratio) * 100.0, 0.0), 100.0)

        final_score = (
            expiry_r * 0.45
            + stock_r * 0.40
            + hist_waste_r * 0.15
        )

        final_score = float(np.clip(final_score, 0.0, 100.0))

        final_scores.append(round(final_score, 2))

    # --------------------------------------------------------
    # FINAL SCORE
    # --------------------------------------------------------

    live_data[
        "predicted_risk_score"
    ] = np.round(
        final_scores,
        2
    )

    # --------------------------------------------------------
    # Risk category based on final score
    # 0-35 LOW, 36-65 MODERATE, 66-100 HIGH
    # --------------------------------------------------------

    def score_to_category(s):

        if s <= 35:
            return "LOW"

        if s <= 65:
            return "MODERATE"

        return "HIGH"

    live_data["predicted_risk_category"] = (
        live_data["predicted_risk_score"].apply(score_to_category)
    )

    # --------------------------------------------------------
    # REMOVE TEMPORARY COLUMN
    # --------------------------------------------------------

    # remove xgboost column if it exists
    if "xgboost_risk_score" in live_data.columns:
        live_data.drop(columns=["xgboost_risk_score"], inplace=True)

    return live_data


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("========================================")
    print("AI WASTE-RISK PREDICTION")
    print("========================================")

    os.makedirs(
        PROCESSED_DIR,
        exist_ok=True
    )

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    # --------------------------------------------------------
    # HISTORICAL DATA
    # --------------------------------------------------------

    sales, waste, purchases = (
        load_data()
    )

    # --------------------------------------------------------
    # TRAINING DATA
    # --------------------------------------------------------

    historical_inventory = (
        create_inventory_dataset(
            sales,
            waste,
            purchases
        )
    )

    # --------------------------------------------------------
    # TRAINING TARGET
    # --------------------------------------------------------

    historical_inventory = (
        calculate_risk_target(
            historical_inventory
        )
    )

    print()
    print(
        "Historical training records:",
        len(
            historical_inventory
        )
    )

    # --------------------------------------------------------
    # TRAIN MODEL
    # --------------------------------------------------------

    model, feature_columns = (
        train_model(
            historical_inventory
        )
    )

    # --------------------------------------------------------
    # LIVE INVENTORY
    # --------------------------------------------------------

    live_inventory = (
        load_live_inventory()
    )

    if live_inventory.empty:

        print(
            "No AVAILABLE inventory."
        )

        return

    # --------------------------------------------------------
    # LIVE FEATURES
    # --------------------------------------------------------

    live_data = (
        build_live_prediction_dataset(
            live_inventory,
            historical_inventory
        )
    )

    # --------------------------------------------------------
    # AI RISK
    # --------------------------------------------------------

    live_data = (
        generate_live_predictions(
            model,
            live_data,
            feature_columns
        )
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------

    output_columns = [

        "date",

        "food_id",

        "food_name",

        "category",

        "current_stock",

        "average_daily_demand",

        "forecasted_demand",

        "stock_coverage_days",

        "waste_ratio",

        "days_to_expiry",

        "predicted_risk_score",

        "predicted_risk_category",
        "forecast_source"

    ]

    result = live_data[
        output_columns
    ].copy()

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    result.to_csv(
        RISK_FILE,
        index=False
    )

    # --------------------------------------------------------
    # PRINT
    # --------------------------------------------------------

    print()
    print("========================================")
    print("LIVE WASTE RISK SCORING COMPLETE")
    print("========================================")

    print()

    print(
        result[
            [
                "food_id",
                "food_name",
                "current_stock",
                "average_daily_demand",
                "forecasted_demand",
                "days_to_expiry",
                "predicted_risk_score",
                "predicted_risk_category"
            ]
        ].to_string(
            index=False
        )
    )

    print()
    print(
        "Risk dataset saved:"
    )

    print(
        RISK_FILE
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    main()