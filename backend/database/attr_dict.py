from collections import defaultdict


class AttrDict(dict):
    def __getattr__(self, item):
        return self[item]


class DefaultAttrDict(defaultdict):
    def __getattr__(self, item):
        if item in self:
            return self.get(item)
        if self.default_factory is not None:
            return self.default_factory()

        raise KeyError(item)
