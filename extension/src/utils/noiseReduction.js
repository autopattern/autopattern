// Noise Reduction & Prefiltering Module
// Implements section 2.6 of the roadmap

class NoiseReducer {
    constructor() {
        this.lastEvent = null;
        this.eventBuffer = [];
        this.bufferTimeout = null;
        this.BUFFER_DELAY = 100; // ms
        this.SCROLL_THRESHOLD = 50; // pixels
        this.MOUSE_MOVE_THRESHOLD = 20; // pixels
        this.INSIGNIFICANT_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT']);
    }

    // Check if element is insignificant
    isInsignificantElement(element) {
        if (!element) return true;
        const tagName = typeof element === 'string' ? element : element.tagName;
        if (!tagName) return true;
        return this.INSIGNIFICANT_TAGS.has(tagName);
    }

    // Check if two events are similar enough to combine
    areSimilarEvents(event1, event2) {
        if (!event1 || !event2) return false;
        if (event1.event !== event2.event) return false;

        const timeDiff = Math.abs(event2.timestamp - event1.timestamp);
        
        // Combine events within 100ms
        if (timeDiff > 100) return false;

        switch (event1.event) {
            case 'scroll':
                return Math.abs((event1.data?.scrollY || 0) - (event2.data?.scrollY || 0)) < this.SCROLL_THRESHOLD;
            
            case 'mouse_move':
                const dx = Math.abs((event1.data?.x || 0) - (event2.data?.x || 0));
                const dy = Math.abs((event1.data?.y || 0) - (event2.data?.y || 0));
                return dx < this.MOUSE_MOVE_THRESHOLD && dy < this.MOUSE_MOVE_THRESHOLD;
            
            case 'input':
                // Combine rapid typing on same field
                return event1.data?.field_name === event2.data?.field_name;
            
            default:
                return false;
        }
    }

    // Check if event should be filtered out
    shouldFilterEvent(event) {
        // Filter out events on insignificant elements
        if (event.data?.tag && this.isInsignificantElement(event.data.tag)) {
            return true;
        }

        // Filter excessive scroll events
        if (event.event === 'scroll') {
            if (this.lastEvent?.event === 'scroll') {
                const scrollDiff = Math.abs((event.data?.scrollY || 0) - (this.lastEvent.data?.scrollY || 0));
                if (scrollDiff < this.SCROLL_THRESHOLD) {
                    return true;
                }
            }
        }

        // Filter heartbeat events when page is inactive
        if (event.event === 'heartbeat' && document.hidden) {
            return true;
        }

        // Filter focus/blur on insignificant elements
        if ((event.event === 'focus' || event.event === 'blur') && 
            this.isInsignificantElement(event.data?.tag)) {
            return true;
        }

        // Filter visibility changes that are too frequent
        if (event.event === 'visibility_change') {
            if (this.lastEvent?.event === 'visibility_change') {
                const timeDiff = event.timestamp - this.lastEvent.timestamp;
                if (timeDiff < 1000) { // Less than 1 second
                    return true;
                }
            }
        }

        return false;
    }

    // Combine consecutive similar events
    combineEvents(events) {
        if (events.length <= 1) return events;

        const combined = [events[0]];
        
        for (let i = 1; i < events.length; i++) {
            const current = events[i];
            const last = combined[combined.length - 1];

            if (this.areSimilarEvents(last, current)) {
                // Update the last event with latest data
                last.timestamp = current.timestamp;
                last.data = { ...last.data, ...current.data };
                
                // Track combination count
                last.combinedCount = (last.combinedCount || 1) + 1;
            } else {
                combined.push(current);
            }
        }

        return combined;
    }

    // Main filter function
    filterEvent(event) {
        // First check if event should be filtered out completely
        if (this.shouldFilterEvent(event)) {
            return null;
        }

        // Add to buffer for batching
        this.eventBuffer.push(event);

        // Clear existing timeout
        if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
        }

        // Set new timeout to process buffer
        return new Promise((resolve) => {
            this.bufferTimeout = setTimeout(() => {
                const combined = this.combineEvents(this.eventBuffer);
                this.eventBuffer = [];
                
                // Update last event
                if (combined.length > 0) {
                    this.lastEvent = combined[combined.length - 1];
                }
                
                resolve(combined);
            }, this.BUFFER_DELAY);
        });
    }

    // Process single event synchronously
    processEvent(event) {
        if (this.shouldFilterEvent(event)) {
            return null;
        }

        this.lastEvent = event;
        return event;
    }

    // Get statistics about filtering
    getStats() {
        return {
            lastEvent: this.lastEvent?.event || 'none',
            bufferSize: this.eventBuffer.length,
            timestamp: Date.now()
        };
    }
}

// Export for use in content script
if (typeof window !== 'undefined') {
    window.NoiseReducer = NoiseReducer;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoiseReducer;
}
