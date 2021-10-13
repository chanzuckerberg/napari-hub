import os
from preview import get_plugin_preview
import argparse

parser = argparse.ArgumentParser(description='Write preview metadata to JSON.')
parser.add_argument('repo_pth', action='store', help='Path to GitHub repository of plugin. Use `--local` if repository has already been cloned.')
parser.add_argument('dest', action='store', help='Path to destination directory (must exist).')
parser.add_argument('--local', action='store_true', help='Use if repo_pth is path to a local repository.')

if __name__ == '__main__':
    args = parser.parse_args()
    repo_pth = args.repo_pth
    if args.local:
        repo_pth = os.path.abspath(args.repo_pth)
    dest_pth = os.path.abspath(args.dest)
    get_plugin_preview(repo_pth, dest_pth, args.local)
