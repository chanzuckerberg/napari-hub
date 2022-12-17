from markdown import Markdown
from markdown.extensions import Extension
from markdown.treeprocessors import Treeprocessor
from markdownify import markdownify

def get_raw_github_url(repo, branch, file):
    return f"https://raw.githubusercontent.com/{repo}/{branch}/{file}"

class ResolveRelativeImageTreeProcesser(Treeprocessor):
    def __init__(self, md, repo: str, branch: str):
        super().__init__(md)
        self.repo = repo
        self.branch = branch

    def run(self, root):
        for img in root.iter('img'):
            src = img.get('src')

            for pattern in ('./', '../'):
                if src.startswith(pattern):
                    url = get_raw_github_url(
                        self.repo,
                        self.branch,
                        src.replace(pattern, ''),
                    )

                    img.set('src', url)

class ResolveRelativeImageExtension(Extension):
    def __init__(self, repo: str, branch: str):
        self.repo = repo
        self.branch = branch

    def extendMarkdown(self, md: Markdown):
        md.treeprocessors.register(
            # Extension
            ResolveRelativeImageTreeProcesser(md, self.repo, self.branch),
            # Extension name
            'resolve-image-extension',
            # Priorty
            0,
        )

def resolve_images_for_markdown(markdown: str, repo: str, branch: str) -> str:
    mk = Markdown(extensions=[ResolveRelativeImageExtension(repo, branch)])
    result = mk.convert(markdown)
    return markdownify(result)
