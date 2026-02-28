# Combat System Redesign Plan

Following PRD v4 implementation order.

---

## Step 1: Action Wheel System ✅ COMPLETE

### Completed
- [x] Create `ActionWheel` system class (`src/systems/ActionWheel.ts`)
- [x] Unit tests for wheel mechanics (`features/unit/action-wheel.feature` - 17 scenarios)
- [x] Basic integration (no UI yet)

### Implementation Details
- 8-segment wheel (positions 0-7)
- FIFO tie-breaking for same-position creatures
- Wrap-around at segment 8 → 0
- Add/remove entities from wheel

---

## Step 2: Monster Bead Bag AI ✅ COMPLETE

### Completed
- [x] Create `BeadBag` system class (`src/systems/BeadBag.ts`)
- [x] Create `MonsterStateMachine` class (`src/systems/MonsterStateMachine.ts`)
- [x] Update monster data schema (beads, states, start_state)
- [x] Unit tests for bead mechanics (`features/unit/bead-bag.feature` - 14 scenarios)
- [x] Unit tests for state machine (`features/unit/monster-state-machine.feature` - 11 scenarios)
- [x] Integrate with MonsterToken and MonsterAI
- [x] Add Bead Guardian test monster

### Implementation Details
- BeadBag: draw, peek, auto-reshuffle when empty
- MonsterStateMachine: color-based state transitions
- 4 bead colors: red, blue, green, white
- States define damage, wheel_cost, range, area, transitions

---

## Step 3: Player Bead System ✅ COMPLETE

### Completed
- [x] Create `PlayerBeadHand` class (`src/systems/PlayerBeadHand.ts`)
- [x] Unit tests for hand management (`features/unit/player-bead-hand.feature` - 19 scenarios)
- [x] Integrate with `CharacterToken` (beadHand property, initializeBeadHand(), hasBeadHand())

### Implementation Details
- Three pools: bag, hand, discard
- Default: 3 beads of each color (12 total)
- `drawToHand(count)`: Moves beads from bag to hand
- `spend(color)`: Moves bead from hand to discard
- `canAfford(costs)`: Checks if hand has required beads
- Auto-reshuffle when bag empties

---

## Step 4: Combat Integration ✅ COMPLETE

### Completed
- [x] Replace TurnManager with ActionWheel in BattleScene
- [x] Implement basic actions (Move, Run, Attack, Rest)
- [x] Update HP values (heroes: 3, bosses: 10)
- [x] Add wheel and bead UI visualization
- [x] E2E testing (19 new scenarios)
- [x] Convert all monsters to bead-based AI

### Implementation Details
- Continuous turn loop using `processTurn()` → `getNextActor()` → execute → `advanceEntity()`
- Actions: Move (cost 1, 2 spaces), Run (cost 2, 6 spaces), Attack (cost 2, 1 damage), Rest (cost 2, draw 2 beads)
- All 4 monsters now use bead-based state machines
- Removed phase state machine and hasMoved/hasActed flags
- UI: 8-segment wheel display, colored bead circles, monster discard counter

---

## Step 5: Turn Enforcement Bug Fix ✅ COMPLETE

### Completed
- [x] Validate that selected character matches current actor from action wheel
- [x] Prevent selecting non-active heroes during player turns
- [x] Auto-select the current actor when their turn begins
- [x] Gray out or disable non-active hero portraits

### Implementation Details
- `handleHeroBarClick()` validates `heroId !== currentActorId` (BattleScene.ts:246)
- `showPlayerTurn()` auto-selects current actor (BattleScene.ts:348-360)
- `HeroSelectionBar.updateCurrentActor()` dims non-active heroes to 50% opacity
- Current actor highlighted with yellow border
- 3 E2E tests verify behavior (turn-enforcement.feature)

---

## Step 6: Battle UI Redesign ✅ COMPLETE

