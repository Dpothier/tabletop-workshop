# Refactoring BattleScene - Phase 2

**Objectif** : Réduire BattleScene de ~740 lignes à ~400 lignes

## Principes

1. **Les composants visuels font leur propre mapping** depuis les objets métier
2. **BattleBuilder instancie les composants non-Phaser**
3. **AnimationExecutor émet les événements UI** directement vers BattleStateObserver

---

## 1. AnimationExecutor émet vers BattleStateObserver

**Problème** : BattleScene fait du push manuel après les animations via `emitPostActionUpdates()` et `emitPostMonsterTurnUpdates()`.

**Solution** : AnimationExecutor reçoit BattleStateObserver et émet après chaque animation.

### Changements

| Fichier | Modification |
|---------|--------------|
| `AnimationExecutor.ts` | Ajouter `stateObserver` au constructeur, émettre dans chaque `executeX()` |
| `BattleScene.ts` | Passer `stateObserver` à AnimationExecutor, supprimer `emitPostActionUpdates()` et `emitPostMonsterTurnUpdates()` |

### Mapping AnimationEvent → UIStateEvent

| AnimationEvent | Émet |
|----------------|------|
| `damage` (entityId=monster) | `emitMonsterHealthChanged(newHealth, maxHealth)` |
| `damage` (entityId=hero-*) | `emitHeroHealthChanged(entityId, newHealth, maxHealth)` |
| `rest` | `emitHeroBeadsChanged(entityId, beadCounts)` |
| `beadDraw` | `emitMonsterBeadsChanged(counts)` |

**Lignes économisées** : ~42

---

## 2. BattleBuilder instancie les composants non-Phaser

**Problème** : BattleScene crée des composants qui ne dépendent pas de Phaser.

**Solution** : BattleBuilder les crée et les inclut dans BattleState.

### Composants à déplacer

| Composant | Actuellement créé dans | Dépend de Phaser ? |
|-----------|------------------------|-------------------|
| `GridSystem` | BattleScene L155-161 | Non |
| `EffectRegistry` + effects | BattleScene L204-207 | Non |
| `TurnController` | BattleScene L181 | Non |
| `BattleStateObserver` | BattleScene L213 | Non |

### Changements

| Fichier | Modification |
|---------|--------------|
| `BattleState.ts` | Ajouter `gridSystem`, `effectRegistry`, `turnController`, `stateObserver` |
| `BattleBuilder.ts` | Créer ces composants dans `build()` |
| `BattleScene.ts` | Les récupérer depuis `this.state` au lieu de les créer |

**Lignes économisées** : ~20

---

## 3. Mapping métier → visuel dans les composants visuels

**Problème** : BattleScene fait le mapping entre objets métier et données visuelles.

**Solution** : Chaque composant visuel reçoit les objets métier et fait son propre mapping.

### 3.1 HeroSelectionBar

**Avant** :
```typescript
const heroCardData: HeroCardData[] = this.characters.map(...);
this.heroSelectionBar.create(heroCardData);
```

**Après** :
```typescript
this.heroSelectionBar.create(this.characters, this.classes);
```

| Fichier | Modification |
|---------|--------------|
| `HeroSelectionBar.ts` | `create(characters: Character[], classes: CharacterClass[])` fait le mapping interne |
| `BattleScene.ts` | Supprimer le mapping, passer les objets métier |

**Lignes économisées** : ~18

### 3.2 CharacterVisual et MonsterVisual

**Avant** :
```typescript
const worldX = this.gridSystem.gridToWorld(pos.x);
const worldY = this.gridSystem.gridToWorld(pos.y);
const visual = new CharacterVisual(this, worldX, worldY, charClass, color, index);
```

**Après** :
```typescript
const visual = CharacterVisual.fromEntity(this, character, charClass, this.gridSystem, index);
```

| Fichier | Modification |
|---------|--------------|
| `CharacterVisual.ts` | Ajouter `static fromEntity(scene, character, class, gridSystem, index)` |
| `MonsterVisual.ts` | Ajouter `static fromEntity(scene, entity, monster, gridSystem)` |
| `BattleScene.ts` | Utiliser les factory methods |

**Lignes économisées** : ~15

### 3.3 syncVisuals() → Visuels réactifs

**Avant** : BattleScene itère sur les entités et met à jour chaque visuel manuellement.

**Après** : Les visuels s'abonnent à BattleStateObserver.

| Fichier | Modification |
|---------|--------------|
| `CharacterVisual.ts` | Ajouter `subscribeToState(observer, character, gridSystem)` |
| `MonsterVisual.ts` | Ajouter `subscribeToState(observer, entity, gridSystem)` |
| `BattleScene.ts` | Supprimer `syncVisuals()`, abonner les visuels |

**Lignes économisées** : ~25

### 3.4 UI reçoit BattleState directement

**Avant** :
```typescript
this.battleUI.subscribeToState(this.stateObserver, this.createBattleUIAccessors());
```

**Après** :
```typescript
this.battleUI.subscribeToState(this.stateObserver, this.state);
```

| Fichier | Modification |
|---------|--------------|
| `BattleState.ts` | Exposer les méthodes d'accès (ou implémenter une interface) |
| `BattleUI.ts` | Recevoir `BattleState` au lieu d'accesseurs custom |
| `SelectedHeroPanel.ts` | Idem |
| `BattleScene.ts` | Supprimer `createBattleUIAccessors()` et `createSelectedHeroPanelAccessors()` |

**Lignes économisées** : ~35

### 3.5 BattleState expose GameContext

**Avant** :
```typescript
private createGameContext(actorId: string): GameContext { ... }
```

**Après** :
```typescript
this.state.createGameContext(actorId)
```

| Fichier | Modification |
|---------|--------------|
| `BattleState.ts` | Ajouter `createGameContext(actorId): GameContext` |
| `BattleScene.ts` | Supprimer la méthode locale |

**Lignes économisées** : ~15

---

## Résumé

| Changement | Lignes économisées |
|------------|-------------------|
| AnimationExecutor émet les événements | -42 |
| BattleBuilder crée composants non-Phaser | -20 |
| HeroSelectionBar fait son mapping | -18 |
| Visuals ont des factory methods | -15 |
| Visuals réactifs (syncVisuals supprimé) | -25 |
| UI reçoit BattleState directement | -35 |
| BattleState expose GameContext | -15 |
| **Total** | **-170** |

**Résultat attendu** : BattleScene passe de ~740 à ~570 lignes.

---

## Ordre d'exécution recommandé

1. **AnimationExecutor émet les événements** - Quick win, supprime du code redondant
2. **BattleBuilder crée les composants non-Phaser** - Simplifie BattleScene.create()
3. **BattleState expose GameContext et accesseurs** - Prépare le terrain
4. **UI reçoit BattleState** - Supprime les factories d'accesseurs
5. **Visuals factory methods** - Simplifie createVisuals()
6. **HeroSelectionBar fait son mapping** - Simplifie createHeroSelectionBar()
7. **Visuals réactifs** - Supprime syncVisuals()
