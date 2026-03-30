# Event Systems Architecture Guide

This project uses **three distinct event systems**, each optimized for different purposes. Understanding when to use each system is critical for maintaining clean, performant code.

---

## 🎯 Quick Decision Guide

**Choose your event system:**

| What are you doing?                                                                | Use this system |
|------------------------------------------------------------------------------------|-----------------|
| Reacting to data changes (nodes/relations added/removed)                           | **EventBus** |
| Coordinating complex user interactions (drag, selection, tooltips)                 | **StateManager** |
| Rendering-related logic (labels, camera, high-frequency updates, nodes, relations) | **Sigma.js directly** |

---

## 1. EventBus (`src/utils/event-bus.ts`)

**For:** Application-level domain events

### When to use:
- ✅ Store data mutations (`onNodesAdd`, `onRelationsUpdate`)
- ✅ Cross-feature communication (search → graph → parallax)
- ✅ Business logic triggers (API sync, analytics, logging)
- ✅ Observer patterns for store changes

### Example:
```typescript
import { eventBus } from 'src/utils/event-bus';

// Subscribe to node additions
const unsubscribe = eventBus.subscribe('onNodesAdd', ({ nodes }) => {
  console.log(`${nodes.length} nodes added`);
  triggerParallaxRefresh();
});

// Clean up
unsubscribe();
```

### Key characteristics:
- **Global singleton** (works across all graph instances)
- **Simple pub/sub** (no state machine logic)
- **Type-safe** events defined in `EventBusEvents`

---

## 2. StateManager (`src/components/network-graph/state-manager.ts`)

**For:** Graph interaction finite state machine

### When to use:
- ✅ Complex multi-step interactions (drag → move → release)
- ✅ Preventing conflicting actions (can't drag while selecting)
- ✅ State transitions with lifecycle hooks (before/after callbacks)
- ✅ Graph-specific UI coordination (tooltips, context menus)

### Example:
```typescript
import { StateManager } from 'src/components/network-graph/state-manager';

// Subscribe to node drag with lifecycle hooks
const unsubscribe = StateManager.getInstance().subscribe('nodeDrag', {
  beforeCallback: (event) => {
    // Setup: Called once when drag starts
    highlightNode(event.nodeId);
  },
  callback: (event) => {
    // During: Called continuously while dragging
    updateNodePosition(event.nodeId, event.x, event.y);
  },
  afterCallback: () => {
    // Cleanup: Called once when transitioning to new state
    persistNodePositions();
  }
});

// Clean up
unsubscribe();
```

### Key characteristics:
- **Instance-specific** (each graph has its own StateManager)
- **Finite State Machine** (enforces valid state transitions)
- **Prevents conflicts** (e.g., IDLE → NODE_DOWN → NODE_DRAG → IDLE)
- **Lifecycle hooks** (before/callback/after)

### Important: Multiple Graph Instances

If you have multiple Sigma instances (e.g., main graph + preview), **do NOT share a StateManager** instance between them. Each graph should have its own StateManager to avoid cross-instance interference.

---

## 3. Sigma.js Events (Direct subscriptions)

**For:** Low-level rendering and graph's native or performance-critical events. Sigma.js works in symbiosis with graphology, a multipurpose
graph manipulation library.Graphology provides its own event system for graph manipulation events. Prefer subscribing to Sigma.js
events, and resort to Graphology events only when you need to react to changes in the graph structure or properties that are not
covered by Sigma.js events. For additional details, refer to the [Graphology.js documentation](https://graphology.github.io/).

### When to use:
- ✅ Rendering lifecycle (`afterRender`, `beforeRender`)
- ✅ High-frequency events (`wheel`, `mousemove`)
- ✅ Camera/viewport updates (`camera.updated`)
- ✅ Custom renderers, plugins, labels
- ✅ Observing graph events regardless of interaction state (StateManager state)

### Example:
```typescript
import { useGraphStore } from 'src/stores/graph';

const sigma = useGraphStore.getState().sigma;

// Update HTML labels after each render
sigma.on('afterRender', () => {
  updateNodeLabelsOverlay();
});

// Camera zoom changed
sigma.getCamera().addListener('updated', (state) => {
  console.log('New zoom:', state.ratio);
});
```

### Key characteristics:
- **Instance-specific** (automatically isolated per Sigma instance)
- **Performance-critical** (no abstraction overhead)
- **Native Sigma API** (full access to all Sigma features)
- **Direct control** (no middleware or indirection)

---

## 📊 System Comparison

| Feature | EventBus | StateManager    | Sigma.js |
|---------|----------|-----------------|----------|
| **Scope** | Global | Singleton       | Per-instance |
| **Pattern** | Pub/Sub | FSM             | Native Events |
| **Use case** | Domain events | UI interactions | Rendering |
| **State tracking** | ❌ No | ✅ Yes           | ❌ No |
| **Type safety** | ✅ Strong | ✅ Strong        | ✅ Strong |

---

## 🎓 Learning More

- **EventBus implementation:** `src/utils/event-bus.ts`
- **StateManager implementation:** `src/components/network-graph/state-manager.ts`
- **Sigma.js docs:** https://www.sigmajs.org/

---

## ✅ Checklist: Adding a New Event

Before adding an event, ask yourself:

1. **Is this a domain event (data change)?**
	- ✅ Yes → Add to `EventBusEvents` in `event-bus.ts`

2. **Is this a complex interaction with state transitions?**
	- ✅ Yes → Add to `StateManagerStates` in `state-manager.ts`

3. **Is this a rendering/performance-critical or non-complex interaction event?**
	- ✅ Yes → Subscribe directly to Sigma.js (we won't be adding events to Sigma.js, as it is a third-party library)

4. **Does it fit multiple categories?**
	- Is it a non-graph/global event?
		- ✅ Yes → EventBus
	- Is it a complex graph interaction?
		- ✅ Yes → StateManager

5. **Still not sure?**
	- Talk to the team :)

---

*Last updated: 2026-02-18*

