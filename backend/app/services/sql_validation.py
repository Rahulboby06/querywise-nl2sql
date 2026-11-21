"""Parse and inspect SQL without executing or connecting to a database."""

from sqlglot import exp, parse
from sqlglot.errors import SqlglotError

from app.schemas.sql_validation import SQLValidationResponse

_UNSUPPORTED_STATEMENTS = (exp.DML, exp.DDL, exp.Command)
_SIDE_EFFECT_FUNCTIONS = {
    "SET_CONFIG",
    "PG_NOTIFY",
    "PG_CANCEL_BACKEND",
    "PG_TERMINATE_BACKEND",
    "PG_RELOAD_CONF",
    "PG_ROTATE_LOGFILE",
    "PG_SWITCH_WAL",
    "PG_CREATE_RESTORE_POINT",
    "PG_PROMOTE",
    "PG_WAL_REPLAY_PAUSE",
    "PG_WAL_REPLAY_RESUME",
    "PG_LOG_BACKEND_MEMORY_CONTEXTS",
    "LO_IMPORT",
    "LO_EXPORT",
    "LO_UNLINK",
    "LO_PUT",
    "LO_CREATE",
    "LO_CREAT",
    "DBLINK_EXEC",
    "DBLINK_EXECUTE",
    "DBLINK_CONNECT",
    "DBLINK_DISCONNECT",
}
_UNVERIFIED_FUNCTION_MESSAGE = (
    "Unrecognized function calls are not accepted because they cannot be "
    "verified as read-only."
)


def validate_sql(sql: str) -> SQLValidationResponse:
    """Validate one PostgreSQL SELECT statement using SQLGlot AST inspection."""
    try:
        parsed_statements = parse(sql, read="postgres")
    except SqlglotError:
        return _invalid("SQL syntax could not be parsed as PostgreSQL.")

    statements = [statement for statement in parsed_statements if statement is not None]
    if not statements:
        return _invalid("A SQL statement is required.")
    if len(parsed_statements) != 1 or len(statements) != 1:
        return _invalid("Multiple SQL statements are not allowed.")

    statement = statements[0]
    if any(table.db.casefold() == 'nl2sql_internal' for table in statement.find_all(exp.Table)):
        return _invalid("Internal application tables are not available for queries.")
    unsupported = next(
        (node for node in statement.walk() if isinstance(node, _UNSUPPORTED_STATEMENTS)),
        None,
    )
    if unsupported is not None:
        return _invalid("Only read-only SELECT statements are allowed.")

    if not isinstance(statement, (exp.Select, exp.SetOperation)):
        return _invalid("Only SELECT statements are allowed.")

    if any(not select.expressions for select in statement.find_all(exp.Select)):
        return _invalid("Every SELECT clause must include a projection.")

    if next(statement.find_all(exp.Into), None) is not None:
        return _invalid("SELECT INTO is not allowed.")

    if next(statement.find_all(exp.Lock), None) is not None:
        return _invalid("Row-locking SELECT clauses are not allowed.")

    # Unknown and user-defined functions may have side effects. SQLGlot models
    # functions it does not recognize as Anonymous; reject these conservatively.
    if next(statement.find_all(exp.Anonymous), None) is not None:
        return _invalid(_UNVERIFIED_FUNCTION_MESSAGE)

    if any(
        isinstance(node, exp.Func)
        and node.sql_name().upper() in _SIDE_EFFECT_FUNCTIONS
        for node in statement.walk()
    ):
        return _invalid("Functions that can change database or session state are not allowed.")

    try:
        normalized_sql = statement.sql(dialect="postgres")
    except SqlglotError:
        return _invalid("The parsed query could not be normalized safely.")

    return SQLValidationResponse(
        valid=True,
        message="SQL query is valid and read-only.",
        normalized_sql=normalized_sql,
        validation_errors=[],
    )


def _invalid(message: str) -> SQLValidationResponse:
    return SQLValidationResponse(
        valid=False,
        message=message,
        normalized_sql=None,
        validation_errors=[message],
    )
