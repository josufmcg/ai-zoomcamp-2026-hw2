from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi.testclient import TestClient

from app.main import app, database


client = TestClient(app)


def setup_function() -> None:
    database.clear()


def create_group(name: str = "Weekend Trip") -> dict:
    response = client.post("/api/groups", json={"name": name})
    assert response.status_code == 201
    return response.json()


def add_member(group_id: str, display_name: str) -> dict:
    response = client.post(
        f"/api/groups/{group_id}/members", json={"displayName": display_name}
    )
    assert response.status_code == 201
    return response.json()


def test_create_and_get_group() -> None:
    group = create_group("Beach Weekend")

    assert UUID(group["groupId"])
    assert group["name"] == "Beach Weekend"
    assert group["members"] == []
    assert group["expenses"] == []
    assert "createdAt" in group

    response = client.get(f"/api/groups/{group['groupId']}")
    assert response.status_code == 200
    assert response.json() == group


def test_group_creation_validates_name() -> None:
    response = client.post("/api/groups", json={"name": ""})

    assert response.status_code == 400
    assert response.json()["fieldErrors"]["name"]


def test_group_not_found() -> None:
    response = client.get("/api/groups/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404
    assert response.json() == {"message": "Group not found"}


def test_add_member_returns_updated_group() -> None:
    group = create_group()

    response = client.post(
        f"/api/groups/{group['groupId']}/members", json={"displayName": "Alex"}
    )

    assert response.status_code == 201
    updated_group = response.json()
    assert len(updated_group["members"]) == 1
    assert updated_group["members"][0]["displayName"] == "Alex"
    assert UUID(updated_group["members"][0]["memberId"])


def test_add_member_validates_display_name() -> None:
    group = create_group()

    response = client.post(
        f"/api/groups/{group['groupId']}/members", json={"displayName": " "}
    )

    assert response.status_code == 400
    assert response.json()["fieldErrors"]["displayName"]


def test_create_expense_and_calculate_balances() -> None:
    group = create_group()
    alex = add_member(group["groupId"], "Alex")["members"][0]
    maria = add_member(group["groupId"], "Maria")["members"][1]

    response = client.post(
        f"/api/groups/{group['groupId']}/expenses",
        json={
            "title": "Dinner",
            "amount": 60.00,
            "date": "2026-09-10",
            "paidByMemberId": alex["memberId"],
            "splitForMemberIds": [alex["memberId"], maria["memberId"]],
        },
    )

    assert response.status_code == 201
    expense = response.json()
    assert expense["groupId"] == group["groupId"]
    assert Decimal(str(expense["amount"])) == Decimal("60.00")
    assert date.fromisoformat(expense["date"]) == date(2026, 9, 10)

    balances = client.get(f"/api/groups/{group['groupId']}/balances")
    assert balances.status_code == 200
    assert balances.json() == {alex["memberId"]: 30.0, maria["memberId"]: -30.0}


def test_balance_calculation_preserves_cents_for_uneven_splits() -> None:
    group = create_group()
    members = [
        add_member(group["groupId"], name)["members"][-1]
        for name in ["A", "B", "C"]
    ]

    response = client.post(
        f"/api/groups/{group['groupId']}/expenses",
        json={
            "title": "Shared snack",
            "amount": 10.00,
            "date": "2026-09-11",
            "paidByMemberId": members[0]["memberId"],
            "splitForMemberIds": [member["memberId"] for member in members],
        },
    )
    assert response.status_code == 201

    balances = client.get(f"/api/groups/{group['groupId']}/balances")
    assert balances.json() == {
        members[0]["memberId"]: 6.67,
        members[1]["memberId"]: -3.33,
        members[2]["memberId"]: -3.33,
    }


def test_expense_rejects_unknown_members() -> None:
    group = create_group()
    member = add_member(group["groupId"], "Alex")["members"][0]

    response = client.post(
        f"/api/groups/{group['groupId']}/expenses",
        json={
            "title": "Dinner",
            "amount": 12.50,
            "date": "2026-09-11",
            "paidByMemberId": member["memberId"],
            "splitForMemberIds": ["00000000-0000-0000-0000-000000000000"],
        },
    )

    assert response.status_code == 422
    assert response.json() == {"message": "Payer or split member ID is not in the group"}