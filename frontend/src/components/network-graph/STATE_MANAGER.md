## Events triggered by `initializeEvents`

`initializeEvents` maps Sigma.js, mouse-captor, camera, and DOM events to the
`StateManager` finite-state machine.

The manager drives state changes through three mechanisms:

- **Immediate switch** — `enterState(target, event)` switches `currentState` (when
  the transition is allowed) and fires the target's entry callbacks in the same
  step. Leaving the previous state first runs its `afterCallback` handlers once.
  Used by discrete events (enter/leave, clicks, context menus, wheel).
- **Deferred (marked) switch** — `markTransition(target)` records an _intent_ on
  mouse-down **without** switching. The switch is committed later by
  `commitPendingTransition(trigger, event)` when the target's `commitOn` trigger
  fires (`'mouse-move'` or `'mouse-up'`), at which point the entry callbacks run.
  This keeps the machine stable until an interaction is genuinely a
  drag / selection / quick-node, and guarantees a callback always fires on a switch.
- **Broadcast** — `broadcast(state, event)` fires a state's callbacks regardless of
  `currentState`. Used by the state-independent `MOUSE_UP`, `RESIZE`, and
  `CAMERA_UPDATE` events.

While a continuous state is active, `updateState(event)` re-fires its main
`callback` on every subsequent `mousemovebody`.

