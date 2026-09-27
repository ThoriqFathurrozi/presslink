export class Scanner {
    constructor({ onScan, delay = 150, logger }) {
        this.onScan = onScan;
        this.delay = delay;
        this.logger = logger;
        this.timer = null;
        this.running = false;
        this.pending = false;
        this.destroyed = false;
    }

    schedule() {
        if (this.destroyed) {
            return;
        }

        if (this.running) {
            this.pending = true;
            return;
        }

        // Keep the first deadline so busy pages cannot postpone scans forever.
        if (this.timer !== null) {
            return;
        }

        this.timer = setTimeout(() => {
            this.timer = null;
            void this.runNow();
        }, this.delay);
    }

    async runNow() {
        if (this.destroyed) {
            return;
        }

        if (this.running) {
            this.pending = true;
            return;
        }

        clearTimeout(this.timer);
        this.timer = null;
        this.running = true;
        this.pending = false;

        try {
            await this.onScan();
        } catch (error) {
            this.logger?.warn('Scan failed', error);
        } finally {
            this.running = false;

            if (this.pending && !this.destroyed) {
                this.pending = false;
                this.schedule();
            }
        }
    }

    destroy() {
        this.destroyed = true;
        this.pending = false;
        clearTimeout(this.timer);
        this.timer = null;
    }
}

export default Scanner;
