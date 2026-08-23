import { useState, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDataWorker } from "../hooks/useDataWorker";

export function DataTable() {
    const { loadData, getRows } = useDataWorker();
    const [totalRows, setTotalRows] = useState(0);
    const [visibleData, setVisibleData] = useState<Record<number, number>>({});
    
    const parentRef = useRef<HTMLDivElement>(null);

    // 1. Initialize dataset in the Worker on mount
    useEffect(() => {
        const init = async () => {
            const response = await loadData();
            if (response?.type === "DATA_LOADED" && response.payload) {
                setTotalRows(response.payload.totalCount);
            }
        };
        init();
    }, [loadData]);

    // 2. Set up TanStack Virtual
    const rowVirtualizer = useVirtualizer({
        count: totalRows,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 35, // 35px row height
        overscan: 10, // Fetch 10 extra rows above/below for smooth scrolling
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    // 3. Fetch missing rows from the Worker as the user scrolls
    useEffect(() => {
        if (virtualItems.length === 0) return;

        const startIndex = virtualItems[0].index;
        const endIndex = virtualItems[virtualItems.length - 1].index + 1;

        // Check if we already have this exact chunk in state (simplified check)
        if (visibleData[startIndex] === undefined) {
            getRows(startIndex, endIndex).then(response => {
                if (response?.type === "ROWS_RESULT" && response.payload) {
                    const chunk = response.payload.rows;
                    
                    // Map the array chunk back into our React state via indices
                    setVisibleData(prev => {
                        const next = { ...prev };
                        for (let i = 0; i < chunk.length; i++) {
                            next[startIndex + i] = chunk[i];
                        }
                        return next;
                    });
                }
            });
        }
    }, [virtualItems, getRows, visibleData]);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>WebWorker + WASM DataTable</h2>
            <p style={{ marginBottom: '12px' }}>
                Status: {totalRows > 0 ? `✅ Loaded ${totalRows.toLocaleString()} rows` : "⏳ Loading dataset..."}
            </p>

            <div 
                ref={parentRef} 
                style={{ 
                    height: '500px', 
                    width: '100%', 
                    overflow: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    textAlign: 'left'
                }}
            >
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
                    {virtualItems.map((virtualRow) => (
                        <div
                            key={virtualRow.index}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                                padding: '6px 12px',
                                borderBottom: '1px solid #eee',
                                boxSizing: 'border-box',
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: virtualRow.index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                                color: '#333'
                            }}
                        >
                            <strong style={{ width: '120px' }}>Row {virtualRow.index}:</strong>
                            <span>Value = {visibleData[virtualRow.index] !== undefined ? visibleData[virtualRow.index] : "Loading..."}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}