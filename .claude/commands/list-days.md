# List Days from New Day

List recent days from the user's New Day task management app.

## Instructions

Use the New Day API to list days. The API endpoint is:
- **URL**: `https://us-central1-new-day-69f04.cloudfunctions.net/listDays`
- **Method**: GET
- **Headers**:
  - `Authorization: Bearer $NEW_DAY_API_KEY`

## Usage

```bash
curl -X GET "https://us-central1-new-day-69f04.cloudfunctions.net/listDays" \
  -H "Authorization: Bearer $NEW_DAY_API_KEY"
```

## Response

Returns a list of recent days with their IDs and creation dates.

$ARGUMENTS
