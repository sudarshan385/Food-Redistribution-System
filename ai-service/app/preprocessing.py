import os
import pandas as pd


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

os.makedirs(PROCESSED_DIR, exist_ok=True)


SALES_FILE = os.path.join(
    RAW_DIR,
    "sales_history.csv"
)

PURCHASE_FILE = os.path.join(
    RAW_DIR,
    "purchase_history.csv"
)

WASTE_FILE = os.path.join(
    RAW_DIR,
    "waste_history.csv"
)


# ---------------------------------------------------------
# Load Data
# ---------------------------------------------------------

def load_datasets():

    sales = pd.read_csv(SALES_FILE)
    purchases = pd.read_csv(PURCHASE_FILE)
    waste = pd.read_csv(WASTE_FILE)

    return sales, purchases, waste


# ---------------------------------------------------------
# Clean Sales Data
# ---------------------------------------------------------

def preprocess_sales(sales):

    print("\nProcessing sales data...")

    # Convert date column
    sales["date"] = pd.to_datetime(
        sales["date"],
        errors="coerce"
    )

    # Convert quantity to numeric
    sales["quantity_sold"] = pd.to_numeric(
        sales["quantity_sold"],
        errors="coerce"
    )

    # Remove invalid records
    sales = sales.dropna(
        subset=[
            "date",
            "food_id",
            "quantity_sold"
        ]
    )

    # Remove negative sales
    sales = sales[
        sales["quantity_sold"] >= 0
        ]

    # Sort by food and date
    sales = sales.sort_values(
        ["food_id", "date"]
    )

    # Create time-based features
    sales["day_of_week"] = sales["date"].dt.dayofweek
    sales["day_of_month"] = sales["date"].dt.day
    sales["month"] = sales["date"].dt.month
    sales["week_of_year"] = sales["date"].dt.isocalendar().week.astype(int)

    # Weekend flag
    sales["is_weekend"] = (
            sales["day_of_week"] >= 5
    ).astype(int)

    # 7-day rolling average
    sales["rolling_7_day"] = (
        sales
        .groupby("food_id")["quantity_sold"]
        .transform(
            lambda x: x.rolling(
                window=7,
                min_periods=1
            ).mean()
        )
    )

    # 14-day rolling average
    sales["rolling_14_day"] = (
        sales
        .groupby("food_id")["quantity_sold"]
        .transform(
            lambda x: x.rolling(
                window=14,
                min_periods=1
            ).mean()
        )
    )

    # ---------------------------------------------------------
    # Normalize category names based on product name and raw category
    # Aim to map historical categories into the inventory categories:
    # Cooked Food, Fruits, Vegetables, Dairy, Bakery
    # Use conservative keyword mappings — do not invent history.
    def map_category(row):

        name = str(row.get("food_name", "")).strip().lower()
        cat = str(row.get("category", "")).strip().lower()

        # direct mappings
        if cat in ["grains", "prepared food"]:
            # decide by name where possible
            if any(k in name for k in ["rice", "pulao", "dal", "curry"]):
                return "Cooked Food"
            if any(k in name for k in ["bread", "chapati"]):
                return "Bakery"
            return "Cooked Food"

        if cat in ["bakery"]:
            return "Bakery"

        if cat in ["dairy"]:
            return "Dairy"

        # name-based heuristics
        if any(k in name for k in ["apple", "banana", "kiwi", "grape", "grapes", "papaya", "mango"]):
            return "Fruits"

        if any(k in name for k in ["onion", "cucumber", "tomato", "potato", "lettuce", "spinach"]):
            return "Vegetables"

        if any(k in name for k in ["bread", "chapati"]):
            return "Bakery"

        if any(k in name for k in ["milk", "curd", "yogurt"]):
            return "Dairy"

        # fallback: keep original category with capitalization
        if cat:
            return cat.title()

        return "Unknown"

    sales["category"] = (
        sales.apply(map_category, axis=1)
    )

    return sales


# ---------------------------------------------------------
# Clean Purchase Data
# ---------------------------------------------------------

def preprocess_purchases(purchases):

    print("Processing purchase data...")

    purchases["date"] = pd.to_datetime(
        purchases["date"],
        errors="coerce"
    )

    purchases["quantity_purchased"] = pd.to_numeric(
        purchases["quantity_purchased"],
        errors="coerce"
    )

    purchases["purchase_cost"] = pd.to_numeric(
        purchases["purchase_cost"],
        errors="coerce"
    )

    purchases = purchases.dropna(
        subset=[
            "date",
            "food_id",
            "quantity_purchased"
        ]
    )

    purchases = purchases[
        purchases["quantity_purchased"] >= 0
        ]

    purchases = purchases[
        purchases["purchase_cost"] >= 0
        ]

    purchases = purchases.sort_values(
        ["food_id", "date"]
    )

    return purchases


