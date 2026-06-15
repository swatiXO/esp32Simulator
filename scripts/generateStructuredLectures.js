const fs = require('fs');
const path = require('path');

const lecsBase = path.join(__dirname, '..', 'public', 'lecs', 'levels');
const publicBase = '/lecs/levels';

// Pre-authored high-quality quizzes for all 16 lessons
const QUIZ_DATABASE = {
  '1-1': [
    {
      question: 'What does the ESP32 microcontroller do?',
      hint: 'Think about what the word "controller" means — what does a controller do to hardware?',
      options: [
        'It is a high-end graphics card for running massive 3D video games',
        'It receives visual blocks/code instructions and directly controls physical hardware outputs',
        'It operates exclusively as an external battery pack to supply power',
        'It works as a keyboard controller for standard computers'
      ],
      correct: 1,
      explanation: 'The ESP32 is a compact, programmable microcontroller designed to read input states and drive physical actuators and outputs.'
    },
    {
      question: 'Why do we need to set the "Pin Mode" (pinMode)?',
      hint: 'Think of a pin like a door — before using it, does the ESP32 need to know if signals flow IN or OUT?',
      options: [
        'To change the physical color of the connected LED bulb',
        'To tell the ESP32 whether a specific pin should act as an Input (receiver) or Output (sender)',
        'To increase the clock speed and make the microcontroller execute instructions faster',
        'To establish a secure connection to the local WiFi network'
      ],
      correct: 1,
      explanation: 'Setting pinMode is mandatory because the microcontroller needs to configure its internal solid-state registers to either drive current (OUTPUT) or sample incoming voltage (INPUT).'
    },
    {
      question: 'What do "HIGH" and "LOW" represent in digital control?',
      hint: 'Digital means only two possible states — think of a simple light switch: it is either ON or OFF.',
      options: [
        'HIGH represents a dangerous 100V spike, and LOW represents 0V safety',
        'HIGH turns the signal ON (applying full voltage), while LOW turns the signal OFF (zero voltage)',
        'HIGH controls output audio volume, and LOW controls display brightness',
        'HIGH makes loops run slower, and LOW makes loops execute faster'
      ],
      correct: 1,
      explanation: 'Digital signals are binary: HIGH applies the supply voltage (3.3V) to illuminate or activate components, and LOW pulls it down to ground (0V) to turn them off.'
    }
  ],
  '1-2': [
    {
      question: 'Why could we not clearly see the LED blinking in Lesson 1.1 without delays?',
      hint: 'The ESP32 runs at 240MHz — try to imagine how many ON/OFF transitions happen in a single second.',
      options: [
        'The physical LED bulb was defective and burned out',
        'The ESP32 runs commands in microseconds—too fast for the human eye to perceive the transitions',
        'The blocks workspace had a logic compilation conflict',
        'The microcontroller did not have a connected power supply'
      ],
      correct: 1,
      explanation: 'The ESP32 runs at 240MHz, executing millions of instructions per second. Without pauses, the LED switches ON and OFF so rapidly that human eyes only perceive a constant, dim light.'
    },
    {
      question: 'What is 1 second in the millisecond (ms) scale used by delays?',
      hint: 'The prefix "milli" means one-thousandth. So one millisecond = 1/1000th of a second.',
      options: [
        '10 milliseconds',
        '100 milliseconds',
        '1,000 milliseconds',
        '10,000 milliseconds'
      ],
      correct: 2,
      explanation: 'Embedded system delay blocks use milliseconds as their base unit. 1,000 milliseconds (ms) equal exactly 1 second.'
    },
    {
      question: 'Does adding a delay block alter the logical rules of your program?',
      hint: 'Think about what a pause does — does it change the ON/OFF setting of a pin, or only when it happens?',
      options: [
        'Yes, it deletes previous pin configurations and variables',
        'No, it only pauses execution flow, changing the timing of transitions without altering states',
        'Yes, it forces all output pins to turn LOW automatically',
        'Yes, it puts the ESP32 into a permanent shutoff state'
      ],
      correct: 1,
      explanation: 'A delay block merely suspends the processor execution loop for the set duration. It does not alter pin states, variable values, or configuration modes.'
    }
  ],
  '1-3': [
    {
      question: 'In what order does the ESP32 execute the blocks you arrange in the workspace?',
      options: [
        'It executes all blocks simultaneously in parallel',
        'It executes blocks in random cycles to balance load',
        'It executes instructions sequentially, step-by-step from top to bottom',
        'It executes blocks from the bottom block up to the top block'
      ],
      correct: 2,
      explanation: 'Microcontrollers are sequential machines; they read and execute instructions one by one in the precise top-to-bottom sequence they are laid out.'
    },
    {
      question: 'What happens if you omit a delay block after setting a pin state to LOW inside a loop?',
      options: [
        'The output pin remains at a constant LOW state forever',
        'The output pin remains at a constant HIGH state forever',
        'The LOW state is executed so briefly that the LED appears constantly ON',
        'The ESP32 stops running and displays an error code'
      ],
      correct: 2,
      explanation: 'If no delay follows the LOW command, the processor instantly loops back to the top of the cycle and turns the pin HIGH in microseconds, leaving no observable time in the OFF state.'
    },
    {
      question: 'What is meant by an output pin\'s "electrical state"?',
      options: [
        'The physical thickness and gauge of the jumper wire',
        'The active voltage condition of the pin, indicating whether it is driven HIGH (3.3V) or LOW (0V)',
        'The registered identifier key of the pin header',
        'The length of the block sequence configured'
      ],
      correct: 1,
      explanation: 'An electrical state refers to whether the pin is outputting active voltage (HIGH/3.3V) to push current, or is clamped to ground (LOW/0V).'
    }
  ],
  '1-4': [
    {
      question: 'What is the main operational difference between Setup and Loop blocks?',
      options: [
        'Setup runs repeatedly in a cycle, whereas Loop runs once at startup',
        'Setup runs exactly once when power is applied, while Loop repeats continuously in an infinite cycle',
        'They function identically and can be used interchangeably',
        'Setup manages sensor variables, while Loop handles hardware digital signals'
      ],
      correct: 1,
      explanation: 'Setup is meant for one-time configurations (e.g. pinMode) performed at startup. Loop runs immediately afterward, repeating its contents indefinitely.'
    },
    {
      question: 'Why is the Loop block described as an "infinite cycle"?',
      options: [
        'Because it runs continuously forever as long as the device has electrical power',
        'Because it does not possess a structured entry point',
        'Because it consumes an infinite amount of physical hardware memory',
        'Because it overrides emergency physical disconnects'
      ],
      correct: 0,
      explanation: 'A loop block is a continuous cycle. Once the processor reaches the final instruction block inside a loop, it wraps back to the first instruction instantly, repeating forever.'
    },
    {
      question: 'What would happen if we placed "pinMode" blocks inside the continuous Loop block?',
      options: [
        'The program would immediately crash and fail to run',
        'The program would function, but is highly inefficient because pins only need to be configured once',
        'The connected LED would flash twice as bright',
        'The input pins would burn out due to electrical overload'
      ],
      correct: 1,
      explanation: 'pinMode is a one-time configuration. Placing it in Loop causes the ESP32 to waste clock cycles re-configuring the same pin state millions of times per second.'
    }
  ],
  '2-1': [
    {
      question: 'What defines a "digital input"?',
      options: [
        'A continuous, slowly changing voltage range',
        'An electrical signal constrained to exactly two distinct states: HIGH (voltage detected) or LOW (no voltage)',
        'An encrypted packet of bytes transferred over a local network',
        'A serial character printed to the monitor console'
      ],
      correct: 1,
      explanation: 'Digital input reads binary conditions—either an electrical potential exists (HIGH) or it is connected to ground (LOW).'
    },
    {
      question: 'Why must a physical button pin be configured as an INPUT?',
      options: [
        'To allow the ESP32 to push current and light up the button cap',
        'To configure the pin\'s internal logic gate to monitor and read external voltages',
        'To direct the compiler to skip that pin during execution loops',
        'To clear previous analog sensor variables'
      ],
      correct: 1,
      explanation: 'An INPUT configuration prepares the pin to behave as a sensor port with high impedance, reading external logic states without generating currents.'
    },
    {
      question: 'What does "digitalRead(4)" return when a pressed button drives 3.3V into Pin 4?',
      options: [
        '0',
        'LOW',
        'HIGH',
        '4095'
      ],
      correct: 2,
      explanation: 'Pressing the button applies voltage (3.3V) directly to the pin. `digitalRead` samples this voltage and returns HIGH.'
    }
  ],
  '2-2': [
    {
      question: 'What is the functional purpose of an "IF" block in microcontroller logic?',
      options: [
        'To create structured repeating cycles of instructions',
        'To evaluate a condition and branch execution down a specific path only if the condition is true',
        'To establish initial pin output registers',
        'To print diagnostic text streams to the serial monitor'
      ],
      correct: 1,
      explanation: 'IF blocks implement conditional execution. They evaluate a boolean state: if true, the interior blocks run; if false, they are bypassed.'
    },
    {
      question: 'How does an "ELSE" block function inside conditional logic?',
      options: [
        'It executes a backup set of instructions only when the preceding IF condition is false',
        'It duplicates the behavior of the IF block to balance safety',
        'It immediately halts the execution loop and resets variables',
        'It reads continuous analog signals from pins'
      ],
      correct: 0,
      explanation: 'The ELSE block is a fallback execution path. It handles cases where all preceding IF/ELSE-IF conditions evaluate to false.'
    },
    {
      question: 'Why must input checks and conditional decision blocks be placed in the Loop?',
      options: [
        'To make sure they only execute once at startup',
        'To continuously check the input state in real-time, responding dynamically to changes',
        'To compress code and compile faster',
        'To preserve the values of stored memory variables'
      ],
      correct: 1,
      explanation: 'Inputs like buttons can change at any moment. Placing decision logic inside Loop forces the ESP32 to continuously poll the inputs, making the device highly responsive.'
    }
  ],
  '2-3': [
    {
      question: 'What condition does the Logical AND (&&) operator require to return true?',
      options: [
        'It requires only one of its sub-conditions to be true',
        'It requires all connected sub-conditions to be simultaneously true',
        'It requires all connected sub-conditions to be simultaneously false',
        'It only works with analog numbers'
      ],
      correct: 1,
      explanation: 'The AND operator performs logical conjunction. The entire expression evaluates to true if and only if every single term is true.'
    },
    {
      question: 'What condition does the Logical OR (||) operator require to evaluate to true?',
      options: [
        'It requires every single connected sub-condition to be true',
        'It requires at least one of its sub-conditions to be true',
        'It requires all connected sub-conditions to be false',
        'It only checks digital pin states'
      ],
      correct: 1,
      explanation: 'The OR operator performs logical disjunction. It returns true if at least one condition in the expression is true.'
    },
    {
      question: 'What is the action of the Logical NOT (!) operator?',
      options: [
        'It deletes a variable\'s value from the hardware memory',
        'It inverts a boolean state (transforming true to false, or HIGH to LOW)',
        'It pauses the loop execution for a fraction of a second',
        'It multiplies two sensor states together'
      ],
      correct: 1,
      explanation: 'The NOT operator inverts boolean logic. Applying `!` to true yields false, and applying it to a HIGH read yields LOW.'
    }
  ],
  '2-4': [
    {
      question: 'What is a variable in programming?',
      options: [
        'A physical hardware component like a button or switch',
        'A labeled space in memory used to store data that can change as the program runs',
        'A colored LED light bulb',
        'A command that pauses the ESP32'
      ],
      correct: 1,
      explanation: 'Variables are named locations in memory that act as data containers, holding values that can be read, written, and manipulated.'
    },
    {
      question: 'What does the instruction "counter = counter + 1" do?',
      options: [
        'It changes the counter name to "1"',
        'It reads the current value of counter, adds 1, and stores the new sum back into counter',
        'It resets the counter back to zero',
        'It checks if the counter equals 1'
      ],
      correct: 1,
      explanation: 'This is an increment operation. The processor evaluates the right-hand side (`counter + 1`) and reassigns the resulting value to the variable.'
    },
    {
      question: 'Why is variable initialization (like setting counter to 0) typically placed above or in Setup?',
      options: [
        'To force the variable to reset to zero on every loop iteration',
        'To define its initial starting value once, preventing it from resetting on every loop cycle',
        'To delete it when the program is stopped',
        'To speed up variables loading times'
      ],
      correct: 1,
      explanation: 'If a variable is initialized inside Loop, it will reset to its starting value on every cycle, erasing any cumulative changes (like counting steps).'
    }
  ],
  '3-1': [
    {
      question: 'What is the core difference between digital and analog inputs?',
      options: [
        'Digital inputs have continuous states, whereas analog inputs have only two',
        'Digital inputs read binary ON/OFF states, while analog inputs read continuous, varying voltage levels',
        'Digital inputs are for LEDs, and analog inputs are for buttons',
        'Analog inputs are much faster than digital inputs'
      ],
      correct: 1,
      explanation: 'Digital reads are binary (HIGH or LOW). Analog inputs sample a continuous range of voltages between 0V and 3.3V, mapping them to numerical ranges.'
    },
    {
      question: 'What is the full resolution range of the ESP32\'s Analog-to-Digital Converter (ADC)?',
      options: [
        '0 to 255 (8-bit)',
        '0 to 1,023 (10-bit)',
        '0 to 4,095 (12-bit)',
        '0 to 10,000'
      ],
      correct: 2,
      explanation: 'The ESP32 has a high-resolution 12-bit ADC, which translates analog sensor voltages into discrete integer values from 0 to 4,095.'
    },
    {
      question: 'How does an LDR (Photoresistor) work?',
      options: [
        'It operates as a small electric motor that spins when lit up',
        'It changes its electrical resistance dynamically based on the intensity of light hitting it',
        'It blinks red to warn the user of light shifts',
        'It connects the ESP32 directly to the cloud'
      ],
      correct: 1,
      explanation: 'An LDR is a light-sensitive resistor. As light increases, its resistance drops, causing the voltage across it to shift in a readable curve.'
    }
  ],
  '3-2': [
    {
      question: 'What does Pulse Width Modulation (PWM) simulate?',
      options: [
        'A binary input toggle state',
        'An analog voltage level on a digital pin by switching the output ON and OFF extremely fast',
        'A faster execution cycle for the main loop',
        'A secure wireless connection layer'
      ],
      correct: 1,
      explanation: 'PWM pulses a digital pin HIGH and LOW at high frequencies. Adjusting the ratio of ON vs OFF time simulates varying output voltages to dim LEDs or speed motors.'
    },
    {
      question: 'What is "Duty Cycle" in a PWM signal?',
      options: [
        'The clock frequency of the processor chip',
        'The percentage of time the digital signal remains HIGH in a single repeating cycle period',
        'The time it takes to compile code blocks',
        'The physical range of the LDR sensor'
      ],
      correct: 1,
      explanation: 'Duty cycle defines the pulse width. A 0% duty cycle is fully off, 50% is on half the time (half-brightness), and 100% is fully on.'
    },
    {
      question: 'In an 8-bit PWM setup (0-255), what value drives an LED to approximately half-brightness?',
      options: [
        '255',
        '0',
        '127',
        '50'
      ],
      correct: 2,
      explanation: 'With 8-bit resolution, the scale is 0 to 255. Half-brightness corresponds to the midpoint of the range, which is roughly 127.'
    }
  ],
  '3-3': [
    {
      question: 'Why do we need a mathematical "Map" block (map function)?',
      options: [
        'To load GPS tracking data into the microcontroller',
        'To scale a value proportionally from an input range (like 0-4095) to an output range (like 0-255)',
        'To trace wire routing paths on the virtual breadboard',
        'To print text logs in the serial terminal'
      ],
      correct: 1,
      explanation: 'Sensors read in one resolution (e.g. 12-bit: 0-4095) but actuators expect another (e.g. 8-bit PWM: 0-255). Mapping translates these ranges proportionally.'
    },
    {
      question: 'What does the operation `map(2048, 0, 4095, 0, 255)` return?',
      options: [
        '0',
        '255',
        '127',
        '2048'
      ],
      correct: 2,
      explanation: '2048 is exactly in the middle of 0 to 4095. Scaling it to the range of 0 to 255 yields the midpoint value, which is 127.'
    },
    {
      question: 'What is the danger of mapping a sensor without verifying the actual range?',
      options: [
        'The ESP32 will suffer permanent hardware damage',
        'The output might clip at maximum limits, stay off, or respond erratically',
        'The block code will refuse to compile',
        'The analog input pins will convert to digital outputs'
      ],
      correct: 1,
      explanation: 'Incorrect ranges lead to scaling math errors. Values can overflow or clip, resulting in components that stay fully ON, OFF, or behave unpredictably.'
    }
  ],
  '3-4': [
    {
      question: 'What is a "real-time feedback control loop"?',
      options: [
        'An error sequence that locks up the computer',
        'A system that continuously reads inputs, makes logical decisions, and immediately updates outputs in a loop',
        'A simple jumper wire loop on a breadboard',
        'A serial output text stream'
      ],
      correct: 1,
      explanation: 'Feedback control loops continuously monitor changing environments via sensors, evaluating conditions in real-time to adjust outputs and maintain target states.'
    },
    {
      question: 'In a night-light feedback system, why does the LED brighten when LDR voltage drops?',
      options: [
        'The LDR acts as a physical power funnel for the LED',
        'The block program maps low light inputs (dark conditions) to high PWM duty cycles (bright output)',
        'The LED matches ambient lighting automatically',
        'It is a random side-effect of analog pins sharing voltage'
      ],
      correct: 1,
      explanation: 'The code is written to invert or map low-input light levels to high-intensity PWM duty cycles, creating an automatic, responsive lighting system.'
    },
    {
      question: 'Why are threshold limits critical in automated control loops?',
      options: [
        'To slow down the execution frequency',
        'To trigger immediate safety actions (like emergency cutoffs) as soon as sensors detect unsafe states',
        'To print pretty charts to the screen',
        'To store more variables'
      ],
      correct: 1,
      explanation: 'Threshold limits set safety bounds. Checking them in fast loops allows triggering shutdowns or alarms the instant a reading exceeds safe parameters.'
    }
  ],
  '4-1': [
    {
      question: 'What is the primary operational purpose of a For Loop?',
      options: [
        'To execute a conditional branch exactly once',
        'To repeat a specific sequence of instructions a pre-determined, set number of times',
        'To create infinite loops that run forever',
        'To temporarily sleep the ESP32 processor'
      ],
      correct: 1,
      explanation: 'For loops iterate a code block a designated number of times, managing the index and bounds automatically.'
    },
    {
      question: 'In a For Loop set to iterate 5 times, how many times will the internal code block execute?',
      options: [
        '1 time',
        '4 times',
        '5 times',
        'Infinitely'
      ],
      correct: 2,
      explanation: 'The loop counter will run from its start bound to its limit, executing the block exactly 5 times.'
    },
    {
      question: 'Why is a For Loop better than copying the same blocks 10 times in a row?',
      options: [
        'Copying blocks makes the execution run faster',
        'It significantly reduces code redundancy, saves memory, and is much easier to maintain',
        'It gives higher voltage to the pins',
        'It overrides pin mode constraints'
      ],
      correct: 1,
      explanation: 'Loops compress code. Instead of copying blocks, a loop runs a single block multiple times, making the project clean, editable, and memory-efficient.'
    }
  ],
  '4-2': [
    {
      question: 'What controls when a While Loop stops executing?',
      options: [
        'A fixed internal count of 10 loops',
        'It stops as soon as its conditional expression evaluates to false',
        'When the connected delay block times out',
        'While loops never stop executing'
      ],
      correct: 1,
      explanation: 'While loops poll their condition on every iteration. The instant the conditional check is false, the loop exits and execution continues below.'
    },
    {
      question: 'What is the risk of a "While Loop" whose condition never evaluates to false?',
      options: [
        'It causes the ESP32 to run out of electricity',
        'It traps execution in an infinite loop, freezing the entire program and locking out all other blocks',
        'It resets all initialized variable counts',
        'It forces pins to switch from output to input'
      ],
      correct: 1,
      explanation: 'An infinite While Loop is a major bug. Since the condition is always true, the processor cannot exit the loop, locking up the entire system.'
    },
    {
      question: 'When is a While Loop preferred over a For Loop?',
      options: [
        'When you want to execute code faster',
        'When the number of repetitions is dynamic and depends on real-time events rather than a fixed count',
        'When you are blinking red LEDs',
        'While loops are always preferred over For loops'
      ],
      correct: 1,
      explanation: 'Use While loops when waiting for a dynamic trigger (like a button release or a sensor threshold) where you don\'t know the count in advance.'
    }
  ],
  '4-3': [
    {
      question: 'What does "nesting" mean in program flow architecture?',
      options: [
        'Deleting duplicate variables in memory',
        'Placing one control structure (like an IF statement or For Loop) inside the body of another control structure',
        'Wiring pins directly to one another',
        'Initializing pins in setup rather than loop'
      ],
      correct: 1,
      explanation: 'Nesting is placing control blocks inside other control blocks, forming a hierarchy (e.g. evaluating a condition inside a repeating loop).'
    },
    {
      question: 'If an IF statement is nested inside a For Loop that repeats 5 times, how many times is the IF condition checked?',
      options: [
        '1 time',
        '5 times',
        '0 times',
        'Infinitely'
      ],
      correct: 1,
      explanation: 'Because the IF block resides inside the loop body, it is executed and evaluated on every single pass of the loop.'
    },
    {
      question: 'How do you safely monitor button inputs during a repeating sequence of pin states?',
      options: [
        'By using huge delays (e.g. delay(10000))',
        'By placing digitalRead checks directly inside the repeating loop body to sample the button state rapidly',
        'By disabling interrupts on the pins',
        'By moving the button pin mode to output'
      ],
      correct: 1,
      explanation: 'Placing reading blocks inside the repeating loop ensures the input is sampled at high frequency, capturing button presses instantly.'
    }
  ],
  '4-4': [
    {
      question: 'What is a sequential multi-LED "chasing pattern"?',
      options: [
        'Turning all connected pins HIGH at the exact same moment',
        'Illuminating and extinguishing multiple pins in a timed, shifting sequential order',
        'A wireless network data package',
        'A random digital state check'
      ],
      correct: 1,
      explanation: 'A chasing pattern lights up pins in sequence (e.g. Pin 2, then Pin 4, then Pin 5) with brief pauses to create a moving light wave effect.'
    },
    {
      question: 'Why is precise coordination of pin state timing vital in active patterns?',
      options: [
        'To conserve electrical current on the board',
        'To prevent overlapping states where multiple pins actuate out of sync',
        'To keep variables from clearing',
        'To allow blocks to execute out of order'
      ],
      correct: 1,
      explanation: 'Coordination ensures display elements activate strictly according to the design sequence, preventing chaotic overlaps.'
    },
    {
      question: 'Why are index-based loops powerful for complex pattern animations?',
      options: [
        'They automatically turn off all hardware components',
        'They let a short block loop cycle through an ordered list of target pin numbers efficiently',
        'They are slower and consume less power',
        'They bypass compiler type checking'
      ],
      correct: 1,
      explanation: 'Iterating over sequence indices allows you to drive complex, multi-pin displays using a tiny set of loops, rather than writing hundreds of individual lines.'
    }
  ]
};

