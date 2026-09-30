import React from "react";

import {
    Bot,
    Send,
} from "lucide-react";

const Assistant = ({
    question,
    setQuestion,
    answer,
    handleQuestion,
}) => {
    const suggestedQuestions = [
        "Why is this response underdamped?",
        "Which run settles fastest?",
        "Compare the overshoot.",
        "What does settling time indicate?",
    ];

    return (
        <section
            id="assistant"
            className="scroll-mt-20"
        >

            <div className="mb-3">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Intelligent Analysis
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                    Simulation Assistant
                </h3>

            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">

                {/* Chat */}

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">

                        <div className="rounded-lg bg-blue-600 p-2">
                            <Bot size={18} />
                        </div>

                        <div>

                            <p className="text-sm font-semibold">
                                SimuScope AI
                            </p>

                            <p className="text-[10px] text-slate-500">
                                Simulation Q&A
                            </p>

                        </div>

                    </div>

                    <div className="my-5 min-h-28 rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-400">
                        {answer}
                    </div>

                    <div className="flex rounded-lg border border-slate-700 p-1">

                        <input
                            value={question}
                            onChange={(event) =>
                                setQuestion(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {

                                if (
                                    event.key ===
                                    "Enter"
                                ) {
                                    handleQuestion();
                                }

                            }}
                            placeholder="Ask about overshoot, settling, stability..."
                            className="flex-1 bg-transparent px-3 text-xs outline-none placeholder:text-slate-600"
                        />

                        <button
                            onClick={
                                handleQuestion
                            }
                            className="rounded-md bg-blue-600 p-2 hover:bg-blue-500"
                        >
                            <Send size={15} />
                        </button>

                    </div>

                </div>

                {/* Suggestions */}

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

                    <p className="text-[10px] uppercase text-slate-500">
                        Suggested Questions
                    </p>

                    <div className="mt-4 space-y-2">

                        {suggestedQuestions.map(
                            (query) => (

                                <button
                                    key={query}
                                    onClick={() =>
                                        setQuestion(
                                            query
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-800 px-3 py-2.5 text-left text-xs text-slate-400 transition hover:border-blue-500 hover:text-blue-400"
                                >
                                    {query}
                                </button>

                            )
                        )}

                    </div>

                    <div className="mt-5 rounded-lg bg-blue-500/5 p-3 text-[10px] leading-5 text-slate-500">

                        <Bot
                            size={15}
                            className="mb-2 text-blue-400"
                        />

                        The current analysis engine uses
                        Python, NumPy and Pandas to calculate
                        response metrics. ML-based simulation
                        Q&A can be connected in the next stage.

                    </div>

                </div>

            </div>

        </section>
    );
};

export default Assistant;