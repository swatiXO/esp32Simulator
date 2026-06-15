import { useSimulatorStore } from '@/store/useSimulatorStore';
import type { Block } from '@/types';

// Sleep utility for async delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Context passed to handlers
interface SimulationContext {
  setPin: (pin: number, value: number, mode?: string) => void;
  appendSerial: (text: string, newline?: boolean) => void;
  clearOledBuffer: () => void;
  setOledCursor: (x: number, y: number) => void;
  printToOledBuffer: (text: string) => void;
  updateOledScreen: () => void;
  variables: Record<string, any>;
}

/**
 * Resolves a value that could be a literal number or a variable name.
 */
function resolveValue(val: any, ctx: SimulationContext): number {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // If it exists in variables, use that
    if (ctx.variables[trimmed] !== undefined) {
      return Number(ctx.variables[trimmed]);
    }
    // Otherwise try to parse as number
    return Number(trimmed);
  }
  return Number(val ?? 0);
}

// Block handlers
type BlockHandler = (block: Block, ctx: SimulationContext) => Promise<void> | void;

const handlers: Record<string, BlockHandler> = {
  dw_high: (block, ctx) => {
    const pin = Number(block.values.pin ?? 2);
    ctx.setPin(pin, 1, 'digital');
  },
  dw_low: (block, ctx) => {
    const pin = Number(block.values.pin ?? 2);
    ctx.setPin(pin, 0, 'digital');
  },
  pwm_write: (block, ctx) => {
    const pin = resolveValue(block.values.pin, ctx);
    const val = resolveValue(block.values.val, ctx);
    ctx.setPin(pin, val, 'pwm');
  },
  servo_write: (block, ctx) => {
    const pin = resolveValue(block.values.pin, ctx);
    const deg = resolveValue(block.values.deg, ctx);
    ctx.setPin(pin, deg, 'servo');
  },
  tone_on: (block, ctx) => {
    const pin = resolveValue(block.values.pin, ctx);
    const freq = resolveValue(block.values.freq, ctx);
    ctx.setPin(pin, freq, 'tone');
  },
  tone_off: (block, ctx) => {
    const pin = resolveValue(block.values.pin, ctx);
    ctx.setPin(pin, 0, 'tone');
  },
  delay_ms: async (block, ctx) => {
    const ms = resolveValue(block.values.ms, ctx);
    await sleep(ms);
  },
  delay_sec: async (block, ctx) => {
    const sec = resolveValue(block.values.sec, ctx);
    await sleep(sec * 1000);
  },
  serial_print: (block, ctx) => {
    const msg = String(block.values.msg ?? '');
    ctx.appendSerial(msg, false);
  },
  serial_printvar: (block, ctx) => {
    const varName = String(block.values.var ?? '');
    ctx.appendSerial(String(ctx.variables[varName] ?? ''), false);
  },
  serial_println: (block, ctx) => {
    const label = String(block.values.label ?? '');
    const varName = String(block.values.var ?? '');
    ctx.appendSerial(`${label}${ctx.variables[varName] ?? ''}`, true);
  },
  oled_setup: (block, ctx) => {
    ctx.clearOledBuffer();
    ctx.updateOledScreen();
  },
  oled_clear: (block, ctx) => {
    ctx.clearOledBuffer();
  },
  oled_set_cursor: (block, ctx) => {
    const x = Number(block.values.x ?? 0);
    const y = Number(block.values.y ?? 0);
    ctx.setOledCursor(x, y);
  },
  oled_print: (block, ctx) => {
    const text = String(block.values.text ?? '');
    ctx.printToOledBuffer(text);
  },
  oled_printvar: (block, ctx) => {
    const varName = String(block.values.var ?? '');
    const val = ctx.variables[varName];
    ctx.printToOledBuffer(String(val ?? ''));
  },
  oled_display: (block, ctx) => {
    ctx.updateOledScreen();
  },
  blink: async (block, ctx) => {
    const pin = Number(block.values.pin ?? 2);
    const ms = Number(block.values.ms ?? 500);
    ctx.setPin(pin, 1, 'digital');
    await sleep(ms);
    ctx.setPin(pin, 0, 'digital');
    await sleep(ms);
  },
  var_int: (block, ctx) => {
    const name = String(block.values.name ?? 'myNum');
    ctx.variables[name] = Number(block.values.val ?? 0);
  },
  var_str: (block, ctx) => {
    const name = String(block.values.name ?? 'myText');
    ctx.variables[name] = String(block.values.val ?? '');
  },
  var_bool: (block, ctx) => {
    const name = String(block.values.name ?? 'isOn');
    ctx.variables[name] = block.values.val === 'true';
  },
  var_add: (block, ctx) => {
    const name = String(block.values.name ?? 'myNum');
    const step = Number(block.values.step ?? 1);
    if (ctx.variables[name] === undefined) {
      ctx.variables[name] = 0;
    }
    ctx.variables[name] += step;
  }
};

