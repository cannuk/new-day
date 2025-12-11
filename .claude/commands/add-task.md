# Add Task to New Day

Add a task to the user's New Day task management app.

## Instructions

Use the New Day API to add a task. The API endpoint is:
- **URL**: `https://us-central1-new-day-69f04.cloudfunctions.net/addTask`
- **Method**: POST
- **Headers**:
  - `Authorization: Bearer $NEW_DAY_API_KEY`
  - `Content-Type: application/json`

## Request Body

```json
{
  "text": "Task description here",
  "type": "Other",
  "notes": "Optional notes"
}
```

**Task types:**
- `Most` - Most important tasks (top 3 priorities)
- `Other` - Backlog items (default)
- `Quick` - Quick tasks
- `PDP` - Pass, Delegate, or Postpone

## Usage

When the user asks to add a task, use WebFetch or Bash with curl to call the API:

```bash
curl -X POST "https://us-central1-new-day-69f04.cloudfunctions.net/addTask" \
  -H "Authorization: Bearer $NEW_DAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "TASK_TEXT", "type": "TYPE"}'
```

## User Request

$ARGUMENTS