### Completed
- [x] Bead display enhancement (larger beads: 10px in cards, 14px in panel)
- [x] Turn indicator banner at top center ("Player 1's Turn")
- [x] Action wheel visualization (8-segment pie chart with entity markers)
- [x] Action button icons (→ Move, » Run, ⚔ Attack, ⏸ Rest) with ⏱ time costs
- [x] Hero card colored backgrounds (P1-P4 unique colors)
- [x] Grid line visibility improved (2px width, 0.7 alpha)

### Implementation Details
- `BattleUI.ts`: Turn banner, enhanced wheel display, larger beads
- `HeroSelectionBar.ts`: Larger beads (10px), colored hero backgrounds
- `SelectedHeroPanel.ts`: Action icons, time cost display (⏱N)
- `GridVisual.ts`: Line width 2px, alpha 0.7, color 0x5a5a7a
- All 40 E2E tests passing

---

## Step 7: Defense and Evasion System ✅ COMPLETE

### Combat Resolution
- [x] Add defensive stats (Armor, Guard, Evasion) to creature schema
- [x] Add offensive stats (Power, Agility) to attack schema
- [x] Implement attack resolution: Agility vs Evasion
- [x] Implement damage resolution: Power vs Defense
- [x] Implement attack modifiers (Feint, Heavy, Precise, Swift)
- [x] Unit tests for CombatResolver (32 scenarios)
- [x] Unit tests for Entity defense stats (8 scenarios)
- [x] Unit tests for MonsterEntity combat (5 scenarios)

### Boss Defense Display
- [x] Display defensive stats on monster status panel below HP
- [x] Show stat icons with values: 🛡 Armor  🔰 Guard  💨 Evasion
- [x] Removed redundant "Current Actor" text
- [x] Unit tests for defense display (15 scenarios)

### Player Defensive Reactions
- [x] When player is attacked, prompt for defensive reaction before resolving
- [x] Option to discard red bead → +1 Guard against current attack
- [x] Option to discard green bead → +1 Evasion against current attack
- [x] Allow multiple bead discards for stacking bonuses
- [x] Skip reaction if player has no beads or chooses to pass
- [x] Unit tests for defensive reactions (10 scenarios)

### Implementation Details
- `AttackEffect.promptDefensiveReaction()` handles the reaction flow
- `Effect.execute()` now supports async for UI prompts
- Defense boosts are temporary (reset at turn start via `resetGuard()`)

---

## Step 8: Character Creation ⏳ IN PROGRESS

### 8.1: Character Data Model & Storage Service ✅ COMPLETE

**Objectif**: Créer le modèle de données et le service de persistance localStorage.

**Fichiers créés**:
- `src/types/CharacterData.ts` - Interface du modèle
- `src/services/CharacterStorageService.ts` - CRUD localStorage
- `public/data/characters/defaults.yaml` - 4 personnages par défaut
- `features/unit/character-storage.feature` - Tests unitaires (17 scénarios)
- `tests/steps/character-storage.steps.ts` - Step definitions

**Critères d'acceptation**:
- [x] Interface `CharacterData` avec: id, name, attributes (str/dex/mnd/spr), weapon, isDefault, createdAt, updatedAt
- [x] `CharacterStorageService.getAll()` retourne tous les personnages (défauts + créés)
- [x] `CharacterStorageService.save(character)` sauvegarde dans localStorage
- [x] `CharacterStorageService.delete(id)` supprime (refuse si isDefault=true)
- [x] `CharacterStorageService.getById(id)` retourne un personnage
- [x] `CharacterStorageService.isNameUnique(name, excludeId?)` vérifie unicité
- [x] 4 personnages par défaut chargés au démarrage (isDefault=true)
- [x] Maximum 10 personnages custom (erreur si dépassé)
- [x] Tests unitaires passent (17 scénarios)

---

### 8.2: Starting Weapons Data ✅ COMPLETE

**Objectif**: Définir les 4 armes de départ dans les données YAML.

**Fichiers créés/modifiés**:
- `public/data/weapons/core.yaml` - Définitions des armes
- `src/types/WeaponDefinition.ts` - Interface TypeScript
- `src/systems/DataLoader.ts` - Ajout loadWeapons()
- `features/unit/weapon-data.feature` - Tests de chargement (7 scénarios)
- `tests/steps/weapon-data.steps.ts` - Step definitions

