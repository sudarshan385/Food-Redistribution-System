import os
import subprocess
import sys
from datetime import datetime


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


def run_script(script_name):

    script_path = os.path.join(
        BASE_DIR,
        "app",
        script_name
    )

    print()
    print("Running:", script_name)

    result = subprocess.run(
        [
            sys.executable,
            script_path
        ],
        capture_output=True,
        text=True
    )

    print(result.stdout)

    if result.returncode != 0:

        print(result.stderr)

        raise RuntimeError(
            f"{script_name} failed"
        )


def run_batch_prediction():

    start_time = datetime.now()

    print()
    print("========================================")
    print("BATCH AI PREDICTION")
    print("========================================")

    print(
        "Started:",
        start_time
    )

    # 1. Preprocess historical data
    run_script(
        "preprocessing.py"
    )

    # 2. Prophet forecasting
    run_script(
        "forecasting.py"
    )

    # 3. LSTM forecasting
    run_script(
        "lstm_model.py"
    )

    # 4. Waste risk
    run_script(
        "waste_risk_model.py"
    )

    # 5. Reorder recommendation
    run_script(
        "reorder_recommendation.py"
    )

    end_time = datetime.now()

    print()
    print("========================================")
    print("BATCH PREDICTION COMPLETE")
    print("========================================")

    print(
        "Finished:",
        end_time
    )


if __name__ == "__main__":

    run_batch_prediction()