# StrictFlow

## Current State
The app has per-user data isolation in the backend (habits, groups, logs, settings, profile) keyed by Principal. However, all data maps are declared as non-stable variables (`let userHabits = Map.empty<...>()`), meaning all user data is lost on every canister upgrade. Internet Identity is the auth method. Guest mode uses local in-memory sample data.

## Requested Changes (Diff)

### Add
- Stable storage for all user data maps so data persists across canister upgrades indefinitely.

### Modify
- Backend: Convert `userHabits`, `userGroups`, `userHabitLogs`, `userSettings`, `userProfiles` to use stable variables with pre/post-upgrade hooks to serialize/deserialize data.
- Login screen messaging: Update subtitle to reflect that signing in means data is permanently saved.

### Remove
- Nothing removed.

## Implementation Plan
1. Regenerate backend Motoko with stable variable patterns for all user data maps.
2. Update login screen copy to clearly communicate persistent data storage when signed in.
