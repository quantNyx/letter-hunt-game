import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Puzzle data                                                        */
/* ------------------------------------------------------------------ */

type PuzzleKind = "input" | "select" | "options";

interface Puzzle {
  title: string;
  kind: PuzzleKind;
  letter: string;
  /** For input: correct answer string (case-insensitive). */
  answer?: string;
  /** For options: index of correct option. */
  correctIndex?: number;
}

const PUZZLES: Puzzle[] = [
  {
    title: "THE PATTERN",
    kind: "input",
    letter: "N",
    answer: "42",
  },
  {
    title: "THE OUTLIER",
    kind: "select",
    letter: "I",
    correctIndex: 2,
  },
  {
    title: "THE LOGIC",
    kind: "options",
    letter: "T",
    correctIndex: 0,
  },
  {
    title: "THE DATA",
    kind: "options",
    letter: "E",
    correctIndex: 1,
  },
  {
    title: "THE FINAL CLUE",
    kind: "input",
    letter: "R",
    answer: "LAMP",
  },
];

/* ------------------------------------------------------------------ */
/*  Format elapsed seconds as MM:SS                                    */
/* ------------------------------------------------------------------ */

function fmtTime(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Main Game component                                                */
/* ------------------------------------------------------------------ */

export default function Game() {
  const [screen, setScreen] = useState<
    "puzzle" | "unlock" | "finalLock" | "complete"
  >("puzzle");
  const [step, setStep] = useState(0);
  const [letters, setLetters] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [feedback, setFeedback] = useState<"" | "correct" | "wrong">("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Start timer */
  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* Go to next puzzle after unlock animation */
  const afterUnlock = useCallback(() => {
    if (step < 4) {
      setStep(step + 1);
      setInputVal("");
      setFeedback("");
      setScreen("puzzle");
    } else {
      setScreen("finalLock");
    }
  }, [step]);

  /* Submit answer (input kind) */
  const submitInput = () => {
    const puzzle = PUZZLES[step];
    const correct =
      inputVal.trim().toUpperCase() === puzzle.answer?.toUpperCase();
    if (correct) {
      setFeedback("correct");
      setLetters((l) => [...l, puzzle.letter]);
      setScreen("unlock");
      setTimeout(afterUnlock, 1800);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback(""), 1200);
    }
  };

  /* Select option / click outlier */
  const selectOption = (index: number) => {
    if (feedback !== "") return;
    const puzzle = PUZZLES[step];
    const correct = index === puzzle.correctIndex;
    if (correct) {
      setFeedback("correct");
      setLetters((l) => [...l, puzzle.letter]);
      setScreen("unlock");
      setTimeout(afterUnlock, 1800);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback(""), 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && screen === "puzzle") submitInput();
  };

  /* ---- Render ---- */

  return (
    <div className="min-h-screen flex flex-col font-red-hat">
      {/* Noise + frame */}
      <div className="noise-overlay" />
      <div className="frame-border" />
      <div className="frame-corner-bl" />
      <div className="frame-corner-br" />

      {/* Header bar */}
      {screen !== "complete" && (
        <header className="sticky top-0 z-40 px-6 md:px-10 py-4 flex items-center justify-between border-b border-white/[0.04] bg-background/80 backdrop-blur-md">
          <span className="hero-label text-[11px] tracking-[0.14em]">
            DIG THE DATA 5.0
          </span>
          <div className="flex items-center gap-6 md:gap-10">
            {/* Progress */}
            <span className="text-xs text-muted-foreground tracking-wider font-medium">
              {screen === "finalLock"
                ? "LOCK"
                : `${String(step + 1).padStart(2, "0")} / 05`}
            </span>
            {/* Letters */}
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`letter-slot w-8 h-9 text-sm border-white/[0.08]${
                    letters[i] ? " filled letter-slot-glow" : ""
                  }`}
                >
                  {letters[i] || ""}
                </span>
              ))}
            </div>
            {/* Timer */}
            <span className="text-xs text-muted-foreground/60 tabular-nums tracking-wider animate-subtle-pulse">
              {fmtTime(seconds)}
            </span>
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 md:px-10">
        <AnimatePresence mode="wait">
          {screen === "puzzle" && (
            <PuzzleScreen
              key={`p-${step}`}
              puzzle={PUZZLES[step]}
              step={step}
              inputVal={inputVal}
              feedback={feedback}
              onInput={setInputVal}
              onSubmit={submitInput}
              onSelect={selectOption}
              onKeyDown={handleKeyDown}
            />
          )}
          {screen === "unlock" && (
            <UnlockScreen
              key={`u-${step}`}
              letter={PUZZLES[step].letter}
              title={PUZZLES[step].title}
            />
          )}
          {screen === "finalLock" && (
            <FinalLockScreen
              key="lock"
              onUnlock={() => {
                stopTimer();
                setScreen("complete");
              }}
              letters={letters}
            />
          )}
          {screen === "complete" && (
            <CompleteScreen
              key="done"
              time={fmtTime(seconds)}
              onRestart={() => {
                setScreen("puzzle");
                setStep(0);
                setLetters([]);
                setSeconds(0);
                setInputVal("");
                setFeedback("");
                // restart timer
                timerRef.current = setInterval(
                  () => setSeconds((s) => s + 1),
                  1000
                );
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ================================================================== */
/*  Puzzle Screen                                                      */
/* ================================================================== */

interface PuzzleScreenProps {
  puzzle: Puzzle;
  step: number;
  inputVal: string;
  feedback: "" | "correct" | "wrong";
  onInput: (v: string) => void;
  onSubmit: () => void;
  onSelect: (i: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function PuzzleScreen({
  puzzle,
  step,
  inputVal,
  feedback,
  onInput,
  onSubmit,
  onSelect,
  onKeyDown,
}: PuzzleScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg"
    >
      {/* Puzzle card */}
      <div className="border border-white/[0.06] bg-card/40 backdrop-blur-sm">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {puzzle.title}
          </span>
          <span className="text-xs text-muted-foreground/40 tabular-nums">
            {step + 1} / 5
          </span>
        </div>

        {/* Card body */}
        <div className="px-6 py-8" onKeyDown={onKeyDown}>
          {step === 0 && <PuzzlePattern />}
          {step === 1 && <PuzzleOutlier feedback={feedback} onSelect={onSelect} />}
          {step === 2 && <PuzzleLogic feedback={feedback} onSelect={onSelect} />}
          {step === 3 && <PuzzleData feedback={feedback} onSelect={onSelect} />}
          {step === 4 && <PuzzleClue />}

          {/* Input area for input-type puzzles */}
          {puzzle.kind === "input" && (
            <div className="mt-8 flex flex-col gap-3">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => onInput(e.target.value)}
                placeholder="Enter your answer"
                className="w-full px-4 py-3 bg-transparent border border-white/[0.08] text-foreground text-sm font-red-hat placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
              <button
                className="btn-cta btn-cta-primary w-full"
                onClick={onSubmit}
                disabled={!inputVal.trim()}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback message */}
      <div className="h-8 mt-3 flex items-center">
        {feedback === "wrong" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-400/80 tracking-wider"
          >
            INCORRECT — TRY AGAIN
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Puzzle 1 — THE PATTERN: 2, 6, 12, 20, 30, ?                       */
/* ------------------------------------------------------------------ */

function PuzzlePattern() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Find the missing number in this sequence.
      </p>
      <div className="flex flex-wrap gap-3 items-center">
        {["2", "6", "12", "20", "30", "?"].map((n, i) => (
          <span
            key={i}
            className={`inline-flex items-center justify-center w-12 h-12 border text-lg font-instrument italic ${
              n === "?"
                ? "border-primary text-primary"
                : "border-white/[0.08] text-foreground"
            }`}
          >
            {n}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/50 mt-2">
        Hint: the differences between terms are increasing.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Puzzle 2 — THE OUTLIER: find the different code                    */
/* ------------------------------------------------------------------ */

const CODES = [
  "DATA47X",
  "DATA47X",
  "DATA74X",
  "DATA47X",
  "DATA47X",
];

function PuzzleOutlier({
  feedback,
  onSelect,
}: {
  feedback: "" | "correct" | "wrong";
  onSelect: (i: number) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleClick = (i: number) => {
    if (feedback !== "") return;
    setSelectedIdx(i);
    onSelect(i);
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        One of these codes is different from the rest. Identify the outlier.
      </p>
      <div className="flex flex-col gap-2">
        {CODES.map((code, i) => {
          let cls = "puzzle-option font-mono-game text-sm tracking-[0.15em]";
          if (selectedIdx === i && feedback === "correct")
            cls += " correct";
          else if (selectedIdx === i && feedback === "wrong")
            cls += " wrong";
          return (
            <button key={i} className={cls} onClick={() => handleClick(i)}>
              {code}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Puzzle 3 — THE LOGIC                                               */
/* ------------------------------------------------------------------ */

const LOGIC_OPTIONS = [
  "Statistics",
  "Economics",
  "Programming",
];

function PuzzleLogic({
  feedback,
  onSelect,
}: {
  feedback: "" | "correct" | "wrong";
  onSelect: (i: number) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleClick = (i: number) => {
    if (feedback !== "") return;
    setSelectedIdx(i);
    onSelect(i);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          Three colleagues — <strong className="text-foreground font-medium">Ana</strong>,{" "}
          <strong className="text-foreground font-medium">Ben</strong>, and{" "}
          <strong className="text-foreground font-medium">Cat</strong> — each
          study exactly one subject: <em>Statistics</em>, <em>Economics</em>,
          or <em>Programming</em>. No two study the same subject.
        </p>
        <ul className="space-y-1 pl-4 list-disc text-xs">
          <li>Ana does not study Economics.</li>
          <li>Cat studies Programming.</li>
        </ul>
        <p className="font-medium text-foreground">
          What does Ana study?
        </p>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        {LOGIC_OPTIONS.map((opt, i) => {
          let cls = "puzzle-option";
          if (selectedIdx === i && feedback === "correct") cls += " correct";
          else if (selectedIdx === i && feedback === "wrong") cls += " wrong";
          return (
            <button key={i} className={cls} onClick={() => handleClick(i)}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Puzzle 4 — THE DATA                                                */
/* ------------------------------------------------------------------ */

const DATA_OPTIONS = ["Week 1: 38", "Week 2: 42", "Week 3: 35", "Week 4: 38"];

function PuzzleData({
  feedback,
  onSelect,
}: {
  feedback: "" | "correct" | "wrong";
  onSelect: (i: number) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleClick = (i: number) => {
    if (feedback !== "") return;
    setSelectedIdx(i);
    onSelect(i);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Study the data table below. Which week recorded the highest number of
          signups?
        </p>
        {/* Data table */}
        <div className="border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Week
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Signups
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Week 1", "38"],
                ["Week 2", "42"],
                ["Week 3", "35"],
                ["Week 4", "38"],
              ].map(([w, s], i) => (
                <tr
                  key={i}
                  className="border-b border-white/[0.03] last:border-0"
                >
                  <td className="px-4 py-2.5 text-muted-foreground">{w}</td>
                  <td className="px-4 py-2.5 font-mono-game tabular-nums">
                    {s}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        {DATA_OPTIONS.map((opt, i) => {
          let cls = "puzzle-option";
          if (selectedIdx === i && feedback === "correct") cls += " correct";
          else if (selectedIdx === i && feedback === "wrong") cls += " wrong";
          return (
            <button key={i} className={cls} onClick={() => handleClick(i)}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Puzzle 5 — THE FINAL CLUE                                          */
/* ------------------------------------------------------------------ */

function PuzzleClue() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Rearrange the letters to find the hidden word.
      </p>
      <div className="flex gap-3 items-center justify-center py-4">
        {["P", "A", "M", "L"].map((ch, i) => (
          <span
            key={i}
            className="inline-flex items-center justify-center w-12 h-12 border border-white/[0.08] text-lg font-instrument italic text-foreground"
          >
            {ch}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/50 text-center">
        A source of light.
      </p>
    </div>
  );
}

/* ================================================================== */
/*  Unlock Screen                                                      */
/* ================================================================== */

function UnlockScreen({ letter, title }: { letter: string; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex flex-col items-center gap-6 text-center"
    >
      <p className="text-xs tracking-[0.18em] text-muted-foreground font-medium uppercase">
        {title} — Solved
      </p>
      <p className="text-xs tracking-[0.18em] text-primary font-semibold uppercase">
        LETTER UNLOCKED
      </p>
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="text-7xl md:text-8xl font-instrument italic text-primary letter-slot-glow"
      >
        {letter}
      </motion.span>
    </motion.div>
  );
}

/* ================================================================== */
/*  Final Lock Screen                                                  */
/* ================================================================== */

function FinalLockScreen({
  onUnlock,
  letters,
}: {
  onUnlock: () => void;
  letters: string[];
}) {
  const [values, setValues] = useState<string[]>(["", "", "", "", ""]);
  const [wrong, setWrong] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) val = val.charAt(val.length - 1);
    const next = [...values];
    next[index] = val.toUpperCase();
    setValues(next);
    setWrong(false);

    // auto-advance
    if (val && index < 4) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") handleSubmit();
  };

  const handleSubmit = () => {
    const word = values.join("").toUpperCase();
    if (word === "NITER") {
      onUnlock();
    } else {
      setWrong(true);
      setTimeout(() => {
        setWrong(false);
        setValues(["", "", "", "", ""]);
        refs.current[0]?.focus();
      }, 1500);
    }
  };

  // Pre-fill from collected letters (shown as visual hint)
  const prefilled = letters.length === 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="border border-white/[0.06] bg-card/40 backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-white/[0.04]">
          <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            FINAL LOCK
          </span>
        </div>
        <div className="px-6 py-10 flex flex-col items-center gap-8">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Enter the word formed by the five letters you recovered.
          </p>

          {/* Collected letters display */}
          {prefilled && (
            <div className="flex gap-2">
              {letters.map((l, i) => (
                <span
                  key={i}
                  className="letter-slot filled letter-slot-glow w-10 h-12 text-base"
                >
                  {l}
                </span>
              ))}
            </div>
          )}

          {/* Lock inputs */}
          <div className="flex gap-3">
            {values.map((v, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={v}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`lock-input ${wrong ? "wrong" : v ? "correct" : ""}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button className="btn-cta btn-cta-primary w-full" onClick={handleSubmit}>
            UNLOCK
          </button>

          {wrong && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs tracking-wider text-red-400/80"
            >
              TRY AGAIN
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Complete Screen                                                    */
/* ================================================================== */

function CompleteScreen({ time, onRestart }: { time: string; onRestart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center gap-10 text-center max-w-lg w-full"
    >
      {/* Access granted flash */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-col items-center gap-2"
      >
        <p className="text-xs tracking-[0.2em] text-primary font-semibold uppercase">
          ACCESS GRANTED
        </p>
        <div className="w-16 h-px bg-primary/30" />
      </motion.div>

      {/* Treasure found */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="flex flex-col items-center gap-5"
      >
        <h2 className="heading-display text-5xl md:text-6xl">
          TREASURE FOUND
        </h2>
        <p className="hero-label">DIG THE DATA 5.0</p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-sm text-muted-foreground"
      >
        Investigation complete.
      </motion.p>

      {/* Collected word */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex gap-2"
      >
        {"NITER".split("").map((l, i) => (
          <span
            key={i}
            className="letter-slot filled letter-slot-glow"
          >
            {l}
          </span>
        ))}
      </motion.div>

      {/* Time + restart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col items-center gap-5"
      >
        <p className="text-xs text-muted-foreground/50 tracking-wider">
          Completion time: {time}
        </p>
        <button className="btn-cta" onClick={onRestart}>
          RESTART GAME
        </button>
      </motion.div>
    </motion.div>
  );
}
