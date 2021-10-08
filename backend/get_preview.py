from preview import get_plugin_preview
import argparse

parser = argparse.ArgumentParser(description='Write preview metadata to JSON.')
parser.add_argument('github_url', action='store', help='URL to GitHub repository of plugin.')
parser.add_argument('dest', action='store', help='Path to destination directory (must exist).')

if __name__ == '__main__':
    args = parser.parse_args()
    get_plugin_preview(args.github_url, args.dest)