**Critères d'acceptation**:
- [x] 4 armes définies: Sword, Axe, Mace, Spear
- [x] Chaque arme a: id, name, category, power, agility, range
- [x] Sword: power=1, agility=1, range=1
- [x] Axe: power=2, agility=0, range=1
- [x] Mace: power=1, agility=0, range=1
- [x] Spear: power=1, agility=1, range=1-2
- [x] DataLoader charge les armes correctement
- [x] Tests unitaires passent (7 scénarios)

---

### 8.3: Character Creation Scene - Layout & Name ✅ COMPLETE

**Objectif**: Créer la scène de création avec champ nom et validation.

**Fichiers créés/modifiés**:
- `src/scenes/CharacterCreationScene.ts` - Scène Phaser avec input DOM
- `src/main.ts` - Ajout DOM support et enregistrement scène
- `src/scenes/MenuScene.ts` - Bouton "Create Character"
- `features/e2e/character-creation.feature` - Tests E2E (10 scénarios, 4 passent, 6 @wip)
- `tests/e2e/steps/character-creation.steps.ts` - Step definitions

**Critères d'acceptation**:
- [x] Scène accessible depuis MenuScene
- [x] Champ de saisie pour le nom du personnage (DOM input via Phaser)
- [x] Validation en temps réel: max 20 caractères
- [x] Message d'erreur si nom vide (affiché dans Phaser)
- [x] Message d'erreur si nom déjà pris (affiché dans Phaser)
- [x] Prévisualisation de la première lettre comme icône du token
- [x] Bouton "Annuler" retourne au MenuScene
- [x] Tests E2E passent (4 scénarios, 6 @wip pour tests DOM/Phaser sync)

---

### 8.4: Character Creation Scene - Attributes ✅ COMPLETE

**Objectif**: Ajouter l'allocation des points d'attributs avec prévisualisation des beads.

**Fichiers modifiés**:
- `src/scenes/CharacterCreationScene.ts` - Ajout UI attributs
- `features/e2e/character-creation.feature` - Tests E2E (8 scénarios)
- `tests/e2e/steps/character-creation.steps.ts` - Step definitions

**Critères d'acceptation**:
- [x] 4 attributs affichés: STR, DEX, MND, SPR
- [x] Boutons +/- pour chaque attribut
- [x] Valeurs min=1, max=6 par attribut
- [x] Compteur de points restants (démarre à 8, car 4 pré-alloués)
- [x] Bouton + désactivé si points=0 ou attribut=6
- [x] Bouton - désactivé si attribut=1
- [x] Prévisualisation du sac de beads en temps réel (cercles colorés)
- [x] Couleurs: Rouge=STR, Vert=DEX, Bleu=MND, Blanc=SPR
- [x] Tests E2E passent (8 scénarios)

---

### 8.5: Character Creation Scene - Weapon & Save ✅ COMPLETE

**Objectif**: Ajouter sélection d'arme et sauvegarde du personnage.

**Fichiers à modifier**:
- `src/scenes/CharacterCreationScene.ts` - Ajout sélection arme + sauvegarde

**Critères d'acceptation**:
- [x] Liste des 4 armes avec stats affichées
- [x] Sélection visuelle (highlight) de l'arme choisie
- [x] Bouton "Sauvegarder"
- [x] Bouton désactivé si: nom invalide OU points non dépensés OU pas d'arme
- [x] Sauvegarde appelle CharacterStorageService.save()
- [x] Après sauvegarde, retour au MenuScene
- [x] Mode édition: pré-remplit les champs si character passé en paramètre
- [x] Tests E2E passent (6 scénarios)

---

### 8.6: Menu Scene - Character Slots UI ✅ COMPLETE

**Objectif**: Remplacer le sélecteur de taille d'équipe par 4 slots de personnages.

