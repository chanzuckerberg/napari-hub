"""
Module containing functionality for running workflows. This can be run either as
a standalone CLI script or by importing the function `run_workflow()` and
passing the correct event payload information to the function. This allows us to
be able to run the workflow in a consistently in different environments like
local CLI, GitHub actions, or in an AWS lambda.
"""

import argparse

from activity.update_activity import update_activity
from categories import run_seed_s3_categories_workflow
from typing import Dict


def run_workflow(event: Dict):
    """
    Function for running a particular data workflow based on the event type. The
    event dictionary should contain all of the necessary data to run the
    specified data workflow.
    """

    type = event["type"]

    if type == "activity":
        update_activity()

    if type == "seed-s3-categories":
        run_seed_s3_categories_workflow(
            event["edam_version"],
            event["s3_path"],
        )


def _get_arg_parser():
    parser = argparse.ArgumentParser(
        prog="run-workflow",
        description="CLI for running hub data workflows",
    )
    subparsers = parser.add_subparsers(required=True, dest="type")

    seed_s3_categories_parser = subparsers.add_parser(
        "seed-s3-categories", help="categories help"
    )
    seed_s3_categories_parser.add_argument("--edam-version", required=True)
    seed_s3_categories_parser.add_argument("--s3-path", required=True)

    subparsers.add_parser("activity", help="activity help")

    return parser


def _main():
    parser = _get_arg_parser()
    run_workflow(vars(parser.parse_args()))


if __name__ == "__main__":
    _main()
