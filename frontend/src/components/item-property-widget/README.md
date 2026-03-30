### Widget's behavior
- some widgets such as float, ingeger and duration will fallback to their default values if the user clears the field and leaves it empty.
This ensures that the field always contains a valid value.
- uncontrolled widgets are there to improve performance when a lot of them are rendered at once (e.g. in a table)
- most (if not all) widgets show a label so we easily identify the type of the rendered widget, otherwise having many similar widgets
would be confusing if their values are of the same type (e.g. widgets like "integer", "float" or "fraction of second")

### Notes about backend data formats
- datetime:
  - backend always sends date, time and timezone offset
  - the only optional part is fraction of second
- time:
  - backend always sends time
  - fraction of second and timezone offset are optional, but can be included