// Find files case-insensitively
function findContentFile(dirPath) {
  if (!fs.existsSync(dirPath)) return null;
  const files = fs.readdirSync(dirPath);
  const found = files.find(f => f.toLowerCase() === 'content.txt');
  return found ? path.join(dirPath, found) : null;
}

// Accent colors palette
const ACCENT_COLORS = [
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#0EA5E9', // Sky Blue
  '#F97316', // Orange
  '#14B8A6'  // Teal
];

// Emoji mapping for headers
const HEADER_EMOJIS = {
  'sensor': '🔬',
  'dht': '🌡️',
  'value': '📊',
  'input': '🔀',
  'important': '⭐',
  'reads': '🧠',
  'serial': '📟',
  'system': '⚙️',
  'insight': '🔑',
  'delay': '⏱️',
  'why': '❓',
  'what': '💡',
  'time': '⏳',
  'loop': '🔁',
  'infinite': '🔒',
  'setup': '⚙️',
  'command': '💻',
  'order': '📏',
  'decision': '🔀',
  'variable': '📦',
  'analog': '📊',
  'pwm': '🔆',
  'intensity': '🔆',
  'map': '🗺️',
  'feedback': '⚙️',
  'real-time': '🌐',
  'repeat': '🔁',
  'chase': '⚡',
  'pattern': '⚙️',
  'logic': '🔀'
};

