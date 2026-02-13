/**
 * Secure Test Environment - Event Logger
 *
 * - Unified event schema
 * - Batch processing for efficient transmission
 * - Local persistence using IndexedDB
 * - Immutable log storage post-submission
 */

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    .toString()
    .replace(/\/$/, "");

const SEAL_ENDPOINT = (attemptId) =>
    `${BACKEND_URL}/api/logs/attempt/${attemptId}/seal`;

class EventLogger {
    constructor() {
        this.attemptId = this.generateAttemptId();
        this.eventQueue = [];

        this.batchSize = 10;
        this.batchInterval = 5000; // 5 seconds

        this.isSubmitted = false;

        // ✅ prevents overlapping flushes
        this.isFlushing = false;

        this.dbName = "SecureTestDB";
        this.storeName = "eventLogs";
        this.db = null;

        this.initializeDB();
        this.startBatchProcessor();
        this.captureMetadata();
        this.setupVisibilityTracking();
    }

    generateAttemptId() {
        return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

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

    setupVisibilityTracking() {
        document.addEventListener("visibilitychange", () => {
            this.logEvent("tab_visibility_change", { visible: !document.hidden });
        });

        window.addEventListener("focus", () => {
            this.logEvent("window_focus", { focusState: true });
        });

        window.addEventListener("blur", () => {
            this.logEvent("window_blur", { focusState: false });
        });
    }

    generateEventId() {
        if (crypto?.randomUUID) return crypto.randomUUID();
        return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    logEvent(eventType, additionalData = {}, questionId = null) {
        if (this.isSubmitted) {
            console.warn("Cannot log events after submission - logs are immutable");
            return;
        }

        const event = {
            eventId: this.generateEventId(),
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

        // ✅ trigger flush when batchSize reached (don’t await, but guarded by isFlushing)
        if (this.eventQueue.length >= this.batchSize) {
            void this.processBatch();
        }

        return event;
    }

    async persistEvent(event) {
        if (!this.db) return;

        const transaction = this.db.transaction([this.storeName], "readwrite");
        const objectStore = transaction.objectStore(this.storeName);

        objectStore.add(event);

        transaction.onerror = () => {
            console.error("Failed to persist event:", transaction.error);
        };
    }

    // ✅ REAL BATCH FLUSH (await + no overlap)
    async processBatch() {
        if (this.isFlushing) return;
        if (this.eventQueue.length === 0) return;

        this.isFlushing = true;

        const batch = [...this.eventQueue];
        this.eventQueue = [];

        try {
            await this.sendToBackend(batch);
        } catch (error) {
            console.error("[Batch Failed] Error sending to backend:", error);
            // re-queue at front so it retries next time
            this.eventQueue.unshift(...batch);
        } finally {
            this.isFlushing = false;
        }
    }

    async sendToBackend(batch) {
        const response = await fetch(`${BACKEND_URL}/api/logs/batch`, {
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
    }

    startBatchProcessor() {
        this.batchTimer = setInterval(() => {
            // flush whatever is queued every interval
            void this.processBatch();
        }, this.batchInterval);
    }

    stopBatchProcessor() {
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }
    }

    async submitLogs() {
        if (this.isSubmitted) {
            console.warn("Logs already submitted");
            return;
        }

        // stop new logs immediately
        this.isSubmitted = true;

        // stop the timer so it won’t interfere; we will flush manually now
        this.stopBatchProcessor();

        // add submission event (manually, because logEvent is blocked now)
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

        // ensure it is flushed too
        this.eventQueue.push(submissionEvent);
        await this.persistEvent(submissionEvent);

        // ✅ flush remaining logs (await)
        await this.processBatch();

        // ✅ seal attempt (backend immutability)
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

    async clearAllLogs() {
        if (!this.db) return;

        const transaction = this.db.transaction([this.storeName], "readwrite");
        const objectStore = transaction.objectStore(this.storeName);
        objectStore.clear();

        console.log("[Logs Cleared] All logs deleted");
    }
}

const eventLogger = new EventLogger();
export default eventLogger;
