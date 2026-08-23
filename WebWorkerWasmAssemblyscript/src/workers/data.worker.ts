import { add } from "../wasm/debug.js";

let largeDataset: Float64Array | null = null;

self.onmessage = async (event: MessageEvent) => {
    const { id, type, payload } = event.data;

    try {
        if (type === "LOAD_DATA") {
            // In reality, you would fetch() from your ASP.NET backend here
            // For now, we simulate loading 3 million rows
            const rowCount = 3_000_000;
            largeDataset = new Float64Array(rowCount);
            
            for (let i = 0; i < rowCount; i++) {
                largeDataset[i] = add(i, i); // Mock data
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
            
            // Slice out just the 50-100 rows React needs right now
            const view = largeDataset.slice(start, end);
            
            // Send back the small chunk (Transferable for maximum speed)
            self.postMessage({ 
                id, 
                type: "ROWS_RESULT", 
                payload: { rows: view } 
            }, { transfer: [view.buffer] }); 
        }

    } catch (error) {
        self.postMessage({ id, error: String(error) });
    }
};