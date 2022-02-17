import { MultiBar, SingleBar } from "cli-progress";

const fakeBar = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setTotal: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  update: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  increment: () => {},
} as unknown as SingleBar;

export class ProgressBar {
  _multibar?: MultiBar;
  constructor(public format: string, public show?: boolean) {}
  get multibar() {
    return (
      this._multibar ||
      (this._multibar = new MultiBar({
        format: this.format,
      }))
    );
  }
  create(...args: Parameters<InstanceType<typeof MultiBar>["create"]>) {
    if (!this.show) return fakeBar;
    return this.multibar.create(...args);
  }
  remove(...args: Parameters<InstanceType<typeof MultiBar>["remove"]>) {
    if (!this.show) return true;
    return this.multibar.remove(...args);
  }
  stop(...args: Parameters<InstanceType<typeof MultiBar>["stop"]>) {
    if (!this.show) return;
    return this.multibar.stop(...args);
  }
}
