/**
 * Shared mock Phaser scene for testing UI components
 */
export function createMockScene(): any {
  return {
    add: {
      container: (x: number, y: number) => {
        const container = {
          x,
          y,
          visible: false,
          depth: 0,
          children: [] as any[],
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
          destroy: (_removeFromDisplay?: boolean) => {
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
          interactiveOptions: undefined as any,
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
          destroy: function (_removeFromDisplay?: boolean) {
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
          setText: function (newText: string) {
            this.text = newText;
            return this;
          },
          visible: true,
          depth: 0,
          alpha: 1,
          setVisible: function (visible: boolean) {
            this.visible = visible;
            return this;
          },
          setDepth: function (depth: number) {
            this.depth = depth;
            return this;
          },
          setAlpha: function (alpha: number) {
            this.alpha = alpha;
            return this;
          },
          setPosition: function (newX: number, newY: number) {
            this.x = newX;
            this.y = newY;
            return this;
          },
          setScale: function () {
            return this;
          },
          setInteractive: function () {
            return this;
          },
          disableInteractive: function () {
            return this;
          },
          on: function () {
            return this;
          },
          off: function () {
            return this;
          },
          destroy: function (_removeFromDisplay?: boolean) {
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
