import {useState} from 'react';
import StartUI from './StartUI';
import SkillScreen from './SkillScreen';
import {SK_CAT_SHEET} from './skillTimeline';
import catSheet from './assets/cat.png';
import bgSheet from './assets/bg.webp';
import num1 from './assets/num1.png';
import num2 from './assets/num2.png';
import skill from './assets/skill.png';
import item from './assets/item.png';
import conf from './assets/conf.png';
import command from './assets/command.png';
import yen from './assets/yen.png';
import skillCat from './assets/skillcat.png';

// Spritesheet layouts come from the Unity .anim clips:
//  catanim.anim        -> output-onlinepngtools.png: 3x3 grid of 166px cells, first 5 cells, 12 fps (0.0833s/frame), loops
//  New Animation2.anim -> recording sheet: 44 frames, 1.117s long (~39.4 fps), loops.
//    Original sheet is 9600x12243 (5 cols x 11 rows of 1920x1113); re-packed here at 640x371 per cell (5 cols x 9 rows) so browsers can decode it.
const assets = {
  cat: { src: catSheet, cols: 3, rows: 3, frames: 5, fps: 12, loop: false }, // plays once, holds the last frame
  bg: { src: bgSheet, cols: 5, rows: 9, frames: 44, fps: 39.4 },
  num1: { src: num1 },
  num2: { src: num2 },
  skill: { src: skill },
  item: { src: item },
  conf: { src: conf },
  command: { src: command },
  yen: { src: yen },
  skillcat: { src: skillCat, ...SK_CAT_SHEET }, // SKILL_cat_anim re-packed as a uniform sheet (see skillTimeline.js)
};
const fonts = { ui: '"Flap Jacks", sans-serif', wild: '"CC Wild Words", sans-serif' };

export default function App() {
  const [screen, setScreen] = useState('menu'); // 'menu' | 'skill'
  return (
    <div style={{ width: 'min(100vw, calc(100vh * 16 / 9))', margin: '0 auto', position: 'relative' }}>
      {/* The menu stays mounted underneath, so it is still on its final frame (Skill selected) when Esc returns to it. */}
      <StartUI
        assets={assets}
        fonts={fonts}
        active={screen === 'menu'}
        onConfirm={(i, id) => id === 'skill' && setScreen('skill')}
      />
      {screen === 'skill' && (
        <SkillScreen
          assets={assets}
          fonts={fonts}
          style={{ position: 'absolute', left: 0, top: 0 }}
          onExit={() => setScreen('menu')} // Esc: the skill screen disappears, back to the menu
        />
      )}
    </div>
  );
}
