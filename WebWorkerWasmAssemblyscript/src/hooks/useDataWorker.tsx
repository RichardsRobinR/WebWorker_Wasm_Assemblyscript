import { useEffect, useRef, useCallback } from "react";

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

export function useDataWorker() {
    const workerRef = useRef<Worker | null>(null);
    const callbacksRef = useRef<Map<string, WorkerCallback>>(new Map());

    useEffect(() => {
        const worker = new Worker(
            new URL("../workers/data.worker.ts", import.meta.url),
            { type: "module" }
        );

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { id, type, payload, error } = event.data;
            
            // Resolve the specific promise that requested this data
            if (id) {
                const resolveCallback = callbacksRef.current.get(id);
                if (resolveCallback) {
                    resolveCallback({ type, payload, error });
                    callbacksRef.current.delete(id);
                }
            }
        };

        workerRef.current = worker;

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    // Helper to send a message and wait for its specific reply
    const sendMessage = useCallback(<T = unknown>(type: string, payload?: unknown): Promise<WorkerResponse<T> | null> => {
        return new Promise<WorkerResponse<T> | null>((resolve) => { 
            if (!workerRef.current) return resolve(null);

            const id = crypto.randomUUID(); // Unique ID for this request
            callbacksRef.current.set(id, resolve as WorkerCallback);
            
            workerRef.current.postMessage({ id, type, payload });
        });
    }, []);

    return {
        loadData: () => sendMessage<LoadDataPayload>("LOAD_DATA"),
        getRows: (start: number, end: number) => 
            sendMessage<RowsResultPayload>("GET_ROWS", { start, end }),
        getAggregations: () => sendMessage("GET_AGGREGATIONS")
    };
}