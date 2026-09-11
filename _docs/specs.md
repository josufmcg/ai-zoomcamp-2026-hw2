# Software Requirements Specification (SRS)

## Expenses4All

---

## 1. Executive Summary & Scope
The **Expenses4All** is a lightweight, friction-free web application designed for temporary group activities (e.g., trips, shared meals, one-off events). The primary objective is to allow quick, hassle-free expense tracking and balance calculation without requiring user registration, authentication, or password management.

---

## 2. Access Model & User Session

### 2.1 Access Control
* **No Authentication:** Users do not register with email or passwords.
* **URL-based Access:** Every group is assigned a unique, unguessable URL containing a UUID. Anyone with the link can view and interact with the group.

### 2.2 Identity & Persistence
* **Display Name:** When opening a group URL for the first time, a visitor enters a temporary display name (e.g., "Alex") to join the group roster.
* **Local Storage Persistence:** The browser stores the user's assigned `memberId` and `displayName` in `localStorage` for that specific `groupId`. Refreshing or returning to the link automatically restores the member session.

---

## 3. Functional Requirements

### 3.1 Group Management
* **FR-1.1 Create Group:** Any user can navigate to the landing page, enter a group name, and create a new session.
* **FR-1.2 Unique Link Generation:** The system creates a unique shareable link (e.g., `https://app.domain.com/g/550e8400-e29b-41d4-a716-446655440000`).
* **FR-1.3 Member Roster:** The group maintains a list of participating members.

### 3.2 Expense Management
* **FR-2.1 Record Expense:** Members can create a new expense entry within the group.
* **FR-2.2 Required Fields:**
  * **Title / Description:** Text string (e.g., "Dinner at Joe's").
  * **Amount:** Decimal value representing total cost.
  * **Date:** Date picker input (`YYYY-MM-DD`).
  * **Payer (`paidBy`):** Single selection from current group members.
  * **Split Coverage:** Toggle/Checkbox option indicating whether the expense was paid for **all** group members or a subset of members.
* **FR-2.3 Division Rule:** Expenses are split **equally** among the participating members for that specific transaction.

### 3.3 Balance Calculation & Display
* **FR-3.1 Overall Net Balances:** The application aggregates all logged expenses and outputs a single overall balance per member:
  * $\text{Paid Total} - \text{Fair Share Owed} = \text{Net Balance}$
* **FR-3.2 Display Formatting:**
  * **Positive Balance (+):** Highlighted in green (User is owed money by the group).
  * **Negative Balance (-):** Highlighted in red (User owes money to the group).
  * **Zero Balance ($0.00):** Neutral indicator (User is fully settled up).

---

## 4. Data Models

### 4.1 Group Object
```json
{
  "groupId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Weekend Trip to Oviedo",
  "createdAt": "2026-09-11T09:30:00Z",
  "members": [
    {
      "memberId": "a1b2c3d4-0000-0000-0000-000000000001",
      "displayName": "Alex"
    },
    {
      "memberId": "a1b2c3d4-0000-0000-0000-000000000002",
      "displayName": "Maria"
    }
  ]
}
```

### 4.2 Expense Object
```json
{
  "expenseId": "e1f2g3h4-0000-0000-0000-000000000001",
  "groupId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Dinner",
  "amount": 60.00,
  "date": "2026-09-10",
  "paidByMemberId": "a1b2c3d4-0000-0000-0000-000000000001",
  "splitForMemberIds": [
    "a1b2c3d4-0000-0000-0000-000000000001",
    "a1b2c3d4-0000-0000-0000-000000000002"
  ]
}
```

---

## 5. API Interface Specification

| Endpoint | Method | Input Parameters / Body | Output Response |
| :--- | :--- | :--- | :--- |
| `/api/groups` | `POST` | `{ "name": "Group Name" }` | Group object with `groupId` |
| `/api/groups/:id` | `GET` | URL param: `id` | Complete Group object with members & expenses |
| `/api/groups/:id/members` | `POST` | `{ "displayName": "Name" }` | Updated Group object with new member |
| `/api/groups/:id/expenses` | `POST` | `{ "title", "amount", "date", "paidByMemberId", "splitForMemberIds" }` | Created Expense object |
| `/api/groups/:id/balances` | `GET` | URL param: `id` | Computed dictionary: `{ memberId: netBalance }` |

---

## 6. Calculation Logic Reference
For each member $M$ in group $G$:
1. Calculate total amount paid by $M$: 
   $$\text{TotalPaid}(M) = \sum \text{Amount of expenses where } \text{paidByMemberId} = M$$
2. Calculate total fair share owed by $M$: 
   $$\text{TotalOwed}(M) = \sum \left( \frac{\text{Expense Amount}}{\text{Count of } \text{splitForMemberIds}} \right) \text{ for each expense where } M \in \text{splitForMemberIds}$$
3. Net Balance: 
   $$\text{NetBalance}(M) = \text{TotalPaid}(M) - \text{TotalOwed}(M)$$