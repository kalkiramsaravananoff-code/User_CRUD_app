/**
 * Secure Test Environment - Browser Enforcement
 *
 * Handles all browser-level restrictions:
 * - Keyboard shortcuts (Ctrl+C/V/X, Cmd+C/V/X)
 * - Context menu blocking + right-click detection
 * - Text selection prevention
 * - Visual feedback via toast notifications
 */

import eventLogger from "./event-logger.js";

class BrowserEnforcement {
    constructor(options = {}) {
        this.options = {
            blockCopy: true,
            blockPaste: true,
            blockCut: true,
            blockContextMenu: true,
            blockTextSelection: true,
            allowInputSelection: true, // Allow selection in input/textarea
            showToasts: true,
            ...options,
        };

        this.currentQuestionId = null;
        this.isActive = false;
        this.toastCallback = null;
    }

    setToastCallback(callback) {
        this.toastCallback = callback;
    }

    setCurrentQuestion(questionId) {
        this.currentQuestionId = questionId;
    }

    showToast(message, type = "warning") {
        if (this.options.showToasts && this.toastCallback) {
            this.toastCallback(message, type);
        }
    }

    isInputElement(element) {
        if (!element) return false;

        const tagName = element.tagName?.toLowerCase?.() || "";
        const isInput = tagName === "input" || tagName === "textarea";
        const isContentEditable = element.contentEditable === "true";

        return isInput || isContentEditable;
    }

    /**
     * Keyboard shortcut blocker (robust across layouts)
     */
    handleKeyDown = (event) => {
        const ctrlOrCmd = event.ctrlKey || event.metaKey;
        if (!ctrlOrCmd) return;

        const code = (event.code || "").toLowerCase(); // keyc/keyv/keyx/insert/delete
        const modifier = event.metaKey ? "Cmd" : "Ctrl";
        const targetTag = event.target?.tagName || "UNKNOWN";

        // COPY: Ctrl/Cmd + C, Ctrl+Insert
        const isCopy = code === "keyc" || (event.ctrlKey && code === "insert");
        if (this.options.blockCopy && isCopy) {
            event.preventDefault();
            event.stopPropagation();

            eventLogger.logEvent(
                "copy_attempt",
                { key: "C", modifier, code: event.code, source: "keydown", targetElement: targetTag },
                this.currentQuestionId
            );

            this.showToast("⚠️ Copying is disabled during the test", "warning");
            return false;
        }

        // PASTE: Ctrl/Cmd + V, Shift+Insert
        const isPaste = code === "keyv" || (event.shiftKey && code === "insert");
        if (this.options.blockPaste && isPaste) {
            event.preventDefault();
            event.stopPropagation();

            eventLogger.logEvent(
                "paste_attempt",
                { key: "V", modifier, code: event.code, source: "keydown", targetElement: targetTag },
                this.currentQuestionId
            );

            this.showToast("⚠️ Pasting is disabled during the test", "warning");
            return false;
        }

        // CUT: Ctrl/Cmd + X, Shift+Delete
        const isCut = code === "keyx" || (event.shiftKey && code === "delete");
        if (this.options.blockCut && isCut) {
            event.preventDefault();
            event.stopPropagation();

            eventLogger.logEvent(
                "cut_attempt",
                { key: "X", modifier, code: event.code, source: "keydown", targetElement: targetTag },
                this.currentQuestionId
            );

            this.showToast("⚠️ Cutting is disabled during the test", "warning");
            return false;
        }
    };

    /**
     * Right-click detection (mouse button)
     * button: 2 => right click
     */
    handleMouseDown = (event) => {
        if (!this.options.blockContextMenu) return;

        // right click
        if (event.button === 2) {
            eventLogger.logEvent(
                "right_click_attempt",
                {
                    source: "mousedown",
                    targetElement: event.target?.tagName,
                    clientX: event.clientX,
                    clientY: event.clientY,
                },
                this.currentQuestionId
            );
            // Don't prevent here; contextmenu handler will prevent reliably
        }
    };

    /**
     * Context menu block (also counts as right-click attempt)
     */
    handleContextMenu = (event) => {
        if (!this.options.blockContextMenu) return;

        event.preventDefault();
        event.stopPropagation();

        eventLogger.logEvent(
            "right_click_attempt",
            {
                source: "contextmenu",
                targetElement: event.target?.tagName,
                clientX: event.clientX,
                clientY: event.clientY,
            },
            this.currentQuestionId
        );

        this.showToast("⚠️ Right-click is disabled during the test", "warning");
        return false;
    };

