"""
Module containing functionality for running data workflows as a standalone script.
"""

import argparse
import handler
import json

from typing import Dict


def run_workflow(event: Dict):
    """
    Function for running a particular data workflow based on the event type. The
    event dictionary should contain all of the necessary data to run the
    specified data workflow.
    """

    handler.handle({"Records": [{"body": json.dumps(event)}]}, {})


def _get_arg_parser():
    parser = argparse.ArgumentParser(
        prog="run-workflow",
        description="CLI for running hub data workflows",
    )
    subparsers = parser.add_subparsers(required=True, dest="type")

    seed_s3_categories_parser = subparsers.add_parser(
        "seed-s3-categories", help="categories help"
    )
    seed_s3_categories_parser.add_argument("--bucket", required=True)
    seed_s3_categories_parser.add_argument("--version", required=True)
    seed_s3_categories_parser.add_argument("--s3-path", required=True)
    seed_s3_categories_parser.add_argument("--s3-prefix", default="")

    subparsers.add_parser("activity", help="activity help")

    return parser


def _main():
    parser = _get_arg_parser()
    run_workflow(vars(parser.parse_args()))


if __name__ == "__main__":
    _main()