**Fichiers créés/modifiés**:
- `src/scenes/MenuScene.ts` - Refonte UI party selection avec CharacterStorageService
- `features/e2e/character-slots.feature` - Tests E2E (6 scénarios)
- `tests/e2e/steps/character-slots.steps.ts` - Step definitions
- `features/e2e/menu-navigation.feature` - Suppression scénario "Party Size"
- `tests/e2e/steps/menu.steps.ts` - Suppression steps party size

**Critères d'acceptation**:
- [x] Suppression du sélecteur "Party Size"
- [x] 4 slots visuels affichés horizontalement (180x100, 16px gap)
- [x] Slot vide: affiche "+" et "Empty"
- [x] Slot rempli: affiche lettre cercle + nom + attributs + arme
- [x] Clic sur slot rempli → retire le personnage
- [x] Clic sur slot vide → assigne le prochain personnage disponible (placeholder avant 8.7)
- [x] Bouton "Start Battle" désactivé si aucun personnage sélectionné
- [x] Auto-population des 4 défauts au chargement
- [x] Bridge partySize pour compatibilité BattleBuilder
- [x] Getter `characterSlotsState` pour tests E2E
- [x] Tests E2E passent (6 scénarios)

---

### 8.7: Menu Scene - Character Selection Popup ✅ COMPLETE

**Objectif**: Créer le popup de sélection de personnage pour les slots.

**Fichiers créés/modifiés**:
- `src/ui/CharacterSelectionPopup.ts` - Composant popup (Phaser container)
- `src/scenes/MenuScene.ts` - Intégration popup, remplacement du placeholder
- `features/e2e/character-selection-popup.feature` - Tests E2E (8 scénarios)
- `tests/e2e/steps/character-selection-popup.steps.ts` - Step definitions
- `features/e2e/character-slots.feature` - Tests mis à jour pour utiliser le popup

**Critères d'acceptation**:
- [x] Popup modal affiche liste des personnages sauvegardés
- [x] Chaque entrée: nom, attributs résumés (STR/DEX/MND/SPR), arme
- [x] Personnages par défaut marqués visuellement (icône 🔒)
- [x] Personnages déjà dans l'équipe grisés (non sélectionnables, 40% alpha)
- [x] Bouton "Créer nouveau" → CharacterCreationScene
- [x] Bouton "Retirer" si slot déjà occupé
- [x] Sélection d'un personnage → ferme popup, remplit le slot
- [x] Clic hors popup ou bouton X → ferme sans changement
- [x] Tests E2E passent (8 scénarios popup + 6 slots)
- [x] Pagination (4 items/page) avec contrôles Prev/Next quand > 4 personnages
- [x] Tests E2E pagination passent (6 scénarios supplémentaires)

---

### 8.8: Character Management View ✅ COMPLETE

**Objectif**: Permettre la gestion des personnages (édition, suppression, import/export).

**Fichiers créés/modifiés**:
- `src/ui/CharacterManagementPanel.ts` - Panel de gestion (411 lignes)
- `src/scenes/MenuScene.ts` - Bouton "Manage Characters" + intégration panel
- `features/e2e/character-management.feature` - Tests E2E (9 scénarios)
- `tests/e2e/steps/character-management.steps.ts` - Step definitions

**Critères d'acceptation**:
- [x] Bouton "Manage Characters" dans MenuScene
- [x] Panel affiche tous les personnages avec détails
- [x] Bouton "Edit" pour chaque personnage custom → CharacterCreationScene (mode édition)
- [x] Bouton "Delete" pour chaque personnage custom (grisé si dans équipe actuelle)
- [x] Confirmation avant suppression ("Supprimer X ?")
- [x] Personnages par défaut: pas de boutons Edit/Delete
- [x] Bouton "Export All" → télécharge JSON
- [x] Bouton "Import" → charge fichier JSON, merge avec existants
- [x] Tests E2E passent (9 scénarios - dépasse le minimum de 5)

---

### 8.9: Battle Integration - Bead Bag from Attributes ✅ COMPLETE

**Objectif**: Modifier BattleBuilder pour créer les personnages avec bead bags basés sur attributs.

