import inspect
import time
import functools
from string import Formatter
import logging

LOGGER = logging.getLogger()


class _UnseenFormatter(Formatter):
    def __init__(self, method, parse_method_for_key=True):
        self._method = method
        self._parse_method_for_key = parse_method_for_key

    def get_value(self, key, args, kwds):
        if isinstance(key, str):
            try:
                return kwds[key]
            except KeyError:
                if self._parse_method_for_key:
                    parameters = inspect.signature(self._method).parameters
                    for i, name_param_tuple in enumerate(parameters.items()):
                        if name_param_tuple[0] == key:
                            if len(args) > i:
                                return args[i]
                            elif name_param_tuple[1].default:
                                return name_param_tuple[1].default

                return key
        else:
            try:
                return args[key]
            except IndexError:
                if self._parse_method_for_key:
                    parameters = inspect.signature(self._method).parameters
                    for i, name_param_tuple in enumerate(parameters.items()):
                        if i == key:
                            if name_param_tuple[0] in kwds:
                                return kwds[name_param_tuple[0]]
                            elif name_param_tuple[1].default:
                                return name_param_tuple[1].default
                return key


def timer_log(method=None, custom_log=""):
    if method is None:
        return functools.partial(timer_log, custom_log=custom_log)

    def timer_log_executor(*args, **kwargs):
        start = time.perf_counter()
        result = method(*args, **kwargs)
        duration = (time.perf_counter() - start) * 1000
        if custom_log:
            log_kwargs = {key: value for key, value in kwargs.items()}
            log_kwargs['_duration'] = duration
            fmt = _UnseenFormatter(method)
            LOGGER.info(fmt.format(custom_log, *args, **log_kwargs))
        else:
            LOGGER.info(f"Function {method.__name__}({args}, {kwargs}) took"
                        f" {duration:.5f}ms to execute")
        return result
    return timer_log_executor
