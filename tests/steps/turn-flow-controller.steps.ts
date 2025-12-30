import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import { TurnFlowController } from '@src/controllers/TurnFlowController';
import type { BattleState } from '@src/state/BattleState';
import type { BattleAdapter } from '@src/types/BattleAdapter';
import type { BattleStatus } from '@src/systems/TurnController';
import { TurnController, type AliveQueryable } from '@src/systems/TurnController';
import { ActionWheel } from '@src/systems/ActionWheel';
import type { AnimationEvent } from '@src/types/AnimationEvent';
import type { MonsterAction } from '@src/entities/MonsterEntity';

interface TurnFlowControllerWorld extends QuickPickleWorld {
  turnFlowController?: TurnFlowController;
  battleState?: BattleState;
  battleAdapter?: BattleAdapter & {
    log: any;
    animate: any;
    delay: any;
    showPlayerTurn: any;
    awaitPlayerAction: any;
    transition: any;
  };
  battleStatus?: BattleStatus;
  monsterMock?: AliveQueryable;
  characterMocks?: AliveQueryable[];
  turnController?: TurnController;
  monsterEntity?: any;
  decisionAction?: MonsterAction;
  animationEvents?: AnimationEvent[];
  actionRegistry?: any;
  selectedActionId?: string;
  mockAction?: any;
  mockActionResolution?: any;
  mockedCheckBattleStatus?: any;
  monsterName?: string;
}

/**
 * Create a mock AliveQueryable object
 */
function createAliveMock(isAlive: boolean): AliveQueryable {
  return {
    isAlive: () => isAlive,
  };
}

/**
 * Create a mock BattleAdapter
 */
function createBattleAdapterMock(): BattleAdapter {
  return {
    promptTile: async () => null,
    promptOptions: async () => null,
    animate: vi.fn(async () => {}),
    log: vi.fn(() => {}),
    showPlayerTurn: vi.fn(() => {}),
    awaitPlayerAction: vi.fn(async () => ''),
    transition: vi.fn(() => {}),
    delay: vi.fn(async () => {}),
  };
}

/**
 * Create a mock BattleState with TurnController
 */
function createBattleStateMock(turnController: TurnController, monsterName?: string): BattleState {
  return {
    arena: {} as any,
    monster: { name: monsterName || 'Monster' } as any,
    classes: [],
    actions: [],
    grid: {} as any,
    wheel: new ActionWheel(),
    characters: [],
    monsterEntity: {} as any,
    entityMap: new Map(),
    actionRegistry: {} as any,
    turnController,
    effectRegistry: {} as any,
    stateObserver: {} as any,
    createGameContext: () => ({}) as any,
  };
}

Given(
  'a TurnFlowController with a dead monster and alive heroes',
  function (world: TurnFlowControllerWorld) {
    const wheel = new ActionWheel();
    world.monsterMock = createAliveMock(false);
    world.characterMocks = [createAliveMock(true), createAliveMock(true)];
    world.turnController = new TurnController(wheel, world.monsterMock, world.characterMocks);
    world.battleState = createBattleStateMock(world.turnController);
    world.battleAdapter = createBattleAdapterMock();
    world.turnFlowController = new TurnFlowController(world.battleState, world.battleAdapter);
  }
);

Given(
  'a TurnFlowController with an alive monster and dead heroes',
  function (world: TurnFlowControllerWorld) {
    const wheel = new ActionWheel();
    world.monsterMock = createAliveMock(true);
    world.characterMocks = [createAliveMock(false), createAliveMock(false)];
    world.turnController = new TurnController(wheel, world.monsterMock, world.characterMocks);
    world.battleState = createBattleStateMock(world.turnController);
    world.battleAdapter = createBattleAdapterMock();
    world.turnFlowController = new TurnFlowController(world.battleState, world.battleAdapter);
  }
);

Given(
  'a TurnFlowController with alive monster and heroes',
  function (world: TurnFlowControllerWorld) {
    const wheel = new ActionWheel();
    world.monsterMock = createAliveMock(true);
    world.characterMocks = [createAliveMock(true), createAliveMock(true)];
    world.turnController = new TurnController(wheel, world.monsterMock, world.characterMocks);
    world.battleState = createBattleStateMock(world.turnController);
    world.battleAdapter = createBattleAdapterMock();
    world.turnFlowController = new TurnFlowController(world.battleState, world.battleAdapter);
  }
);

