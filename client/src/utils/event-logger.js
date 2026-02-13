/**
 * Secure Test Environment - Event Logger
 *
 * Provides comprehensive event logging with:
 * - Unified event schema
 * - Batch processing for efficient transmission
 * - Local persistence using IndexedDB
 * - Immutable log storage post-submission
 */

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    .toString()
    .replace(/\/$/, "");

const LOG_ENDPOINT = `${BACKEND_URL}/api/test-events`;
const SEAL_ENDPOINT = (attemptId) => `${BACKEND_URL}/api/logs/attempt/${attemptId}/seal`;

class EventLogger {
    constructor() {
        this.attemptId = this.generateAttemptId();
        this.eventQueue = [];
        this.batchSize = 10;
        this.batchInterval = 5000; // 5 seconds
        this.isSubmitted = false;
        this.dbName = "SecureTestDB";
        this.storeName = "eventLogs";
        this.db = null;

        this.initializeDB();
        this.startBatchProcessor();
        this.captureMetadata();
        this.setupVisibilityTracking();
    }

    /**
     * Generate unique attempt ID for this session
     */
    generateAttemptId() {
        return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initialize IndexedDB for persistent storage
     */
    async initializeDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.error("Failed to open IndexedDB:", request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log("IndexedDB initialized successfully");
                this.loadPersistedLogs();
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    objectStore.createIndex("attemptId", "attemptId", { unique: false });
                    objectStore.createIndex("timestamp", "timestamp", { unique: false });
                    objectStore.createIndex("eventType", "eventType", { unique: false });
                }
            };
        });
    }

    /**
     * Load persisted logs from IndexedDB on initialization
     */
    async loadPersistedLogs() {
        if (!this.db) return;

        const transaction = this.db.transaction([this.storeName], "readonly");
        const objectStore = transaction.objectStore(this.storeName);
        const index = objectStore.index("attemptId");
        const request = index.getAll(this.attemptId);

        request.onsuccess = () => {
            const persistedLogs = request.result;
            console.log(`Loaded ${persistedLogs.length} persisted logs`);
        };
    }

    /**
     * Capture browser and device metadata
     */
    captureMetadata() {
        this.metadata = {
            browser: this.getBrowserInfo(),
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookiesEnabled: navigator.cookieEnabled,
        };
    }

    /**
     * Detect browser information
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = "Unknown";

        if (ua.indexOf("Chrome") > -1 && ua.indexOf("Edg") === -1) browser = "Chrome";
        else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) browser = "Safari";
        else if (ua.indexOf("Firefox") > -1) browser = "Firefox";
        else if (ua.indexOf("Edg") > -1) browser = "Edge";
        else if (ua.indexOf("MSIE") > -1 || ua.indexOf("Trident") > -1) browser = "IE";

        return browser;
    }

    /**
     * Track tab visibility and focus changes
     */
    setupVisibilityTracking() {
        document.addEventListener("visibilitychange", () => {
            this.logEvent("tab_visibility_change", {
                visible: !document.hidden,
            });
        });

        window.addEventListener("focus", () => {
            this.logEvent("window_focus", {
                focusState: true,
            });
        });

        window.addEventListener("blur", () => {
            this.logEvent("window_blur", {
                focusState: false,
            });
        });
    }

    /**
     * Create a stable unique event id for dedupe on retries
     */
    generateEventId() {
        // crypto.randomUUID is supported in modern browsers
        if (crypto?.randomUUID) return crypto.randomUUID();
        // fallback
        return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    /**
     * Log an event with unified schema
     */
    logEvent(eventType, additionalData = {}, questionId = null) {
        if (this.isSubmitted) {
            console.warn("Cannot log events after submission - logs are immutable");
            return;
        }

        const event = {
            eventId: this.generateEventId(), // ✅ NEW (dedupe)
            eventType,
            timestamp: Date.now(),
            attemptId: this.attemptId,
            questionId,
            metadata: {
                ...this.metadata,
                focusState: document.hasFocus(),
                tabVisible: !document.hidden,
                ...additionalData,
            },
        };

        this.eventQueue.push(event);
        this.persistEvent(event);

        // console.log(`[Event Logged] ${eventType}`, event);

        if (this.eventQueue.length >= this.batchSize) {
            this.processBatch();
        }

        return event;
    }

    /**
     * Persist event to IndexedDB
     */
    async persistEvent(event) {
        if (!this.db) return;

        const transaction = this.db.transaction([this.storeName], "readwrite");
        const objectStore = transaction.objectStore(this.storeName);

        objectStore.add(event);

        transaction.onerror = () => {
            console.error("Failed to persist event:", transaction.error);
        };
    }

    /**
     * Process batch of events (send to backend)
     */
    processBatch() {
        if (this.eventQueue.length === 0) return;

        const batch = [...this.eventQueue];
        this.eventQueue = [];

        // console.log(`[Batch Processing] Sending ${batch.length} events`, batch);
        this.sendToBackend(batch);
    }

    /**
     * Send batch to backend API
     */
    async sendToBackend(batch) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/logs/frontend-batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attemptId: this.attemptId,
                    events: batch,
                }),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(`API error: ${response.status} ${text}`);
            }
        } catch (error) {
            console.error("[Batch Failed] Error sending to backend:", error);
            this.eventQueue.unshift(...batch);
        }
    }


    /**
     * Start automatic batch processor
     */
    startBatchProcessor() {
        this.batchTimer = setInterval(() => {
            this.processBatch();
        }, this.batchInterval);
    }

    /**
     * Stop batch processor
     */
    stopBatchProcessor() {
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }
    }

    /**
     * Submit all logs and mark as immutable (frontend + backend)
     */
    async submitLogs() {
        if (this.isSubmitted) {
            console.warn("Logs already submitted");
            return;
        }

        // flush remaining events
        this.processBatch();

        // stop further logging immediately
        this.isSubmitted = true;
        this.stopBatchProcessor();

        // log submission event locally
        const submissionEvent = {
            eventId: this.generateEventId(),
            eventType: "logs_submitted",
            timestamp: Date.now(),
            attemptId: this.attemptId,
            questionId: null,
            metadata: {
                ...this.metadata,
                totalEvents: await this.getTotalEventCount(),
            },
        };

        await this.persistEvent(submissionEvent);

        // ✅ Seal attempt on backend so backend rejects further events (real immutability)
        try {
            const res = await fetch(SEAL_ENDPOINT(this.attemptId), { method: "POST" });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.warn("Seal attempt failed:", res.status, text);
            }
        } catch (e) {
            console.warn("Seal attempt request failed:", e);
        }

        console.log("[Logs Submitted] All logs are now immutable");
        return submissionEvent;
    }

    /**
     * Get total event count from IndexedDB
     */
    async getTotalEventCount() {
        if (!this.db) return 0;

        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], "readonly");
            const objectStore = transaction.objectStore(this.storeName);
            const index = objectStore.index("attemptId");
            const request = index.count(this.attemptId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(0);
        });
    }

    /**
     * Get all logs for this attempt
     */
    async getAllLogs() {
        if (!this.db) return [];

        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], "readonly");
            const objectStore = transaction.objectStore(this.storeName);
            const index = objectStore.index("attemptId");
            const request = index.getAll(this.attemptId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve([]);
        });
    }

    /**
     * Export logs as JSON
     */
    async exportLogs() {
        const logs = await this.getAllLogs();
        const exportData = {
            attemptId: this.attemptId,
            exportTimestamp: Date.now(),
            totalEvents: logs.length,
            events: logs,
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Clear all logs (testing only)
     */
    async clearAllLogs() {
        if (!this.db) return;

        const transaction = this.db.transaction([this.storeName], "readwrite");
        const objectStore = transaction.objectStore(this.storeName);
        objectStore.clear();

        console.log("[Logs Cleared] All logs deleted");
    }
}

// Export singleton instance
const eventLogger = new EventLogger();
export default eventLogger;
