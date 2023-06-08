import pytest


@pytest.fixture
def verify_call():
    def _verify_call(is_called, mock, calls):
        if is_called:
            assert len(calls) == mock.call_count
            assert calls == mock.call_args_list
        else:
            mock.assert_not_called()
    return _verify_call
