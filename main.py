#!/usr/bin/env python3
"""Main entry point for git-deploy-schedule."""

import sys
import argparse
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.scheduler import GitScheduler


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Automated git commit scheduler with Ollama-powered commit messages"
    )

    parser.add_argument(
        '--config',
        type=str,
        default='config/config.yaml',
        help='Path to configuration file (default: config/config.yaml)'
    )

    parser.add_argument(
        '--once',
        action='store_true',
        help='Run once and exit (useful for testing)'
    )

    parser.add_argument(
        '--status',
        action='store_true',
        help='Show scheduler status and exit'
    )

    args = parser.parse_args()

    try:
        # Initialize scheduler
        scheduler = GitScheduler(config_path=args.config)

        # Run based on mode
        if args.status:
            scheduler.status()
        elif args.once:
            success = scheduler.run_once()
            sys.exit(0 if success else 1)
        else:
            scheduler.run()

    except KeyboardInterrupt:
        print("\nScheduler stopped")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
