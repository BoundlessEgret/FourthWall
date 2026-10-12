'use strict';
// ============================================================
//  Audio — WebAudio 合成器 + 音序器 + 音效（全部程序生成，無外部素材）
// ============================================================
(function () {
  const U = FW.U;
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function noteToMidi(tok) {
    const m = /^([a-g])(#|b)?(\d)$/.exec(tok);
    if (!m) return null;
    let n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 12 * (parseInt(m[3]) + 1) + n;
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus4: [0, 5, 7], dim: [0, 3, 6], aug: [0, 4, 8], add9: [0, 4, 7, 14] };
  function parseChord(s) {
    const m = /^([A-G])(#|b)?(maj7|m7|m|7|sus4|dim|aug|add9)?$/.exec(s);
    if (!m) return { root: 57, tones: [0, 4, 7] };
    const root = NOTE[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return { root, tones: QUAL[m[3] || ''] };
  }

  // ---------------- 樂曲資料 ----------------
  // chords: 每個和弦一小節(4拍)；melody: 每個 token = 8分音符，'-' 延長，'.' 休止
  const SONGS = {
    title: { title: '幕間的邀請 ～ Intermission Invitation', bpm: 92, lead: 'bell', drums: 'soft', bass: 'long', arp: 'bell', pad: true,
      chords: 'Am F C G Am F E E F G Em Am Dm G C E',
      melody: `e5 - - d5 c5 - b4 c5 | a4 - - - c5 - f5 - | e5 - - g5 e5 d5 c5 - | d5 - - - - - . . | e5 - - d5 c5 - b4 c5 | a4 - - c5 f5 - e5 f5 | g#5 - - - e5 - b4 - | e5 - - - - - . . |
               a5 - g5 - f5 - e5 - | d5 - - e5 f5 - g5 - | e5 - - - b4 - e5 - | c6 - - - b5 - a5 - | f5 - - a5 - - d6 - | b5 - - - g5 - d5 - | e5 - g5 - c6 - - - | b5 - - - g#5 - e5 -`,
      note: '標題畫面的曲子。玲音說，每次你打開遊戲，她都是聽著這首歌醒來的。' },
    select: { title: '選擇你的女主角', bpm: 128, lead: 'square', drums: 'half', bass: 'octave', arp: 'pulse', pad: true,
      chords: 'C G Am F C G F G',
      melody: `c5 - e5 - g5 - e5 g5 | b4 - d5 - g5 - - - | a4 - c5 - e5 - d5 c5 | f5 - - - e5 - d5 - | c5 - e5 - g5 - c6 - | b5 - - a5 g5 - d5 - | a5 - g5 - f5 - e5 - | d5 - - - g4 - . .`,
      note: '角色選擇畫面。她們每個人都覺得自己才是主角。' },
    st1: { title: '初始畫面之丘 ～ Press Start', bpm: 150, lead: 'square', drums: 'four', bass: 'octave', arp: 'updown', pad: true,
      chords: 'D A Bm G D A G A Bm G D A Bm G A A',
      melody: `f#5 - a5 - d6 - a5 - | e5 - - c#5 e5 - a5 - | f#5 - - d5 b4 - d5 f#5 | g5 - f#5 - e5 - d5 - | f#5 - a5 - d6 - e6 - | c#6 - - a5 e5 - a5 - | b5 - a5 - g5 - f#5 g5 | a5 - - - - - . . |
               d6 - - c#6 b5 - f#5 - | g5 - b5 - d6 - - - | a5 - - f#5 d5 - f#5 a5 | e5 - - - c#5 - e5 - | f#5 - - g5 a5 - b5 - | d6 - - c#6 b5 - a5 - | c#6 - - d6 e6 - c#6 - | a5 - - - e5 - . .`,
      note: '第一關。按下開始鍵的那一刻，整個世界才會開始呼吸。' },
    st2: { title: '對話框之海 ～ Text Sea', bpm: 140, lead: 'flute', drums: 'break', bass: 'root8', arp: 'pulse', pad: true,
      chords: 'Em C D Bm Em C Am B C D Bm Em C D B B',
      melody: `b4 - e5 - g5 - f#5 e5 | g5 - - - e5 - c5 - | d5 - f#5 - a5 - g5 f#5 | f#5 - - - d5 - b4 - | b4 - e5 - g5 - b5 - | c6 - b5 - a5 - g5 - | a5 - g5 - f#5 - e5 - | d#5 - - - f#5 - b5 - |
               e6 - - d6 c6 - b5 - | a5 - - b5 c6 - d6 - | b5 - - a5 f#5 - d5 - | e5 - g5 - b5 - e6 - | e6 - d6 - c6 - g5 - | f#5 - a5 - d6 - c6 - | b5 - - a5 f#5 - d#5 - | b4 - - - - - . .`,
      note: '第二關。海浪是沒說完的台詞。' },
    st3: { title: '錯誤之城 ～ Segmentation Fault', bpm: 160, lead: 'saw', drums: 'four', bass: 'root8', arp: 'up', pad: false,
      chords: 'Cm Ab Bb Cm Cm Ab Bb G Ab Bb Gm Cm Ab Bb G G',
      melody: `c5 - eb5 - g5 - c6 - | bb5 - ab5 - g5 - eb5 - | f5 - - bb5 - - d6 - | c6 - - - g5 - . . | c5 c5 eb5 - g5 g5 c6 - | eb6 - d6 - c6 - ab5 - | bb5 - - f5 d5 - bb4 - | b4 - d5 - g5 - b5 - |
               c6 - - - eb6 - c6 - | d6 - - - f6 - d6 - | bb5 - g5 - d5 - g5 - | c6 - eb6 - g6 - - - | ab5 - c6 - eb6 - c6 - | bb5 - d6 - f6 - d6 - | b5 - d6 - g6 - f6 - | d6 - - - b5 - . .`,
      note: '第三關。這座城市每隔幾秒就會當機一次，居民早就習慣了。' },
    st4: { title: '桌面之原 ～ Wallpaper Meadow', bpm: 132, lead: 'bell', drums: 'half', bass: 'walk', arp: 'updown', pad: true,
      chords: 'F C Dm Bb F C Bb C Dm Bb F C Dm Bb C C',
      melody: `a5 - c6 - f5 - a5 - | g5 - - e5 c5 - e5 - | f5 - a5 - d6 - c6 - | bb5 - - - a5 - g5 - | a5 - c6 - f6 - e6 - | d6 - - c6 g5 - e5 - | f5 - g5 - a5 - bb5 - | c6 - - - - - . . |
               d6 - - c6 a5 - f5 - | g5 - - f5 d5 - bb4 - | c5 - f5 - a5 - c6 - | e6 - - - c6 - g5 - | a5 - d6 - f6 - e6 - | d6 - - c6 bb5 - a5 - | g5 - a5 - bb5 - e6 - | c6 - - - g5 - . .`,
      note: '第四關。風吹過草原，草原其實是一張預設桌布。' },
    st5: { title: '片尾之塔 ～ Staff Roll Spire', bpm: 144, lead: 'saw', drums: 'four', bass: 'octave', arp: 'pulse', pad: true,
      chords: 'Bm G D A Bm G Em F# G A F#m Bm G A F# F#',
      melody: `f#5 - - b5 - - d6 - | c#6 - b5 - a5 - g5 - | f#5 - - a5 - - d6 - | e6 - - - c#6 - a5 - | b5 - d6 - f#6 - e6 - | d6 - - c#6 b5 - g5 - | e5 - g5 - b5 - e6 - | c#6 - - - a#5 - f#5 - |
               g5 - b5 - d6 - b5 - | a5 - c#6 - e6 - c#6 - | f#5 - a5 - c#6 - a5 - | b5 - - - f#5 - d5 - | d6 - - b5 g5 - b5 d6 | e6 - - c#6 a5 - c#6 e6 | f#6 - - e6 c#6 - a#5 - | f#5 - - - - - . .`,
      note: '第五關。塔的每一層都刻著某個人的名字，最頂層是空白的。' },
    st6: { title: '幕後 ～ Backstage', bpm: 152, lead: 'saw', drums: 'march', bass: 'root8', arp: 'up', pad: true,
      chords: 'Am Dm E Am F G C E Dm Am Bb E Am Dm E E',
      melody: `a5 - - e5 a5 - c6 - | d6 - - c6 a5 - f5 - | g#5 - b5 - e6 - d6 - | c6 - - - a5 - . . | a5 - c6 - f6 - e6 - | d6 - b5 - g5 - d6 - | e6 - - d6 c6 - g5 - | g#5 - - - b5 - e6 - |
               f6 - - e6 d6 - a5 - | c6 - - b5 a5 - e5 - | f5 - bb5 - d6 - f6 - | e6 - - - g#5 - b5 - | a5 - c6 - e6 - a6 - | f6 - e6 - d6 - c6 - | b5 - - c6 d6 - g#5 - | a5 - - - - - . .`,
      note: '最終關。舞台後面堆滿了沒用上的道具，和沒說出口的話。' },
    st7: { title: '螢幕之外 ～ Beyond the Glass', bpm: 168, lead: 'saw', drums: 'four', bass: 'octave', arp: 'up', pad: true,
      chords: 'F#m D E C#m F#m D E C# D E C#m F#m D E C# C#',
      melody: `c#6 - a5 - f#5 - a5 c#6 | d6 - - - a5 - f#5 - | e6 - - b5 g#5 - b5 e6 | c#6 - - - g#5 - . . | f#5 - a5 - c#6 - f#6 - | e6 - d6 - c#6 - a5 - | b5 - c#6 - d6 - e6 - | c#6 - - - g#5 - f5 - |
               a5 - - f#5 d6 - - a5 | b5 - - g#5 e6 - - b5 | c#6 - - g#5 e6 - - c#6 | f#6 - - - c#6 - a5 - | d6 - e6 - f#6 - a6 - | g#6 - f#6 - e6 - b5 - | c#6 - - f5 g#5 - c#6 - | c#6 - - - - - . .`,
      note: 'Extra 關。這裡沒有地圖，因為這裡是你那一側。' },
    b_rinne: { title: '存檔點的少女 ～ Save & Load', bpm: 156, lead: 'square', drums: 'four', bass: 'octave', arp: 'updown', pad: true,
      chords: 'G D Em C G D C D Em C G D Em C D D',
      melody: `d5 - g5 - b5 - d6 - | c6 - b5 - a5 - f#5 - | g5 - - b5 - - e6 - | e6 - d6 - c6 - b5 - | b5 - d6 - g6 - f#6 - | e6 - - d6 a5 - f#5 - | g5 - a5 - b5 - c6 - | d6 - - - - - . . |
               e6 - - d6 b5 - g5 - | c6 - - b5 g5 - e5 - | d5 - g5 - b5 - d6 - | f#6 - - - d6 - a5 - | g6 - - f#6 e6 - b5 - | c6 - e6 - g6 - e6 - | f#6 - - e6 d6 - a5 - | d6 - - - - - . .`,
      note: '玲音的主題。她說這首曲子聽起來像「讀檔成功」的聲音。' },
    b_chiyo: { title: '千代的台詞 ～ Unskippable', bpm: 148, lead: 'flute', drums: 'break', bass: 'walk', arp: 'pulse', pad: true,
      chords: 'Dm Bb C Dm Dm Bb Gm A',
      melody: `a5 - f5 - d5 - f5 a5 | bb5 - - - a5 - f5 - | g5 - e5 - c5 - e5 g5 | f5 - - - d5 - . . | d6 - - c6 a5 - f5 - | g5 - bb5 - d6 - f6 - | e6 - d6 - bb5 - g5 - | c#6 - - - a5 - . .`,
      note: '千代的主題。據說這首曲子不能跳過。' },
    b_akane: { title: '藍色畫面的魔女 ～ Fatal Exception', bpm: 170, lead: 'saw', drums: 'four', bass: 'root8', arp: 'up', pad: false,
      chords: 'Em C D B Em C Am B',
      melody: `e5 e5 g5 - e5 e5 b5 - | c6 - b5 - g5 - e5 - | f#5 f#5 a5 - f#5 f#5 d6 - | d#6 - - - b5 - f#5 - | e6 - - b5 g5 - e5 - | g5 - c6 - e6 - g6 - | f#6 - e6 - c6 - a5 - | b5 - - - d#6 - f#6 -`,
      note: '茜的主題。播到一半當機是正常現象（她說的）。' },
    b_shio: { title: '游標的舞踏 ～ Drag & Drop', bpm: 150, lead: 'square', drums: 'half', bass: 'octave', arp: 'updown', pad: true,
      chords: 'C Am F G C Am Dm G',
      melody: `e5 - g5 - c6 - g5 - | a5 - - e5 c6 - a5 - | f5 - a5 - c6 - f6 - | d6 - - - b5 - g5 - | c6 - e6 - g6 - e6 - | c6 - a5 - e5 - a5 - | d6 - f6 - a5 - d6 - | b5 - - - g5 - . .`,
      note: '汐的主題。請試著用滑鼠跟著節奏畫圈。' },
    b_natsume: { title: '謝幕之書 ～ End Roll Grimoire', bpm: 126, lead: 'saw', drums: 'march', bass: 'long', arp: 'up', pad: true,
      chords: 'Gm Eb F D Gm Eb Cm D',
      melody: `g5 - - - d6 - - - | eb6 - - d6 c6 - bb5 - | a5 - - - c6 - f6 - | f#6 - - - d6 - . . | g6 - - f6 d6 - bb5 - | c6 - - bb5 g5 - eb5 - | c6 - eb6 - g6 - eb6 - | d6 - - - f#5 - a5 -`,
      note: '棗的主題。她堅持這首曲子要配上滾動的字幕才完整。' },
    b_suzu: { title: '越界貓 ～ Out of Bounds', bpm: 172, lead: 'square', drums: 'four', bass: 'octave', arp: 'pulse', pad: true,
      chords: 'A E F#m D A E D E',
      melody: `c#6 - e6 - a5 - e6 - | b5 - g#5 - e5 - b5 - | c#6 - a5 - f#5 - a5 - | d6 - - - f#6 - e6 - | a6 - e6 - c#6 - a5 - | g#5 - b5 - e6 - b5 - | a5 - b5 - c#6 - d6 - | e6 - - - - - . .`,
      note: '鈴的主題。耳機外漏的音量請自行調整。' },
    b_nanashi: { title: '未命名 ～ Untitled_Character_07', bpm: 120, lead: 'bell', drums: 'half', bass: 'long', arp: 'bell', pad: true,
      chords: 'Bm G Bm F# Bm G Em F#',
      melody: `b5 - - - f#5 - - - | g5 - - - d5 - - - | f#5 - - d5 b4 - - - | a#4 - - - c#5 - - - | b5 - - - d6 - - - | d6 - - c6 b5 - - - | g5 - - - e5 - - - | f#5 - - - - - . .`,
      note: '無名的主題。這首曲子原本也沒有名字。' },
    b_maku: { title: '第四面牆 ～ Curtain Call', bpm: 150, lead: 'saw', drums: 'march', bass: 'root8', arp: 'up', pad: true,
      chords: 'Dm Bb F C Dm Bb Gm A Bb C Am Dm Bb C A A',
      melody: `d5 - f5 - a5 - d6 - | f6 - - e6 d6 - bb5 - | c6 - - a5 f5 - a5 c6 | e6 - - - c6 - g5 - | a5 - d6 - f6 - a6 - | g6 - f6 - d6 - bb5 - | bb5 - - a5 g5 - d5 - | c#6 - - - e6 - a6 - |
               f6 - - - d6 - bb5 - | e6 - - - g6 - e6 - | c6 - e6 - a6 - g6 - | f6 - - - d6 - a5 - | d6 - f6 - bb6 - a6 - | g6 - e6 - c6 - g5 - | a5 - c#6 - e6 - g6 - | a6 - - - - - . .`,
      note: '幕的主題。謝幕的時候，觀眾會鼓掌嗎？' },
    b_true: { title: '∞ ～ Endless Intermission', bpm: 176, lead: 'saw', drums: 'four', bass: 'octave', arp: 'updown', pad: true,
      chords: 'Am F G Em Am F G E F G Em Am F G E E',
      melody: `e6 - a5 - c6 - e6 - | f6 - e6 - c6 - a5 - | b5 - d6 - g6 - d6 - | e6 - - - b5 - g5 - | a5 - c6 - e6 - a6 - | g6 - f6 - e6 - c6 - | d6 - b5 - g5 - d6 - | g#6 - - - e6 - b5 - |
               c6 - - a5 f5 - a5 c6 | d6 - - b5 g5 - b5 d6 | e6 - - b5 g5 - b5 e6 | a6 - - - e6 - c6 - | f6 - e6 - f6 - a6 - | g6 - f6 - g6 - b6 - | g#6 - - b6 - - e6 - | e6 - - - - - . .`,
      note: '真・最終戰。這首歌沒有結尾，只有下一次循環。' },
    ending: { title: '這面牆的這一側', bpm: 84, lead: 'bell', drums: 'none', bass: 'long', arp: 'bell', pad: true,
      chords: 'C G Am Em F C F G',
      melody: `e5 - - - g5 - c6 - | b5 - - - d5 - g5 - | c6 - - b5 a5 - e5 - | g5 - - - - - . . | a5 - - - c6 - f6 - | e6 - - d6 c6 - g5 - | a5 - - c6 b5 - a5 - | g5 - - - - - . .`,
      note: '結局的曲子。謝謝你看到這裡。' },
    credits: { title: '製作人員名單（真的）', bpm: 110, lead: 'flute', drums: 'soft', bass: 'walk', arp: 'updown', pad: true,
      chords: 'F C Dm Bb F C Bb C',
      melody: `c6 - a5 - f5 - a5 - | g5 - - - e5 - g5 - | a5 - - f5 d6 - c6 - | bb5 - - - a5 - g5 - | f5 - a5 - c6 - f6 - | e6 - - c6 g5 - e5 - | f5 - g5 - a5 - bb5 - | c6 - - - - - . .`,
      note: '片尾名單。這次是真的片尾。大概。' },
    gameover: { title: '還要繼續嗎？', bpm: 70, lead: 'bell', drums: 'none', bass: 'long', arp: 'none', pad: true,
      chords: 'Am F G E',
      melody: `e5 - - - c5 - - - | a4 - - - c5 - f5 - | d5 - - - b4 - g4 - | g#4 - - - - - . .`,
      note: '接關畫面。她們一直在等你按下去。' },
  };
  FW.SONGS = SONGS;
  // 預處理
  for (const id in SONGS) {
    const s = SONGS[id];
    s.chordList = s.chords.trim().split(/\s+/).map(parseChord);
    s.mel = s.melody.replace(/\|/g, ' ').trim().split(/\s+/);
    s.steps = s.chordList.length * 16;
  }

  const A = FW.Audio = {
    ctx: null, ready: false, cur: null, curId: null, step: 0, nextTime: 0, timer: null,
    stutterUntil: 0, stutterStep: 0, duckVal: 1, lastSE: {},
    unlock() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      this.build(this.ctx);
      this.applyVolume();
      this.ready = true;
      this.timer = setInterval(() => this.tick(), 25);
      if (this.pending) { const p = this.pending; this.pending = null; this.play(p); }
    },
    build(c) {
      this.master = c.createGain(); this.master.gain.value = 0.9;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      this.master.connect(comp); comp.connect(c.destination);
      this.bgm = c.createGain(); this.bgm.connect(this.master);
      this.se = c.createGain(); this.se.connect(this.master);
      this.duck = c.createGain(); this.duck.connect(this.bgm);
      // 混響
      this.rev = c.createConvolver();
      const len = c.sampleRate * 1.6, buf = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      this.rev.buffer = buf; this.revGain = c.createGain(); this.revGain.gain.value = 0.28;
      this.rev.connect(this.revGain); this.revGain.connect(this.duck);
      const nl = c.sampleRate; this.noise = c.createBuffer(1, nl, c.sampleRate);
      const nd = this.noise.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
    },
    // 離線渲染（預告片用）：cues = [{t, music:id, step, until}, {t, sfx:name}, {t, gain:v, ramp}]
    async renderOffline(cues, dur, sr = 44100) {
      const keep = ['ctx', 'master', 'bgm', 'se', 'duck', 'rev', 'revGain', 'noise'].map(k => [k, this[k]]);
      const c = new OfflineAudioContext(2, Math.ceil(sr * dur), sr);
      this.ctx = c; this.build(c); this._offline = true;
      this.bgm.gain.value = 0.42; this.se.gain.value = 0.55;
      let lastG = 1;
      for (const q of cues) {
        if (q.music) {
          const song = SONGS[q.music], sd = 60 / song.bpm / 4;
          let st = q.step || 0;
          for (let tt = q.t; tt < Math.min(q.until, dur) - 0.001; tt += sd, st++) this.scheduleStep(song, st % song.steps, tt, sd);
        } else if (q.sfx) this.sfx(q.sfx, { at: q.t });
        else if (q.gain !== undefined) { this.duck.gain.setValueAtTime(lastG, q.t); this.duck.gain.linearRampToValueAtTime(q.gain, q.t + (q.ramp || 0.01)); lastG = q.gain; }
      }
      this._offline = false;
      keep.forEach(([k, v]) => this[k] = v);
      return c.startRendering();
    },
    applyVolume() {
      if (!this.ctx) return;
      const s = FW.Save.data.settings;
      this.bgm.gain.value = s.bgm * 0.55; this.se.gain.value = s.se * 0.8;
    },
    play(id, force) {
      if (!this.ready) { this.pending = id; return; }
      if (this.curId === id && !force) return;
      this.curId = id; this.cur = SONGS[id] || null; this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.08;
      this.duck.gain.cancelScheduledValues(this.ctx.currentTime);
      this.duck.gain.setValueAtTime(0, this.ctx.currentTime);
      this.duck.gain.linearRampToValueAtTime(this.duckVal, this.ctx.currentTime + 0.3);
      if (this.cur) { FW.Save.data.musicHeard[id] = true; }
    },
    stop(fade = 0.6) {
      if (!this.ready) { this.pending = null; return; }
      const t = this.ctx.currentTime;
      this.duck.gain.cancelScheduledValues(t);
      this.duck.gain.setValueAtTime(this.duck.gain.value, t);
      this.duck.gain.linearRampToValueAtTime(0, t + fade);
      const id = this.curId;
      setTimeout(() => { if (this.curId === id) { this.cur = null; this.curId = null; } }, fade * 1000);
    },
    setDuck(v, time = 0.3) {
      this.duckVal = v; if (!this.ready) return;
      const t = this.ctx.currentTime; this.duck.gain.cancelScheduledValues(t);
      this.duck.gain.setValueAtTime(this.duck.gain.value, t); this.duck.gain.linearRampToValueAtTime(v, t + time);
    },
    stutter(sec) { if (this.ready) { this.stutterUntil = this.ctx.currentTime + sec; this.stutterStep = this.step; } },
    tick() {
      if (!this.cur || !this.ctx) return;
      const s = this.cur, sd = 60 / s.bpm / 4;
      while (this.nextTime < this.ctx.currentTime + 0.12) {
        let st = this.step;
        if (this.ctx.currentTime < this.stutterUntil) { st = this.stutterStep + (this.step % 2); }
        this.scheduleStep(s, st % s.steps, this.nextTime, sd);
        this.nextTime += sd; this.step++;
      }
    },
    scheduleStep(s, st, t, sd) {
      const bar = Math.floor(st / 16), pos = st % 16;
      const ch = s.chordList[bar];
      // 鼓
      this.drum(s.drums, pos, t);
      // 貝斯
      const root = 36 + ch.root;
      const bs = s.bass;
      if (bs === 'long' && pos === 0) this.bassNote(root, t, sd * 15);
      else if (bs === 'root8' && pos % 2 === 0) this.bassNote(root, t, sd * 1.6);
      else if (bs === 'octave' && pos % 2 === 0) this.bassNote(root + (pos % 4 === 2 ? 12 : 0), t, sd * 1.6);
      else if (bs === 'walk' && pos % 4 === 0) this.bassNote(root + [0, 7, 12, 7][pos / 4], t, sd * 3.5);
      // 墊音
      if (s.pad && pos === 0) for (const tn of ch.tones.slice(0, 3)) this.padNote(60 + ch.root + tn - (ch.root > 5 ? 12 : 0), t, sd * 16);
      // 琶音
      const tones = ch.tones, base = 72 + ch.root - (ch.root > 4 ? 12 : 0);
      if (s.arp === 'up') { const i = pos % (tones.length * 2); this.arpNote(base + tones[i % tones.length] + 12 * Math.floor(i / tones.length), t, sd); }
      else if (s.arp === 'updown') { const seq = [0, 1, 2, 3, 2, 1]; const i = seq[pos % 6]; this.arpNote(base + tones[i % tones.length] + (i >= tones.length ? 12 : 0), t, sd); }
      else if (s.arp === 'pulse' && pos % 4 === 2) for (const tn of tones.slice(0, 3)) this.arpNote(base + tn, t, sd * 1.2, 0.5);
      else if (s.arp === 'bell' && pos % 4 === 0) this.arpNote(base + 12 + tones[(pos / 4) % tones.length], t, sd * 6, 0.9, 'bell');
      // 主旋律
      if (pos % 2 === 0) {
        const mi = (st / 2) % s.mel.length, tok = s.mel[mi];
        const m = noteToMidi(tok);
        if (m) {
          let len = 1; while (s.mel[(mi + len) % s.mel.length] === '-' && len < 16) len++;
          this.leadNote(s.lead, m, t, sd * 2 * len);
        }
      }
    },
    env(g, t, a, peak, d, sus, rel, end) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d);
      g.gain.setValueAtTime(Math.max(0.0001, peak * sus), end);
      g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
    },
    leadNote(type, m, t, dur) {
      const c = this.ctx, f = mtof(m), g = c.createGain(), flt = c.createBiquadFilter();
      flt.type = 'lowpass'; flt.frequency.value = type === 'saw' ? 2600 : 3200; flt.Q.value = 1.5;
      const end = t + dur * 0.92;
      const oscs = [];
      const mk = (wt, det, vol) => { const o = c.createOscillator(); o.type = wt; o.frequency.value = f; o.detune.value = det; const og = c.createGain(); og.gain.value = vol; o.connect(og); og.connect(flt); oscs.push(o); return o; };
      let peak = 0.11;
      if (type === 'square') { mk('square', -6, 0.5); mk('square', 6, 0.5); peak = 0.07; }
      else if (type === 'saw') { mk('sawtooth', -9, 0.5); mk('sawtooth', 9, 0.5); mk('square', 0, 0.3); peak = 0.065; }
      else if (type === 'flute') { mk('triangle', 0, 1); mk('sine', 1200, 0.25); peak = 0.16; }
      else { mk('sine', 0, 1); mk('triangle', 1200, 0.35); peak = 0.15; }
      // 抖音
      if (dur > 0.25) { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(type === 'bell' ? 0 : 14, t + 0.25); lfo.connect(lg); oscs.forEach(o => lg.connect(o.detune)); lfo.start(t); lfo.stop(end + 0.4); }
      flt.connect(g); g.connect(this.duck); g.connect(this.rev);
      if (type === 'bell') this.env(g, t, 0.005, peak, 0.6, 0.25, 0.4, end); else this.env(g, t, 0.012, peak, 0.12, 0.7, 0.12, end);
      oscs.forEach(o => { o.start(t); o.stop(end + 0.6); });
    },
    bassNote(m, t, dur) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = mtof(m); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(260, t + Math.min(dur, 0.3)); f.Q.value = 3;
      o.connect(f); f.connect(g); g.connect(this.duck);
      this.env(g, t, 0.005, 0.16, 0.1, 0.6, 0.06, t + dur); o.start(t); o.stop(t + dur + 0.2);
    },
    padNote(m, t, dur) {
      const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100;
      for (const d of [-12, 10]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = d; o.connect(f); o.start(t); o.stop(t + dur + 0.8); }
      f.connect(g); g.connect(this.duck); g.connect(this.rev);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022, t + 0.4); g.gain.setValueAtTime(0.022, t + dur - 0.1); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    },
    arpNote(m, t, dur, vol = 1, kind) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = kind === 'bell' ? 'sine' : 'triangle'; o.frequency.value = mtof(m);
      o.connect(g); g.connect(this.duck); g.connect(this.rev);
      this.env(g, t, 0.003, 0.05 * vol, dur * 0.8, 0.3, 0.05, t + dur); o.start(t); o.stop(t + dur + 0.3);
    },
    drum(style, pos, t) {
      if (!style || style === 'none') return;
      const P = {
        four: { k: [0, 4, 8, 12], s: [4, 12], h: [2, 6, 10, 14], hs: [0, 4, 8, 12] },
        break: { k: [0, 6, 10], s: [4, 12], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
        half: { k: [0, 10], s: [8], h: [0, 2, 4, 6, 8, 10, 12, 14] },
        march: { k: [0, 8], s: [4, 12, 14, 15], h: [0, 2, 4, 6, 8, 10, 12, 14] },
        soft: { k: [0, 8], s: [], h: [4, 12] },
      }[style];
      if (P.k.includes(pos)) this.kick(t, style === 'soft' ? 0.5 : 1);
      if (P.s.includes(pos)) this.snare(t, pos >= 14 ? 0.5 : 1);
      if (P.h.includes(pos)) this.hat(t, pos % 4 === 2 ? 1 : 0.5);
    },
    kick(t, v = 1) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      o.connect(g); g.connect(this.duck); g.gain.setValueAtTime(0.32 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t); o.stop(t + 0.25);
    },
    snare(t, v = 1) {
      const c = this.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      n.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
      n.connect(f); f.connect(g); g.connect(this.duck);
      g.gain.setValueAtTime(0.16 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      n.start(t, Math.random() * 0.5); n.stop(t + 0.18);
    },
    hat(t, v = 1) {
      const c = this.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      n.buffer = this.noise; f.type = 'highpass'; f.frequency.value = 7500;
      n.connect(f); f.connect(g); g.connect(this.duck);
      g.gain.setValueAtTime(0.05 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      n.start(t, Math.random() * 0.5); n.stop(t + 0.06);
    },

    // ---------------- 音效 ----------------
    sfx(name, opt = {}) {
      if (!this.ready && !this._offline) return;
      const c = this.ctx, t = opt.at !== undefined ? opt.at : c.currentTime;
      const lim = { shoot: 0.07, hit: 0.06, graze: 0.04, item: 0.03, eshot: 0.07, text: 0.03, cancel: 0.1 }[name];
      if (lim && opt.at === undefined) { if (t - (this.lastSE[name] || 0) < lim) return; this.lastSE[name] = t; }
      const out = this.se;
      const tone = (type, f0, f1, dur, vol, when = 0, dest = out) => {
        const o = c.createOscillator(), g = c.createGain(); o.type = type;
        o.frequency.setValueAtTime(f0, t + when); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + when + dur);
        g.gain.setValueAtTime(vol, t + when); g.gain.exponentialRampToValueAtTime(0.0001, t + when + dur);
        o.connect(g); g.connect(dest); o.start(t + when); o.stop(t + when + dur + 0.02);
      };
      const noise = (dur, vol, ftype, f0, f1, when = 0) => {
        const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        n.buffer = this.noise; f.type = ftype; f.frequency.setValueAtTime(f0, t + when); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + when + dur);
        g.gain.setValueAtTime(vol, t + when); g.gain.exponentialRampToValueAtTime(0.0001, t + when + dur);
        n.connect(f); f.connect(g); g.connect(out); n.start(t + when, Math.random() * 0.5); n.stop(t + when + dur + 0.02);
      };
      switch (name) {
        case 'shoot': noise(0.04, 0.05, 'highpass', 3000); break;
        case 'eshot': tone('sine', 1500, 600, 0.06, 0.035); break;
        case 'hit': noise(0.03, 0.06, 'bandpass', 2400); break;
        case 'kill': noise(0.25, 0.22, 'lowpass', 3000, 200); tone('square', 600, 120, 0.15, 0.05); break;
        case 'bigkill': noise(0.7, 0.35, 'lowpass', 4000, 80); tone('sawtooth', 300, 40, 0.6, 0.12); break;
        case 'graze': noise(0.04, 0.08, 'highpass', 6000); break;
        case 'item': tone('triangle', 1600, 2200, 0.05, 0.05); break;
        case 'cancel': for (let i = 0; i < 4; i++) tone('sine', 1800 + i * 400, 0, 0.12, 0.03, i * 0.03); break;
        case 'bomb': noise(1.2, 0.4, 'lowpass', 200, 4000); tone('sine', 80, 30, 1.0, 0.4); break;
        case 'death': tone('square', 1200, 300, 0.12, 0.12); tone('square', 900, 150, 0.4, 0.12, 0.06); noise(0.5, 0.25, 'bandpass', 3000, 300); break;
        case 'extend': [0, 4, 7, 12, 16].forEach((s, i) => tone('square', mtof(72 + s), 0, 0.12, 0.06, i * 0.06)); break;
        case 'powerup': [0, 7, 12].forEach((s, i) => tone('triangle', mtof(79 + s), 0, 0.1, 0.08, i * 0.05)); break;
        case 'spell': noise(0.8, 0.2, 'bandpass', 400, 5000); [0, 3, 7, 12].forEach((s, i) => tone('sawtooth', mtof(62 + s), 0, 0.5, 0.04, i * 0.04)); break;
        case 'capture': [0, 4, 7, 12, 7, 12, 16, 19].forEach((s, i) => tone('triangle', mtof(76 + s), 0, 0.14, 0.08, i * 0.05)); break;
        case 'cursor': tone('square', 900, 0, 0.03, 0.04); break;
        case 'select': tone('square', 1200, 1800, 0.08, 0.06); break;
        case 'back': tone('square', 700, 400, 0.08, 0.05); break;
        case 'pause': tone('triangle', 880, 0, 0.1, 0.1); tone('triangle', 660, 0, 0.15, 0.1, 0.08); break;
        case 'text': tone('square', opt.pitch || 700, 0, 0.025, 0.03); break;
        case 'error': [[0, 7, 12], [4, 9]].forEach((ch, i) => ch.forEach(s => tone('sine', mtof(76 + s - i * 5), 0, 0.5, 0.08, i * 0.12))); break;
        case 'glass': noise(0.6, 0.4, 'highpass', 2500, 8000); for (let i = 0; i < 10; i++) tone('sine', 3000 + Math.random() * 4000, 0, 0.2 + Math.random() * 0.3, 0.03, Math.random() * 0.3); break;
        case 'crack': noise(0.15, 0.3, 'highpass', 3500); tone('square', 2400, 800, 0.05, 0.05); break;
        case 'knock': tone('sine', 160, 70, 0.12, 0.5); noise(0.05, 0.2, 'lowpass', 900); break;
        case 'click': noise(0.015, 0.25, 'highpass', 4000); tone('square', 2000, 0, 0.01, 0.05); break;
        case 'timeout': tone('square', 1000, 0, 0.05, 0.06); break;
        case 'laser': noise(0.5, 0.12, 'bandpass', 600, 2400); tone('sawtooth', 220, 440, 0.5, 0.04); break;
        case 'charge': tone('sawtooth', 200, 1600, 0.8, 0.05); break;
        case 'whoosh': noise(0.4, 0.2, 'bandpass', 600, 3000); break;
        case 'slash': noise(0.35, 0.45, 'highpass', 9000, 1500); tone('triangle', 3400, 2400, 0.9, 0.07); tone('sine', 5200, 5000, 1.4, 0.03); break;
        case 'sheathe': tone('square', 2200, 2100, 0.04, 0.06); noise(0.08, 0.2, 'bandpass', 4000, 3000); tone('triangle', 1400, 1400, 0.25, 0.04, 0.05); break;
        case 'boom': noise(1.0, 0.4, 'lowpass', 1200, 60); tone('sine', 70, 30, 0.8, 0.4); break;
        case 'type': tone('square', 1100 + Math.random() * 300, 0, 0.02, 0.05); noise(0.02, 0.08, 'highpass', 5000); break;
        case 'stretch': tone('sawtooth', 120, 60, 0.6, 0.08); break;
        case 'impact': noise(1.4, 0.55, 'lowpass', 6000, 60); tone('sine', 90, 28, 1.2, 0.6); tone('sawtooth', 180, 40, 0.5, 0.12); break;
        case 'riser': noise(2.0, 0.22, 'bandpass', 300, 9000); tone('sawtooth', 110, 880, 2.0, 0.05); break;
        case 'rewind': for (let i = 0; i < 8; i++) tone('sawtooth', 1400 - i * 120, 300, 0.12, 0.05, i * 0.11); noise(1.0, 0.15, 'bandpass', 3000, 800); break;
        case 'tapestop': tone('sawtooth', 440, 30, 0.6, 0.12); tone('square', 220, 20, 0.6, 0.06); break;
        case 'hit2': noise(0.25, 0.4, 'lowpass', 5000, 200); tone('sine', 160, 50, 0.25, 0.5); break;
        case 'boing': tone('sine', 300, 900, 0.15, 0.2); tone('sine', 900, 200, 0.3, 0.15, 0.15); break;
      }
    },
  };
})();