function getEmojiForTitle(title) {
  const t = title.toLowerCase();
  for (const [key, emoji] of Object.entries(HEADER_EMOJIS)) {
    if (t.includes(key)) return emoji;
  }
  return '📝'; // Fallback
}

// Clean and parse content lines into structured JSON
function parseContentToStructured(filePath, relativeImageFolder, imagesList, stepIndexBase) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      levelTitle: 'Lesson Step',
      lessonTitle: '',
      stepType: '',
      sections: []
    };
  }

  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split(/\r?\n/).map(l => l.trim());

  let levelTitle = '';
  let stepType = '';
  let consumedIndices = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) {
      if (!levelTitle) {
        levelTitle = lines[i].replace(/^#+\s*/, '').trim();
        consumedIndices.push(i);
      } else if (!stepType) {
        stepType = lines[i].replace(/^#+\s*/, '').trim();
        consumedIndices.push(i);
        break;
      }
    }
  }

  let sections = [];
  let currentSection = {
    title: '',
    rawLines: []
  };

  const flushSection = () => {
    if (currentSection.title || currentSection.rawLines.length > 0) {
      sections.push({ ...currentSection });
    }
  };

  const startIndex = consumedIndices.length > 0 ? Math.max(...consumedIndices) + 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (line.startsWith('##')) {
      flushSection();
      currentSection = {
        title: line.replace(/^#+\s*/, '').replace(/:$/, '').trim(),
        rawLines: []
      };
    } else {
      currentSection.rawLines.push(line);
    }
  }
  flushSection();

  // If no sections were found, treat it as a single block
  if (sections.length === 0) {
    let rawLines = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      rawLines.push(line);
    }
    sections.push({
      title: stepType || 'Overview',
      rawLines: rawLines
    });
  }

  // Post-process sections: add numbers, icons, accents, and parse rawLines sequentially into blocks!
  const finalSections = [];
  sections.forEach((sec, idx) => {
    // Skip empty dummy sections
    if (!sec.title && sec.rawLines.length === 0) return;

    const title = sec.title || 'Overview';
    const number = `${stepIndexBase}.${idx + 1}`;
    const icon = getEmojiForTitle(title);
    const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];

    // Parse rawLines into sequential blocks, supporting inline images, code fences, and reveal blocks!
    const blocks = [];
    let inCodeFence = false;
    let codeLang = 'code';
    let codeLines = [];

    for (let lineIdx = 0; lineIdx < sec.rawLines.length; lineIdx++) {
      const line = sec.rawLines[lineIdx];
      const low = line.toLowerCase();

      // Handle opening/closing code fences: ```lang
      if (line.trim().startsWith('```')) {
        if (!inCodeFence) {
          inCodeFence = true;
          codeLang = line.trim().slice(3).trim() || 'code';
          codeLines = [];
        } else {
          inCodeFence = false;
          blocks.push({ type: 'code', text: codeLines.join('\n'), lang: codeLang });
          codeLines = []; codeLang = 'code';
        }
        continue;
      }
      if (inCodeFence) { codeLines.push(line); continue; }

      // Handle reveal/spoiler: [reveal: Question text | Answer text]
      const revealMatch = line.match(/^\[reveal:\s*([^|]+)\|\s*(.+)\]$/i);
      if (revealMatch) {
        blocks.push({ type: 'reveal', question: revealMatch[1].trim(), text: revealMatch[2].trim() });
        continue;
      }

      // Check for inline image tag: [image: filename.extension]
      const imageMatch = line.match(/^\[image:\s*([^\]]+)\]$/i);
      if (imageMatch) {
        const ref = imageMatch[1].trim();
        blocks.push({ type: 'image', text: `${relativeImageFolder}/images/${ref}` });
      } else if (low.startsWith('key insight') || low.startsWith('remember') || low.startsWith('note:') || low.startsWith('warning:')) {
        const isWarning = low.includes('warning');
        blocks.push({
          type: 'callout', text: line,
          icon: isWarning ? '⚠️' : '💡',
          bg: isWarning ? '#FEF2F2' : '#EFF6FF',
          border: isWarning ? '#FECACA' : '#BFDBFE',
          textColor: isWarning ? '#991B1B' : '#1E40AF'
        });
      } else if (line.startsWith('#') && !line.startsWith('##')) {
        blocks.push({ type: 'paragraph', text: line.replace(/^#\s*/, '').trim(), isSubheading: true });
      } else {
        const isBullet = line.startsWith('-') || line.startsWith('*') || line.startsWith('•');
        const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
        const isShort = cleanLine.length < 120 &&
          !cleanLine.endsWith('.') && !cleanLine.endsWith('?') &&
          !cleanLine.endsWith(':') && !cleanLine.endsWith('!');
        blocks.push(isBullet || isShort
          ? { type: 'bullet', text: cleanLine }
          : { type: 'paragraph', text: line });
      }
    }

    finalSections.push({
      number,
      title,
      icon,
      accent,
      blocks // Sequential array of parsed blocks!
    });
  });

  return {
    levelTitle,
    lessonTitle: levelTitle.split(':').pop() || '',
    stepType,
    sections: finalSections
  };
}

