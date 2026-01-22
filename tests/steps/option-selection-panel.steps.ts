import { Given, When, Then } from 'quickpickle';
import { expect, vi } from 'vitest';
import type { QuickPickleWorld } from 'quickpickle';
import type { OptionChoice } from '@src/types/ParameterPrompt';
import type { BeadCounts } from '@src/types/Beads';
import { OptionSelectionPanel } from '@src/ui/OptionSelectionPanel';

interface OptionSelectionPanelWorld extends QuickPickleWorld {
  mockScene?: any;
  mockButtonClick?: Map<string, () => void>;
  panel?: OptionSelectionPanel;
  options?: OptionChoice[];
  multiSelect?: boolean;
  availableBeads?: BeadCounts;
  confirmCallback?: (selectedIds: string[]) => void;
  cancelCallback?: () => void;
  confirmCallbackFired?: boolean;
  confirmCallbackArgs?: string[];
  cancelCallbackFired?: boolean;
}

/**
 * Helper to create a mock Phaser scene for testing
 */
function createMockScene(): any {
  const eventListeners = new Map<string, any>();

  return {
    add: {
      container: (x: number, y: number) => {
        const container = {
          x,
          y,
          visible: false,
          depth: 0,
          children: [],
          setVisible: (visible: boolean) => {
            container.visible = visible;
            return container;
          },
          setDepth: (depth: number) => {
            container.depth = depth;
            return container;
          },
          setPosition: (x: number, y: number) => {
            container.x = x;
            container.y = y;
            return container;
          },
          add: (children: any) => {
            const childArray = Array.isArray(children) ? children : [children];
            container.children.push(...childArray);
            return container;
          },
          removeAll: (destroyChildren: boolean) => {
            if (destroyChildren) {
              container.children.forEach((child: any) => {
                if (child.destroy) child.destroy(true);
              });
            }
            container.children = [];
            return container;
          },
          destroy: (removeFromDisplay?: boolean) => {
            container.children = [];
          },
        };
        return container;
      },
      rectangle: (x: number, y: number, width: number, height: number, color: number) => {
        const rect = {
          x,
          y,
          width,
          height,
          color,
          fillStyle: color,
          strokeStyle: { width: 0, color: 0 },
          interactive: false,
          listeners: {} as Record<string, () => void>,
          setStrokeStyle: function (width: number, color: number) {
            this.strokeStyle = { width, color };
            return this;
          },
          setInteractive: function (options?: any) {
            this.interactive = true;
            this.interactiveOptions = options;
            return this;
          },
          disableInteractive: function () {
            this.interactive = false;
            return this;
          },
          on: function (event: string, callback: () => void) {
            this.listeners[event] = callback;
            return this;
          },
          setFillStyle: function (color: number) {
            this.fillStyle = color;
            return this;
          },
          destroy: function (removeFromDisplay?: boolean) {
            // no-op
          },
        };
        return rect;
      },
      text: (x: number, y: number, text: string, config?: any) => {
        return {
          x,
          y,
          text,
          config,
          origin: { x: 0, y: 0 },
          color: config?.color || '#ffffff',
          setOrigin: function (x: number, y?: number) {
            this.origin = { x, y: y ?? x };
            return this;
          },
          setColor: function (color: string) {
            this.color = color;
            return this;
          },
          destroy: function (removeFromDisplay?: boolean) {
            // no-op
          },
        };
      },
    },
    cameras: {
      main: {
        width: 800,
        height: 600,
      },
    },
  };
}

// Step: Create panel with multiSelect false
Given(
  'an option selection prompt with multiSelect false',
  function (world: OptionSelectionPanelWorld) {
    world.mockScene = createMockScene();
    world.panel = new OptionSelectionPanel(world.mockScene);
    world.multiSelect = false;
    world.options = [];
    world.mockButtonClick = new Map();
    world.confirmCallbackFired = false;
    world.confirmCallbackArgs = [];
    world.cancelCallbackFired = false;
  }
);

// Step: Create panel with multiSelect true
Given(
  'an option selection prompt with multiSelect true',
  function (world: OptionSelectionPanelWorld) {
    world.mockScene = createMockScene();
    world.panel = new OptionSelectionPanel(world.mockScene);
    world.multiSelect = true;
    world.options = [];
    world.mockButtonClick = new Map();
    world.confirmCallbackFired = false;
    world.confirmCallbackArgs = [];
    world.cancelCallbackFired = false;
  }
);

// Step: Add an option that is affordable
Given(
  'option {string} exists and is affordable',
  function (world: OptionSelectionPanelWorld, optionId: string) {
    if (!world.options) world.options = [];
    if (!world.availableBeads) {
      world.availableBeads = { red: 10, blue: 10, green: 10, white: 10 };
    }

    world.options.push({
      id: optionId,
      label: optionId.charAt(0).toUpperCase() + optionId.slice(1),
      cost: { red: 1 }, // Affordable cost
    });
  }
);

// Step: Click an option (simulating user click)
When('I click option {string}', function (world: OptionSelectionPanelWorld, optionId: string) {
  expect(world.panel).toBeDefined();
  expect(world.options).toBeDefined();
  expect(world.multiSelect !== undefined).toBe(true);

  world.confirmCallback = (selectedIds: string[]) => {
    world.confirmCallbackFired = true;
    world.confirmCallbackArgs = selectedIds;
  };

  world.cancelCallback = () => {
    world.cancelCallbackFired = true;
  };

  // Show the panel
  world.panel!.show({
    prompt: 'Select an option',
    options: world.options!,
    multiSelect: world.multiSelect!,
    availableBeads: world.availableBeads || { red: 10, blue: 10, green: 10, white: 10 },
    availableTime: 0,
    onConfirm: world.confirmCallback,
    onCancel: world.cancelCallback,
  });

  // Simulate clicking the option by accessing the internal method
  // This tests the actual behavior of the Panel when a button is clicked
  const panel = world.panel as any;
  panel.onOptionClicked(optionId);
});

// Step: Verify confirm callback was called with pass selected
Then(
  'onConfirm should be called with pass selected',
  function (world: OptionSelectionPanelWorld) {
    expect(world.confirmCallbackFired, 'onConfirm should have been called').toBe(true);
    expect(world.confirmCallbackArgs).toEqual(['pass']);
  }
);
