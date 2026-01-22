# Bug List

## Bug 1: Defensive Reaction Prompt - Click Doesn't Confirm Selection

**Severity**: High
**Status**: FIXED

### Description
When the defensive reaction prompt appears (with options like "Spend 1 red bead for +1 Guard", "Pass", etc.), clicking an option selects it visually but does NOT confirm the selection. The game waits indefinitely for a confirmation that never comes from the UI.

### Steps to Reproduce
1. Start a battle
2. Move a hero adjacent to the monster (e.g., using Run action)
3. Cycle through player turns until the monster attacks an adjacent hero
4. Defensive reaction prompt appears with options
5. Click "Pass" (or any other option)

### Expected Behavior
Clicking an option should select AND confirm it, advancing the game.

### Actual Behavior
- The option gets selected (`selectedIds: ["pass"]` in panel logic state)
- But `confirm()` is never called
- The monster turn remains stuck
- Game waits indefinitely

### Root Cause Analysis
The `OptionSelectionUI.onOptionClicked()` method only calls `logic.selectOption()` but doesn't call `logic.confirm()` for non-multiSelect prompts. For single-select prompts (like defensive reactions), clicking an option should auto-confirm.

### Fix Applied
Modified `OptionSelectionPanel.onOptionClicked()` to auto-confirm for single-select prompts (multiSelect === false). After selecting an option, if it's a single-select prompt, `this.logic.confirm()` is now called automatically.

**Commit**: 6952758

---

## Bug 2: Action Button Click Detection Issues in SelectedHeroPanel

**Severity**: Medium
**Status**: FIXED (Root cause was Bug 3)

### Description
Clicking action buttons in the SelectedHeroPanel (Attack, Run, etc.) didn't always register. The button hit detection seemed unreliable.

### Root Cause
This was caused by Bug 3 (panel tab state resetting). When the tab reset to 'movement' during panel refresh, the attack buttons would be replaced with movement buttons, making the click appear to not register.

### Fix Applied
Fixed by resolving Bug 3 - the tab now persists correctly when the panel is shown for the same hero.

All E2E tests pass, including:
- "Attack action advances wheel by 2"
- "Attack deals fixed 1 damage"

---

## Bug 3: Panel Tab State Resets Unexpectedly

**Severity**: Low
**Status**: FIXED

### Description
After switching to the Attacks tab and performing some actions, the panel resets to the Movement tab unexpectedly.

### Root Cause
In `SelectedHeroPanel.showPanel()`, the tab was unconditionally reset to 'movement' every time the panel was shown, even if it was for the same hero.

### Fix Applied
Modified `showPanel()` to only reset the tab when showing the panel for a DIFFERENT hero. If the same hero is selected again, the tab persists.

**Commit**: 6952758

---

## Testing Notes

- Monster HP correctly decreases when Attack action executes (10 -> 7 after one attack with power 3)
- Hero HP correctly decreases when monster attacks (3 -> 1 after stone_slam with damage 2)
- Turn flow works correctly when defensive prompts are handled programmatically
- Movement actions (Move, Run) work correctly with targeting system
