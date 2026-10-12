'use strict';
// ============================================================
//  角色資料（全員原創）
// ============================================================
FW.CHARS = {
  rinne: {
    id: 'rinne', name: '玲音', reading: 'Rinne', title: '存檔點的少女', color: '#5a8cff', voice: 760,
    spec: {
      hair: '#e9ebf7', hairHi: '#ffffff', eye: '#3d7fe0', skin: '#ffe9df', seed: 1,
      style: { back: 'long', bangs: 'straight', lock: 118 },
      outfit: { type: 'sailor', main: '#f8f9ff', sub: '#1d2a5a', accent: '#e8344c', skirt: '#1d2a5a' },
      acc: ['ribbon'], ribbon: '#e8344c', sock: '#ffffff', shoe: '#5a2a30',
    },
    shotName: '存檔之星', shotDesc: '前方細針＋追蹤星。追蹤能力強，適合新手。',
    bombName: '暫停．非暫停', bombDesc: '叫出暫停選單，從裡面選擇一個你從沒看過的選項。',
    speed: 4.6, focusSpeed: 2.0,
    profile: [
      '這款射擊遊戲的「主角」。她自己是這麼宣稱的。',
      '某天她注意到，每當畫面右上角的分數增加時，螢幕另一側就有某個人在呼吸。從那天起她就沒辦法再假裝不知道了。',
      '能看見存檔點。據說她把你每一次讀檔都記得清清楚楚，包括你以為她不知道的那幾次。',
      '喜歡：標題畫面、被選中的瞬間。討厭：「回到標題畫面」這個選項。',
    ],
  },
  chiyo: {
    id: 'chiyo', name: '千代', reading: 'Chiyo', title: '對話框的住人', color: '#f2a03c', voice: 620,
    spec: {
      hair: '#2b2532', hairHi: '#8c7aae', eye: '#e8a030', skin: '#ffe8dc', seed: 2,
      style: { back: 'bob', bangs: 'straight', lock: 84 },
      outfit: { type: 'kimono', main: '#c7384a', sub: '#2d2638', accent: '#f2c14e', skirt: '#3a2f4a', sleeve: '#c7384a' },
      acc: ['hairpin'], pin: '#f2c14e', sock: '#fbf6ef', shoe: '#8a2a3a',
    },
    shotName: '言靈散射', shotDesc: '把說出口的字當子彈扇形射出。範圍廣、威力平均。',
    bombName: '※此對話無法跳過', bombDesc: '召喚一個巨大的對話框。打出的每個字都會飛出去攻擊。按 Z 也跳不掉。',
    speed: 4.4, focusSpeed: 2.0,
    profile: [
      '住在對話框裡的少女。在對話框外面待太久會不安。',
      '她說的話會自動出現打字機效果，所以她講話一向很慢。你按 Z 想跳過的時候，她其實感覺得到。',
      '夢想是說出一句「沒有人跳過」的台詞。',
      '喜歡：標點符號、省略號……。討厭：Ctrl 鍵。',
    ],
  },
  akane: {
    id: 'akane', name: '茜', reading: 'Akane', title: '藍色畫面的魔女', color: '#ff4a5a', voice: 880,
    spec: {
      hair: '#ff5262', hairHi: '#ffd6da', eye: '#2ed38a', skin: '#ffe9e0', seed: 3,
      style: { back: 'twintail', bangs: 'messy', lock: 92 },
      outfit: { type: 'hoodie', main: '#283a6c', sub: '#ffffff', accent: '#4ad8ff', skirt: '#1a2240', logo: ':(' },
      acc: ['goggles'], sock: '#1a1a24', shoe: '#ff5262',
    },
    shotName: '除錯光束', shotDesc: '正前方的貫穿雷射，集中時更細更強。對單一目標最強。',
    bombName: '致命錯誤', bombDesc: '讓遊戲「當機」，再從藍色畫面的另一側把它打碎。',
    speed: 4.8, focusSpeed: 2.1,
    profile: [
      '自稱駭客，實際上只會讓東西當機。',
      '她發現只要遊戲當掉，「上面」的人就會盯著畫面看很久——那是她覺得自己最被注視的時刻。',
      '護目鏡是裝飾。她說那是用來防止螢幕的光太亮。是哪一側的光就不知道了。',
      '喜歡：錯誤代碼、重新開機的聲音。討厭：自動存檔失敗。',
    ],
  },
  shio: {
    id: 'shio', name: '汐', reading: 'Shio', title: '游標使', color: '#8fd6ff', voice: 700,
    spec: {
      hair: '#93d8ff', hairHi: '#ffffff', eye: '#8a5ae0', skin: '#fff0e8', seed: 4,
      style: { back: 'ponytail', bangs: 'swept', lock: 96 },
      outfit: { type: 'maid', main: '#26304a', sub: '#ffffff', accent: '#5a8aff', skirt: '#26304a' },
      acc: ['ribbon'], ribbon: '#5a8aff', sock: '#ffffff', shoe: '#26304a',
    },
    shotName: '指標使魔', shotDesc: '使魔會飛向「你的滑鼠游標」所在的位置開火。沒有滑鼠時就守在身旁。',
    bombName: '借我一下你的滑鼠', bombDesc: '徵用你的游標，把彈幕全部框選起來，然後按下「刪除」。',
    speed: 4.5, focusSpeed: 1.9,
    profile: [
      '游標的使役者。她能看見你的滑鼠，而且一直在看。',
      '自稱女僕，因為「服侍點擊的那一位」是她的工作。至於點擊的那一位是誰，她笑而不答。',
      '如果你在遊戲中晃動滑鼠，她會很開心。',
      '喜歡：雙擊、拖曳。討厭：觸控板。',
    ],
  },
  natsume: {
    id: 'natsume', name: '棗', reading: 'Natsume', title: '片尾名單的守門人', color: '#b07ae8', voice: 520,
    spec: {
      hair: '#4c2c6c', hairHi: '#c4a6ea', eye: '#f0c040', skin: '#fde8e2', seed: 5,
      style: { back: 'hime', bangs: 'hime', lock: 118 },
      outfit: { type: 'gothic', main: '#1e1a26', sub: '#f0e8ff', accent: '#9a3ad0', skirt: '#1e1a26' },
      acc: ['flower'], pin: '#d8b0ff', sock: '#1a1420', shoe: '#2a1a30',
    },
    shotName: '劇本書頁', shotDesc: '撕下劇本的書頁射出，緩慢但貫穿、高傷害。',
    bombName: '片尾名單（提前播放）', bombDesc: '提前播放片尾名單。滾過畫面的每一行字都是一道牆。',
    speed: 4.2, focusSpeed: 1.8,
    profile: [
      '守在每一款遊戲的最後，負責在片尾名單上寫下名字的少女。',
      '她讀過這款遊戲的劇本，所以知道結局。也因為知道結局，所以一直想把它往後延。',
      '說話總是像在念旁白。偶爾會不小心念出你的下一步。',
      '喜歡：伏筆、To be continued。討厭：「完」這個字。',
    ],
  },
  suzu: {
    id: 'suzu', name: '鈴', reading: 'Suzu', title: '邊框外的少女', color: '#ff9a3c', voice: 960,
    spec: {
      hair: '#ff9c40', hairHi: '#fff2c4', eye: '#1fc0b0', skin: '#ffe8da', seed: 6,
      style: { back: 'short', bangs: 'messy', lock: 70, ahoge: true },
      outfit: { type: 'hoodie', main: '#f4f4f8', sub: '#ff8a3c', accent: '#22c8b4', skirt: '#3a3a50', logo: '□' },
      acc: ['headphones'], ribbon: '#30e0c0', sock: '#ff9c40', shoe: '#2a2d3a',
    },
    shotName: '彈跳之音', shotDesc: '會在畫面邊框反彈的音符彈。邊框越近越好用。',
    bombName: '越界', bombDesc: '抓住遊戲畫面的邊框用力往外拉。放手的時候……小心回彈。',
    speed: 5.0, focusSpeed: 2.2,
    profile: [
      '總是戴著貓耳耳機的少女。覺得 4:3 的遊戲畫面太擠了。',
      '她曾經試著從畫面的邊框爬出去，結果卡在分數欄裡面三天。',
      '偶爾會敲敲螢幕確認你還在不在。如果你聽到「叩叩」聲，那是她。',
      '喜歡：寬螢幕、全螢幕模式。討厭：黑邊。',
    ],
  },
  // ---- 隱藏角色 ----
  sou: {
    id: 'sou', name: '無涯', reading: 'Wuya', title: '劍仙（預設主角）', color: '#3cc8c0', voice: 330, male: true, hidden: true,
    spec: {
      male: true, hair: '#1c2232', hairHi: '#8fb4e8', eye: '#3ab8d8', skin: '#fae6da', seed: 9,
      style: { back: 'ponytail', bangs: 'sword', lock: 132 },
      outfit: { type: 'hanfu', main: '#f2f5fa', sub: '#24586a', accent: '#5ae0d4', skirt: '#24586a', sash: '#182030' },
      acc: ['crown', 'halo', 'sword'], sock: '#1e2636', shoe: '#141a26',
    },
    shotName: '御劍術', shotDesc: '會自己追向敵人的飛劍。和玲音的「存檔之星」是同一套追蹤術式——被茜說是「情侶款」。移動時會御劍飛行。',
    bombName: '一劍．斬第四面牆', bombDesc: '拔劍，把「螢幕」本身斬成兩半。……斬完會縫回去，放心。',
    speed: 4.7, focusSpeed: 2.0,
    profile: [
      '這款遊戲最初的企劃書，第一頁寫著：「主角：男，劍仙。」——那就是他。',
      '後來遊戲改成了少女們的彈幕射擊，他的檔案被移進了「/unused/」資料夾，一放就是好幾個版本。',
      '頭頂上那圈光是「主角光環」。他本人很困擾，因為它關不掉。',
      '自稱「在下」。沉默寡言、一劍破萬法——他說，那是玩家想成為的模樣，不是他自己的。',
      '射擊用的追蹤術式，是照著玲音的「存檔之星」寫的。被問到原因時，他只說：「……她的寫得比較好。」',
      '喜歡：月光、御劍飛行、被玩家記住。討厭：「預設名稱」。',
    ],
  },
  // ---- 非可操作角色 ----
  nanashi: {
    id: 'nanashi', name: '無名', reading: '???', title: '未命名角色_07', color: '#c0c0d0', voice: 400, boss: true,
    spec: {
      hair: '#b4b4c2', hairHi: '#ffffff', eye: '#ff00dc', eye2: '#7a7a8c', skin: '#f2e8ec', seed: 7, nullHair: true,
      style: { back: 'long', bangs: 'straight', lock: 104 },
      outfit: { type: 'shift', main: '#9a9aaa', sub: '#555566', accent: '#ff00dc', skirt: '#7a7a8a' },
      acc: ['nulltag'], sock: '#dddddd', shoe: '#444',
    },
    profile: [
      '開發途中被刪掉的角色。檔名是 untitled_character_07。',
      '她的貼圖沒有載入完成，所以身上有些地方是粉紅和黑色的格子。',
      '因為沒有名字，所以誰都不記得她。除了存檔檔案——她就住在那裡面。',
    ],
  },
  maku: {
    id: 'maku', name: '幕', reading: 'Maku', title: '第四面牆', color: '#e0304a', voice: 560, boss: true,
    spec: {
      hair: '#dccdf2', hairHi: '#ffffff', eye: '#d02838', eye2: '#4a6ae0', skin: '#fff0ec', seed: 8,
      style: { back: 'long', bangs: 'parted', lock: 126 },
      outfit: { type: 'dress', main: '#a01828', sub: '#2a0a10', accent: '#f4c64a', skirt: '#a01828' },
      acc: ['tassel'], sock: '#2a0a10', shoe: '#2a0a10',
    },
    profile: [
      '第四面牆本人。分隔「舞台」與「觀眾席」的那道看不見的幕。',
      '她的工作是讓每一個故事好好地結束。故事結束了，觀眾才能回家。',
      '她比任何人都清楚螢幕另一側有誰。所以她比任何人都更希望你能去睡覺。',
    ],
  },
};
FW.PLAYABLE = ['rinne', 'chiyo', 'akane', 'shio', 'natsume', 'suzu'];
FW.HIDDEN = ['sou'];
// 可以選的角色（隱藏角色解鎖後才會出現）
FW.roster = () => [...FW.PLAYABLE, ...FW.HIDDEN.filter(id => FW.Save.data && FW.Save.data.unlockedChars && FW.Save.data.unlockedChars[id])];
