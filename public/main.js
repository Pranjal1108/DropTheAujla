import { resetState } from './state.js';
import { update } from './gameloop.js';

resetState();
requestAnimationFrame(update);
