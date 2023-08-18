class MockSnowflakeCursor:
    def __init__(self, data, row_field_count):
        self._data = data
        self._size = len(data)
        self._index = -1
        self._row_field_count = row_field_count

    def __iter__(self):
        return self

    def __next__(self):
        if self._index < self._size - 1:
            self._index += 1
            if self._row_field_count == 3:
                return (
                    self._data[self._index][0],
                    self._data[self._index][1],
                    self._data[self._index][2],
                )
            else:
                return self._data[self._index][0], self._data[self._index][1]
        raise StopIteration
