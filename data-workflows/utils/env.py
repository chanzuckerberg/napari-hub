import os


def get_required_env(key: str) -> str:
    """
    Utility for getting the value of an environment variable with the additional
    constraint that it must be defined, otherwise the application will be unable
    to run without it.
    """

    value = os.environ.get(key)

    if not value:
        raise ValueError(f"Required environment variable '{key}' is not defined")

    return value
