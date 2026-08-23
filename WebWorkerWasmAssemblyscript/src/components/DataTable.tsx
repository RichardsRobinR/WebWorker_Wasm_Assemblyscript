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
        <div 
            ref={parentRef} 
            style={{ height: '600px', width: '100%', overflow: 'auto' }}
        >
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
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
                        }}
                    >
                        Row {virtualRow.index}: Data = {visibleData[virtualRow.index] ?? "Loading..."}
                    </div>
                ))}
            </div>
        </div>
    );
}