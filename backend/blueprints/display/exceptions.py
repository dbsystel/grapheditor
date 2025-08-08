class StyleNotFoundException(Exception):
    "Raised when the style asked for doesn't exist on the server"

    pass


class SafeEvalError(Exception):
    def __init__(self, message, code):
        self.message = message
        self.code = code
        super().__init__(self.message)


class SafeEvalSyntaxError(SafeEvalError):
    """The Python code given to safe_eval is syntactically invalid."""

    def __init__(self, message, code):
        self.code = code
        self.message = message
        super().__init__(self.message, code)


class SafeEvalRuntimeError(SafeEvalError):
    """Evaluating the Python code in the given context raises an Exception."""

    def __init__(self, message, code, element):
        self.code = code
        self.message = message
        self.element = element
        super().__init__(self.message, code)
