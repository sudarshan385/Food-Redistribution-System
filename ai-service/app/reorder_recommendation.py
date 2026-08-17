import os
import pandas as pd


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

OUTPUT_FILE = os.path.join(
    PROCESSED_DIR,
    "reorder_recommendations.csv"
)


# Storage capacity for each food product
STORAGE_CAPACITY = {
    1: 500,
    2: 600,
    3: 400,
    4: 350,
    5: 450,
    6: 550,
    7: 400,
    8: 450
}


FORECAST_DAYS = 7
SAFETY_STOCK_RATIO = 0.20


def load_risk_data():

    if not os.path.exists(RISK_FILE):

        raise FileNotFoundError(
            f"Risk dataset not found:\n{RISK_FILE}"
        )

    data = pd.read_csv(
        RISK_FILE
    )

    data["date"] = pd.to_datetime(
        data["date"]
    )

    return data


def get_latest_inventory(data):

    latest = (
        data
        .sort_values("date")
        .groupby(
            "food_id",
            as_index=False
        )
        .tail(1)
    )

    return latest.copy()


def calculate_recommendations(
        inventory
):

    recommendations = []

    for _, row in inventory.iterrows():

        food_id = int(
            row["food_id"]
        )

        food_name = row[
            "food_name"
        ]

        current_stock = float(
            row["current_stock"]
        )

        daily_demand = float(
            row["average_daily_demand"]
        )

        forecasted_demand = float(
            row["forecasted_demand"]
        )

        risk_score = float(
            row["predicted_risk_score"]
        )

        risk_category = str(
            row["predicted_risk_category"]
        )

        # Safety stock (20% of 7-day forecast)
        safety_stock = (
            forecasted_demand * SAFETY_STOCK_RATIO
        )

        # Target/required stock
        target_stock = (
            forecasted_demand + safety_stock
        )

        # Recommended purchase = target - current_stock (clamped >=0)
        recommended_purchase = max(
            0,
            round(target_stock - current_stock)
        )

        # Storage capacity (use mapping if available otherwise default 500)
        storage_capacity = STORAGE_CAPACITY.get(food_id, 500)

        available_storage = max(0, storage_capacity - current_stock)

        # Respect storage capacity
        recommended_purchase = int(
            min(recommended_purchase, max(0, int(available_storage)))
        )

        # Reorder status
        status = "REORDER" if recommended_purchase > 0 else "SUFFICIENT"

        # Simple reason text
        reason = "Recommended based on 7-day forecast and safety stock" if status == "REORDER" else "Current stock sufficient"

        recommendations.append({

            "food_id": food_id,

            "food_name": food_name,

            "current_stock": round(
                current_stock,
                2
            ),

            "average_daily_demand": round(daily_demand, 2),
            "forecasted_7_day_demand": round(forecasted_demand, 2),
            "safety_stock": round(safety_stock, 2),
            "target_stock": round(target_stock, 2),
            "storage_capacity": storage_capacity,
            "available_storage": round(available_storage, 2),
            "waste_risk_score": round(risk_score, 2),
            "waste_risk_category": risk_category,
            "recommended_purchase": recommended_purchase,
            "reorder_status": status,
            "reason": reason,
            "forecast_source": row.get("forecast_source", "UNKNOWN")
        })

    return pd.DataFrame(
        recommendations
    )


def main():

    print()
    print("========================================")
    print("SMART REORDER RECOMMENDATION")
    print("========================================")

    data = load_risk_data()

    print(
        "Risk records:",
        len(data)
    )

    inventory = get_latest_inventory(
        data
    )

    print(
        "Latest inventory records:",
        len(inventory)
    )

    recommendations = calculate_recommendations(
        inventory
    )

    recommendations.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print()
    print("========================================")
    print("REORDER RECOMMENDATION COMPLETE")
    print("========================================")

    print()

    print(
        recommendations.to_string(
            index=False
        )
    )

    print()

    print(
        "Recommendation file saved:"
    )

    print(
        OUTPUT_FILE
    )

    print()

    print(
        "Status distribution:"
    )

    print(
        recommendations[
            "reorder_status"
        ].value_counts()
    )


if __name__ == "__main__":
    main()