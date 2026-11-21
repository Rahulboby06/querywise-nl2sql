"""Read-only database schema metadata endpoint."""

from fastapi import APIRouter, HTTPException
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine
from app.schemas.schema import (
    CheckConstraintMetadata,
    ColumnMetadata,
    DatabaseMetadata,
    ForeignKeyMetadata,
    IndexMetadata,
    PrimaryKeyMetadata,
    SchemaResponse,
    TableMetadata,
    UniqueConstraintMetadata,
)

router = APIRouter(prefix="/api", tags=["schema"])


@router.get("/schema", response_model=SchemaResponse)
def read_database_schema() -> SchemaResponse:
    """Return schema metadata from the configured database without reading rows."""
    try:
        with engine.connect() as connection:
            inspector = inspect(connection)
            database_name = connection.execute(
                text("SELECT current_database()")
            ).scalar_one()
            database_version = connection.execute(
                text("SHOW server_version")
            ).scalar_one()

            tables: list[TableMetadata] = []
            for table_name in sorted(inspector.get_table_names(schema="public")):
                columns = [
                    ColumnMetadata(
                        name=column["name"],
                        data_type=str(column["type"]),
                        nullable=column["nullable"],
                        default=(
                            str(column["default"])
                            if column.get("default") is not None
                            else None
                        ),
                    )
                    for column in inspector.get_columns(table_name, schema="public")
                ]
                primary_key = inspector.get_pk_constraint(table_name, schema="public")
                foreign_keys = [
                    ForeignKeyMetadata(
                        name=foreign_key.get("name"),
                        columns=foreign_key.get("constrained_columns") or [],
                        referred_schema=foreign_key.get("referred_schema"),
                        referred_table=foreign_key.get("referred_table") or "",
                        referred_columns=foreign_key.get("referred_columns") or [],
                        options=foreign_key.get("options") or {},
                    )
                    for foreign_key in inspector.get_foreign_keys(
                        table_name, schema="public"
                    )
                ]
                unique_constraints = [
                    UniqueConstraintMetadata(
                        name=constraint.get("name"),
                        columns=constraint.get("column_names") or [],
                    )
                    for constraint in inspector.get_unique_constraints(
                        table_name, schema="public"
                    )
                ]
                check_constraints = [
                    CheckConstraintMetadata(
                        name=constraint.get("name"),
                        expression=constraint.get("sqltext", ""),
                    )
                    for constraint in inspector.get_check_constraints(
                        table_name, schema="public"
                    )
                ]
                primary_key = inspector.get_pk_constraint(table_name, schema="public")
                indexes = [
                    IndexMetadata(
                        name=index["name"],
                        columns=index.get("column_names") or [],
                        unique=index.get("unique", False),
                        dialect_options=index.get("dialect_options") or {},
                        duplicates_constraint=index.get("duplicates_constraint"),
                    )
                    for index in inspector.get_indexes(table_name, schema="public")
                    if index.get("name")
                ]
                # PostgreSQL's Inspector omits primary-key backing indexes.
                # A primary key necessarily creates a unique index, so expose
                # that index alongside the reflected standalone/unique ones.
                primary_key_name = primary_key.get("name")
                if primary_key_name and all(
                    index.name != primary_key_name for index in indexes
                ):
                    indexes.append(
                        IndexMetadata(
                            name=primary_key_name,
                            columns=primary_key.get("constrained_columns") or [],
                            unique=True,
                            dialect_options={},
                            duplicates_constraint=primary_key_name,
                        )
                    )

                tables.append(
                    TableMetadata(
                        name=table_name,
                        columns=columns,
                        primary_key=PrimaryKeyMetadata(
                            name=primary_key_name,
                            columns=primary_key.get("constrained_columns") or [],
                        ),
                        foreign_keys=foreign_keys,
                        unique_constraints=unique_constraints,
                        check_constraints=check_constraints,
                        indexes=indexes,
                    )
                )

            return SchemaResponse(
                database=DatabaseMetadata(
                    name=database_name,
                    engine="PostgreSQL",
                    version=database_version,
                ),
                tables=tables,
            )
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unavailable",
                "message": "Database schema metadata is temporarily unavailable.",
            },
        ) from None
