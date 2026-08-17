from apscheduler.schedulers.background import BackgroundScheduler

from app.batch_prediction import run_batch_prediction


scheduler = BackgroundScheduler()


def start_scheduler():

    # Run once every 24 hours
    scheduler.add_job(
        run_batch_prediction,
        "interval",
        hours=24,
        id="daily_ai_prediction",
        replace_existing=True
    )

    scheduler.start()

    print("AI batch scheduler started.")
    print("Scheduled interval: every 24 hours")


def stop_scheduler():

    if scheduler.running:
        scheduler.shutdown()
        print("AI batch scheduler stopped.")