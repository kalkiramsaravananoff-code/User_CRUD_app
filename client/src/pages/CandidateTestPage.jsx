/**
 * Secure Test Environment - Candidate Test Page
 * 
 * Clean candidate-facing test page with:
 * - Test questions and timer
 * - Browser enforcement (copy/paste blocking)
 * - Event logging (sent to backend)
 * - NO event log viewer (admin-only)
 */

import React, { useState, useEffect } from 'react';
import eventLogger from '../utils/event-logger.js';
import browserEnforcement from '../utils/browser-enforcement.js';
import ToastNotifications from '../components/ToastNotifications.jsx';

const CandidateTestPage = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes
    const [isSubmitted, setIsSubmitted] = useState(false);

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
        if (timeRemaining <= 0 || isSubmitted) return;

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
    }, [timeRemaining, isSubmitted]);

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
        if (isSubmitted) return;

        eventLogger.logEvent('test_submitted', {
            answeredQuestions: Object.keys(answers).length,
            totalQuestions: questions.length,
            timeRemaining,
            timestamp: new Date().toISOString()
        });

        await eventLogger.submitLogs();

        if (window.showToast) {
            window.showToast('✅ Test submitted successfully!', 'success');
        }

        // Deactivate enforcement after submission
        browserEnforcement.deactivate();
        setIsSubmitted(true);
    };

    // Render question based on type
    const renderQuestion = (q) => {
        switch (q.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-base transition-all bg-neutral-50 text-slate-800 leading-relaxed focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                        placeholder={q.placeholder}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        disabled={isSubmitted}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-base transition-all bg-neutral-50 text-slate-800 leading-relaxed focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 min-h-[140px] resize-y"
                        placeholder={q.placeholder}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        rows={6}
                        disabled={isSubmitted}
                    />
                );

            case 'multiple-choice':
                return (
                    <div className="flex flex-col gap-3.5">
                        {q.options.map((option, idx) => (
                            <label
                                key={idx}
                                className={`flex items-center gap-3.5 p-4 border-2 rounded-xl cursor-pointer transition-all ${isSubmitted ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-indigo-500 hover:translate-x-1 hover:shadow-lg'
                                    } ${answers[q.id] === option
                                        ? 'bg-gradient-to-br from-indigo-50 to-violet-100 border-indigo-500 shadow-md'
                                        : 'bg-neutral-50 border-slate-200'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={q.id}
                                    value={option}
                                    checked={answers[q.id] === option}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    disabled={isSubmitted}
                                    className="w-5 h-5 cursor-pointer accent-indigo-500 disabled:cursor-not-allowed"
                                />
                                <span className="text-base font-medium text-slate-800">{option}</span>
                            </label>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    const currentQ = questions[currentQuestion];

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 p-6 font-sans">
                <ToastNotifications />
                <div className="max-w-2xl mx-auto my-20 bg-white rounded-[20px] p-12 shadow-2xl text-center border border-indigo-500/10">
                    <div className="text-[96px] mb-7 animate-[scaleIn_0.5s_ease]">✅</div>
                    <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tighter">Test Submitted Successfully!</h1>
                    <p className="text-lg text-slate-500 mb-3 leading-relaxed">Thank you for completing the assessment.</p>
                    <p className="text-lg text-slate-500 mb-3 leading-relaxed">Your responses have been recorded and will be reviewed by the employer.</p>
                    <div className="mt-10 pt-8 border-t-2 border-slate-100">
                        <div className="flex justify-between items-center p-5 bg-slate-50 rounded-xl mb-3">
                            <span className="font-semibold text-slate-600 text-[15px]">Questions Answered:</span>
                            <span className="text-indigo-600 font-bold text-base">{Object.keys(answers).length} / {questions.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-5 bg-slate-50 rounded-xl mb-3">
                            <span className="font-semibold text-slate-600 text-[15px]">Submission Time:</span>
                            <span className="text-indigo-600 font-bold text-base">{new Date().toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 p-6 font-sans">
            <ToastNotifications />

            {/* Header */}
            <header className="bg-white rounded-2xl p-7 mb-5 shadow-xl max-w-4xl w-full mx-auto border border-indigo-500/10">
                <div className="flex items-center justify-between mb-5 gap-4 max-md:flex-col max-md:items-start">
                    <h1 className="text-[32px] font-bold text-slate-800 tracking-tighter m-0 max-md:text-2xl">Secure Assessment</h1>
                    <span className="px-4 py-2 rounded-full text-[13px] font-semibold bg-gradient-to-br from-green-100 to-green-200 text-green-800 border border-green-300 flex items-center gap-1.5 whitespace-nowrap">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Protected Mode
                    </span>
                </div>

                <div className="flex justify-between items-center pt-5 border-t-2 border-slate-100 gap-4 max-md:flex-col max-md:items-stretch">
                    <div className="flex items-center gap-3 bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 max-md:justify-between">
                        <span className="text-[13px] font-semibold text-red-800 uppercase tracking-wide">⏱ Time Remaining</span>
                        <span className={`text-[28px] font-extrabold text-red-600 font-mono tracking-wider max-md:text-2xl ${timeRemaining < 300 ? 'text-red-700 animate-pulse' : ''}`}>
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                    <div className="text-[15px] text-slate-600 font-semibold bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 max-md:text-center">
                        <strong>Question {currentQuestion + 1}</strong> of {questions.length}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl w-full mx-auto mb-5">
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-indigo-500/10 max-md:p-6">
                    <div className="flex justify-between items-center mb-7 pb-5 border-b-2 border-slate-100 max-md:flex-col max-md:items-start max-md:gap-2.5">
                        <span className="text-xl font-bold text-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-100 px-4 py-2 rounded-xl border border-indigo-200">Question {currentQuestion + 1}</span>
                        <span className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md font-mono border border-slate-200 font-semibold uppercase tracking-wide">{currentQ.id}</span>
                    </div>

                    <div className="text-[22px] font-semibold text-slate-800 mb-8 leading-relaxed tracking-tight max-md:text-lg">
                        {currentQ.question}
                    </div>

                    <div className="mb-9">
                        {renderQuestion(currentQ)}
                    </div>

                    <div className="flex justify-between gap-4 pt-2 max-md:flex-col">
                        <button
                            className="px-7 py-3.5 border-none rounded-xl text-base font-semibold cursor-pointer transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed max-md:w-full"
                            onClick={handlePreviousQuestion}
                            disabled={currentQuestion === 0}
                        >
                            ← Previous
                        </button>

                        {currentQuestion < questions.length - 1 ? (
                            <button
                                className="px-7 py-3.5 border-none rounded-xl text-base font-semibold cursor-pointer transition-all bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-violet-600 hover:shadow-indigo-500/40 hover:-translate-y-0.5 max-md:w-full"
                                onClick={handleNextQuestion}
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                className="px-7 py-3.5 border-none rounded-xl text-base font-semibold cursor-pointer transition-all bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/40 hover:-translate-y-0.5 max-md:w-full"
                                onClick={handleSubmit}
                            >
                                Submit Test
                            </button>
                        )}
                    </div>
                </div>
            </main>

            {/* Instructions */}
            <aside className="bg-white rounded-2xl p-7 shadow-xl max-w-4xl w-full mx-auto border border-indigo-500/10">
                <h3 className="m-0 mb-5 text-xl font-bold text-slate-800 flex items-center gap-2.5">⚠️ Test Instructions</h3>
                <ul className="m-0 pl-6 list-disc">
                    <li className="mb-3 text-slate-600 leading-relaxed text-[15px]">Answer all questions to the best of your ability</li>
                    <li className="mb-3 text-slate-600 leading-relaxed text-[15px]">You can navigate between questions using the buttons</li>
                    <li className="mb-3 text-slate-600 leading-relaxed text-[15px]">Your progress is automatically saved</li>
                    <li className="mb-3 text-slate-600 leading-relaxed text-[15px]">Copy, paste, and right-click are disabled for security</li>
                    <li className="mb-0 text-slate-600 leading-relaxed text-[15px]">The test will auto-submit when time expires</li>
                </ul>
            </aside>
        </div>
    );
};

export default CandidateTestPage;
