import { useCallback } from "react";

export interface WorkerResponse<T = unknown> {
    id?: string;
    type?: string;
    payload?: T;
    error?: string;
}

export interface LoadDataPayload {
    totalCount: number;
}

export interface RowsResultPayload {
    rows: Float64Array;
}

type WorkerCallback = (response: WorkerResponse<unknown>) => void;

// ⚡ Singleton Preloaded Worker and Callback Registry
let workerInstance: Worker | null = null;
const callbacks = new Map<string, WorkerCallback>();

// Preload & singleton getter
export function getPreloadedWorker(): Worker {
    if (!workerInstance) {
        workerInstance = new Worker(
            new URL("../workers/data.worker.ts", import.meta.url),
            { type: "module" }
        );

        workerInstance.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { id, type, payload, error } = event.data;
            if (id) {
                const resolveCallback = callbacks.get(id);
                if (resolveCallback) {
                    resolveCallback({ type, payload, error });
                    callbacks.delete(id);
                }
            }
        };

        workerInstance.onerror = (error) => {
            console.error("Preloaded Worker Error:", error);
        };
    }
    return workerInstance;
}

// ⚡ Preload function called at app launch
export const preloadWorker = (): void => {
    getPreloadedWorker();
};

// Generic request-response message helper
export function sendWorkerMessage<T = unknown>(
    type: string, 
    payload?: unknown
): Promise<WorkerResponse<T> | null> {
    return new Promise<WorkerResponse<T> | null>((resolve) => {
        const worker = getPreloadedWorker();
        const id = crypto.randomUUID();
        callbacks.set(id, resolve as WorkerCallback);
        worker.postMessage({ id, type, payload });
    });
}

// React Hook wrapping the preloaded worker service
export function useDataWorker() {
    const loadData = useCallback(() => sendWorkerMessage<LoadDataPayload>("LOAD_DATA"), []);
    const getRows = useCallback((start: number, end: number) => 
        sendWorkerMessage<RowsResultPayload>("GET_ROWS", { start, end }), []);
    const getAggregations = useCallback(() => sendWorkerMessage("GET_AGGREGATIONS"), []);

    return {
        loadData,
        getRows,
        getAggregations
    };
}