import pytest

class HierarchyNode:
    def __init__(self, name, parent=None):
        self.name = name
        self.parent = parent
        self.children = []
        if parent:
            parent.add_child(self)

    def add_child(self, child):
        if child not in self.children:
            child.add
