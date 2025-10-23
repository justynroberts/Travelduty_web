"""FastAPI HTTP server for web UI integration."""

import logging
from typing import Optional, Dict, Any
from datetime import datetime
import threading

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .database import Database


logger = logging.getLogger(__name__)

app = FastAPI(title="Git Deploy Scheduler API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global scheduler instance (set from main)
scheduler_instance = None
db_instance = None


def set_scheduler(scheduler):
    """Set the scheduler instance for API access."""
    global scheduler_instance, db_instance
    scheduler_instance = scheduler
    db_instance = scheduler.db if scheduler else None


class ControlAction(BaseModel):
    """Control action model."""
    action: str  # pause, resume, trigger


@app.get("/")
async def root():
    """Serve the main UI page."""
    return FileResponse("web/frontend/index.html")


@app.get("/api/status")
async def get_status():
    """Get current scheduler status."""
    if not scheduler_instance:
        raise HTTPException(status_code=503, detail="Scheduler not initialized")

    try:
        last_commit = db_instance.get_last_commit() if db_instance else None

        # Calculate next commit time
        next_in = None
        if hasattr(scheduler_instance, 'next_commit_time') and scheduler_instance.next_commit_time:
            next_in = int((scheduler_instance.next_commit_time - datetime.now()).total_seconds())
            next_in = max(0, next_in)

        return {
            "running": True,
            "paused": getattr(scheduler_instance, 'paused', False),
            "next_commit_in": next_in,
            "last_commit": {
                "hash": last_commit['hash'][:7] if last_commit else None,
                "message": last_commit['message'] if last_commit else None,
                "timestamp": last_commit['timestamp'] if last_commit else None,
                "files_changed": last_commit['files_changed'] if last_commit else 0,
                "success": last_commit['success'] if last_commit else False,
            } if last_commit else None,
            "ollama_available": scheduler_instance.ollama_client is not None if scheduler_instance else False,
            "current_theme": scheduler_instance.config.get('ollama.theme', '') if scheduler_instance else '',
            "repository": scheduler_instance.git_ops.repo_path if scheduler_instance and scheduler_instance.git_ops else None,
            "branch": scheduler_instance.git_ops.get_current_branch() if scheduler_instance and scheduler_instance.git_ops else None,
        }
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history")
async def get_history(limit: int = 50):
    """Get commit history."""
    if not db_instance:
        raise HTTPException(status_code=503, detail="Database not initialized")

    try:
        commits = db_instance.get_recent_commits(limit=limit)
        total = db_instance.get_commit_count()

        return {
            "commits": commits,
            "total": total
        }
    except Exception as e:
        logger.error(f"Error getting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
async def get_stats():
    """Get statistics."""
    if not db_instance:
        raise HTTPException(status_code=503, detail="Database not initialized")

    try:
        daily_stats = db_instance.get_daily_stats(days=7)
        commit_types = db_instance.get_commit_types()

        # Calculate commits last 24h
        commits_24h = daily_stats[0]['total_commits'] if daily_stats else 0

        # Get commits by day for chart
        commits_by_day = [stat['total_commits'] for stat in reversed(daily_stats)]

        return {
            "total_commits": db_instance.get_commit_count(),
            "success_rate": round(db_instance.get_success_rate(), 1),
            "ollama_usage_rate": round(db_instance.get_ollama_usage_rate(), 1),
            "commits_last_24h": commits_24h,
            "commits_by_day": commits_by_day,
            "commit_types": commit_types
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/control")
async def control_action(action: ControlAction):
    """Control the scheduler."""
    if not scheduler_instance:
        raise HTTPException(status_code=503, detail="Scheduler not initialized")

    try:
        if action.action == "pause":
            scheduler_instance.paused = True
            logger.info("Scheduler paused via API")
            return {"status": "paused"}

        elif action.action == "resume":
            scheduler_instance.paused = False
            logger.info("Scheduler resumed via API")
            return {"status": "resumed"}

        elif action.action == "trigger":
            # Trigger immediate commit in background
            def trigger_commit():
                try:
                    scheduler_instance._perform_commit()
                except Exception as e:
                    logger.error(f"Error triggering commit: {e}")

            thread = threading.Thread(target=trigger_commit)
            thread.daemon = True
            thread.start()

            logger.info("Commit triggered via API")
            return {"status": "triggered"}

        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action.action}")

    except Exception as e:
        logger.error(f"Error in control action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/config")
async def get_config():
    """Get current configuration."""
    if not scheduler_instance:
        raise HTTPException(status_code=503, detail="Scheduler not initialized")

    try:
        return {
            "config": scheduler_instance.config.config
        }
    except Exception as e:
        logger.error(f"Error getting config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/logs")
async def get_logs(lines: int = 100):
    """Get recent log entries."""
    try:
        log_file = "logs/scheduler.log"
        with open(log_file, 'r') as f:
            log_lines = f.readlines()
            recent_logs = log_lines[-lines:]
            return {"logs": recent_logs}
    except Exception as e:
        logger.error(f"Error getting logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Mount static files
try:
    app.mount("/static", StaticFiles(directory="web/frontend"), name="static")
except Exception:
    pass  # Static files may not exist yet