| Custom state                | Source and trigger                                                                                                               | Mechanism                                                       | Timing                                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_DOWN`                 | Sigma `downNode`; ignored when `original.buttons === 2`                                                                          | Immediate `enterState`                                          | On node mouse-down; also marks a deferred gesture (see below)                                                                                                             |
| `NODE_DRAG`                 | Marked on `downNode` with no modifier; committed on the first `mousemovebody`                                                    | Deferred, `commitOn: 'mouse-move'`, continuous                  | Entry callback on the commit move; `callback` on every subsequent move. Payload includes `nodeId`                                                                         |
| `NODE_AUTO_CONNECT`         | Marked on `downNode` while Ctrl+Shift are pressed; committed on the first `mousemovebody`                                        | Deferred, `commitOn: 'mouse-move'`, continuous                  | Entry callback on the commit move; `callback` on every subsequent move                                                                                                    |
| `NODE_ENTER`                | Sigma `enterNode`                                                                                                                | Immediate `enterState`                                          | When the pointer enters a node                                                                                                                                            |
| `NODE_TOOLTIP`              | Timer started by `enterNode`                                                                                                     | Immediate `enterState`                                          | After `ITEM_OVERVIEW_MOUSE_ENTER_TIMEOUT_MILLISECONDS`, if the transition is still allowed                                                                                |
| `NODE_LEAVE`                | Sigma `leaveNode` (clears the node-tooltip timer)                                                                                | Immediate `enterState`                                          | On leave; then `resetState()` if still in `NODE_LEAVE`                                                                                                                    |
| `NODE_CLICK`                | Sigma `clickNode` while Ctrl is **not** pressed                                                                                  | Immediate `enterState`                                          | On node click; opens node details                                                                                                                                         |
| `NODE_HIGHLIGHT_TOGGLE`     | Sigma `clickNode` while exactly Ctrl is pressed                                                                                  | Immediate `enterState`                                          | On Ctrl + node click; toggles node highlight                                                                                                                              |
| `NODE_CONTEXT_MENU`         | Sigma `rightClickNode`                                                                                                           | Immediate `enterState`                                          | On node right-click                                                                                                                                                       |
| `RELATION_ENTER`            | Sigma `enterEdge`; the event is saved as `lastRelationEvent`                                                                     | Immediate `enterState`                                          | When the pointer enters an edge                                                                                                                                           |
| `RELATION_TOOLTIP`          | Timer started by `enterEdge`                                                                                                     | Immediate `enterState`                                          | After `ITEM_OVERVIEW_MOUSE_ENTER_TIMEOUT_MILLISECONDS`, if the transition is still allowed                                                                                |
| `RELATION_LEAVE`            | Sigma `leaveEdge` (clears the relation-tooltip timer)                                                                            | Immediate `enterState`                                          | On leave; then `resetState()` if still in `RELATION_LEAVE`                                                                                                                |
| `RELATION_LEAVE`            | Sigma `enterNode` while the current state is `RELATION_ENTER`                                                                    | Immediate `enterState` using `lastRelationEvent`                | Corrects Sigma sometimes emitting `enterNode` before `leaveEdge`; runs before `NODE_ENTER`                                                                                |
| `RELATION_CLICK`            | Sigma `clickEdge` while Ctrl is **not** pressed                                                                                  | Immediate `enterState`                                          | On edge click; opens relation details                                                                                                                                     |
| `RELATION_CLICK`            | DOM container `click` while in `IDLE`, when `getEdgeLabelAtPoint(x, y)` finds a displayed edge label and Ctrl is **not** pressed | Immediate `enterState` with a synthetic `SigmaEdgeEventPayload` | Then the state is manually reset because no `leaveEdge` follows                                                                                                           |
| `RELATION_HIGHLIGHT_TOGGLE` | Sigma `clickEdge` while exactly Ctrl is pressed                                                                                  | Immediate `enterState`                                          | On Ctrl + edge click; toggles relation highlight                                                                                                                          |
| `RELATION_HIGHLIGHT_TOGGLE` | DOM container `click` while in `IDLE`, when `getEdgeLabelAtPoint(x, y)` finds a displayed edge label and exactly Ctrl is pressed | Immediate `enterState` with a synthetic `SigmaEdgeEventPayload` | Then the state is manually reset because no `leaveEdge` follows                                                                                                           |
| `RELATION_CONTEXT_MENU`     | Sigma `rightClickEdge`                                                                                                           | Immediate `enterState`                                          | On edge right-click                                                                                                                                                       |
| `STAGE_DOWN`                | Sigma `downStage`; ignored when `original.buttons === 2`                                                                         | Immediate `transitionTo` (no callbacks)                         | On stage mouse-down; also marks a deferred gesture (see below)                                                                                                            |
| `NODE_LASSO_SELECTION`      | Marked on `downStage` while Alt+Shift are pressed; committed on the first `mousemovebody`                                        | Deferred, `commitOn: 'mouse-move'`, continuous                  | Entry callback on the commit move; `callback` on every subsequent move                                                                                                    |
| `NODE_SELECTION`            | Marked on `downStage` while Shift (without Alt) is pressed; committed on the first `mousemovebody`                               | Deferred, `commitOn: 'mouse-move'`, continuous                  | Entry callback on the commit move; `callback` on every subsequent move                                                                                                    |
| `NODE_QUICK`                | Marked on `downStage` while Ctrl (without Shift) is pressed; committed on Sigma `upStage`                                        | Deferred, `commitOn: 'mouse-up'`                                | Entry callback once, on mouse release                                                                                                                                     |
| `STAGE_CONTEXT_MENU`        | Sigma `rightClickStage`                                                                                                          | Immediate `enterState`                                          | On stage right-click                                                                                                                                                      |
| `MOUSE_UP`                  | Mouse-captor `mouseup`                                                                                                           | Broadcast                                                       | On every mouse-up; afterwards, an active drag/selection/lasso/auto-connect/stage-down/quick state is reset to `IDLE`, otherwise any uncommitted `pendingState` is cleared |
| `RESIZE`                    | Sigma `resize`                                                                                                                   | Broadcast                                                       | On every resize                                                                                                                                                           |
| `CAMERA_UPDATE`             | Camera `updated`                                                                                                                 | Broadcast                                                       | On every camera update                                                                                                                                                    |
| `ZOOM_FACTOR`               | Mouse-captor `wheel`, non-zero delta, Ctrl pressed                                                                               | Immediate `enterState`                                          | Ctrl has priority over Shift and Alt                                                                                                                                      |
| `SCALE_LABELS`              | Mouse-captor `wheel`, non-zero delta, Shift pressed and Ctrl not pressed                                                         | Immediate `enterState`                                          | —                                                                                                                                                                         |
| `SCALE_NODES`               | Mouse-captor `wheel`, non-zero delta, Alt pressed and Ctrl/Shift not pressed                                                     | Immediate `enterState`                                          | —                                                                                                                                                                         |
| `AUTO_PAN_SPEED`            | Mouse-captor `wheel`, non-zero delta, Ctrl+Alt pressed                                                                           | Immediate `enterState`                                          | Ctrl+Alt takes priority over plain Ctrl (zoom)                                                                                                                            |

## Deferred (marked) transitions

Deferred gestures are marked on mouse-down and committed on the trigger configured
by the target state's `commitOn`. Until the commit, the manager stays in the
mouse-down state (`NODE_DOWN` / `STAGE_DOWN`), so a click without movement never
becomes a gesture, and a plain stage drag (no modifier) is left to Sigma's camera.

| State                  | Marked on                | `commitOn`     | Committed by          | Continuous |
| ---------------------- | ------------------------ | -------------- | --------------------- | ---------- |
| `NODE_DRAG`            | `downNode` (no modifier) | `'mouse-move'` | first `mousemovebody` | yes        |
| `NODE_AUTO_CONNECT`    | `downNode` + Ctrl+Shift  | `'mouse-move'` | first `mousemovebody` | yes        |
| `NODE_SELECTION`       | `downStage` + Shift      | `'mouse-move'` | first `mousemovebody` | yes        |
| `NODE_LASSO_SELECTION` | `downStage` + Alt+Shift  | `'mouse-move'` | first `mousemovebody` | yes        |
| `NODE_QUICK`           | `downStage` + Ctrl       | `'mouse-up'`   | Sigma `upStage`       | no         |

On the commit move, `commitPendingTransition` enters the state (firing
`beforeCallback` + `callback`), so `mousemovebody` skips its own `updateState` for
that move; later moves call `updateState`, which fires `callback` only.

## Core methods

- **`enterState(target, event)`** — guarded immediate switch: runs the old state's
  `afterCallback`s, switches, then fires the new state's `beforeCallback` (once) and
  `callback`.
- **`markTransition(target)`** — records `pendingState` (only if `target` is
  reachable from the current state) without switching.
- **`commitPendingTransition(trigger, event)`** — if a pending transition's
  `commitOn` equals `trigger` (`'mouse-move'` / `'mouse-up'`), consumes the intent
  and switches via `enterState`. Returns whether it committed.
- **`updateState(event)`** — fires only the main `callback` of the current state,
  and only when that state is `isContinuous` (per-move updates for
  drag/selection/lasso/auto-connect).
- **`broadcast(stateKey, event)`** — fires a state's callbacks regardless of the
  current state (`MOUSE_UP`, `RESIZE`, `CAMERA_UPDATE`).
- Private: `transitionTo` (switch only, runs exit callbacks), `executeStateCallbacks`
  (fires callbacks only when `stateKey` is the current state), `runStateCallbacks`,
  `runExitCallbacks`.

## Callback lifecycle

Each subscription can contain three handlers:

- `beforeCallback` runs once, immediately before that subscription's first main
  callback in the current state cycle.
- `callback` runs whenever callbacks are fired for the active state (once on entry
  for discrete states; on entry and every `mousemovebody` for continuous states).
- `afterCallback` runs once, immediately before transitioning away from the state.

`resetState()` clears the per-subscription `beforeCallbackExecuted` and
`afterCallbackExecuted` flags, clears any pending marked transition, and transitions
to `IDLE` when that transition is allowed.

## Modifier keys

Modifier detection uses the helpers in `keyboard-observer.ts`, which track only the
Control/Shift/Alt keys and remove them on release. `areExactModifiersPressed(...keys)`
is true only when exactly the listed modifiers are held, and `areNoModifiersPressed()`
is true only when none are held. This keeps every gesture's chord unambiguous.

- `downNode`: `areExactModifiersPressed('Control', 'Shift')` marks `NODE_AUTO_CONNECT`;
  `areNoModifiersPressed()` marks `NODE_DRAG`. Any other combination (e.g. Ctrl alone)
  marks nothing, so the following `clickNode` can drive `NODE_HIGHLIGHT_TOGGLE`.
- `clickNode`: `areExactModifiersPressed('Control')` enters `NODE_HIGHLIGHT_TOGGLE`,
  otherwise `NODE_CLICK`.
- `clickEdge` (and the synthetic edge-label click): `areExactModifiersPressed('Control')`
  enters `RELATION_HIGHLIGHT_TOGGLE`, otherwise `RELATION_CLICK`.
- `downStage` uses `areExactModifiersPressed(...)`: exactly Alt+Shift marks
  `NODE_LASSO_SELECTION`; exactly Shift marks `NODE_SELECTION`; exactly Ctrl marks
  `NODE_QUICK`. Any other combination (e.g. Ctrl+Shift) marks nothing.
- `wheel` uses the same helper: exactly Ctrl+Alt triggers `AUTO_PAN_SPEED`; exactly Ctrl
  triggers `ZOOM_FACTOR`; exactly Shift triggers `SCALE_LABELS`; exactly Alt triggers
  `SCALE_NODES`. Any other combination, or `event.delta === 0`, triggers nothing.

## Additional DOM behavior

The container's native `contextmenu` event is prevented so the browser context menu
does not interfere with Sigma's right-click events. This prevention does not trigger
a `StateManager` state or subscriber callback by itself.