**Fichiers créés/modifiés**:
- `src/entities/Character.ts` - Ajout name, attributes, weaponId + initializeBeadHand(initial?)
- `src/builders/BattleBuilder.ts` - Ajout withCharacterData() + mapping attributs→beads
- `src/scenes/MenuScene.ts` - startBattle() passe CharacterData[] au builder
- `features/unit/battle-builder-beads.feature` - Tests unitaires (6 scénarios)
- `tests/steps/battle-builder-beads.steps.ts` - Step definitions

**Critères d'acceptation**:
- [x] BattleBuilder reçoit liste de CharacterData au lieu de partySize
- [x] Character entity stocke: name, attributes, weaponId
- [x] PlayerBeadSystem initialisé avec composition basée sur attributs
- [x] Personnage STR=5,DEX=2,MND=2,SPR=3 → sac de 5R,2G,2B,3W
- [x] 3 beads tirés au début du combat (inchangé)
- [x] Tests unitaires passent (6 scénarios)

---

### 8.10: Battle UI - Character Names Display ✅ COMPLETE

**Objectif**: Afficher les noms des personnages dans l'UI de combat.

**Fichiers modifiés**:
- `src/ui/HeroSelectionBar.ts` - Nom complet sur chaque carte (remplace cercle coloré)
- `src/ui/SelectedHeroPanel.ts` - Nom affiché en haut du panel
- `src/visuals/CharacterVisual.ts` - Initiale du nom centrée sur le token
- `src/scenes/BattleScene.ts` - Passe les noms au SelectedHeroPanel

**Critères d'acceptation**:
- [x] HeroSelectionBar: nom du personnage visible sur chaque carte
- [x] SelectedHeroPanel: nom affiché en haut quand héros sélectionné
- [x] Token sur la grille: première lettre du nom (au lieu de "P1", "P2", etc.)
- [x] Couleurs des joueurs (P1-P4) conservées pour distinction visuelle
- [x] Tests E2E passent (4 scénarios)

---

### 8.11: Final Integration & Polish ⏳ PENDING

**Objectif**: Intégration finale, tests complets, corrections de bugs.

**Critères d'acceptation**:
- [ ] Flow complet fonctionne: Menu → Créer perso → Sélectionner → Combat
- [ ] Personnages par défaut utilisables immédiatement
- [ ] Import/Export fonctionne correctement
- [ ] Tous les tests unitaires passent
- [ ] Tous les tests E2E passent
- [ ] Pas de régression sur fonctionnalités existantes
- [ ] `npm run check` passe sans erreur

---

### Step 8 - Ordre d'Exécution Recommandé

| Phase | Sous-tâches | Notes |
|-------|-------------|-------|
| 1 | **8.1** + **8.2** | Parallélisables (pas de dépendances) |
| 2 | **8.3** | Requiert 8.1 |
| 3 | **8.4** | Requiert 8.3 |
| 4 | **8.5** | Requiert 8.2 + 8.4 |
| 5 | **8.6** | Requiert 8.5 |
| 6 | **8.7** | Requiert 8.6 |
| 7 | **8.8** | Requiert 8.7 |
| 8 | **8.9** | Requiert 8.8 |
| 9 | **8.10** | Requiert 8.9 |
| 10 | **8.11** | Requiert tous les précédents |

### Step 8 - Diagramme des Dépendances

```
8.1 Character Data Model ──┬──→ 8.3 Creation Scene (Name)
                           │
8.2 Weapons Data ──────────┴──→ 8.5 Creation Scene (Weapon)
                                        │
8.3 ──→ 8.4 (Attributes) ──→ 8.5 ──────┤
                                        │
                                        ▼
                              8.6 Menu Slots ──→ 8.7 Selection Popup
                                        │
                                        ▼
                              8.8 Character Management
                                        │
                                        ▼
                              8.9 Battle Integration ──→ 8.10 UI Names
                                        │
                                        ▼
                                   8.11 Final Polish
```

---

## Step 9: Weapon System ⏳ PENDING

- [ ] Define weapon data schema
- [ ] Create weapon list with stats and special actions
- [ ] Add weapon selection to character creation
- [ ] Link weapons to character combat actions