    /**
     * Selection blocker
     */
    handleSelectStart = (event) => {
        if (!this.options.blockTextSelection) return;

        // Allow selection in input elements
        if (this.options.allowInputSelection && this.isInputElement(event.target)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        eventLogger.logEvent(
            "text_selection_attempt",
            { targetElement: event.target?.tagName },
            this.currentQuestionId
        );

        return false;
    };

    /**
     * Clipboard events (unify names with *_attempt)
     */
    handleCopy = (event) => {
        if (!this.options.blockCopy) return;

        event.preventDefault();
        event.stopPropagation();

        eventLogger.logEvent(
            "copy_attempt",
            { source: "clipboard_event", targetElement: event.target?.tagName },
            this.currentQuestionId
        );

        this.showToast("⚠️ Copying is disabled during the test", "warning");
        return false;
    };

    handlePaste = (event) => {
        if (!this.options.blockPaste) return;

        event.preventDefault();
        event.stopPropagation();

        eventLogger.logEvent(
            "paste_attempt",
            { source: "clipboard_event", targetElement: event.target?.tagName },
            this.currentQuestionId
        );

        this.showToast("⚠️ Pasting is disabled during the test", "warning");
        return false;
    };

    handleCut = (event) => {
        if (!this.options.blockCut) return;

        event.preventDefault();
        event.stopPropagation();

        eventLogger.logEvent(
            "cut_attempt",
            { source: "clipboard_event", targetElement: event.target?.tagName },
            this.currentQuestionId
        );

        this.showToast("⚠️ Cutting is disabled during the test", "warning");
        return false;
    };

    applySelectionStyles() {
        if (!this.options.blockTextSelection) return;

        const styleId = "browser-enforcement-styles";

        const existingStyle = document.getElementById(styleId);
        if (existingStyle) existingStyle.remove();

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      /* Allow selection in input elements */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;

        document.head.appendChild(style);
    }

    removeSelectionStyles() {
        const styleId = "browser-enforcement-styles";
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) existingStyle.remove();
    }

    activate() {
        if (this.isActive) {
            console.warn("Browser enforcement already active");
            return;
        }

        document.addEventListener("keydown", this.handleKeyDown, true);
        document.addEventListener("mousedown", this.handleMouseDown, true);
        document.addEventListener("contextmenu", this.handleContextMenu, true);
        document.addEventListener("selectstart", this.handleSelectStart, true);
        document.addEventListener("copy", this.handleCopy, true);
        document.addEventListener("paste", this.handlePaste, true);
        document.addEventListener("cut", this.handleCut, true);

        this.applySelectionStyles();

        this.isActive = true;

        eventLogger.logEvent("browser_enforcement_activated", {
            options: this.options,
        });

        console.log("[Browser Enforcement] Activated with options:", this.options);
    }

    deactivate() {
        if (!this.isActive) {
            console.warn("Browser enforcement not active");
            return;
        }

        document.removeEventListener("keydown", this.handleKeyDown, true);
        document.removeEventListener("mousedown", this.handleMouseDown, true);
        document.removeEventListener("contextmenu", this.handleContextMenu, true);
        document.removeEventListener("selectstart", this.handleSelectStart, true);
        document.removeEventListener("copy", this.handleCopy, true);
        document.removeEventListener("paste", this.handlePaste, true);
        document.removeEventListener("cut", this.handleCut, true);

        this.removeSelectionStyles();

        this.isActive = false;

        eventLogger.logEvent("browser_enforcement_deactivated");

        console.log("[Browser Enforcement] Deactivated");
    }

    updateOptions(newOptions) {
        const wasActive = this.isActive;

        if (wasActive) this.deactivate();

        this.options = {
            ...this.options,
            ...newOptions,
        };

        if (wasActive) this.activate();

        console.log("[Browser Enforcement] Options updated:", this.options);
    }

    getStatus() {
        return {
            isActive: this.isActive,
            options: this.options,
            currentQuestionId: this.currentQuestionId,
        };
    }
}

const browserEnforcement = new BrowserEnforcement();
export default browserEnforcement;
