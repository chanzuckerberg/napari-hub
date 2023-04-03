import os


def get_required_env(key: str) -> str:
    """
    Utility for getting the value of an environment variable with the additional
    constraint that it must be defined, otherwise the application will be unable
    to run without it.

    :param: key: The key for the environment variable.
    :type key: str
    :raises ValueError: If environment variable is not defined.
    :return The environment variable value.
    :rtype str
    """

    value = os.getenv(key)

    if not value:
        raise ValueError(f"Required environment variable '{key}' is not defined")

    return value
