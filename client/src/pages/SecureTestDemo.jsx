/**
 * Secure Test Environment - Demo Page
 * 
 * A complete demonstration of the secure test environment with:
 * - Sample test questions
 * - Timer simulation
 * - Live event log viewer
 * - All enforcement mechanisms active
 */

import React, { useState, useEffect } from 'react';
import eventLogger from '../utils/event-logger.js';
import browserEnforcement from '../utils/browser-enforcement.js';
import ToastNotifications from '../components/ToastNotifications.jsx';
import './SecureTestDemo.css';

const SecureTestDemo = () => {
    const [isEnforcementActive, setIsEnforcementActive] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes
    const [eventLogs, setEventLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);

    // Sample test questions
    const questions = [
        {
            id: 'q1',
            question: 'What is the capital of France?',
            type: 'text',
            placeholder: 'Enter your answer here...',
        },
        {
            id: 'q2',
            question: 'Explain the concept of closures in JavaScript.',
            type: 'textarea',
            placeholder: 'Type your explanation here...',
        },
        {
            id: 'q3',
            question: 'Which of the following is a valid HTTP method?',
            type: 'multiple-choice',
            options: ['GET', 'FETCH', 'RETRIEVE', 'OBTAIN'],
        },
        {
            id: 'q4',
            question: 'What does CSS stand for?',
            type: 'text',
            placeholder: 'Enter your answer here...',
        },
    ];

    // Initialize enforcement on mount
    useEffect(() => {
        // Set toast callback
        browserEnforcement.setToastCallback((message, type) => {
            if (window.showToast) {
                window.showToast(message, type);
            }
        });

        // Activate enforcement
        browserEnforcement.activate();
        setIsEnforcementActive(true);

        // Set initial question
        browserEnforcement.setCurrentQuestion(questions[0].id);

        // Log test start
        eventLogger.logEvent('test_started', {
            totalQuestions: questions.length,
            timeLimit: 1800,
        });

        // Cleanup on unmount
        return () => {
            browserEnforcement.deactivate();
        };
    }, []);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    // Update event logs periodically
    useEffect(() => {
        const updateLogs = async () => {
            const logs = await eventLogger.getAllLogs();
            setEventLogs(logs);
        };

        updateLogs();
        const interval = setInterval(updateLogs, 2000);

        return () => clearInterval(interval);
    }, []);

    // Format time remaining
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle question navigation
    const handleNextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            const nextQuestion = currentQuestion + 1;
            setCurrentQuestion(nextQuestion);
            browserEnforcement.setCurrentQuestion(questions[nextQuestion].id);

            eventLogger.logEvent('question_navigation', {
                from: questions[currentQuestion].id,
                to: questions[nextQuestion].id,
                direction: 'next',
            });
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestion > 0) {
            const prevQuestion = currentQuestion - 1;
            setCurrentQuestion(prevQuestion);
            browserEnforcement.setCurrentQuestion(questions[prevQuestion].id);

            eventLogger.logEvent('question_navigation', {
                from: questions[currentQuestion].id,
                to: questions[prevQuestion].id,
                direction: 'previous',
            });
        }
    };

    // Handle answer changes
    const handleAnswerChange = (questionId, value) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }));

        eventLogger.logEvent('answer_updated', {
            answerLength: value.length,
        }, questionId);
    };

    // Handle test submission
    const handleSubmit = async () => {
        eventLogger.logEvent('test_submitted', {
            answeredQuestions: Object.keys(answers).length,
            totalQuestions: questions.length,
            timeRemaining,
        });

        await eventLogger.submitLogs();

        if (window.showToast) {
            window.showToast('✅ Test submitted successfully!', 'success');
        }

        // Deactivate enforcement after submission
        browserEnforcement.deactivate();
        setIsEnforcementActive(false);
    };

    // Export logs
    const handleExportLogs = async () => {
        const logsJson = await eventLogger.exportLogs();
        const blob = new Blob([logsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-logs-${eventLogger.attemptId}.json`;
        a.click();
        URL.revokeObjectURL(url);

        if (window.showToast) {
            window.showToast('📥 Logs exported successfully!', 'info');
        }
    };

    // Render question based on type
    const renderQuestion = (q) => {
        switch (q.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        className="answer-input"
                        placeholder={q.placeholder}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        className="answer-textarea"
                        placeholder={q.placeholder}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        rows={6}
                    />
                );

            case 'multiple-choice':
                return (
                    <div className="answer-options">
                        {q.options.map((option, idx) => (
                            <label key={idx} className="option-label">
                                <input
                                    type="radio"
                                    name={q.id}
                                    value={option}
                                    checked={answers[q.id] === option}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    const currentQ = questions[currentQuestion];

    return (
        <div className="secure-test-demo">
            <ToastNotifications />

            {/* Header */}
            <header className="test-header">
                <div className="test-title">
                    <h1> Secure Test Environment Demo</h1>
                    <span className={`status-badge ${isEnforcementActive ? 'active' : 'inactive'}`}>
                        {isEnforcementActive ? '🔐 Protected' : '🔓 Unprotected'}
                    </span>
                </div>

                <div className="test-info">
                    <div className="timer">
                        <span className="timer-label">Time Remaining:</span>
                        <span className="timer-value">{formatTime(timeRemaining)}</span>
                    </div>
                    <div className="progress">
                        Question {currentQuestion + 1} of {questions.length}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="test-content">
                <div className="question-container">
                    <div className="question-header">
                        <span className="question-number">Question {currentQuestion + 1}</span>
                        <span className="question-id">{currentQ.id}</span>
                    </div>

                    <div className="question-text">
                        {currentQ.question}
                    </div>

                    <div className="answer-section">
                        {renderQuestion(currentQ)}
                    </div>

                    <div className="navigation-buttons">
                        <button
                            className="nav-button"
                            onClick={handlePreviousQuestion}
                            disabled={currentQuestion === 0}
                        >
                            ← Previous
                        </button>

                        {currentQuestion < questions.length - 1 ? (
                            <button
                                className="nav-button primary"
                                onClick={handleNextQuestion}
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                className="nav-button submit"
                                onClick={handleSubmit}
                            >
                                Submit Test
                            </button>
                        )}
                    </div>
                </div>

                {/* Event Log Viewer */}
                <div className="log-viewer">
                    <div className="log-header">
                        <h3>📊 Event Log Viewer</h3>
                        <div className="log-actions">
                            <button
                                className="log-toggle"
                                onClick={() => setShowLogs(!showLogs)}
                            >
                                {showLogs ? 'Hide' : 'Show'} Logs
                            </button>
                            <button
                                className="log-export"
                                onClick={handleExportLogs}
                            >
                                📥 Export
                            </button>
                        </div>
                    </div>

                    {showLogs && (
                        <div className="log-content">
                            <div className="log-stats">
                                <span>Total Events: {eventLogs.length}</span>
                                <span>Attempt ID: {eventLogger.attemptId}</span>
                            </div>

                            <div className="log-list">
                                {eventLogs.slice(-10).reverse().map((log, idx) => (
                                    <div key={idx} className="log-entry">
                                        <span className="log-type">{log.eventType}</span>
                                        <span className="log-time">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                        {log.questionId && (
                                            <span className="log-question">{log.questionId}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Instructions */}
            <aside className="test-instructions">
                <h3>⚠️ Test Instructions</h3>
                <ul>
                    <li>Copy, paste, and cut operations are disabled</li>
                    <li>Right-click context menu is disabled</li>
                    <li>Text selection is limited (works in answer fields only)</li>
                    <li>All actions are logged for audit purposes</li>
                    <li>Timer will auto-submit when time expires</li>
                </ul>
            </aside>
        </div>
    );
};

export default SecureTestDemo;
