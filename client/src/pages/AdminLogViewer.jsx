/**
 * Admin Log Viewer - Employer/Admin Only
 * 
 * Secure admin dashboard for viewing candidate event logs
 * - Requires ?admin=1 query parameter or admin token
 * - Displays all logged events with filtering
 * - Export functionality
 * - Real-time updates
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import eventLogger from '../utils/event-logger.js';
import './AdminLogViewer.css';

const AdminLogViewer = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminToken, setAdminToken] = useState('');
    const [eventLogs, setEventLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Check authentication on mount
    useEffect(() => {
        const adminParam = searchParams.get('admin');
        const tokenParam = searchParams.get('token');

        // Simple authentication check
        // In production, this should verify against backend
        if (adminParam === '1' || tokenParam === 'admin-secret-token') {
            setIsAuthenticated(true);
            setAdminToken(tokenParam || 'admin-param');
        } else {
            setIsAuthenticated(false);
        }
    }, [searchParams]);

    // Load event logs
    useEffect(() => {
        if (!isAuthenticated) return;

        const loadLogs = async () => {
            const logs = await eventLogger.getAllLogs();
            setEventLogs(logs);
            setFilteredLogs(logs);
        };

        loadLogs();

        // Auto-refresh every 2 seconds if enabled
        if (autoRefresh) {
            const interval = setInterval(loadLogs, 2000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, autoRefresh]);

    // Filter logs based on type and search
    useEffect(() => {
        let filtered = eventLogs;

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(log => log.eventType === filterType);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(log =>
                JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredLogs(filtered);
    }, [eventLogs, filterType, searchTerm]);

    // Export logs
    const handleExportLogs = async () => {
        const logsJson = await eventLogger.exportLogs();
        const blob = new Blob([logsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Clear all logs (admin only - for testing)
    const handleClearLogs = async () => {
        if (window.confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
            await eventLogger.clearAllLogs();
            setEventLogs([]);
            setFilteredLogs([]);
        }
    };

    // Get unique event types for filter
    const eventTypes = ['all', ...new Set(eventLogs.map(log => log.eventType))];

    // Get event statistics
    const stats = {
        total: eventLogs.length,
        copyAttempts: eventLogs.filter(l => l.eventType === 'copy_attempt').length,
        pasteAttempts: eventLogs.filter(l => l.eventType === 'paste_attempt').length,
        cutAttempts: eventLogs.filter(l => l.eventType === 'cut_attempt').length,
        rightClickAttempts: eventLogs.filter(l => l.eventType === 'right_click_attempt').length,
        focusChanges: eventLogs.filter(l => l.eventType.includes('focus') || l.eventType.includes('visibility')).length,
    };

    // Authentication screen
    if (!isAuthenticated) {
        return (
            <div className="admin-log-viewer">
                <div className="auth-screen">
                    <div className="auth-card">
                        <div className="auth-icon">🔒</div>
                        <h1>Admin Access Required</h1>
                        <p>This page is restricted to administrators and employers only.</p>

                        <div className="auth-instructions">
                            <h3>Access Methods:</h3>
                            <ul>
                                <li>Add <code>?admin=1</code> to the URL</li>
                                <li>Add <code>?token=admin-secret-token</code> to the URL</li>
                            </ul>
                        </div>

                        <button
                            className="btn-back"
                            onClick={() => navigate('/secure-test')}
                        >
                            ← Back to Test
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Admin dashboard
    return (
        <div className="admin-log-viewer">
            {/* Header */}
            <header className="admin-header">
                <div className="header-content">
                    <div className="header-title">
                        <h1>Admin Event Log Viewer</h1>
                        <span className="admin-badge">Admin Access</span>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => navigate('/secure-test')}
                        >
                            View Test Page
                        </button>
                    </div>
                </div>
            </header>

            {/* Statistics */}
            <section className="stats-section">
                <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Events</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-value">{stats.copyAttempts}</div>
                    <div className="stat-label">Copy Attempts</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-value">{stats.pasteAttempts}</div>
                    <div className="stat-label">Paste Attempts</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-value">{stats.cutAttempts}</div>
                    <div className="stat-label">Cut Attempts</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-value">{stats.rightClickAttempts}</div>
                    <div className="stat-label">Right-Click Attempts</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-value">{stats.focusChanges}</div>
                    <div className="stat-label">Focus Changes</div>
                </div>
            </section>

            {/* Controls */}
            <section className="controls-section">
                <div className="controls-left">
                    <div className="control-group">
                        <label>Filter by Type:</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="filter-select"
                        >
                            {eventTypes.map(type => (
                                <option key={type} value={type}>
                                    {type === 'all' ? 'All Events' : type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Search:</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search logs..."
                            className="search-input"
                        />
                    </div>

                    <div className="control-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                            />
                            <span>Auto-refresh (2s)</span>
                        </label>
                    </div>
                </div>

                <div className="controls-right">
                    <button
                        className="btn-primary"
                        onClick={handleExportLogs}
                    >
                        📥 Export Logs
                    </button>
                    <button
                        className="btn-danger"
                        onClick={handleClearLogs}
                    >
                        🗑️ Clear All
                    </button>
                </div>
            </section>

            {/* Event Logs Table */}
            <section className="logs-section">
                <div className="logs-header">
                    <h2>Event Logs ({filteredLogs.length})</h2>
                    <span className="attempt-id">
                        Attempt ID: {eventLogger.attemptId}
                    </span>
                </div>

                <div className="logs-table-container">
                    {filteredLogs.length === 0 ? (
                        <div className="no-logs">
                            <div className="no-logs-icon">📭</div>
                            <p>No events logged yet</p>
                        </div>
                    ) : (
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Event Type</th>
                                    <th>Question ID</th>
                                    <th>Browser</th>
                                    <th>Focus State</th>
                                    <th>Tab Visible</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.slice().reverse().map((log, idx) => (
                                    <tr key={idx} className={`log-row ${log.eventType.includes('attempt') ? 'warning-row' : ''}`}>
                                        <td className="timestamp">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="event-type">
                                            <span className={`event-badge ${log.eventType.includes('attempt') ? 'badge-warning' : 'badge-info'}`}>
                                                {log.eventType}
                                            </span>
                                        </td>
                                        <td className="question-id">
                                            {log.questionId || '-'}
                                        </td>
                                        <td>{log.metadata?.browser || '-'}</td>
                                        <td>
                                            <span className={`status-dot ${log.metadata?.focusState ? 'active' : 'inactive'}`}></span>
                                            {log.metadata?.focusState ? 'Focused' : 'Blurred'}
                                        </td>
                                        <td>
                                            <span className={`status-dot ${log.metadata?.tabVisible ? 'active' : 'inactive'}`}></span>
                                            {log.metadata?.tabVisible ? 'Visible' : 'Hidden'}
                                        </td>
                                        <td className="details">
                                            <button
                                                className="btn-details"
                                                onClick={() => alert(JSON.stringify(log, null, 2))}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
};

export default AdminLogViewer;
