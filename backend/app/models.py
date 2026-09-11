from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator


class CreateGroupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class AddMemberRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    displayName: str = Field(min_length=1, max_length=80)

    @field_validator("displayName")
    @classmethod
    def display_name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class CreateExpenseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=Decimal("0"), decimal_places=2)
    date: date
    paidByMemberId: UUID
    splitForMemberIds: list[UUID] = Field(min_length=1)

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("splitForMemberIds")
    @classmethod
    def split_members_must_be_unique(cls, value: list[UUID]) -> list[UUID]:
        if len(value) != len(set(value)):
            raise ValueError("must contain unique member IDs")
        return value


class Member(BaseModel):
    model_config = ConfigDict(extra="forbid")

    memberId: UUID
    displayName: str


class Expense(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expenseId: UUID
    groupId: UUID
    title: str
    amount: Decimal
    date: date
    paidByMemberId: UUID
    splitForMemberIds: list[UUID]

    @field_serializer("amount")
    def serialize_amount(self, value: Decimal) -> float:
        return float(value)


class Group(BaseModel):
    model_config = ConfigDict(extra="forbid")

    groupId: UUID
    name: str
    createdAt: datetime
    members: list[Member] = []
    expenses: list[Expense] = []