from markdown import Markdown
from markdown.extensions import Extension
from markdown.treeprocessors import Treeprocessor
from markdownify import markdownify
from urllib.parse import urlparse, urlunparse
import os.path as path

def resolve_link(base, src):
    scheme, netloc, base_path, *_ = urlparse(base)

    src_scheme, _, src_path, params, query, fragment = urlparse(src)

    # URL is absolute if there's a scheme defined
    if src_scheme:
        return src

    complete_path = path.normpath(path.join(base_path, src_path))

    return urlunparse((
        scheme,
        netloc,
        complete_path,
        params,
        query,
        fragment,
    ))

class ResolveRelativeImageTreeProcesser(Treeprocessor):
    def __init__(self, md, repo: str, branch: str, source: str):
        super().__init__(md)
        self.repo = repo
        self.branch = branch
        self.source = source

    def resolve_links(self, iter, get_source, set_source):
        for node in iter:
            src = get_source(node)
            base = path.join(
                'https://raw.githubusercontent.com',
                self.repo,
                self.branch,
                self.source,
            )

            set_source(node, resolve_link(base, src))

    def run(self, root):
        self.resolve_links(
            root.iter('img'),
            lambda node: node.get('src'),
            lambda node, url: node.set('src', url),
        )

        self.resolve_links(
            root.iter('link'),
            lambda node: node.get('href'),
            lambda node, url: node.set('href', url),
        )

class ResolveRelativeImageExtension(Extension):
    def __init__(self, repo: str, branch: str, source: str):
        self.repo = repo
        self.branch = branch
        self.source = source

    def extendMarkdown(self, md: Markdown):
        md.treeprocessors.register(
            item=ResolveRelativeImageTreeProcesser(md, self.repo, self.branch, self.source),
            name='resolve-image-extension',
            priority=0,
        )

def resolve_images_for_markdown(markdown: str, repo: str, branch: str, source: str) -> str:
    mk = Markdown(extensions=[ResolveRelativeImageExtension(repo, branch, source)])
    result = mk.convert(markdown)
    return markdownify(result)
