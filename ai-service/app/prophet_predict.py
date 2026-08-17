import os
import pickle
import pandas as pd


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODELS_DIR = os.path.join(
    BASE_DIR,
    "models"
)


def predict_food(food_id, days=7):

    model_file = os.path.join(
        MODELS_DIR,
        f"prophet_food_{food_id}.pkl"
    )

    if not os.path.exists(model_file):
        raise FileNotFoundError(
            f"Model not found for food ID {food_id}"
        )

    with open(model_file, "rb") as file:
        model = pickle.load(file)

    future = model.make_future_dataframe(
        periods=days,
        freq="D"
    )

    forecast = model.predict(future)

    result = forecast[
        [
            "ds",
            "yhat",
            "yhat_lower",
            "yhat_upper"
        ]
    ].tail(days).copy()

    result["yhat"] = result["yhat"].clip(lower=0)

    result["yhat_lower"] = (
        result["yhat_lower"].clip(lower=0)
    )

    result["yhat_upper"] = (
        result["yhat_upper"].clip(lower=0)
    )

    result["predicted_demand"] = (
        result["yhat"]
        .round()
        .astype(int)
    )

    return result


if __name__ == "__main__":

    # Rice
    food_id = 1

    forecast = predict_food(
        food_id,
        days=7
    )

    print()
    print("========================================")
    print("7-DAY DEMAND FORECAST")
    print("========================================")

    print(
        forecast[
            [
                "ds",
                "predicted_demand"
            ]
        ].to_string(index=False)
    )

    total_demand = int(
        forecast["predicted_demand"].sum()
    )

    print()
    print(
        f"Predicted 7-day demand: {total_demand}"
    )