from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .database import MockDatabase
from .models import (
    AddMemberRequest,
    CreateExpenseRequest,
    CreateGroupRequest,
    Expense,
    Group,
)


app = FastAPI(title="Expenses4All API", version="1.0.0")
database = MockDatabase()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    field_errors: dict[str, list[str]] = {}
    for error in exc.errors():
        field = str(error["loc"][-1])
        field_errors.setdefault(field, []).append(error["msg"])
    return JSONResponse(
        status_code=400,
        content={"message": "Request validation failed", "fieldErrors": field_errors},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})


def get_group_or_404(group_id: UUID) -> Group:
    group = database.get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@app.post("/api/groups", response_model=Group, status_code=201)
def create_group(request: CreateGroupRequest) -> Group:
    return database.create_group(request.name)


@app.get("/api/groups/{group_id}", response_model=Group)
def get_group(group_id: UUID) -> Group:
    return get_group_or_404(group_id)


@app.post("/api/groups/{group_id}/members", response_model=Group, status_code=201)
def add_member(group_id: UUID, request: AddMemberRequest) -> Group:
    group = get_group_or_404(group_id)
    return database.add_member(group, request.displayName)


@app.post("/api/groups/{group_id}/expenses", response_model=Expense, status_code=201)
def create_expense(group_id: UUID, request: CreateExpenseRequest) -> Expense:
    group = get_group_or_404(group_id)
    member_ids = {member.memberId for member in group.members}
    if request.paidByMemberId not in member_ids or not set(
        request.splitForMemberIds
    ).issubset(member_ids):
        raise HTTPException(
            status_code=422, detail="Payer or split member ID is not in the group"
        )
    return database.add_expense(group, request)


@app.get("/api/groups/{group_id}/balances", response_model=dict[UUID, float])
def get_balances(group_id: UUID) -> dict[UUID, float]:
    group = get_group_or_404(group_id)
    balances = {member.memberId: Decimal("0.00") for member in group.members}
    for expense in group.expenses:
        share = expense.amount / len(expense.splitForMemberIds)
        balances[expense.paidByMemberId] += expense.amount
        for member_id in expense.splitForMemberIds:
            balances[member_id] -= share
    return {
        member_id: float(balance.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        for member_id, balance in balances.items()
    }