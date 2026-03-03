# Revue architecturale 8.10 — Affichage des noms de personnages

## Tableau résumé

| # | Problème | Sévérité | Solution envisagée |
|---|----------|----------|--------------------|
| 1 | `SelectedHeroPanel.heroNames` Map duplique les noms — données potentiellement périmées si un nom change | CRITICAL | Supprimer la Map, passer les références Character au panel, appeler `getName()` dynamiquement |
| 2 | `CharacterVisual` stocke une copie statique du nom au lieu d'une référence au Character | ✅ DONE | Passer la référence Character au constructeur au lieu de `characterName?: string` |
| 3 | Fallback incohérent : CharacterVisual tombe sur "P1" mais `Character.getName()` tombe sur l'ID | MAJOR | Unifier la stratégie de fallback — utiliser `character.getName()` partout (CharacterVisual ✅) |
| 4 | `createFromEntities()` couple fortement HeroSelectionBar au modèle Character+CharacterClass | MAJOR | Extraire un `CharacterPresenter` pour mapper Character → HeroCardData |
| 5 | Mock scene dupliqué à l'identique dans 2 fichiers de tests (115 lignes chacun) | MAJOR | Extraire dans `tests/mocks/mockScene.ts` partagé |
| 6 | Interface `HeroCardState` redéfinie dans fixtures.ts au lieu d'être importée de la source | MINOR | Importer `HeroCardState` depuis `@src/ui/HeroSelectionBar` |
| 7 | `showPanel()` peut être appelé avant `setHeroNames()` — condition de course potentielle | MINOR | Appeler `setHeroNames()` immédiatement après `create()`, avant tout `showPanel()` |
| 8 | Mock text incomplet (manque `setVisible`, `setDepth`, etc.) | MINOR | Enrichir le mock partagé (voir point 5) |
| 9 | Affichage nom complet (carte) vs initiale (token) — intentionnel mais non documenté | INFO | Documenter le choix de design (espace limité sur le token) |

## Détails

### Issues CRITICAL

**#1 — Stockage dupliqué des noms dans SelectedHeroPanel**

`SelectedHeroPanel` maintient un `heroNames: Map<string, string>` peuplé manuellement par `BattleScene`. Si un nom de personnage change à runtime, cette Map ne sera pas mise à jour.

```typescript
// Actuel — donnée potentiellement périmée
private heroNames: Map<string, string> = new Map();
this.nameText?.setText(this.heroNames.get(heroId) ?? '');

// Proposé — source unique de vérité
private characters: Map<string, Character> = new Map();
this.nameText?.setText(this.characters.get(heroId)?.getName() ?? '');
```

**#2 — CharacterVisual stocke une copie statique**

Le nom est passé comme `string` au constructeur et stocké une seule fois. Même problème de données périmées.

```typescript
// Actuel
constructor(..., characterName?: string) { this.characterName = characterName; }

// Proposé
constructor(..., character?: Character) { this.character = character; }
```

### Issues MAJOR

**#3 — Fallback incohérent**

- `CharacterVisual` : tombe sur `P${index + 1}` (ex: "P1")
- `Character.getName()` : tombe sur `this.id` (ex: "hero-0")

Deux stratégies différentes pour le même cas.

**#4 — Couplage data extraction dans HeroSelectionBar**

`createFromEntities()` fait le mapping Character → HeroCardData. Cette logique devrait être dans un Presenter dédié.

**#5 — Mock scene dupliqué**

`selected-hero-panel-tabs.steps.ts` et `selected-hero-panel-range.steps.ts` contiennent le même `createMockScene()` de 115 lignes. À extraire dans un fichier partagé.

### Issues MINOR

**#6** — `HeroCardState` redéfini dans fixtures.ts au lieu d'importé.
**#7** — Ordre d'initialisation : `setHeroNames()` doit précéder tout appel à `showPanel()`.
**#8** — Mock text manque des méthodes Phaser (`setVisible`, `setDepth`).

## Recommandations de priorité

1. **#1 + #2** (CRITICAL) — Éliminer le stockage dupliqué, passer des références Character (#2 ✅ commit cfaaac3)
2. **#5** (MAJOR) — Extraire le mock partagé (quick win, réduit 230 lignes dupliquées)
3. **#3 + #4** (MAJOR) — Unifier fallback + extraire CharacterPresenter
4. **#6-#8** (MINOR) — Nettoyage opportuniste
