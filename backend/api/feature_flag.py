from splitio import get_factory
from splitio.exceptions import TimeoutException

factory = get_factory('YOUR_API_KEY')
try:
    factory.block_until_ready(5)  # wait up to 5 seconds
except TimeoutException:
    # Now the user can choose whether to abort the whole execution, or just keep going
    # without a ready client, which if configured properly, should become ready at some point.
    pass
split = factory.client()
