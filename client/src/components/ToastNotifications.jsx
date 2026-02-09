/**
 * Secure Test Environment - Toast Notifications
 * 
 * Lightweight toast notification system for user feedback
 * - Warning messages for restricted actions
 * - Auto-dismiss functionality
 * - Stacking support
 * - Accessible ARIA labels
 */

import React, { useState, useEffect, useCallback } from 'react';
import './ToastNotifications.css';

// Toast item component
const Toast = ({ id, message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(id);
        }, 3000); // Auto-dismiss after 3 seconds

        return () => clearTimeout(timer);
    }, [id, onDismiss]);

    const getIcon = () => {
        switch (type) {
            case 'warning':
                return '⚠️';
            case 'error':
                return '❌';
            case 'info':
                return 'ℹ️';
            case 'success':
                return '✅';
            default:
                return 'ℹ️';
        }
    };

    return (
        <div
            className={`toast toast-${type}`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
        >
            <div className="toast-icon">{getIcon()}</div>
            <div className="toast-message">{message}</div>
            <button
                className="toast-close"
                onClick={() => onDismiss(id)}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    );
};

// Toast container component
const ToastNotifications = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    // Expose addToast globally for use by browser enforcement
    useEffect(() => {
        window.showToast = addToast;
        return () => {
            delete window.showToast;
        };
    }, [addToast]);

    return (
        <div className="toast-container" aria-label="Notifications">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onDismiss={removeToast}
                />
            ))}
        </div>
    );
};

export default ToastNotifications;
