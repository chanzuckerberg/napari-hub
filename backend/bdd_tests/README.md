## Behavioral Driven Development for backend

### Setting up to run BDD tests

To ensure you have all the dependencies needed for the BDD tests, run `pip install` on 'backend\bdd-test-requirements.txt`.
```
pip install -r bdd-test-requirements.txt
```

### Running BDD tests locally

To run the tests against your local environment, ensure you have the backend application running locally in another terminal, and run the following command from the backend folder:
```
python -m pytest bdd_tests
```

If you are running your local Flask application on a non-default port (The default port is `12345`), you can leverage the `PORT` variable. For example, if you are running the backend application on port 8080, you can specify it as follows:
```
PORT=8080 python -m pytest bdd_tests
```

### Running BDD tests against staging and prod

The prefix variable is helpful in cases where you are running against non-local environments. For staging and production, it can be run by setting the `PREFIX` value to `staging` and `prod`, respectively. For example, to run the BDD tests against the prod-environment, use the following command:
```
PREFIX=prod python -m pytest bdd_tests
```

### Running BDD tests against dev environments

The `PREFIX` variable also comes to the rescue in this case. The dev environment can have any prefix, so you would have to specify the dev-branch name that acts as the prefix for the environment. For example, to run the BDD tests against the `dev-shared` dev-environment, use the following command:

```
PREFIX=dev-shared python -m pytest bdd_tests
```
