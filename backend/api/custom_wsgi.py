def script_path_middleware(script_path):
    def wrapper(wsgi_app):

        # Allows route mapping to ignore the specific prefix if present
        def new_app(environ, start_response):
            if environ['PATH_INFO'].startswith(script_path):
                environ['PATH_INFO'] = environ['PATH_INFO'][len(script_path):]
                environ['SCRIPT_NAME'] += script_path
            return wsgi_app(environ, start_response)

        return new_app
    return wrapper