/**
 * Safely evaluates a logic condition (e.g., "btnState == 1") dynamically against the 
 * current simulation variables. Uses a safe Regex parser to prevent execution of arbitrary code.
 * 
 * @param cond - The condition string from the if_block or while_loop
 * @param variables - The dictionary of current variable values in the simulation
 * @returns boolean evaluating if the condition is true or false
 */
function evaluateCondition(cond: string, variables: Record<string, any>): boolean {
  try {
    const match = cond.match(/^\s*(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+?)\s*$/);
    if (!match) {
      // If it's a direct boolean variable evaluation like "isOn"
      return Boolean(variables[cond.trim()]);
    }

    const [, leftRaw, op, rightRaw] = match;
    const leftVar = leftRaw.trim();
    const rightVar = rightRaw.trim();

    // Resolve left side
    const left = variables[leftVar] !== undefined ? variables[leftVar] :
      (isNaN(Number(leftVar)) ? leftVar : Number(leftVar));

    // Resolve right side
    const right = variables[rightVar] !== undefined ? variables[rightVar] :
      (isNaN(Number(rightVar)) ? rightVar : Number(rightVar));

    switch (op) {
      case '==': return left == right;
      case '!=': return left != right;
      case '>': return left > right;
      case '<': return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      default: return false;
    }
  } catch (e) {
    return false;
  }
}

/**
 * The core asynchronous Code Interpreter. 
 * Replaces simple loop evaluation with an Instruction Pointer (IP) based engine 
 * to support variable state reading, If/Otherwise branches, and While/For loops.
 * 
 * @param blocks - The array of blocks to execute
 * @param ctx - The simulation context containing pin setter and variables
 */