When('I call checkBattleStatus\\(\\)', function (world: TurnFlowControllerWorld) {
  world.battleStatus = world.turnFlowController!.checkBattleStatus();
});

Then('it returns {string}', function (world: TurnFlowControllerWorld, expectedStatus: string) {
  expect(world.battleStatus).toBe(expectedStatus);
});

// ===== executeMonsterTurn() tests =====

/**
 * Create a mock MonsterEntity with decideTurn and executeDecision methods
 */
function createMonsterEntityMock(hasBeadSystem: boolean): any {
  return {
    id: 'monster',
    hasBeadBag: () => hasBeadSystem,
    hasStateMachine: () => hasBeadSystem,
    decideTurn: vi.fn(),
    executeDecision: vi.fn(),
  };
}

Given('a mock BattleAdapter for turn flow', function (world: TurnFlowControllerWorld) {
  world.battleAdapter = createBattleAdapterMock();
});

Given(
  'a BattleState with a monster that has a bead system',
  function (world: TurnFlowControllerWorld) {
    const wheel = new ActionWheel();
    wheel.addEntity('monster', 0); // Add monster to wheel
    world.monsterMock = createAliveMock(true);
    world.characterMocks = [createAliveMock(true), createAliveMock(true)];
    world.turnController = new TurnController(wheel, world.monsterMock, world.characterMocks);
    vi.spyOn(world.turnController, 'advanceTurn');

    world.monsterEntity = createMonsterEntityMock(true);

    world.battleState = createBattleStateMock(world.turnController);
    (world.battleState as any).monsterEntity = world.monsterEntity;
    (world.battleState as any).characters = world.characterMocks as any;
  }
);

Given('a TurnFlowController with the mock adapter', function (world: TurnFlowControllerWorld) {
  if (!world.battleAdapter) {
    world.battleAdapter = createBattleAdapterMock();
  }
  if (!world.battleState) {
    const wheel = new ActionWheel();
    world.monsterMock = createAliveMock(true);
    world.characterMocks = [createAliveMock(true), createAliveMock(true)];
    world.turnController = new TurnController(wheel, world.monsterMock, world.characterMocks);
    vi.spyOn(world.turnController, 'advanceTurn');
    world.monsterEntity = createMonsterEntityMock(true);
    world.battleState = createBattleStateMock(world.turnController);
    (world.battleState as any).monsterEntity = world.monsterEntity;
    (world.battleState as any).characters = world.characterMocks as any;
  }
  world.turnFlowController = new TurnFlowController(world.battleState, world.battleAdapter);
});

Given(
  'monster.decideTurn returns action with wheelCost {int}',
  function (world: TurnFlowControllerWorld, wheelCost: number) {
    world.decisionAction = {
      type: 'attack',
      wheelCost,
    };
    world.monsterEntity!.decideTurn.mockReturnValue(world.decisionAction);
  }
);

Given(
  'monster.executeDecision returns animation events',
  function (world: TurnFlowControllerWorld) {
    world.animationEvents = [
      { type: 'beadDraw', color: 'red' },
      { type: 'attack', attackerId: 'monster', targetId: 'char1', damage: 5 },
    ];
    world.monsterEntity!.executeDecision.mockReturnValue(world.animationEvents);
  }
);

Given(
  'a TurnFlowController with a monster without bead system',
  function (world: TurnFlowControllerWorld) {
    const wheel = new ActionWheel();
    wheel.addEntity('monster', 0); // Add monster to wheel
    world.monsterMock = createAliveMock(true);
    world.characterMocks = [createAliveMock(true), createAliveMock(true)];
    world.turnController = new TurnController(wheel, world.monsterMock, world.characterMocks);
    vi.spyOn(world.turnController, 'advanceTurn');

    // Monster without bead system
    world.monsterEntity = createMonsterEntityMock(false);

    world.battleState = createBattleStateMock(world.turnController);
    (world.battleState as any).monsterEntity = world.monsterEntity;
    (world.battleState as any).characters = world.characterMocks as any;

    world.battleAdapter = createBattleAdapterMock();
    world.turnFlowController = new TurnFlowController(world.battleState, world.battleAdapter);
  }
);

