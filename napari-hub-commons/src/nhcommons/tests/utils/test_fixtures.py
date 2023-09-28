import requests


class MockResponse(requests.Response):
    def __init__(self, status_code: int = 200, content: str = ""):
        super().__init__()
        self.status_code = status_code
        self._content = content.encode("UTF-8")
