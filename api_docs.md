# Xenoh API Documentation

**Base URL**: `https://localhost:{port}/api`  
**Format**: JSON  
**Auth**: JWT Bearer token — `Authorization: Bearer <access_token>`  
**Date types**: `DateOnly` serialised as `"YYYY-MM-DD"`, `DateTime` as ISO 8601

---

## Table of Contents

1. [Auth](#1-auth)
2. [Users](#2-users)
3. [Coaches](#3-coaches)
4. [Coach-Client Relationships](#4-coach-client-relationships)
5. [Plans](#5-plans)
6. [Weekly Workouts](#6-weekly-workouts)
7. [Daily Workouts](#7-daily-workouts)
8. [Exercises](#8-exercises)
9. [Exercise Templates](#9-exercise-templates)

---

## 1. Auth

Base path: `/api/auth`

### POST `/api/auth/register`

**Auth**: None

**Request body**:
```json
{
  "email": "user@example.com",      // required, valid email
  "password": "secret123",           // required, min 6 chars
  "firstName": "Tấn",               // required
  "lastName": "Phúc",               // required
  "role": "Individual"               // required — "Individual" | "Coach"
}
```

**Response `200`**:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "abc...",
  "email": "user@example.com",
  "fullName": "Tấn Phúc",
  "roles": ["Individual"]
}
```

---

### POST `/api/auth/login`

**Auth**: None

**Request body**:
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response `200`**: same as register response (`AuthResponse`)

---

### POST `/api/auth/refresh-token`

**Auth**: None

**Request body**:
```json
{
  "refreshToken": "abc..."
}
```

**Response `200`**: same as register response (`AuthResponse`)  
Refresh token expires after **7 days**.

---

### POST `/api/auth/logout`

**Auth**: Required  
**Request body**: none  
**Response `204`**: no content  
Blacklists the current access token server-side.

---

## 2. Users

Base path: `/api/users`  
**Auth**: Required for all

### GET `/api/users/me`

Returns the logged-in user's profile.

**Response `200`**:
```json
{
  "id": "guid",
  "email": "user@example.com",
  "firstName": "Tấn",
  "lastName": "Phúc",
  "height": 175.0,           // cm, nullable
  "gender": "Male",          // "Male" | "Female" | "Other" | null
  "dateOfBirth": "1998-05-12", // DateOnly, nullable
  "currentStreak": 5,
  "latestBodyweight": 72.5,  // kg, nullable
  "bmi": 23.7,               // nullable
  "bmiCategory": "Normal",   // nullable
  "dotsScore": 312.4         // nullable
}
```

---

### PUT `/api/users/me`

Partial update — all fields optional.

**Request body**:
```json
{
  "height": 175.0,              // 50–300, nullable
  "gender": "Male",             // "Male" | "Female" | "Other", nullable
  "dateOfBirth": "1998-05-12"   // DateOnly, nullable
}
```

**Response `200`**: `UserProfileResponse` (same as GET /me)

---

### POST `/api/users/me/bodyweight`

Log a bodyweight entry for today.

**Request body**:
```json
{
  "weight": 72.5   // required, 20–500 kg
}
```

**Response `200`**:
```json
{
  "id": "guid",
  "weight": 72.5,
  "date": "2026-04-26"
}
```

---

### GET `/api/users/me/bodyweight`

Returns full bodyweight history.

**Response `200`**: array of `BodyweightLogResponse`
```json
[
  { "id": "guid", "weight": 72.5, "date": "2026-04-26" }
]
```

---

### DELETE `/api/users/me/bodyweight/{id}`

**Path param**: `id` — GUID of the entry  
**Response `204`**: no content  
**Response `404`**: `{ "message": "..." }` if entry not found

---

## 3. Coaches

Base path: `/api/coaches`  
**Auth**: Required

### GET `/api/coaches`

List all coaches with optional name filter.

**Query params**:
| Param | Type | Description |
|-------|------|-------------|
| `name` | string? | Case-insensitive; strips Vietnamese diacritics |

**Response `200`**:
```json
[
  { "id": "guid", "fullName": "Nguyễn Văn A", "email": "coach@example.com" }
]
```

---

## 4. Coach-Client Relationships

Base path: `/api/coach-client`  
**Auth**: Required for all

### POST `/api/coach-client/request`

Individual sends a coaching request.

**Roles**: Individual only

**Request body**:
```json
{
  "coachId": "guid"   // required
}
```

**Response `200`**: `CoachRelationshipResponse`
```json
{
  "id": "guid",
  "clientId": "guid",
  "clientName": "Tấn Phúc",
  "coachId": "guid",
  "coachName": "Nguyễn Văn A",
  "status": "Pending",    // "Pending" | "Active"
  "createdAt": "2026-04-26T10:00:00Z"
}
```

Rules: a client can only have 1 pending or active relationship at a time.

---

### PUT `/api/coach-client/accept/{relationshipId}`

Coach accepts a pending request.

**Roles**: Coach only  
**Path param**: `relationshipId` — GUID  
**Response `200`**: `CoachRelationshipResponse` with `status: "Active"`

---

### DELETE `/api/coach-client/{relationshipId}`

Terminate a relationship (either party can call this).

**Path param**: `relationshipId` — GUID  
**Response `204`**: no content

---

### GET `/api/coach-client/pending-requests`

**Roles**: Coach only  
**Response `200`**: array of `CoachRelationshipResponse` where status = "Pending"

---

### GET `/api/coach-client/my-coach`

**Roles**: Individual only  
**Response `200`**: `CoachRelationshipResponse` or `404` if no active coach

---

### GET `/api/coach-client/my-clients`

**Roles**: Coach only  
**Response `200`**:
```json
[
  {
    "relationshipId": "guid",
    "clientId": "guid",
    "fullName": "Tấn Phúc",
    "email": "client@example.com",
    "status": "Active",         // "Pending" | "Active"
    "connectedAt": "2026-04-20T08:00:00Z"
  }
]
```

---

## 5. Plans

Base path: `/api/plans`  
**Auth**: Required for all

### GET `/api/plans`

Returns the current user's plans.

**Response `200`**: array of `PlanResponse`

---

### GET `/api/plans/{planId}`

**Path param**: `planId` — GUID  
**Response `200`**: `PlanResponse` or `404`

**`PlanResponse` shape**:
```json
{
  "id": "guid",
  "name": "Bulking Plan Q2",
  "startDate": "2026-04-01",
  "endDate": "2026-06-30",
  "planType": "Self",          // "Self" | "Coach"
  "ownerId": "guid",
  "ownerName": "Tấn Phúc",
  "createdByCoachId": null,    // guid | null
  "coachName": null,           // string | null
  "totalWeeks": 13,
  "totalDays": 91,
  "completedDays": 5,
  "isActive": true,
  "createdAt": "2026-04-01T00:00:00Z"
}
```

---

### POST `/api/plans`

Create a personal plan.

**Request body**:
```json
{
  "name": "Bulking Plan Q2",      // required, 2–100 chars
  "startDate": "2026-04-01",      // required, DateOnly
  "endDate": "2026-06-30"         // required, DateOnly, must be > startDate
}
```

**Response `201`**: `PlanResponse`  
Rule: max **3 personal plans** per user.

---

### POST `/api/plans/for-user`

Coach creates a plan for a specific client.

**Roles**: Coach only

**Request body**:
```json
{
  "userId": "guid",               // required — target client
  "name": "Client Strength Plan", // required, 2–100 chars
  "startDate": "2026-05-01",
  "endDate": "2026-07-31"
}
```

**Response `201`**: `PlanResponse` with `planType: "Coach"`

---

### PUT `/api/plans/{planId}`

Update an existing plan (owner only).

**Request body**:
```json
{
  "name": "Updated Name",
  "startDate": "2026-04-01",
  "endDate": "2026-07-31"
}
```

**Response `200`**: `PlanResponse`

---

### DELETE `/api/plans/{planId}`

**Response `204`**: no content  
Owner only.

---

### PATCH `/api/plans/{planId}/activate`

Activate a plan. Auto-deactivates any other currently active plan of the same owner.

**Response `200`**: `PlanResponse` with `isActive: true`

---

### PATCH `/api/plans/{planId}/deactivate`

**Response `200`**: `PlanResponse` with `isActive: false`

---

### GET `/api/plans/coach-overview`

**Roles**: Coach only  
Returns the coach's personal plans **and** plans created for clients.

**Response `200`**:
```json
[
  {
    "id": "guid",
    "name": "Client Strength Plan",
    "startDate": "2026-05-01",
    "endDate": "2026-07-31",
    "planType": "Coach",
    "ownerId": "guid",
    "ownerName": "Tấn Phúc",
    "ownerEmail": "client@example.com",
    "totalWeeks": 13,
    "createdAt": "2026-04-26T00:00:00Z"
  }
]
```

---

## 6. Weekly Workouts

Base path: `/api/plans/{planId}/weeks`  
**Auth**: Required for all

### GET `/api/plans/{planId}/weeks`

Returns all weeks for a plan.

**Response `200`**:
```json
[
  {
    "id": "guid",
    "weekNumber": 1,
    "name": "Week 1",
    "startDate": "2026-04-01",
    "endDate": "2026-04-07",
    "planId": "guid",
    "totalDays": 7,
    "completedDays": 2
  }
]
```

---

### PATCH `/api/plans/{planId}/weeks/{weeklyWorkoutId}`

Update a week's name.

**Request body**:
```json
{
  "weeklyWorkoutId": "guid",  // must match URL param
  "name": "Strength Week"     // required, 1–100 chars
}
```

**Response `200`**: `WeeklyWorkoutResponse`

---

## 7. Daily Workouts

### GET `/api/weeks/{weeklyWorkoutId}/days`

Returns all days in a week.

**Response `200`**:
```json
[
  {
    "id": "guid",
    "date": "2026-04-01",
    "dayOfWeek": "Wednesday",
    "isCompleted": false,
    "weeklyWorkoutId": "guid",
    "totalExercises": 4,
    "completedExercises": 2
  }
]
```

---

### POST `/api/days/{sourceDailyWorkoutId}/copy`

Copy all exercises from a source day into a target day, replacing the target's existing exercises.

**Path param**: `sourceDailyWorkoutId` — GUID of the day to copy **from**

**Request body**:
```json
{
  "targetDailyWorkoutId": "guid"   // required
}
```

**Response `200`**:
```json
{
  "targetDailyWorkoutId": "guid",
  "exercisesCopied": 4
}
```

---

## 8. Exercises

Base path: `/api/exercises`  
**Auth**: Required for all

### GET `/api/exercises/by-day/{dailyWorkoutId}`

Returns all exercises for a day, each with its sets.

**Response `200`**: array of `ExerciseResponse`

**`ExerciseResponse` shape**:
```json
{
  "id": "guid",
  "exerciseTemplateId": "guid",
  "name": "Bench Press",
  "primaryMuscleGroup": "Chest",
  "secondaryMuscleGroups": ["Triceps", "Shoulders"],
  "plannedSets": 4,
  "plannedReps": 8,
  "plannedWeight": 80.0,       // nullable
  "completedSetsCount": 2,
  "isCompleted": false,
  "notes": "Pause at bottom",  // nullable
  "dailyWorkoutId": "guid",
  "personalRecordWeight": 85.0, // nullable
  "sets": [
    {
      "id": "guid",
      "setNumber": 1,
      "plannedReps": 8,
      "plannedWeight": 80.0,    // nullable
      "actualReps": 8,          // nullable
      "actualWeight": 80.0,     // nullable
      "rpe": 7.5,               // nullable, 1–10
      "isCompleted": true,
      "completedAt": "2026-04-26T10:15:00Z"  // nullable
    }
  ]
}
```

---

### POST `/api/exercises`

Add an exercise to a day. Auto-generates the planned sets.

**Request body**:
```json
{
  "dailyWorkoutId": "guid",         // required
  "exerciseTemplateId": "guid",     // required
  "plannedSets": 4,                 // required, 1–100
  "plannedReps": 8,                 // required, 1–1000
  "plannedWeight": 80.0,            // optional, 0–10000
  "notes": "Pause at bottom"        // optional
}
```

**Response `200`**: `ExerciseResponse`

---

### PUT `/api/exercises/{exerciseId}`

Update an exercise (all fields optional).

**Request body**:
```json
{
  "exerciseId": "guid",   // required — must match {exerciseId} in URL
  "plannedSets": 5,       // optional, 1–100
  "plannedReps": 6,       // optional, 1–1000
  "plannedWeight": 85.0,  // optional, 0–10000
  "notes": "Drop set"     // optional
}
```

**Response `200`**: `ExerciseResponse`  
Owner only.

---

### PATCH `/api/exercises/sets/{setId}/complete`

Mark a set as completed with actual performance data.

**Path param**: `setId` — GUID

**Request body**:
```json
{
  "actualReps": 8,        // optional, 1–1000
  "actualWeight": 82.5,   // optional, 0–10000
  "rpe": 8.0              // optional, 1–10
}
```

**Response `200`**: parent `ExerciseResponse` (reflects updated completion state)

**Cascade rules**:
- When all sets of an exercise are completed → exercise `isCompleted = true`
- When all exercises of a day are completed → day `isCompleted = true`
- Logs workout history for streak tracking (once per day)
- Updates Personal Record if `actualWeight` exceeds previous PR

---

### DELETE `/api/exercises/{exerciseId}`

**Response `204`**: no content  
Deletes the exercise and all its sets.

---

## 9. Exercise Templates

Base path: `/api/exercise-templates`  
**Auth**: Required

### GET `/api/exercise-templates`

List exercise templates with optional muscle group filter.

**Query params**:
| Param | Type | Description |
|-------|------|-------------|
| `muscleGroup` | string? | Enum value — filters primary **and** secondary muscle groups |

**Muscle group enum values**: `Chest`, `Back`, `Shoulders`, `Biceps`, `Triceps`, `Forearms`, `Abs`, `Glutes`, `Quads`, `Hamstrings`, `Calves`, `FullBody`, `Cardio`

**Response `200`**:
```json
[
  {
    "id": "guid",
    "name": "Bench Press",
    "description": "Barbell bench press targeting chest",  // nullable
    "primaryMuscleGroup": "Chest",
    "secondaryMuscleGroups": ["Triceps", "Shoulders"]
  }
]
```

---

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (POST /plans, POST /plans/for-user) |
| 204 | Success, no content |
| 400 | Validation error or business rule violation |
| 401 | Missing or invalid token |
| 403 | Insufficient role/permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate plan, existing relationship) |

All error responses (4xx) return a JSON body:
```json
{ "message": "Human-readable error description." }
```

---

## Enums Reference

| Enum | Values |
|------|--------|
| Role | `Individual`, `Coach` |
| Gender | `Male`, `Female`, `Other` |
| PlanType | `Self`, `Coach` |
| RelationshipStatus | `Pending`, `Active` |
| MuscleGroup | `Chest`, `Back`, `Shoulders`, `Biceps`, `Triceps`, `Forearms`, `Abs`, `Glutes`, `Quads`, `Hamstrings`, `Calves`, `FullBody`, `Cardio` |

---

*Generated: 2026-04-26 — reflects Wave 1 + Wave 2 (RPE, Copy Daily Workout) implementation.*
