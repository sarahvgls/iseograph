## Dev tools

### About poetry

Add new dependencies to your project using the command:

```bash
poetry add <package_name>
```

Dependencies will be added to the `pyproject.toml` file.

If specifically dev dependencies are needed, use:

```bash
poetry add --group dev <package_name>
```

They will be added to the `pyproject.toml` file under the `[tool.poetry.dev-dependencies]` section.

Start poetry environment:

```bash
poetry shell
```

### About .env files

The `.env` file is used to store environment variables for the project. Copy the `.env.template` file to `.env` and
adjust the variables as needed.