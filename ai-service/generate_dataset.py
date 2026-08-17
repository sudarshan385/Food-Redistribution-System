import csv
import os
import random
from datetime import date, timedelta

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")

os.makedirs(RAW_DATA_DIR, exist_ok=True)

SALES_FILE = os.path.join(RAW_DATA_DIR, "sales_history.csv")
PURCHASE_FILE = os.path.join(RAW_DATA_DIR, "purchase_history.csv")
WASTE_FILE = os.path.join(RAW_DATA_DIR, "waste_history.csv")


# ---------------------------------------------------------
# Food Products
# ---------------------------------------------------------

products = [
    {
        "food_id": 1,
        "food_name": "Rice",
        "category": "Grains",
        "base_demand": 45,
        "cost": 40
    },
    {
        "food_id": 2,
        "food_name": "Chapati",
        "category": "Bakery",
        "base_demand": 55,
        "cost": 12
    },
    {
        "food_id": 3,
        "food_name": "Vegetable Curry",
        "category": "Cooked Food",
        "base_demand": 35,
        "cost": 60
    },
    {
        "food_id": 4,
        "food_name": "Dal",
        "category": "Cooked Food",
        "base_demand": 30,
        "cost": 50
    },
    {
        "food_id": 5,
        "food_name": "Bread",
        "category": "Bakery",
        "base_demand": 40,
        "cost": 30
    },
    {
        "food_id": 6,
        "food_name": "Milk",
        "category": "Dairy",
        "base_demand": 50,
        "cost": 35
    },
    {
        "food_id": 7,
        "food_name": "Curd",
        "category": "Dairy",
        "base_demand": 32,
        "cost": 45
    },
    {
        "food_id": 8,
        "food_name": "Pulao",
        "category": "Prepared Food",
        "base_demand": 38,
        "cost": 70
    }
]


# ---------------------------------------------------------
# Date Range
# 365 days of historical data
# ---------------------------------------------------------

start_date = date(2025, 8, 1)
end_date = date(2026, 7, 31)

random.seed(42)


# ---------------------------------------------------------
# Generate Sales History
# ---------------------------------------------------------

sales_rows = []

current_date = start_date

while current_date <= end_date:

    day_of_week = current_date.weekday()

    for product in products:

        # Base demand
        demand = product["base_demand"]

        # Weekend effect
        if day_of_week >= 5:
            demand *= 1.20

        # Weekly seasonality
        if day_of_week == 0:
            demand *= 1.10

        if day_of_week == 6:
            demand *= 1.15

        # Random variation
        variation = random.uniform(0.80, 1.20)

        quantity_sold = max(
            1,
            int(demand * variation)
        )

        sales_rows.append([
            current_date.isoformat(),
            product["food_id"],
            product["food_name"],
            product["category"],
            quantity_sold
        ])

    current_date += timedelta(days=1)


# ---------------------------------------------------------
# Generate Purchase History
# ---------------------------------------------------------

purchase_rows = []

current_date = start_date

while current_date <= end_date:

    # Purchase approximately every 7 days
    if (current_date - start_date).days % 7 == 0:

        for product in products:

            purchase_quantity = int(
                product["base_demand"]
                * random.uniform(5.0, 8.0)
            )

            suppliers = [
                "Local Supplier",
                "Fresh Foods Ltd",
                "Green Basket Suppliers",
                "City Wholesale Market"
            ]

            supplier = random.choice(suppliers)

            purchase_cost = round(
                purchase_quantity * product["cost"] * random.uniform(0.90, 1.10),
                2
            )

            purchase_rows.append([
                current_date.isoformat(),
                product["food_id"],
                product["food_name"],
                product["category"],
                purchase_quantity,
                supplier,
                purchase_cost
            ])

    current_date += timedelta(days=1)


# ---------------------------------------------------------
# Generate Waste History
# ---------------------------------------------------------

waste_rows = []

current_date = start_date

waste_reasons = [
    "Expired",
    "Unsold",
    "Damaged",
    "Overproduction"
]

while current_date <= end_date:

    # Generate waste every few days
    if random.random() < 0.35:

        product = random.choice(products)

        quantity_wasted = random.randint(
            1,
            max(2, int(product["base_demand"] * 0.20))
        )

        reason = random.choice(waste_reasons)

        waste_rows.append([
            current_date.isoformat(),
            product["food_id"],
            product["food_name"],
            product["category"],
            quantity_wasted,
            reason
        ])

    current_date += timedelta(days=1)


# ---------------------------------------------------------
# Write Sales CSV
# ---------------------------------------------------------

with open(
        SALES_FILE,
        "w",
        newline="",
        encoding="utf-8"
) as file:

    writer = csv.writer(file)

    writer.writerow([
        "date",
        "food_id",
        "food_name",
        "category",
        "quantity_sold"
    ])

    writer.writerows(sales_rows)


# ---------------------------------------------------------
# Write Purchase CSV
# ---------------------------------------------------------

with open(
        PURCHASE_FILE,
        "w",
        newline="",
        encoding="utf-8"
) as file:

    writer = csv.writer(file)

    writer.writerow([
        "date",
        "food_id",
        "food_name",
        "category",
        "quantity_purchased",
        "supplier",
        "purchase_cost"
    ])

    writer.writerows(purchase_rows)


# ---------------------------------------------------------
# Write Waste CSV
# ---------------------------------------------------------

with open(
        WASTE_FILE,
        "w",
        newline="",
        encoding="utf-8"
) as file:

    writer = csv.writer(file)

    writer.writerow([
        "date",
        "food_id",
        "food_name",
        "category",
        "quantity_wasted",
        "reason"
    ])

    writer.writerows(waste_rows)


# ---------------------------------------------------------
# Summary
# ---------------------------------------------------------

print("========================================")
print("Historical Dataset Generation Complete")
print("========================================")

print(f"Sales records     : {len(sales_rows)}")
print(f"Purchase records  : {len(purchase_rows)}")
print(f"Waste records     : {len(waste_rows)}")

print()
print("Files generated:")

print(SALES_FILE)
print(PURCHASE_FILE)
print(WASTE_FILE)