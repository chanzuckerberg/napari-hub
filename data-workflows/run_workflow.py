import argparse
import os

from categories import run_seed_s3_categories_workflow
from typing import Dict


def run_workflow(event: Dict):
    type = event['type']

    if type == 'seed-s3-categories':
        run_seed_s3_categories_workflow(
            event['table'],
            event['bucket'],
            event['edam_version'],
        )


def get_arg_parser():
    parser = argparse.ArgumentParser(
        prog='run-workflow',
        description='CLI for running hub data workflows',
    )
    subparsers = parser.add_subparsers(required=True, dest='type')

    seed_s3_categories_parser = subparsers.add_parser('seed-s3-categories', help='categories help')
    seed_s3_categories_parser.add_argument('--table', required=True)
    seed_s3_categories_parser.add_argument('--bucket', required=True)
    seed_s3_categories_parser.add_argument('--edam-version', required=True)

    return parser

def main():
    parser = get_arg_parser()
    run_workflow(vars(parser.parse_args()))
    run_workflow

if __name__ == '__main__':
    main()