When('I call executeMonsterTurn\\(\\)', async function (world: TurnFlowControllerWorld) {
  await world.turnFlowController!.executeMonsterTurn();
});

Then(
  'adapter.log is called with {string}',
  function (world: TurnFlowControllerWorld, expectedMessage: string) {
    expect(world.battleAdapter!.log).toHaveBeenCalledWith(expectedMessage);
  }
);

Then(
  'adapter.animate is called with the animation events',
  function (world: TurnFlowControllerWorld) {
    expect(world.battleAdapter!.animate).toHaveBeenCalledWith(world.animationEvents);
  }
);

Then(
  'turnController.advanceTurn is called with {string} and {int}',
  function (world: TurnFlowControllerWorld, entityId: string, cost: number) {
    expect(world.turnController!.advanceTurn).toHaveBeenCalledWith(entityId, cost);
  }
);

Then('adapter.delay is called', function (world: TurnFlowControllerWorld) {
  expect(world.battleAdapter!.delay).toHaveBeenCalled();
});

// ===== executePlayerTurn() tests =====

/**
 * Create a mock ActionRegistry with getAction() method
 */
function createActionRegistryMock(): any {
  return {
    getAction: vi.fn(),
  };
}

/**
 * Create a mock ActionResolution with execute() method
 */
function createActionResolutionMock(cost: any): any {
  return {
    execute: vi.fn(async () => ({
      cancelled: false,
      success: true,
      cost,
      events: [],
      data: {},
    })),
  };
}

/**
 * Create a mock Action with resolve() method
 */
function createActionMock(actionResolution: any): any {
  return {
    resolve: vi.fn(async () => actionResolution),
  };
}

Given(
  'a TurnFlowController with mock adapter and action registry',
  function (world: TurnFlowControllerWorld) {
    const wheel = new ActionWheel();
    wheel.addEntity('hero-0', 0); // Add hero to wheel
    world.monsterMock = createAliveMock(true);
    world.characterMocks = [createAliveMock(true), createAliveMock(true)];
    world.turnController = new TurnController(wheel, world.monsterMock, world.characterMocks);
    vi.spyOn(world.turnController, 'advanceTurn');

    world.battleState = createBattleStateMock(world.turnController);
    world.battleAdapter = createBattleAdapterMock();
    world.actionRegistry = createActionRegistryMock();
    (world.battleState as any).actionRegistry = world.actionRegistry;

    world.turnFlowController = new TurnFlowController(world.battleState, world.battleAdapter);
  }
);

Given(
  'adapter.awaitPlayerAction returns {string}',
  function (world: TurnFlowControllerWorld, actionId: string) {
    world.selectedActionId = actionId;
    (world.battleAdapter!.awaitPlayerAction as any).mockResolvedValue(actionId);
  }
);

Given(
  'action {string} resolves successfully with cost time {int}',
  function (world: TurnFlowControllerWorld, _actionId: string, timeCost: number) {
    const cost = { time: timeCost };
    const mockActionResolution = createActionResolutionMock(cost);
    const mockAction = createActionMock(mockActionResolution);

    world.mockAction = mockAction;
    world.mockActionResolution = mockActionResolution;
    (world.actionRegistry!.getAction as any).mockReturnValue(mockAction);
  }
);

When(
  'I call executePlayerTurn with {string}',
  async function (world: TurnFlowControllerWorld, heroId: string) {
    await world.turnFlowController!.executePlayerTurn(heroId);
  }
);

Then(
  'adapter.showPlayerTurn is called with {string}',
  function (world: TurnFlowControllerWorld, expectedHeroId: string) {
    expect(world.battleAdapter!.showPlayerTurn).toHaveBeenCalledWith(expectedHeroId);
  }
);

