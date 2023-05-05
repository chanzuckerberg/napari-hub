"""
Module containing functionality for running data workflows as a standalone script.
"""

import argparse
import categories
import logging

from activity.update_activity import update_activity
from typing import Dict

LOGGER = logging.getLogger()


def run_workflow(event: Dict):
    """
    Function for running a particular data workflow based on the event type. The
    event dictionary should contain all of the necessary data to run the
    specified data workflow.

    Events:
        activity: {}
        seed-s3-categories: { version: string, categories_path: string }
    """

    event_type = event.get("type", "").lower()

    if event_type == "activity":
        update_activity()
        LOGGER.info(f"Update successful for type={event_type}")
    elif event_type == "seed-s3-categories":
        version = event.get("version")
        categories_path = event.get("categories_path")

        categories.run_seed_s3_categories_workflow(version, categories_path)
        LOGGER.info(f"Update successful for type={event_type}")


def _get_arg_parser():
    parser = argparse.ArgumentParser(
        prog="run-workflow",
        description="CLI for running hub data workflows",
    )
    subparsers = parser.add_subparsers(required=True, dest="type")

    seed_s3_categories_parser = subparsers.add_parser(
        "seed-s3-categories", help="categories help"
    )
    seed_s3_categories_parser.add_argument("--version", required=True)
    seed_s3_categories_parser.add_argument("--categories-path", required=True)

    subparsers.add_parser("activity", help="activity help")

    return parser


def _main():
    parser = _get_arg_parser()
    run_workflow(vars(parser.parse_args()))


if __name__ == "__main__":
    _main()
