import { useEffect, useReducer } from "react";

const SYMBOL = { "+": "+", "-": "−", "*": "×", "/": "÷" };

const INITIAL = { display: "0", prev: null, op: null, fresh: false, error: false, expr: "" };
const DIV_ZERO = { ...INITIAL, display: "Cannot divide by 0", error: true };

const fmt = (n) => String(parseFloat(Number(n).toPrecision(12)));

function calc(a, b, op) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? null : a / b;
    default: return b;
  }
}

function reducer(state, action) {
  let s = state;
  if (s.error) {
    if (action.type === "clear") return INITIAL;
    if (action.type === "digit" || action.type === "dot") s = INITIAL;
    else return s;
  }

  switch (action.type) {
    case "digit": {
      if (s.fresh) return { ...s, display: action.value, fresh: false, expr: s.op ? s.expr : "" };
      if (s.display === "0") return { ...s, display: action.value };
      if (s.display.replace(/[-.]/g, "").length >= 12) return s;
      return { ...s, display: s.display + action.value };
    }
    case "dot": {
      if (s.fresh) return { ...s, display: "0.", fresh: false, expr: s.op ? s.expr : "" };
      if (s.display.includes(".")) return s;
      return { ...s, display: s.display + "." };
    }
    case "op": {
      // Changing your mind about the operator before typing the next number.
      if (s.op && s.fresh) {
        return { ...s, op: action.value, expr: `${fmt(s.prev)} ${SYMBOL[action.value]}` };
      }
      let value = Number(s.display);
      if (s.op) {
        const result = calc(s.prev, value, s.op);
        if (result === null) return DIV_ZERO;
        value = result;
      }
      return {
        ...s,
        prev: value,
        op: action.value,
        fresh: true,
        display: fmt(value),
        expr: `${fmt(value)} ${SYMBOL[action.value]}`,
      };
    }
    case "equals": {
      if (!s.op) return s;
      const b = Number(s.display);
      const result = calc(s.prev, b, s.op);
      if (result === null) return DIV_ZERO;
      return {
        display: fmt(result),
        prev: null,
        op: null,
        fresh: true,
        error: false,
        expr: `${fmt(s.prev)} ${SYMBOL[s.op]} ${fmt(b)} =`,
      };
    }
    case "back": {
      if (s.fresh) return s;
      return { ...s, display: s.display.length <= 1 ? "0" : s.display.slice(0, -1) };
    }
    case "clear":
      return INITIAL;
    default:
      return s;
  }
}

function Key({ label, onPress, className = "", aria }) {
  return (
    <button
      type="button"
      aria-label={aria || label}
      onClick={onPress}
      className={
        "h-16 rounded-xl text-2xl font-semibold text-white select-none " +
        "transition-transform duration-100 active:scale-95 " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber " +
        className
      }
    >
      {label}
    </button>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (/^[0-9]$/.test(k)) dispatch({ type: "digit", value: k });
      else if (k === ".") dispatch({ type: "dot" });
      else if (["+", "-", "*", "/"].includes(k)) {
        e.preventDefault();
        dispatch({ type: "op", value: k });
      } else if (k === "Enter" || k === "=") {
        e.preventDefault();
        dispatch({ type: "equals" });
      } else if (k === "Backspace") dispatch({ type: "back" });
      else if (k === "Escape") dispatch({ type: "clear" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const digit = (v) => () => dispatch({ type: "digit", value: v });
  const op = (v) => () => dispatch({ type: "op", value: v });

  const key = "bg-key hover:bg-[#25606b]";
  const opKey = "bg-op hover:bg-[#37808d]";

  const displaySize =
    state.error ? "text-2xl" : state.display.length > 9 ? "text-4xl" : "text-5xl";

  return (
    <main className="min-h-screen px-4 py-8 flex flex-col items-center justify-center gap-8 md:flex-row md:items-start md:gap-12">
      <section aria-label="Calculator" className="w-full max-w-sm rounded-3xl bg-shell p-5 shadow-xl">
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex h-32 flex-col items-end justify-end rounded-2xl bg-screen px-5 py-4 text-white overflow-hidden"
        >
          <div className="h-6 text-sm text-white/60">{state.expr}</div>
          <div className={`font-extrabold tabular-nums break-all text-right ${displaySize} ${state.error ? "text-amber" : ""}`}>
            {state.display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Key label="AC" aria="All clear" onPress={() => dispatch({ type: "clear" })} className="bg-amber !text-shell hover:brightness-110" />
          <Key label="⌫" aria="Backspace" onPress={() => dispatch({ type: "back" })} className={opKey} />
          <Key label="÷" aria="Divide" onPress={op("/")} className={opKey} />
          <Key label="×" aria="Multiply" onPress={op("*")} className={opKey} />

          <Key label="7" onPress={digit("7")} className={key} />
          <Key label="8" onPress={digit("8")} className={key} />
          <Key label="9" onPress={digit("9")} className={key} />
          <Key label="−" aria="Subtract" onPress={op("-")} className={opKey} />

          <Key label="4" onPress={digit("4")} className={key} />
          <Key label="5" onPress={digit("5")} className={key} />
          <Key label="6" onPress={digit("6")} className={key} />
          <Key label="+" aria="Add" onPress={op("+")} className={opKey} />

          <Key label="1" onPress={digit("1")} className={key} />
          <Key label="2" onPress={digit("2")} className={key} />
          <Key label="3" onPress={digit("3")} className={key} />
          <Key label="=" aria="Equals" onPress={() => dispatch({ type: "equals" })} className="row-span-2 !h-auto bg-amber !text-shell hover:brightness-110" />

          <Key label="0" onPress={digit("0")} className={`col-span-2 ${key}`} />
          <Key label="." aria="Decimal point" onPress={() => dispatch({ type: "dot" })} className={key} />
        </div>
      </section>

      <aside className="w-full max-w-sm text-shell">
        <h1 className="text-2xl font-extrabold">How to use the calculator</h1>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>Tap or type numbers (0–9) and a decimal point.</li>
          <li>Choose an operator: +, −, ×, or ÷.</li>
          <li>Enter the next number, then press = to see the result.</li>
          <li>Use ⌫ to delete the last digit and AC to start over.</li>
        </ol>

        <h2 className="mt-6 text-lg font-extrabold">Supported operations</h2>
        <p className="mt-2">Addition, subtraction, multiplication, and division. Dividing by zero shows an error until you press AC or type a new number.</p>

        <h2 className="mt-6 text-lg font-extrabold">Keyboard shortcuts</h2>
        <p className="mt-2">
          Digits and <code>.</code> to enter numbers, <code>+ - * /</code> for operators, <code>Enter</code> for equals,
          <code> Backspace</code> to delete, <code>Esc</code> to clear.
        </p>
      </aside>
    </main>
  );
}
