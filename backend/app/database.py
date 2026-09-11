from datetime import datetime, timezone
from uuid import UUID, uuid4

from .models import CreateExpenseRequest, Expense, Group, Member


class MockDatabase:
    def __init__(self) -> None:
        self.groups: dict[UUID, Group] = {}

    def clear(self) -> None:
        self.groups.clear()

    def create_group(self, name: str) -> Group:
        group = Group(
            groupId=uuid4(),
            name=name,
            createdAt=datetime.now(timezone.utc),
        )
        self.groups[group.groupId] = group
        return group

    def get_group(self, group_id: UUID) -> Group | None:
        return self.groups.get(group_id)

    def add_member(self, group: Group, display_name: str) -> Group:
        group.members.append(Member(memberId=uuid4(), displayName=display_name))
        return group

    def add_expense(self, group: Group, request: CreateExpenseRequest) -> Expense:
        expense = Expense(expenseId=uuid4(), groupId=group.groupId, **request.model_dump())
        group.expenses.append(expense)
        return expense