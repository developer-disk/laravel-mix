let chokidar = require('chokidar');
let File = require('../File');
let FileCollection = require('../FileCollection');
let NOOP = () => {};

/**
 * @template {object} TData
 */
class Task {
    /**
     * Create a new task instance.
     *
     * @param {TData} data
     */
    constructor(data) {
        /** @type {TData} */
        this.data = data;

        /** @type {File[]} */
        this.assets = [];

        /** @type {FileCollection} */
        this.files = new FileCollection();

        this.isBeingWatched = false;
    }

    /**
     * Watch all relevant files for changes.
     *
     * @param {boolean} usePolling
     * @param {(task: Task<TData>) => void|Promise<void>} onFileChange Will be called on every file that changes
     */
    watch(usePolling = false, onFileChange = NOOP) {
        if (this.isBeingWatched) return;

        let files = this.files.get();
        let watcher = chokidar
            .watch(files, { usePolling, persistent: true })
            .on('change', async file => {
                await Promise.resolve(this.onChange(file));
                onFileChange(this);
            });

        // Workaround for issue with atomic writes.
        // See https://github.com/paulmillr/chokidar/issues/591
        if (!usePolling) {
            watcher.on('raw', event => {
                if (event === 'rename') {
                    watcher.unwatch(files);
                    watcher.add(files);
                }
            });
        }

        this.isBeingWatched = true;
    }

    /**
     */
    run() {
        throw new Error('Task.run is an abstract method. Please override it.');
    }

    /**
     *
     * @param {string} filepath
     */
    onChange(filepath) {
        throw new Error('Task.onChange is an abstract method. Please override it.');
    }
}

module.exports = Task;