# ---------------------------------------------------------
# Clean Waste Data
# ---------------------------------------------------------

def preprocess_waste(waste):

    print("Processing waste data...")

    waste["date"] = pd.to_datetime(
        waste["date"],
        errors="coerce"
    )

    waste["quantity_wasted"] = pd.to_numeric(
        waste["quantity_wasted"],
        errors="coerce"
    )

    waste = waste.dropna(
        subset=[
            "date",
            "food_id",
            "quantity_wasted"
        ]
    )

    waste = waste[
        waste["quantity_wasted"] >= 0
        ]

    waste = waste.sort_values(
        ["food_id", "date"]
    )

    return waste


# ---------------------------------------------------------
# Create Daily Demand Dataset
# ---------------------------------------------------------

def create_daily_demand(sales):

    print("Creating daily demand dataset...")

    daily_demand = (
        sales
        .groupby(
            [
                "date",
                "food_id",
                "food_name",
                "category"
            ],
            as_index=False
        )["quantity_sold"]
        .sum()
    )

    daily_demand = daily_demand.sort_values(
        ["food_id", "date"]
    )

    return daily_demand


# ---------------------------------------------------------
# Create Purchase Summary
# ---------------------------------------------------------

def create_purchase_summary(purchases):

    purchase_summary = (
        purchases
        .groupby(
            [
                "food_id",
                "food_name",
                "category"
            ],
            as_index=False
        )
        .agg(
            total_purchased=(
                "quantity_purchased",
                "sum"
            ),
            total_purchase_cost=(
                "purchase_cost",
                "sum"
            ),
            purchase_transactions=(
                "date",
                "count"
            )
        )
    )

    return purchase_summary


# ---------------------------------------------------------
# Create Waste Summary
# ---------------------------------------------------------

def create_waste_summary(waste):

    waste_summary = (
        waste
        .groupby(
            [
                "food_id",
                "food_name",
                "category"
            ],
            as_index=False
        )
        .agg(
            total_wasted=(
                "quantity_wasted",
                "sum"
            ),
            waste_transactions=(
                "date",
                "count"
            )
        )
    )

    return waste_summary


# ---------------------------------------------------------
# Main Preprocessing Function
# ---------------------------------------------------------

def run_preprocessing():

    print("========================================")
    print("AI DATA PREPROCESSING")
    print("========================================")

    sales, purchases, waste = load_datasets()

    print("\nRaw dataset sizes:")
    print(f"Sales     : {len(sales)}")
    print(f"Purchases : {len(purchases)}")
    print(f"Waste     : {len(waste)}")

    # Process datasets
    sales = preprocess_sales(sales)
    purchases = preprocess_purchases(purchases)
    waste = preprocess_waste(waste)

    # Create derived datasets
    daily_demand = create_daily_demand(sales)

    purchase_summary = create_purchase_summary(
        purchases
    )

    waste_summary = create_waste_summary(
        waste
    )

    # Output files
    sales_output = os.path.join(
        PROCESSED_DIR,
        "processed_sales.csv"
    )

    purchases_output = os.path.join(
        PROCESSED_DIR,
        "processed_purchases.csv"
    )

    waste_output = os.path.join(
        PROCESSED_DIR,
        "processed_waste.csv"
    )

    demand_output = os.path.join(
        PROCESSED_DIR,
        "daily_demand.csv"
    )

    purchase_summary_output = os.path.join(
        PROCESSED_DIR,
        "purchase_summary.csv"
    )

    waste_summary_output = os.path.join(
        PROCESSED_DIR,
        "waste_summary.csv"
    )

    # Save
    sales.to_csv(
        sales_output,
        index=False
    )

    purchases.to_csv(
        purchases_output,
        index=False
    )

    waste.to_csv(
        waste_output,
        index=False
    )

    daily_demand.to_csv(
        demand_output,
        index=False
    )

    purchase_summary.to_csv(
        purchase_summary_output,
        index=False
    )

    waste_summary.to_csv(
        waste_summary_output,
        index=False
    )

    # Final report
    print("\n========================================")
    print("PREPROCESSING COMPLETE")
    print("========================================")

    print(f"Processed sales     : {len(sales)}")
    print(f"Processed purchases : {len(purchases)}")
    print(f"Processed waste     : {len(waste)}")
    print(f"Daily demand rows   : {len(daily_demand)}")

    print("\nFiles created:")
    print("processed_sales.csv")
    print("processed_purchases.csv")
    print("processed_waste.csv")
    print("daily_demand.csv")
    print("purchase_summary.csv")
    print("waste_summary.csv")


# ---------------------------------------------------------
# Run
# ---------------------------------------------------------

if __name__ == "__main__":
    run_preprocessing()