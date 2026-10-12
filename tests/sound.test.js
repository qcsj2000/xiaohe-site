import test from 'node:test';
import assert from 'node:assert/strict';
import { sfx } from '../public/js/sound.js';
test('没有 Web Audio 时不报错', () => { assert.doesNotThrow(() => { sfx.key(); sfx.err(); }); });
