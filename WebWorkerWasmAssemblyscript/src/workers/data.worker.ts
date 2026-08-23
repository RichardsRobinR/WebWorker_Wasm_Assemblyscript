import wasmUrl from "../wasm/debug.wasm?url";
import type * as WasmModule from "../wasm/debug";

let largeDataset: Float64Array | null = null;
let wasm: typeof WasmModule;

// Initialize WASM inside the worker reliably
const wasmReady = (async () => {
    try {
        const response = await fetch(wasmUrl);
        const buffer = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(buffer, {
            env: {
                abort: () => {},
                "console.log": () => {},
            }
        });
        
        wasm = instance.exports as unknown as typeof WasmModule;
    } catch (err) {
        console.error("Worker WASM Load Error:", err);
    }
})();

self.addEventListener("message", async (event: MessageEvent) => {
    await wasmReady;
    const { id, type, payload } = event.data;

    try {
        if (type === "LOAD_DATA") {
            const rowCount = 3_000_000; // 3 million rows
            largeDataset = new Float64Array(rowCount);
            
            for (let i = 0; i < rowCount; i++) {
                largeDataset[i] = wasm.add(i, i);
            }

            self.postMessage({ 
                id, 
                type: "DATA_LOADED", 
                payload: { totalCount: largeDataset.length } 
            });
        }

        if (type === "GET_ROWS") {
            if (!largeDataset) throw new Error("Data not loaded yet");

            const { start, end } = payload;
            const view = largeDataset.slice(start, end);
            
            self.postMessage({ 
                id, 
                type: "ROWS_RESULT", 
                payload: { rows: view } 
            }, { transfer: [view.buffer] }); 
        }

    } catch (error) {
        self.postMessage({ id, error: String(error) });
    }
});