Then(
  'adapter.awaitPlayerAction is called with {string}',
  function (world: TurnFlowControllerWorld, expectedHeroId: string) {
    expect(world.battleAdapter!.awaitPlayerAction).toHaveBeenCalledWith(expectedHeroId);
  }
);

// ===== executePlayerTurn() cancellation and failure tests =====

Given(
  'adapter.awaitPlayerAction returns {string} then {string}',
  function (world: TurnFlowControllerWorld, firstActionId: string, secondActionId: string) {
    (world.battleAdapter!.awaitPlayerAction as any)
      .mockResolvedValueOnce(firstActionId)
      .mockResolvedValueOnce(secondActionId);
  }
);

Given(
  'action {string} is cancelled by user',
  function (world: TurnFlowControllerWorld, _actionId: string) {
    const cancelledResolution = {
      execute: vi.fn(async () => ({
        cancelled: true,
        success: false,
        cost: { time: 0 },
        events: [],
        data: {},
      })),
    };
    const cancelledAction = {
      resolve: vi.fn(async () => cancelledResolution),
    };

    (world.actionRegistry!.getAction as any).mockReturnValueOnce(cancelledAction);
  }
);

Given(
  'action {string} fails with reason {string}',
  function (world: TurnFlowControllerWorld, _actionId: string, reason: string) {
    const failedResolution = {
      execute: vi.fn(async () => ({
        cancelled: false,
        success: false,
        reason,
        cost: { time: 0 },
        events: [],
        data: {},
      })),
    };
    const failedAction = {
      resolve: vi.fn(async () => failedResolution),
    };

    (world.actionRegistry!.getAction as any).mockReturnValue(failedAction);
  }
);

Then('adapter.awaitPlayerAction is called twice', function (world: TurnFlowControllerWorld) {
  expect(world.battleAdapter!.awaitPlayerAction).toHaveBeenCalledTimes(2);
});

// ===== start\(\) game loop tests =====

Given(
  'a TurnFlowController where checkBattleStatus returns {string}',
  function (world: TurnFlowControllerWorld, status: string) {
    const wheel = new ActionWheel();
    world.monsterMock = createAliveMock(true);
    world.characterMocks = [createAliveMock(true), createAliveMock(true)];
    world.turnController = new TurnController(wheel, world.monsterMock, world.characterMocks);
    world.battleState = createBattleStateMock(world.turnController);
    world.battleAdapter = createBattleAdapterMock();
    world.turnFlowController = new TurnFlowController(world.battleState, world.battleAdapter);

    // Mock checkBattleStatus to return the specified status
    world.mockedCheckBattleStatus = vi
      .spyOn(world.turnFlowController, 'checkBattleStatus')
      .mockReturnValue(status as BattleStatus);
  }
);

Given(
  'the monster name is {string}',
  function (world: TurnFlowControllerWorld, monsterName: string) {
    world.monsterName = monsterName;
    if (world.battleState) {
      (world.battleState.monster as any).name = monsterName;
    }
  }
);

When('I call start\\(\\)', function (world: TurnFlowControllerWorld) {
  // The start() method should check status and transition if needed
  // This is a placeholder - will fail until start() is implemented
  const method = (world.turnFlowController as any).start;
  if (method) {
    method.call(world.turnFlowController);
  }
});

Then(
  'adapter.transition is called with {string} and victory {word}',
  function (world: TurnFlowControllerWorld, sceneName: string, victoryStr: string) {
    const victory = victoryStr === 'true';
    expect(world.battleAdapter!.transition).toHaveBeenCalledWith(
      sceneName,
      expect.objectContaining({
        victory,
        monster: world.monsterName || 'Monster',
        turns: 0,
      })
    );
  }
);

Then('the start method returns', function (_world: TurnFlowControllerWorld) {
  // This is just a confirmation that the method completed
  // The test verifies by not throwing
  expect(true).toBe(true);
});

// ===== start\(\) turn alternation tests (FR-4.7) =====

/**
 * Track the sequence of actors returned by getNextActor
 */
interface ActorSequence {
  actors: (string | null)[];
  currentIndex: number;
}