async function execute(blocks: Block[], ctx: SimulationContext) {
  let ip = 0; // Instruction Pointer
  const loopStack: number[] = []; // Tracks return points for loops
  const loopCounters: Record<number, number> = {}; // Tracks iteration limits for for_loops
  let iterations = 0;

  while (ip < blocks.length && useSimulatorStore.getState().isRunning) {
    if (++iterations % 50 === 0) {
      await sleep(0);
    }

    const block = blocks[ip];
    const handler = handlers[block.type];

    if (handler) {
      await handler(block, ctx);
      ip++;
      continue;
    }

    // Handlers that require manipulating the instruction pointer (IP) directly
    switch (block.type) {
      case 'btn_read': {
        const pin = Number(block.values.pin ?? 12);
        const varName = String(block.values.var ?? 'btnState');
        ctx.variables[varName] = useSimulatorStore.getState().pins[pin]?.value || 0;
        ip++;
        break;
      }
      case 'pir_read':
      case 'analog_read':
      case 'dht_temp':
      case 'dht_hum':
      case 'ultrasonic': {
        // Generic sensor reads for now just inject a mock value or 0
        const varName = String(block.values.var ?? 'sensorVal');
        const pin = Number(block.values.pin ?? 14);
        ctx.variables[varName] = useSimulatorStore.getState().pins[pin]?.value || 0;
        ip++;
        break;
      }

      case 'if_block': {
        const cond = String(block.values.cond ?? 'false');
        if (evaluateCondition(cond, ctx.variables)) {
          // Condition true, proceed inside the if
          ip++;
        } else {
          // Condition false, scan forward to matching else_block or end_if
          let depth = 1;
          ip++;
          while (ip < blocks.length && depth > 0) {
            const t = blocks[ip].type;
            if (t === 'if_block') depth++;
            else if (t === 'end_if') depth--;
            else if (t === 'else_block' && depth === 1) {
              // Found our else_block, jump PAST it so we enter the else body
              ip++;
              break;
            }
            if (depth > 0) ip++;
          }
        }
        break;
      }
      case 'else_block': {
        // If we reached this normally, it means the 'if' condition was true and we executed its contents.
        // We must now skip the else block up to the end_if.
        let depth = 1;
        ip++;
        while (ip < blocks.length && depth > 0) {
          const t = blocks[ip].type;
          if (t === 'if_block') depth++;
          else if (t === 'end_if') depth--;
          if (depth > 0) ip++;
        }
        break;
      }
      case 'end_if': {
        ip++;
        break;
      }

      case 'while_loop': {
        const varName = String(block.values.var ?? 'counter').trim();
        const op = String(block.values.op ?? '>').trim();
        const val = String(block.values.val ?? '0').trim();
        const cond = `${varName} ${op} ${val}`;
        if (evaluateCondition(cond, ctx.variables)) {
          // Push this loop's index so we can jump back
          if (loopStack[loopStack.length - 1] !== ip) {
            loopStack.push(ip);
          }
          ip++;
        } else {
          // Condition false, skip to end_loop
          if (loopStack[loopStack.length - 1] === ip) {
            loopStack.pop();
          }
          let depth = 1;
          ip++;
          while (ip < blocks.length && depth > 0) {
            const t = blocks[ip].type;
            if (t === 'while_loop' || t === 'for_loop') depth++;
            else if (t === 'end_loop') depth--;
            if (depth > 0) ip++;
          }
        }
        break;
      }

      case 'for_loop': {
        const times = Number(block.values.times ?? 5);
        if (loopCounters[ip] === undefined) {
          loopCounters[ip] = times;
        }

        if (loopCounters[ip] > 0) {
          loopCounters[ip]--;
          if (loopStack[loopStack.length - 1] !== ip) {
            loopStack.push(ip);
          }
          ip++;
        } else {
          // Finished iterating
          delete loopCounters[ip];
          if (loopStack[loopStack.length - 1] === ip) {
            loopStack.pop();
          }
          let depth = 1;
          ip++;
          while (ip < blocks.length && depth > 0) {
            const t = blocks[ip].type;
            if (t === 'while_loop' || t === 'for_loop') depth++;
            else if (t === 'end_loop') depth--;
            if (depth > 0) ip++;
          }
        }
        break;
      }

      case 'end_loop': {
        if (loopStack.length > 0) {
          // Jump back to the start of the loop to re-evaluate the condition or counter
          ip = loopStack[loopStack.length - 1];
        } else {
          ip++;
        }
        break;
      }

      default:
        // Safely ignore unimplemented blocks
        ip++;
        break;
    }
  }
}

export async function runLoop(blocks: Block[]) {
  const store = useSimulatorStore.getState();
  if (store.isRunning) return;

  store.setRunning(true);
  store.resetSimulation();
  useSimulatorStore.getState().setRunning(true);

  const ctx: SimulationContext = {
    setPin: useSimulatorStore.getState().setPin,
    appendSerial: useSimulatorStore.getState().appendSerial,
    clearOledBuffer: useSimulatorStore.getState().clearOledBuffer,
    setOledCursor: useSimulatorStore.getState().setOledCursor,
    printToOledBuffer: useSimulatorStore.getState().printToOledBuffer,
    updateOledScreen: useSimulatorStore.getState().updateOledScreen,
    // Pre-inject common ESP32 constants so things like "btnState == HIGH" evaluate correctly
    variables: { HIGH: 1, LOW: 0, high: 1, low: 0 },
  };

  // Run the sequence continuously
  while (useSimulatorStore.getState().isRunning) {
    await execute(blocks, ctx);

    // Critical: Yield the thread to avoid completely locking the browser
    // when executing synchronous block loops without physical delay_ms blocks.
    await sleep(10);
  }
}

export function stopSimulation() {
  useSimulatorStore.getState().setRunning(false);
}
