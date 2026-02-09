/**
 * Secure Test Environment - Browser Enforcement
 * 
 * Handles all browser-level restrictions:
 * - Keyboard shortcuts (Ctrl+C/V/X, Cmd+C/V/X)
 * - Context menu blocking
 * - Text selection prevention
 * - Visual feedback via toast notifications
 */

import eventLogger from './event-logger.js';

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

    /**
     * Set toast notification callback
     * @param {Function} callback - Function to show toast notifications
     */
    setToastCallback(callback) {
        this.toastCallback = callback;
    }

    /**
     * Set current question ID for logging
     * @param {string} questionId - Current question identifier
     */
    setCurrentQuestion(questionId) {
        this.currentQuestionId = questionId;
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (warning, error, info)
     */
    showToast(message, type = 'warning') {
        if (this.options.showToasts && this.toastCallback) {
            this.toastCallback(message, type);
        }
    }

    /**
     * Check if element is an input field
     * @param {Element} element - DOM element to check
     */
    isInputElement(element) {
        if (!element) return false;

        const tagName = element.tagName.toLowerCase();
        const isInput = tagName === 'input' || tagName === 'textarea';
        const isContentEditable = element.contentEditable === 'true';

        return isInput || isContentEditable;
    }

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown = (event) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
        const key = event.key.toLowerCase();

        // Check for copy (Ctrl/Cmd + C)
        if (this.options.blockCopy && ctrlKey && key === 'c') {
            event.preventDefault();
            event.stopPropagation();

            eventLogger.logEvent('copy_attempt', {
                key: 'C',
                modifier: isMac ? 'Cmd' : 'Ctrl',
                targetElement: event.target.tagName,
            }, this.currentQuestionId);

            this.showToast('⚠️ Copying is disabled during the test', 'warning');
            return false;
        }

        // Check for paste (Ctrl/Cmd + V)
        if (this.options.blockPaste && ctrlKey && key === 'v') {
            event.preventDefault();
            event.stopPropagation();

            eventLogger.logEvent('paste_attempt', {
                key: 'V',
                modifier: isMac ? 'Cmd' : 'Ctrl',
                targetElement: event.target.tagName,
            }, this.currentQuestionId);

            this.showToast('⚠️ Pasting is disabled during the test', 'warning');
            return false;
        }

        // Check for cut (Ctrl/Cmd + X)
        if (this.options.blockCut && ctrlKey && key === 'x') {
            event.preventDefault();
            event.stopPropagation();

            eventLogger.logEvent('cut_attempt', {
                key: 'X',
                modifier: isMac ? 'Cmd' : 'Ctrl',
                targetElement: event.target.tagName,
            }, this.currentQuestionId);

            this.showToast('⚠️ Cutting is disabled during the test', 'warning');
            return false;
        }
    };

    /**
     * Handle context menu (right-click) events
     * @param {MouseEvent} event - Mouse event
     */
    handleContextMenu = (event) => {
        if (!this.options.blockContextMenu) return;

        event.preventDefault();
        event.stopPropagation();

        eventLogger.logEvent('right_click_attempt', {
            targetElement: event.target.tagName,
            clientX: event.clientX,
            clientY: event.clientY,
        }, this.currentQuestionId);

        this.showToast('⚠️ Right-click is disabled during the test', 'warning');
        return false;
    };

    /**
     * Handle text selection
     * @param {Event} event - Selection event
     */
    handleSelectStart = (event) => {
        if (!this.options.blockTextSelection) return;

        // Allow selection in input elements
        if (this.options.allowInputSelection && this.isInputElement(event.target)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        eventLogger.logEvent('text_selection_attempt', {
            targetElement: event.target.tagName,
        }, this.currentQuestionId);

        return false;
    };

    /**
     * Handle copy event (additional layer)
     * @param {ClipboardEvent} event - Clipboard event
     */
    handleCopy = (event) => {
        if (!this.options.blockCopy) return;

        event.preventDefault();
        event.stopPropagation();

        eventLogger.logEvent('copy_event', {
            targetElement: event.target.tagName,
        }, this.currentQuestionId);

        this.showToast('⚠️ Copying is disabled during the test', 'warning');
        return false;
    };

    /**
     * Handle paste event (additional layer)
     * @param {ClipboardEvent} event - Clipboard event
     */
    handlePaste = (event) => {
        if (!this.options.blockPaste) return;

        event.preventDefault();
        event.stopPropagation();

        eventLogger.logEvent('paste_event', {
            targetElement: event.target.tagName,
        }, this.currentQuestionId);

        this.showToast('⚠️ Pasting is disabled during the test', 'warning');
        return false;
    };

    /**
     * Handle cut event (additional layer)
     * @param {ClipboardEvent} event - Clipboard event
     */
    handleCut = (event) => {
        if (!this.options.blockCut) return;

        event.preventDefault();
        event.stopPropagation();

        eventLogger.logEvent('cut_event', {
            targetElement: event.target.tagName,
        }, this.currentQuestionId);

        this.showToast('⚠️ Cutting is disabled during the test', 'warning');
        return false;
    };

    /**
     * Apply CSS to prevent text selection
     */
    applySelectionStyles() {
        if (!this.options.blockTextSelection) return;

        const styleId = 'browser-enforcement-styles';

        // Remove existing styles if any
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
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

    /**
     * Remove selection prevention styles
     */
    removeSelectionStyles() {
        const styleId = 'browser-enforcement-styles';
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }
    }

    /**
     * Activate all browser restrictions
     */
    activate() {
        if (this.isActive) {
            console.warn('Browser enforcement already active');
            return;
        }

        // Add event listeners
        document.addEventListener('keydown', this.handleKeyDown, true);
        document.addEventListener('contextmenu', this.handleContextMenu, true);
        document.addEventListener('selectstart', this.handleSelectStart, true);
        document.addEventListener('copy', this.handleCopy, true);
        document.addEventListener('paste', this.handlePaste, true);
        document.addEventListener('cut', this.handleCut, true);

        // Apply CSS styles
        this.applySelectionStyles();

        this.isActive = true;

        eventLogger.logEvent('browser_enforcement_activated', {
            options: this.options,
        });

        console.log('[Browser Enforcement] Activated with options:', this.options);
    }

    /**
     * Deactivate all browser restrictions
     */
    deactivate() {
        if (!this.isActive) {
            console.warn('Browser enforcement not active');
            return;
        }

        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown, true);
        document.removeEventListener('contextmenu', this.handleContextMenu, true);
        document.removeEventListener('selectstart', this.handleSelectStart, true);
        document.removeEventListener('copy', this.handleCopy, true);
        document.removeEventListener('paste', this.handlePaste, true);
        document.removeEventListener('cut', this.handleCut, true);

        // Remove CSS styles
        this.removeSelectionStyles();

        this.isActive = false;

        eventLogger.logEvent('browser_enforcement_deactivated');

        console.log('[Browser Enforcement] Deactivated');
    }

    /**
     * Update enforcement options
     * @param {Object} newOptions - New options to merge
     */
    updateOptions(newOptions) {
        const wasActive = this.isActive;

        if (wasActive) {
            this.deactivate();
        }

        this.options = {
            ...this.options,
            ...newOptions,
        };

        if (wasActive) {
            this.activate();
        }

        console.log('[Browser Enforcement] Options updated:', this.options);
    }

    /**
     * Get current enforcement status
     */
    getStatus() {
        return {
            isActive: this.isActive,
            options: this.options,
            currentQuestionId: this.currentQuestionId,
        };
    }
}

// Export singleton instance
const browserEnforcement = new BrowserEnforcement();

export default browserEnforcement;