---

## Step 10: Terrain System ⏳ PENDING

- [ ] Define terrain data schema
- [ ] Create `TerrainSystem` for movement/LoS calculations
- [ ] Implement hazard and tactical terrain effects
- [ ] Update map data format

---

## Step 11: Inventory System ⏳ PENDING

- [ ] Define inventory and item data schemas
- [ ] Create `InventoryManager` system
- [ ] Implement equipment slots and backpack
- [ ] Add Swap Weapon and Use Consumable actions

---

## Step 12: Campaign & Progression ⏳ PENDING

- [ ] Define campaign data structure
- [ ] Create `CampaignManager` system
- [ ] Implement experience and leveling
- [ ] Create between-battle phase UI
- [ ] Implement shop system

---

## Step 13: Monster Variety & Boss Phases ⏳ PENDING

- [ ] Update monster schema for phases
- [ ] Implement phase threshold detection
- [ ] Minion spawning system
- [ ] Environmental interaction actions

---

## Step 14: Print-and-Play Export ⏳ PENDING

- [ ] Character sheet PDF generator
- [ ] Monster card generator
- [ ] Action wheel printable template
- [ ] Rulebook markdown export

---

## Test Results

```
Unit/Integration Tests: 475 passed
E2E Tests: 107 passed
Total: 582 tests passing
```

### E2E Flaky Test Fixes (Feb 2025)
- **Round 1** (3 tests): Replaced `waitForTimeout` with `waitForFunction` polling for `entityTargetingActive` and wheel position change; replaced rigid rest loop with goal-oriented loop
- **Round 2** (12 tests): Systematic elimination of `waitForTimeout` across 6 files:
  - `fixtures.ts`: `waitForGameReady` polls active scene; new `waitForEntityTargeting`/`waitForWheelAdvanced` helpers; `clickValidMovementTile` polls for valid moves
  - `character-selection-popup.steps.ts`: `waitForPopupVisible` before state reads; `expect().toPass()` on visibility assertions
  - `character-slots.steps.ts`: `expect().toPass()` on slot letter assertion
  - `character-management.steps.ts`: `waitForManagementPanelVisible` before state reads
  - `battle.steps.ts`: Use shared `waitForEntityTargeting`/`waitForWheelAdvanced` helpers (10s timeout, up from 5s)
  - `combat-integration.steps.ts`: `clickValidMovementTile` self-polls; `expect().toPass()` on monster discards; hero rest retry loop with `expect().toPass()`
  - `playwright.config.ts`: Test timeout 30s → 60s for multi-turn battle tests
  - `.claude/agents/e2e-test-writer.md`: Added rule: never use `waitForTimeout`, always use event-driven polling

---

## Previous Work: BattleScene Decomposition ✅ COMPLETE

### New Systems Created (4)
- **GridSystem** - Grid coordinate conversion, position validation
- **MovementValidator** - Movement validation logic with occupation checks
- **CombatResolver** - Attack resolution, damage calculation, range checking
- **MonsterAI** - Monster decision making (targeting, attack selection, movement)

### Architecture

```
src/
├── systems/
│   ├── ActionWheel.ts        # Action wheel turn order (Step 1)
│   ├── BeadBag.ts            # Bead drawing system (Step 2)
│   ├── MonsterStateMachine.ts# Monster state transitions (Step 2)
│   ├── PlayerBeadHand.ts     # Player bead hand management (Step 3)
│   ├── GridSystem.ts         # Grid coordinate conversion
│   ├── MovementValidator.ts  # Movement validation
│   ├── CombatResolver.ts     # Combat resolution
│   ├── MonsterAI.ts          # Monster AI decisions
│   ├── DiceRoller.ts         # Dice rolling
│   ├── TurnManager.ts        # Turn tracking (to be replaced Step 4)
│   └── DataLoader.ts         # Data loading
├── entities/
│   └── Token.ts              # Token entities (CharacterToken has beadHand)
└── scenes/
    └── BattleScene.ts        # Scene orchestrator
```
