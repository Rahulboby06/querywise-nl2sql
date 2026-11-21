"""Pydantic response models for database schema metadata."""

from typing import Any

from pydantic import BaseModel


class DatabaseMetadata(BaseModel):
    name: str
    engine: str
    version: str


class ColumnMetadata(BaseModel):
    name: str
    data_type: str
    nullable: bool
    default: str | None


class PrimaryKeyMetadata(BaseModel):
    name: str | None
    columns: list[str]


class ForeignKeyMetadata(BaseModel):
    name: str | None
    columns: list[str]
    referred_schema: str | None
    referred_table: str
    referred_columns: list[str]
    options: dict[str, Any]


class UniqueConstraintMetadata(BaseModel):
    name: str | None
    columns: list[str]


class CheckConstraintMetadata(BaseModel):
    name: str | None
    expression: str


class IndexMetadata(BaseModel):
    name: str
    columns: list[str | None]
    unique: bool
    dialect_options: dict[str, Any]
    duplicates_constraint: str | None = None


class TableMetadata(BaseModel):
    name: str
    columns: list[ColumnMetadata]
    primary_key: PrimaryKeyMetadata
    foreign_keys: list[ForeignKeyMetadata]
    unique_constraints: list[UniqueConstraintMetadata]
    check_constraints: list[CheckConstraintMetadata]
    indexes: list[IndexMetadata]


class SchemaResponse(BaseModel):
    database: DatabaseMetadata
    tables: list[TableMetadata]
