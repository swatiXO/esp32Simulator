import type { Block } from '@/types';
import { BLOCK_CATALOGUE } from '@/lib/blockCatalogue';

export type ProjectTemplate = {
  id: string;
  title: string;
  description: string;
  teaches: string[];
  components: string[];
  icon: string;
  tags: string[];
  blocks: Omit<Block, 'id'>[];
};

/**
 * Builds a template block from the catalogue, applying overrides on top of
 * the block's default param values.
 *
 * Pin params are `select` types in the catalogue, so their values must be
 * strings that exist in the param's `options`. This helper coerces overrides
 * to strings for select params and warns (dev only) if an override isn't a
 * valid option — catching invalid-pin regressions before they ship.
 */
const buildTemplateBlock = (
  type: string,
  overrides: Record<string, string | number> = {},
): Omit<Block, 'id'> => {
  const template = BLOCK_CATALOGUE.find((block) => block.type === type);

  if (!template) {
    throw new Error(`Block type not found in catalogue: ${type}`);
  }

  const defaultValues: Record<string, string | number> = Object.fromEntries(
    template.params.map((param) => [param.name, param.default]),
  );

  // Normalise + validate overrides against the catalogue param definitions
  const normalised: Record<string, string | number> = {};
  for (const [key, raw] of Object.entries(overrides)) {
    const param = template.params.find((p) => p.name === key);

    if (param?.type === 'select' && Array.isArray(param.options)) {
      const value = String(raw);
      if (process.env.NODE_ENV !== 'production' && !param.options.includes(value)) {
        console.warn(
          `[templates] Block "${type}" override ${key}="${value}" is not a valid option. ` +
          `Allowed: ${param.options.join(', ')}`,
        );
      }
      normalised[key] = value;
    } else {
      normalised[key] = raw;
    }
  }

  return {
    type: template.type,
    icon: template.icon,
    label: template.label,
    params: template.params,
    values: {
      ...defaultValues,
      ...normalised,
    },
  };
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blink_led',
    title: 'Blink LED',
    description:
      'Classic first project. Blink the built-in LED on Pin 2 every second. Teaches: digitalWrite, delay, pinMode.',
    teaches: ['digitalWrite', 'delay', 'pinMode'],
    components: ['ESP32', 'LED', '220Ω Resistor'],
    icon: 'BLINK',
    tags: ['Output', 'Timing'],
    blocks: [
      buildTemplateBlock('serial_begin'),
      buildTemplateBlock('pinMode', { pin: '2', mode: 'OUTPUT' }),
      buildTemplateBlock('dw_high', { pin: '2' }),
      buildTemplateBlock('delay_ms', { ms: 500 }),
      buildTemplateBlock('dw_low', { pin: '2' }),
      buildTemplateBlock('delay_ms', { ms: 500 }),
    ],
  },
  {
    id: 'temp_serial',
    title: 'Read Temperature',
    description:
      'Read temperature & humidity from a DHT11 sensor and print to Serial Monitor. Teaches: sensors, variables, serial output.',
    teaches: ['DHT11 sensor', 'variables', 'Serial output'],
    components: ['ESP32', 'DHT11 Sensor'],
    icon: 'TEMP',
    tags: ['Sensor', 'Serial'],
    blocks: [
      buildTemplateBlock('serial_begin'),
      buildTemplateBlock('dht_setup', { pin: '4' }),
      buildTemplateBlock('dht_temp', { var: 'temp' }),
      buildTemplateBlock('dht_hum', { var: 'humidity' }),
      buildTemplateBlock('serial_println', { label: 'Temp: ', var: 'temp' }),
      buildTemplateBlock('serial_println', { label: 'Humidity: ', var: 'humidity' }),
      buildTemplateBlock('delay_sec', { sec: 2 }),
    ],
  },
  {
    id: 'wifi_connect',
    title: 'Connect to WiFi',
    description:
      'Connect your ESP32 to WiFi and print the IP address. Teaches: WiFi setup, connection waiting, network basics.',
    teaches: ['WiFi setup', 'network basics'],
    components: ['ESP32'],
    icon: 'WIFI',
    tags: ['WiFi', 'Serial'],
    blocks: [
      buildTemplateBlock('serial_begin'),
      buildTemplateBlock('wifi_connect', { ssid: 'MyWiFi', pass: 'password123' }),
      buildTemplateBlock('wifi_wait'),
      buildTemplateBlock('wifi_ip'),
    ],
  },
  {
    id: 'mqtt_temp',
    title: 'Send Temp to MQTT',
    description:
      'Read temperature and publish it live to an MQTT broker. Teaches: IoT cloud communication, MQTT protocol, sensors.',
    teaches: ['MQTT protocol', 'IoT cloud', 'sensors'],
    components: ['ESP32', 'DHT11 Sensor'],
    icon: 'MQTT',
    tags: ['MQTT', 'WiFi', 'Sensor'],
    blocks: [
      buildTemplateBlock('serial_begin'),
      buildTemplateBlock('dht_setup', { pin: '4' }),
      buildTemplateBlock('wifi_connect', { ssid: 'MyWiFi', pass: 'password123' }),
      buildTemplateBlock('wifi_wait'),
      buildTemplateBlock('mqtt_setup', { broker: 'broker.hivemq.com' }),
      buildTemplateBlock('dht_temp', { var: 'temp' }),
      buildTemplateBlock('mqtt_publish', { val: 'temp', topic: 'home/temperature' }),
      buildTemplateBlock('mqtt_loop'),
      buildTemplateBlock('delay_sec', { sec: 5 }),
    ],
  },
  {
    id: 'button_led',
    title: 'Button Controls LED',
    description:
      'Press a button to toggle an LED. Teaches: digital input, if/else logic, pull-up resistors.',
    teaches: ['digitalRead', 'if/else logic', 'input'],
    components: ['ESP32', 'LED', 'Push Button', '10kΩ Resistor'],
    icon: 'BUTTON',
    tags: ['Sensor', 'Output', 'Logic'],
    blocks: [
      buildTemplateBlock('serial_begin'),
      buildTemplateBlock('pinMode', { pin: '2', mode: 'OUTPUT' }),
      buildTemplateBlock('pinMode', { pin: '4', mode: 'INPUT_PULLUP' }),
      buildTemplateBlock('btn_read', { pin: '4', var: 'btnState' }),
      buildTemplateBlock('if_block', { cond: 'btnState == LOW' }),
      buildTemplateBlock('dw_high', { pin: '2' }),
      buildTemplateBlock('else_block'),
      buildTemplateBlock('dw_low', { pin: '2' }),
      buildTemplateBlock('end_if'),
      buildTemplateBlock('delay_ms', { ms: 50 }),
    ],
  },
  {
    id: 'distance_meter',
    title: 'Distance Meter',
    description:
      'Measure distance using an HC-SR04 ultrasonic sensor and display in cm. Teaches: pulse timing, sensors, serial output.',
    teaches: ['ultrasonic sensor', 'pulse timing', 'serial'],
    components: ['ESP32', 'HC-SR04 Ultrasonic Sensor'],
    icon: 'DISTANCE',
    tags: ['Sensor', 'Serial'],
    blocks: [
      buildTemplateBlock('serial_begin'),
      buildTemplateBlock('ultrasonic', { trig: '12', echo: '13', var: 'distance' }),
      buildTemplateBlock('serial_println', { label: 'Distance (cm): ', var: 'distance' }),
      buildTemplateBlock('delay_ms', { ms: 500 }),
    ],
  },
];