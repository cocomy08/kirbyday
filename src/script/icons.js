// 统一图标：24px 视图、stroke 1.5、currentColor 继承，配合 index.html 里的 <symbol> 雪碧图。
const Icon = (name, size = 24, cls = '') => {
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${name}"/></svg>`;
};

// 吉祥物：真·卡比（粉色身体 / 腮红 / 脚 / 手臂），支持表情变体；叶子用于动森主题。
const Mascot = {
  kirby(face = 'happy', size = 64) {
    const mouths = {
      happy:   '<path d="M27.5 42c2.6 3 6.4 3 9 0" stroke="#8a4a5e" stroke-width="2" stroke-linecap="round" fill="none"/>',
      welcome: '<path d="M27.5 42c2.6 3 6.4 3 9 0" stroke="#8a4a5e" stroke-width="2" stroke-linecap="round" fill="none"/>',
      thinking:'<path d="M29 44.5h6" stroke="#8a4a5e" stroke-width="2" stroke-linecap="round"/>',
      error:   '<path d="M27.5 43.5c2.6-2.8 6.4-2.8 9 0" stroke="#8a4a5e" stroke-width="2" stroke-linecap="round" fill="none"/>'
    };
    const mouth = mouths[face] || mouths.happy;
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <ellipse cx="23" cy="56" rx="9.5" ry="6" fill="#e27aa0"/>
      <ellipse cx="41" cy="56" rx="9.5" ry="6" fill="#e27aa0"/>
      <ellipse cx="9" cy="42" rx="5.5" ry="10" fill="#f7a8c0" transform="rotate(-18 9 42)"/>
      <ellipse cx="55" cy="42" rx="5.5" ry="10" fill="#f7a8c0" transform="rotate(18 55 42)"/>
      <circle cx="32" cy="34" r="24" fill="#f7a8c0"/>
      <ellipse cx="24" cy="30" rx="3.6" ry="5.6" fill="#3a2e3f"/>
      <ellipse cx="40" cy="30" rx="3.6" ry="5.6" fill="#3a2e3f"/>
      <circle cx="25.4" cy="27.6" r="1.4" fill="#ffffff"/>
      <circle cx="41.4" cy="27.6" r="1.4" fill="#ffffff"/>
      <ellipse cx="19" cy="39" rx="5" ry="3" fill="#f48fb1"/>
      <ellipse cx="45" cy="39" rx="5" ry="3" fill="#f48fb1"/>
      ${mouth}
    </svg>`;
  },

  leaf(size = 24) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z" fill="#6f9f62"/>
      <path d="M5 19c4-4 7-9 9-13" stroke="#f7f2e7" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`;
  }
};
