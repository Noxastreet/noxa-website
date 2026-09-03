# NOXA Organizer event flow

Event creation uses three client-side steps:

1. Event — organizer, name, type.
2. Place — date/time, city, region, location.
3. Review — preview, optional description, Save draft or Publish event.

No database write happens between steps. A new event is written only from the final step. `Cancelled` is not available during creation and remains an action for existing events only.