function processStructuredLevels() {
  const lectures = {};

  const levelKeys = [
    {
      levelId: 1,
      lessons: [
        { lessonId: '1-1', stepIndex: 1, folders: { intro: 'Level 1/Level 1.1/LEVEL 1.1 Introduction', concept: 'Level 1/Level 1.1/LEVEL 1.1 Concept Building' } },
        { lessonId: '1-2', stepIndex: 2, folders: { intro: 'Level 1/Level 1.2/Introduction', concept: 'Level 1/Level 1.2/Concept Building' } },
        { lessonId: '1-3', stepIndex: 3, folders: { intro: 'Level 1/Level 1.3/Introduction', concept: 'Level 1/Level 1.3/Concept Building' } },
        { lessonId: '1-4', stepIndex: 4, folders: { intro: 'Level 1/Level 1.4/Introduction', concept: 'Level 1/Level 1.4/Concept Building' } }
      ]
    },
    {
      levelId: 2,
      lessons: [
        { lessonId: '2-1', stepIndex: 1, folders: { intro: 'Level 2/2.1/Introduction', concept: 'Level 2/2.1/Concept Building' } },
        { lessonId: '2-2', stepIndex: 2, folders: { intro: 'Level 2/2.2/Introduction', concept: 'Level 2/2.2/Concept Building' } },
        { lessonId: '2-3', stepIndex: 3, folders: { intro: 'Level 2/2.3/Introduction', concept: 'Level 2/2.3/Concept Building' } },
        { lessonId: '2-4', stepIndex: 4, folders: { intro: 'Level 2/2.4/Introduction', concept: 'Level 2/2.4/Concept Building' } },
        { lessonId: '2-5', stepIndex: 4, folders: { intro: 'Level 2/2.5/Introduction', concept: 'Level 2/2.5/Concept Building' } }
      ]
    },
    {
      levelId: 3,
      lessons: [
        { lessonId: '3-1', stepIndex: 1, folders: { intro: 'Level 3/Level 3.1/Introduction', concept: 'Level 3/Level 3.1/Concept Building' } },
        { lessonId: '3-2', stepIndex: 2, folders: { intro: 'Level 3/Level 3.2/Introduction', concept: 'Level 3/Level 3.2/Concept Building' } },
        { lessonId: '3-3', stepIndex: 3, folders: { intro: 'Level 3/Level 3.3/Introduction', concept: 'Level 3/Level 3.3/Concept Building' } },
        { lessonId: '3-4', stepIndex: 4, folders: { intro: 'Level 3/Level 3.4/Introduction', concept: 'Level 3/Level 3.4/Concept Building' } }
      ]
    },
    {
      levelId: 4,
      lessons: [
        { lessonId: '4-1', stepIndex: 1, folders: { intro: 'Level 4/4.1/Introduction', concept: 'Level 4/4.1/Concept Building' } },
        { lessonId: '4-2', stepIndex: 2, folders: { intro: 'Level 4/4.2/Introduction', concept: 'Level 4/4.2/Concept Building' } },
        { lessonId: '4-3', stepIndex: 3, folders: { intro: 'Level 4/4.3/Introduction', concept: 'Level 4/4.3/Concept Building' } },
        { lessonId: '4-4', stepIndex: 4, folders: { intro: 'Level 4/4.4/Introduction', concept: 'Level 4/4.4/Concept Building' } }
      ]
    },
    {
      levelId: 5,
      lessons: [
        { lessonId: '5-1', stepIndex: 1, folders: { intro: 'Level 5/Level 5.1/Introduction', concept: 'Level 5/Level 5.1/Concept Building' } },
        { lessonId: '5-2', stepIndex: 2, folders: { intro: 'Level 5/Level 5.2/Introduction', concept: 'Level 5/Level 5.2/Concept Building' } },
        { lessonId: '5-3', stepIndex: 3, folders: { intro: 'Level 5/Level 5.3/Introduction', concept: 'Level 5/Level 5.3/Concept Building' } },
        { lessonId: '5-4', stepIndex: 4, folders: { intro: 'Level 5/Level 5.4/Introduction', concept: 'Level 5/Level 5.4/Concept Building' } },
        { lessonId: '5-5', stepIndex: 5, folders: { intro: 'Level 5/Level 5.5/Introduction', concept: 'Level 5/Level 5.5/Concept Building' } }
      ]
    }
  ];

  levelKeys.forEach(lvl => {
    lvl.lessons.forEach(les => {
      const keyPrefix = `${lvl.levelId}-${les.lessonId}`;

      Object.entries(les.folders).forEach(([stepType, folderRelPath]) => {
        const fullFolder = path.join(lecsBase, folderRelPath);
        const contentPath = findContentFile(fullFolder);
        const imagesDir = path.join(fullFolder, 'images');

        let imagesList = [];
        if (fs.existsSync(imagesDir)) {
          imagesList = fs.readdirSync(imagesDir).filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
        }

        const relativeImageFolder = `${publicBase}/${folderRelPath}`;
        const stepIndexBase = stepType === 'intro' ? `${les.stepIndex}.1` : `${les.stepIndex}.2`;
        const data = parseContentToStructured(contentPath, relativeImageFolder, imagesList, stepIndexBase);

        // Attach pre-authored quiz to Concept Building steps dynamically!
        if (stepType === 'concept' && QUIZ_DATABASE[les.lessonId]) {
          data.quiz = QUIZ_DATABASE[les.lessonId];
        }

        // Handle composite 2-3 step merges
        if (keyPrefix === '2-2-3' && stepType === 'concept') {
          const extraFolder = path.join(lecsBase, 'Level 2/2.3/Concept Building');
          const extraContentPath = findContentFile(extraFolder);
          const extraImagesDir = path.join(extraFolder, 'images');
          let extraImages = [];
          if (fs.existsSync(extraImagesDir)) {
            extraImages = fs.readdirSync(extraImagesDir).filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
          }
          const extraData = parseContentToStructured(extraContentPath, `${publicBase}/Level 2/2.3/Concept Building`, extraImages, `${les.stepIndex}.3`);
          data.sections = data.sections.concat(extraData.sections);
        }
        if (keyPrefix === '2-2-3' && stepType === 'intro') {
          const extraFolder = path.join(lecsBase, 'Level 2/2.3/Introduction');
          const extraContentPath = findContentFile(extraFolder);
          const extraImagesDir = path.join(extraFolder, 'images');
          let extraImages = [];
          if (fs.existsSync(extraImagesDir)) {
            extraImages = fs.readdirSync(extraImagesDir).filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
          }
          const extraData = parseContentToStructured(extraContentPath, `${publicBase}/Level 2/2.3/Introduction`, extraImages, `${les.stepIndex}.3`);
          data.sections = data.sections.concat(extraData.sections);
        }

        lectures[`${keyPrefix}-${stepType}`] = data;
      });
    });
  });

  // Write out as a beautiful structured TypeScript database
  const tsContent = `// This file is auto-generated. Do not edit directly.

export interface LectureBlock {
  type: 'paragraph' | 'bullet' | 'callout' | 'image' | 'code' | 'reveal';
  text: string;
  isSubheading?: boolean;
  icon?: string;
  bg?: string;
  border?: string;
  textColor?: string;
  lang?: string;
  question?: string;
}

export interface LectureSection {
  number: string;
  title: string;
  icon: string;
  accent: string;
  blocks: LectureBlock[];
  images?: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  hint?: string;
}

export interface LectureData {
  levelTitle: string;
  lessonTitle: string;
  stepType: string;
  sections: LectureSection[];
  quiz?: QuizQuestion[];
}

export const LECTURES_STRUCTURED_DATA: Record<string, LectureData> = ${JSON.stringify(lectures, null, 2)};
`;

  const outputPath = path.join(__dirname, '..', 'src', 'lib', 'lecturesStructuredData.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
}

processStructuredLevels();