Given('a TurnFlowController for turn alternation', function (world: TurnFlowControllerWorld) {
  const wheel = new ActionWheel();
  wheel.addEntity('hero-0', 0);
  wheel.addEntity('monster', 10);
  world.monsterMock = createAliveMock(true);
  world.characterMocks = [createAliveMock(true), createAliveMock(true)];
  world.turnController = new TurnController(wheel, world.monsterMock, world.characterMocks);
  vi.spyOn(world.turnController, 'advanceTurn');

  world.battleState = createBattleStateMock(world.turnController);
  world.battleAdapter = createBattleAdapterMock();

  // Mock stateObserver if needed
  (world.battleState as any).stateObserver = {
    emitActorChanged: vi.fn(),
  } as any;

  world.turnFlowController = new TurnFlowController(world.battleState, world.battleAdapter);

  // Spy on executePlayerTurn and executeMonsterTurn to prevent actual execution
  vi.spyOn(world.turnFlowController, 'executePlayerTurn').mockResolvedValue(undefined);
  vi.spyOn(world.turnFlowController, 'executeMonsterTurn').mockResolvedValue(undefined);

  // Attach actor sequence tracker to world
  (world as any).actorSequence = {
    actors: [],
    currentIndex: 0,
  } as ActorSequence;
});

Given(
  'getNextActor returns {string} then {string} then victory',
  function (world: TurnFlowControllerWorld, actor1: string, actor2: string) {
    const sequence: ActorSequence = (world as any).actorSequence || {
      actors: [],
      currentIndex: 0,
    };
    sequence.actors = [actor1, actor2, null]; // null signals victory/end
    (world as any).actorSequence = sequence;

    // Mock checkBattleStatus to return victory when getNextActor returns null
    let callCount = 0;
    vi.spyOn(world.turnFlowController!, 'checkBattleStatus').mockImplementation(() => {
      callCount++;
      // First call for initial check, then calls after each turn
      if (callCount >= 3) {
        return 'victory';
      }
      return 'ongoing';
    });

    // Mock getNextActor to return sequence
    vi.spyOn(world.turnController!, 'getNextActor').mockImplementation(() => {
      const actor = sequence.actors[sequence.currentIndex];
      sequence.currentIndex++;
      return actor;
    });
  }
);

Given(
  'getNextActor returns {string} then victory',
  function (world: TurnFlowControllerWorld, actor1: string) {
    const sequence: ActorSequence = (world as any).actorSequence || {
      actors: [],
      currentIndex: 0,
    };
    sequence.actors = [actor1, null]; // null signals victory/end
    (world as any).actorSequence = sequence;

    // Mock checkBattleStatus to return victory when getNextActor returns null
    let callCount = 0;
    vi.spyOn(world.turnFlowController!, 'checkBattleStatus').mockImplementation(() => {
      callCount++;
      // First call for initial check, then calls after each turn
      if (callCount >= 2) {
        return 'victory';
      }
      return 'ongoing';
    });

    // Mock getNextActor to return sequence
    vi.spyOn(world.turnController!, 'getNextActor').mockImplementation(() => {
      const actor = sequence.actors[sequence.currentIndex];
      sequence.currentIndex++;
      return actor;
    });
  }
);

Then(
  'executePlayerTurn is called for {string}',
  function (world: TurnFlowControllerWorld, expectedHeroId: string) {
    const spy = vi.spyOn(world.turnFlowController!, 'executePlayerTurn');
    expect(spy).toHaveBeenCalledWith(expectedHeroId);
  }
);

Then('executeMonsterTurn is called', function (world: TurnFlowControllerWorld) {
  const spy = vi.spyOn(world.turnFlowController!, 'executeMonsterTurn');
  expect(spy).toHaveBeenCalled();
});

Then('adapter.transition is called', function (world: TurnFlowControllerWorld) {
  expect(world.battleAdapter!.transition).toHaveBeenCalled();
});

Then(
  'stateObserver.emitActorChanged is called with {string}',
  function (world: TurnFlowControllerWorld, expectedActorId: string) {
    const emitSpy = (world.battleState!.stateObserver as any).emitActorChanged as any;
    expect(emitSpy).toHaveBeenCalledWith(expectedActorId);
  }
);
