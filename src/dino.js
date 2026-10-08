/* ===== Sauria concept renderer: modular dinosaurs =====
   Each species is four swappable parts (tail, body, neck, head). A part is a list of spine
   control points [x, y, topThickness, bottomThickness] relative to its attach point.
   The body owns the legs. Ground is y = 0, the hip sits at y = -body.hip, facing +x. */
const SP = {
  trex: {
    name: 'Tyrannosaurus', stem: 'Tyranno',
    pal: { side: '#7a5c3c', back: '#352719', belly: '#dcc39a', stripe: '#2a1f15', eye: '#f0b54a' },
    tail: { pts: [[-178, 12, 1.2, 1.2], [-140, 9, 4, 4], [-100, 4, 9, 9], [-60, 0, 15, 16], [-28, -1, 21, 23], [0, 0, 26, 30]] },
    body: {
      pts: [[0, 0, 26, 30], [30, 2, 29, 38], [60, 8, 27, 40], [84, 10, 22, 30]], hip: 112,
      hind: [[0, 0, 25], [20, 46, 14], [4, 86, 7.5], [11, 104, 5], [28, 109, 3]],
      arm: [[0, 0, 5], [9, 10, 3.6], [16, 9, 2.4]], armAt: [72, 22],
    },
    neck: { pts: [[0, 0, 22, 30], [14, -10, 19, 21], [26, -22, 17, 18], [34, -30, 16, 16]] },
    head: { pts: [[0, 0, 15, 15], [12, -3, 20, 17], [30, -2, 18, 15], [44, 2, 13, 12], [54, 5, 8, 7.5], [58, 6, 4, 4]], eye: [15, -9], mouth: 'teeth', brow: true },
  },
  stego: {
    name: 'Stegosaurus', stem: 'Stego',
    pal: { side: '#6f7448', back: '#363a22', belly: '#d2c491', stripe: '#2c3020', eye: '#2a1c10', plate: '#b9572f', plate2: '#e3a04a' },
    tail: { pts: [[-160, 40, 2.2, 2.2], [-122, 34, 5, 5], [-82, 22, 10, 10], [-40, 8, 17, 17], [0, 0, 25, 25]], plates: { h: 30, u0: 0.42 }, spikes: { n: 4, len: 34 } },
    body: {
      pts: [[0, 0, 25, 25], [34, 8, 25, 28], [64, 24, 20, 23], [86, 36, 14, 15]], hip: 98, plates: { h: 46 },
      hind: [[0, 0, 19], [4, 46, 12.5], [-1, 80, 10.5], [1, 88, 10]],
      front: [[0, 0, 12], [4, 32, 8.5], [1, 60, 8]], frontAt: [78, 30],
    },
    neck: { pts: [[0, 0, 14, 15], [14, 8, 10, 10], [27, 14, 8, 8]], plates: { h: 18 } },
    head: { pts: [[0, 0, 8, 8], [10, 2, 7.5, 7], [22, 6, 5.5, 5], [30, 9, 3, 3]], eye: [9, -2], mouth: 'beak' },
  },
  bronto: {
    name: 'Brontosaurus', stem: 'Bronto',
    pal: { side: '#7b766b', back: '#3f3c36', belly: '#cbc2ab', stripe: '#34312b', eye: '#20180f' },
    tail: { pts: [[-262, 44, 1, 1], [-212, 34, 3, 3], [-160, 20, 7, 7], [-104, 8, 13, 14], [-50, 1, 22, 24], [0, 0, 31, 33]] },
    body: {
      pts: [[0, 0, 31, 33], [44, 0, 35, 42], [84, -6, 32, 38], [108, -14, 24, 28]], hip: 122,
      hind: [[0, 0, 21], [6, 52, 15], [0, 92, 12.5], [2, 109, 13]],
      front: [[0, 0, 16], [4, 60, 12], [0, 104, 10.5], [1, 117, 11]], frontAt: [96, -6],
    },
    neck: { pts: [[0, 0, 24, 28], [30, -26, 16, 18], [58, -56, 12, 13], [86, -84, 10, 10], [108, -100, 8.5, 8.5]] },
    head: { pts: [[0, 0, 8.5, 8.5], [10, -1, 9, 8], [21, 2, 7, 6], [27, 4, 4, 4]], eye: [8, -3], mouth: 'smile' },
  },
  trike: {
    name: 'Triceratops', stem: 'Cerato',
    pal: { side: '#8a6a4a', back: '#45321f', belly: '#dac7a3', stripe: '#3a2a1c', eye: '#20160c', frill: '#b4623a', frill2: '#e8b25a' },
    tail: { pts: [[-128, 30, 1.5, 1.5], [-94, 22, 6, 6], [-55, 10, 13, 13], [0, 0, 25, 25]] },
    body: {
      pts: [[0, 0, 25, 25], [38, 4, 29, 33], [74, 12, 26, 30], [94, 18, 20, 23]], hip: 88,
      hind: [[0, 0, 21], [7, 40, 13], [0, 70, 10.5], [2, 78, 10]],
      front: [[0, 0, 14], [-5, 32, 10], [0, 52, 9], [2, 61, 9]], frontAt: [84, 18],
    },
    neck: { pts: [[0, 0, 20, 23], [12, 4, 18, 20]] },
    head: {
      pts: [[0, 0, 18, 19], [16, 4, 17, 16], [33, 12, 12, 11], [45, 20, 7, 6], [50, 24, 3, 3]], eye: [16, -4], mouth: 'beak',
      frill: { cx: -6, cy: -16, rx: 25, ry: 36, rot: -0.55 }, horns: [[18, -10, -0.42, 42, 6.5], [40, 5, -1.15, 14, 5.5]],
    },
  },
  allo: {
    name: 'Allosaurus', stem: 'Allo',
    pal: { side: '#8a5a3e', back: '#33200f', belly: '#dcb68f', stripe: '#24150c', eye: '#f2c14e' },
    tail: { pts: [[-182, 8, 1.2, 1.2], [-142, 5, 4, 4], [-96, 2, 8.5, 9], [-50, 0, 14, 15], [0, 0, 21, 23]] },
    body: {
      pts: [[0, 0, 21, 23], [30, 3, 23, 29], [58, 8, 21, 29], [78, 8, 16, 20]], hip: 106,
      hind: [[0, 0, 21], [19, 44, 11.5], [4, 82, 6.5], [11, 100, 4.3], [27, 104, 2.8]],
      arm: [[0, 0, 5], [11, 13, 3.4], [21, 13, 2.2]], armAt: [60, 20],
    },
    neck: { pts: [[0, 0, 16, 20], [13, -12, 12, 13], [23, -24, 11, 11]] },
    head: { pts: [[0, 0, 11, 10], [13, -2, 13, 11], [30, 0, 10, 9], [44, 3, 6, 5.5], [48, 4, 3, 3]], eye: [11, -5], mouth: 'teeth', brow: true, hornlet: [13, -13] },
  },
  coelo: {
    name: 'Coelophysis', stem: 'Coelo',
    pal: { side: '#b0744a', back: '#55301d', belly: '#ecd0a8', stripe: '#3a2014', eye: '#f2c14e' },
    tail: { pts: [[-150, 6, 0.8, 0.8], [-110, 4, 2.5, 2.5], [-70, 2, 5, 5], [-35, 0, 8, 8], [0, 0, 11, 12]] },
    body: {
      pts: [[0, 0, 11, 12], [22, 2, 12, 15], [42, 4, 10, 13], [54, 2, 7, 8]], hip: 70,
      hind: [[0, 0, 10], [14, 30, 6], [2, 54, 3.5], [8, 66, 2.4], [18, 69, 1.6]],
      arm: [[0, 0, 2.6], [8, 9, 1.8], [14, 9, 1.2]], armAt: [44, 9],
    },
    neck: { pts: [[0, 0, 7, 8], [10, -12, 5.5, 5.5], [16, -26, 5, 5], [22, -34, 4.8, 4.8]] },
    head: { pts: [[0, 0, 5, 4.5], [8, -1, 5.5, 4.5], [18, 1, 4, 3.5], [26, 3, 2, 2]], eye: [6, -2.5], mouth: 'teeth' },
  },
  para: {
    name: 'Parasaurolophus', stem: 'Lopho',
    pal: { side: '#5f7a78', back: '#283b3e', belly: '#cfd2b8', stripe: '#22323a', eye: '#20160c', crest: '#c2492f' },
    tail: { pts: [[-148, 12, 1.5, 1.5], [-108, 8, 6, 6], [-64, 3, 13, 14], [0, 0, 23, 27]] },
    body: {
      pts: [[0, 0, 23, 27], [34, 6, 25, 31], [62, 16, 20, 24], [80, 22, 14, 16]], hip: 100,
      hind: [[0, 0, 21], [13, 44, 12], [2, 82, 7.5], [9, 96, 5], [22, 99, 3]],
      front: [[0, 0, 10], [3, 40, 7], [5, 72, 5.5]], frontAt: [68, 22],
    },
    neck: { pts: [[0, 0, 14, 16], [12, -12, 10, 10], [20, -26, 9, 9]] },
    head: { pts: [[0, 0, 9, 9], [13, 3, 9, 8], [25, 9, 6, 5.5], [31, 12, 4, 4]], eye: [9, -3], mouth: 'bill', crest: [[6, -7], [-38, -30], 4.4] },
  },
  anky: {
    name: 'Ankylosaurus', stem: 'Ankylo',
    pal: { side: '#7d6a4f', back: '#3f3424', belly: '#cdb891', stripe: '#352b1f', eye: '#20160c' },
    tail: { pts: [[-128, 6, 4, 4], [-100, 4, 4.5, 4.5], [-62, 0, 9, 9], [0, 0, 23, 21]], club: { rx: 15, ry: 10 } },
    body: {
      pts: [[0, 0, 23, 21], [40, 0, 29, 25], [78, 6, 26, 23], [98, 14, 16, 16]], hip: 60, armor: true,
      hind: [[0, 0, 16], [4, 30, 11], [0, 50, 10]],
      front: [[0, 0, 11], [3, 22, 8], [0, 40, 8]], frontAt: [86, 12],
    },
    neck: { pts: [[0, 0, 15, 15], [10, 6, 13, 13]] },
    head: { pts: [[0, 0, 13, 12], [13, 3, 12, 11], [25, 7, 8, 8], [30, 9, 5, 5]], eye: [11, -3], mouth: 'beak' },
  },
  diplo: {
    name: 'Diplodocus', stem: 'Diplo',
    pal: { side: '#8a7f62', back: '#433b2c', belly: '#d6caa6', stripe: '#3a3326', eye: '#20180f' },
    tail: { pts: [[-300, 46, 0.8, 0.8], [-240, 36, 2, 2], [-180, 22, 5, 5], [-115, 8, 11, 12], [-55, 1, 19, 21], [0, 0, 26, 28]] },
    body: {
      pts: [[0, 0, 26, 28], [40, 0, 29, 34], [76, -4, 26, 31], [98, -10, 19, 22]], hip: 112,
      hind: [[0, 0, 19], [5, 50, 14], [0, 88, 11.5], [2, 100, 12]],
      front: [[0, 0, 14], [3, 55, 10.5], [0, 96, 9.5], [1, 106, 10]], frontAt: [88, -4],
    },
    neck: { pts: [[0, 0, 19, 22], [34, -16, 13, 14], [70, -36, 9, 10], [104, -52, 7, 7], [128, -60, 6, 6]] },
    head: { pts: [[0, 0, 6, 6], [9, 0, 6.5, 6], [19, 3, 5, 4.5], [24, 5, 3, 3]], eye: [7, -2.5], mouth: 'smile' },
  },
  iguano: {
    name: 'Iguanodon', stem: 'Iguano',
    pal: { side: '#7a8a5a', back: '#36401f', belly: '#dad6aa', stripe: '#2c331e', eye: '#20160c' },
    tail: { pts: [[-150, 14, 1.5, 1.5], [-110, 10, 6, 6], [-64, 4, 13, 14], [0, 0, 23, 27]] },
    body: {
      pts: [[0, 0, 23, 27], [34, 6, 25, 31], [62, 16, 21, 25], [82, 22, 15, 17]], hip: 104,
      hind: [[0, 0, 21], [13, 46, 12], [2, 86, 8], [9, 100, 5.5], [22, 103, 3.2]],
      front: [[0, 0, 8], [4, 40, 5.5], [6, 76, 5]], frontAt: [70, 22],
    },
    neck: { pts: [[0, 0, 15, 17], [12, -10, 11, 11], [22, -20, 10, 10]] },
    head: { pts: [[0, 0, 10, 10], [14, 3, 10, 9], [28, 8, 7, 6.5], [36, 11, 4.5, 4.5]], eye: [10, -4], mouth: 'beak' },
  },
  deino: {
    name: 'Deinonychus', stem: 'Deino',
    pal: { side: '#8a6a48', back: '#3a2616', belly: '#e2c8a0', stripe: '#2a1a0e', eye: '#f2c14e' },
    tail: { pts: [[-120, 0, 0.8, 0.8], [-90, -1, 2.2, 2.2], [-60, -1, 4, 4], [-30, 0, 7, 7.5], [0, 0, 10, 11]] },
    body: {
      pts: [[0, 0, 10, 11], [20, 1, 11, 14], [38, 3, 10, 13], [50, 2, 7, 8]], hip: 62,
      hind: [[0, 0, 9.5], [12, 26, 5.5], [1, 48, 3.2], [6, 58, 2.2], [15, 61, 1.5]],
      arm: [[0, 0, 3], [10, 9, 2.2], [20, 10, 1.5]], armAt: [40, 8],
    },
    neck: { pts: [[0, 0, 7, 8], [9, -8, 5.5, 5.5], [16, -16, 5, 5]] },
    head: { pts: [[0, 0, 5.5, 5], [8, -1, 6, 5], [18, 1, 4.5, 4], [25, 3, 2.2, 2.2]], eye: [6, -2.5], mouth: 'teeth', brow: true },
  },
  pachy: {
    name: 'Pachycephalosaurus', stem: 'Pachy',
    pal: { side: '#8a6a52', back: '#4a3424', belly: '#dcc3a2', stripe: '#3a281a', eye: '#20160c', dome: '#c9a37a' },
    tail: { pts: [[-110, 10, 1.2, 1.2], [-80, 7, 4, 4], [-45, 3, 9, 10], [0, 0, 17, 20]] },
    body: {
      pts: [[0, 0, 17, 20], [24, 4, 19, 24], [44, 10, 16, 20], [56, 12, 11, 12]], hip: 70,
      hind: [[0, 0, 15], [10, 30, 8.5], [1, 56, 5.5], [6, 67, 3.8], [15, 69, 2.4]],
      arm: [[0, 0, 3], [6, 8, 2.2], [10, 8, 1.6]], armAt: [44, 12],
    },
    neck: { pts: [[0, 0, 11, 12], [8, -8, 8, 8], [14, -14, 7.5, 7.5]] },
    head: { pts: [[0, 0, 9, 7], [9, 1, 10, 7], [18, 4, 7, 5.5], [24, 7, 3.5, 3.5]], eye: [11, 0], mouth: 'beak', dome: [7, -7, 11, 9] },
  },
  brachio: {
    name: 'Brachiosaurus', stem: 'Brachio',
    pal: { side: '#868670', back: '#424232', belly: '#d6d0ae', stripe: '#38382a', eye: '#20180f' },
    tail: { pts: [[-150, 34, 1, 1], [-110, 24, 4, 4], [-70, 12, 10, 10], [-30, 2, 20, 21], [0, 0, 28, 30]] },
    body: {
      pts: [[0, 0, 28, 30], [40, -14, 32, 36], [78, -34, 30, 34], [100, -48, 22, 26]], hip: 120,
      hind: [[0, 0, 20], [5, 50, 15], [0, 94, 12.5], [2, 107, 13]],
      front: [[0, 0, 18], [4, 70, 13.5], [0, 138, 11.5], [1, 148, 12]], frontAt: [90, -40],
    },
    neck: { pts: [[0, 0, 22, 26], [18, -40, 15, 16], [34, -90, 11, 12], [46, -140, 9, 9], [54, -176, 8, 8]] },
    head: { pts: [[0, 0, 8, 8], [11, -2, 9, 8], [23, 2, 6.5, 5.5], [29, 5, 3.5, 3.5]], eye: [8, -4], mouth: 'smile' },
  },
  spino: {
    name: 'Spinosaurus', stem: 'Spino',
    pal: { side: '#7a5a48', back: '#3a2418', belly: '#d6b896', stripe: '#2a180e', eye: '#f2c14e', sail: '#b8583a', sail2: '#e8a060' },
    tail: { pts: [[-190, 10, 1.5, 2.5], [-150, 6, 4, 6], [-100, 2, 8, 10], [-50, 0, 14, 16], [0, 0, 22, 24]] },
    body: {
      pts: [[0, 0, 22, 24], [34, -2, 24, 30], [66, 0, 22, 30], [88, 2, 16, 20]], hip: 100, sail: { h: 72 },
      hind: [[0, 0, 20], [16, 40, 11], [3, 76, 6.5], [10, 94, 4.3], [25, 98, 2.8]],
      arm: [[0, 0, 5.5], [12, 14, 4], [22, 16, 2.6]], armAt: [70, 24],
    },
    neck: { pts: [[0, 0, 16, 20], [16, -10, 12, 13], [28, -20, 10, 10]] },
    head: { pts: [[0, 0, 10, 9], [16, 0, 9, 8], [34, 4, 6, 5.5], [52, 8, 4.5, 4], [58, 9, 3, 3]], eye: [10, -4], mouth: 'teeth', brow: true },
  },
  proto: {
    name: 'Protoceratops', stem: 'Proto',
    pal: { side: '#b09060', back: '#5a4a2a', belly: '#e6d4a8', stripe: '#4a3a20', eye: '#20160c', frill: '#c88a4a', frill2: '#ecc078' },
    tail: { pts: [[-80, 16, 1.5, 1.5], [-55, 10, 5, 5], [-28, 4, 9, 9], [0, 0, 14, 14]] },
    body: {
      pts: [[0, 0, 14, 14], [24, 2, 16, 18], [44, 6, 14, 16], [56, 10, 11, 12]], hip: 48,
      hind: [[0, 0, 12], [4, 24, 7.5], [0, 42, 6]],
      front: [[0, 0, 8], [-2, 18, 6], [0, 35, 5]], frontAt: [50, 8],
    },
    neck: { pts: [[0, 0, 11, 12], [8, 2, 10, 10]] },
    head: { pts: [[0, 0, 10, 10], [10, 2, 10, 9], [20, 6, 7, 6], [27, 10, 3.5, 3.5]], eye: [9, -3], mouth: 'beak', frill: { cx: -4, cy: -10, rx: 12, ry: 16, rot: -0.7 } },
  },
  cory: {
    name: 'Corythosaurus', stem: 'Corytho',
    pal: { side: '#6a7a58', back: '#33402a', belly: '#d6d8b4', stripe: '#2a3420', eye: '#20160c', dome: '#c86a3a' },
    tail: { pts: [[-148, 12, 1.5, 1.5], [-108, 8, 6, 6], [-64, 3, 13, 14], [0, 0, 23, 27]] },
    body: {
      pts: [[0, 0, 23, 27], [34, 6, 25, 31], [62, 16, 20, 24], [80, 22, 14, 16]], hip: 100,
      hind: [[0, 0, 21], [13, 44, 12], [2, 82, 7.5], [9, 96, 5], [22, 99, 3]],
      front: [[0, 0, 10], [3, 40, 7], [5, 72, 5.5]], frontAt: [68, 22],
    },
    neck: { pts: [[0, 0, 14, 16], [12, -12, 10, 10], [20, -26, 9, 9]] },
    head: { pts: [[0, 0, 9, 9], [13, 3, 9, 8], [24, 8, 6, 5.5], [30, 11, 4, 4]], eye: [9, -3], mouth: 'bill', dome: [4, -11, 10, 14] },
  },
  galli: {
    name: 'Gallimimus', stem: 'Galli',
    pal: { side: '#a88a62', back: '#5a4228', belly: '#ecdcbc', stripe: '#4a3420', eye: '#20160c' },
    tail: { pts: [[-120, 4, 0.8, 0.8], [-90, 2, 2.5, 2.5], [-55, 0, 5, 5.5], [-25, 0, 8, 9], [0, 0, 11, 13]] },
    body: {
      pts: [[0, 0, 11, 13], [20, 2, 13, 17], [38, 4, 11, 15], [48, 0, 8, 9]], hip: 92,
      hind: [[0, 0, 12], [16, 38, 7], [2, 72, 4], [8, 88, 2.6], [20, 91, 1.8]],
      arm: [[0, 0, 3], [9, 10, 2.2], [16, 12, 1.5]], armAt: [38, 10],
    },
    neck: { pts: [[0, 0, 7, 8], [12, -16, 5, 5], [18, -36, 4.5, 4.5], [22, -52, 4.2, 4.2]] },
    head: { pts: [[0, 0, 4.5, 4], [7, -1, 5, 4], [15, 1, 3.5, 3], [21, 3, 1.8, 1.8]], eye: [5, -2], mouth: 'beak' },
  },
  edmonto: {
    name: 'Edmontosaurus', stem: 'Edmonto',
    pal: { side: '#6f6a50', back: '#383424', belly: '#d4ceac', stripe: '#2c281a', eye: '#20160c' },
    tail: { pts: [[-170, 14, 1.5, 1.5], [-125, 10, 6, 6], [-72, 4, 14, 15], [0, 0, 25, 29]] },
    body: {
      pts: [[0, 0, 25, 29], [38, 6, 27, 33], [68, 18, 22, 26], [88, 26, 15, 17]], hip: 108,
      hind: [[0, 0, 22], [14, 48, 13], [2, 90, 8.5], [10, 104, 5.8], [24, 107, 3.4]],
      front: [[0, 0, 9], [3, 42, 6], [6, 78, 5.5]], frontAt: [74, 26],
    },
    neck: { pts: [[0, 0, 15, 17], [13, -10, 11, 11], [24, -18, 10, 10]] },
    head: { pts: [[0, 0, 11, 10], [16, 4, 10, 9], [32, 10, 7, 6.5], [42, 13, 5.5, 5]], eye: [11, -4], mouth: 'bill' },
  },
};

const cr1 = (a, b, c, d, u) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
function crSpline(ctrl, step) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
    for (let s = 0; s < n; s++) {
      const u = s / n;
      out.push({
        x: cr1(p0.x, p1.x, p2.x, p3.x, u), y: cr1(p0.y, p1.y, p2.y, p3.y, u),
        t: Math.max(0.4, cr1(p0.t, p1.t, p2.t, p3.t, u)), b: Math.max(0.4, cr1(p0.b, p1.b, p2.b, p3.b, u)),
        tag: p2.tag,
      });
    }
  }
  out.push({ ...ctrl[ctrl.length - 1] });
  return out;
}
function normals(S, win = 3) {
  for (let i = 0; i < S.length; i++) {
    const a = S[Math.max(0, i - win)], c = S[Math.min(S.length - 1, i + win)];
    let dx = c.x - a.x, dy = c.y - a.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    Object.assign(S[i], { dx, dy, nx: dy, ny: -dx });
  }
}
const topPt = (q, k = 1) => [q.x + q.nx * q.t * k, q.y + q.ny * q.t * k];
const botPt = (q, k = 1) => [q.x - q.nx * q.b * k, q.y - q.ny * q.b * k];
function tubePath(S, i0 = 0, i1 = S.length - 1, caps = [true, true]) {
  const p = new Path2D();
  let q = topPt(S[i0]); p.moveTo(q[0], q[1]);
  for (let i = i0 + 1; i <= i1; i++) { q = topPt(S[i]); p.lineTo(q[0], q[1]); }
  const e = S[i1], ad = Math.atan2(e.dy, e.dx);
  if (caps[1]) p.arc(e.x + e.nx * (e.t - e.b) / 2, e.y + e.ny * (e.t - e.b) / 2, (e.t + e.b) / 2, ad - Math.PI / 2, ad + Math.PI / 2, false);
  for (let i = i1; i >= i0; i--) { q = botPt(S[i]); p.lineTo(q[0], q[1]); }
  const s = S[i0], a0 = Math.atan2(s.dy, s.dx);
  if (caps[0]) p.arc(s.x + s.nx * (s.t - s.b) / 2, s.y + s.ny * (s.t - s.b) / 2, (s.t + s.b) / 2, a0 + Math.PI / 2, a0 + 1.5 * Math.PI, false);
  p.closePath();
  return p;
}

function assemble(sel, pose = {}) {
  if (typeof sel === 'string') sel = { head: sel, neck: sel, body: sel, tail: sel };
  const T = SP[sel.tail].tail, B = SP[sel.body].body, N = SP[sel.neck].neck, Hd = SP[sel.head].head;
  const hipY = -B.hip, ctrl = [];
  const tl = T.pts[T.pts.length - 1], b0 = B.pts[0], ts = (b0[2] + b0[3]) / (tl[2] + tl[3]);
  for (const p of T.pts) ctrl.push({ x: p[0], y: hipY + p[1], t: p[2] * ts, b: p[3] * ts, tag: 'tail' });
  for (const p of B.pts.slice(1)) ctrl.push({ x: p[0], y: hipY + p[1], t: p[2], b: p[3], tag: 'body' });
  const be = B.pts[B.pts.length - 1], n0 = N.pts[0], ns = (be[2] + be[3]) / (n0[2] + n0[3]);
  const nb = { x: be[0], y: hipY + be[1] };
  for (const p of N.pts.slice(1)) ctrl.push({ x: nb.x + p[0], y: nb.y + p[1], t: p[2] * ns, b: p[3] * ns, tag: 'neck' });
  const ne = N.pts[N.pts.length - 1], hb = { x: nb.x + ne[0], y: nb.y + ne[1] };
  for (const p of Hd.pts.slice(1)) ctrl.push({ x: hb.x + p[0], y: hb.y + p[1], t: p[2], b: p[3], tag: 'head' });
  // pose: bend the tail about the hip and the neck about its base (positive = tail up / head down)
  const rot = (q, cx, cy, a) => { const dx = q.x - cx, dy = q.y - cy, c = Math.cos(a), s_ = Math.sin(a); q.x = cx + dx * c - dy * s_; q.y = cy + dx * s_ + dy * c; };
  if (pose.tail) { const tl0 = -T.pts[0][0]; for (const q of ctrl) if (q.tag === 'tail') rot(q, 0, hipY, pose.tail * Math.pow(Math.min(1, -q.x / tl0), 0.8)); }
  if (pose.head) {
    const nl = Math.hypot(ne[0], ne[1]) || 1;
    for (const q of ctrl) if (q.tag === 'neck') rot(q, nb.x, nb.y, pose.head * Math.min(1, Math.hypot(q.x - nb.x, q.y - nb.y) / nl));
    for (const q of ctrl) if (q.tag === 'head') rot(q, nb.x, nb.y, pose.head);
    rot(hb, nb.x, nb.y, pose.head);
  }
  const S = crSpline(ctrl, 2); normals(S, 3);
  const range = tag => { let a = -1, b = -1; S.forEach((q, i) => { if (q.tag === tag) { if (a < 0) a = i; b = i; } }); return [a, b]; };
  const M = { sel, T, B, N, Hd, hipY, nb, hb, S, headRot: pose.head || 0, ranges: { tail: range('tail'), body: range('body'), neck: range('neck'), head: range('head') } };
  M.pal = { ...SP[sel.body].pal };
  M.partPal = { tail: SP[sel.tail].pal, body: SP[sel.body].pal, neck: SP[sel.neck].pal, head: SP[sel.head].pal };
  return M;
}

function legShape(pts, ox, oy, rot = 0, lift = 0) {
  const c = Math.cos(rot), s = Math.sin(rot);
  let ctrl = pts.map(p => ({ x: ox + p[0] * c - p[1] * s, y: oy + p[0] * s + p[1] * c, t: p[2], b: p[2] }));
  const low = Math.max(...ctrl.map(q => q.y + q.t));
  const drop = -low - lift; // keep the foot on the ground (y = 0) unless lifted
  if (Math.abs(drop) < 12) ctrl = ctrl.map((q, i) => ({ ...q, y: q.y + drop * (i / (ctrl.length - 1)) }));
  const S = crSpline(ctrl, 1.5); normals(S, 2);
  return { S, ctrl, path: tubePath(S) };
}
function legsOf(M, pose = {}) {
  const B = M.B, hip = [B.hindAt?.[0] || 0, M.hipY + (B.hindAt?.[1] || 0)];
  const st = pose.stride ?? 0.18;
  const legs = [];
  legs.push({ ...legShape(B.hind, hip[0] + 7, hip[1] - 2, st, pose.liftFar || 0), near: false, kind: 'hind' });
  legs.push({ ...legShape(B.hind, hip[0], hip[1], -st * 0.9, pose.liftNear || 0), near: true, kind: 'hind' });
  if (B.front) {
    const f = [B.frontAt[0], M.hipY + B.frontAt[1]];
    legs.push({ ...legShape(B.front, f[0] + 6, f[1] - 2, -st, 0), near: false, kind: 'front' });
    legs.push({ ...legShape(B.front, f[0], f[1], st * 0.8, 0), near: true, kind: 'front' });
  }
  if (B.arm) {
    const a = [B.armAt[0], M.hipY + B.armAt[1]];
    legs.push({ ...legShape(B.arm, a[0] + 5, a[1] - 2, -0.25 + (pose.arm || 0), -999), near: false, kind: 'arm' });
    legs.push({ ...legShape(B.arm, a[0], a[1], 0.1 + (pose.arm || 0), -999), near: true, kind: 'arm' });
  }
  return legs;
}

/* plates along the back: one list of stations, two staggered rows */
function plateStations(M) {
  const parts = { tail: M.T.plates, body: M.B.plates, neck: M.N.plates };
  const out = [], S = M.S; let acc = 0, idx = 0;
  for (let i = 1; i < S.length; i++) {
    acc += Math.hypot(S[i].x - S[i - 1].x, S[i].y - S[i - 1].y);
    if (acc < 13) continue; acc = 0;
    const q = S[i], def = parts[q.tag]; if (!def) continue;
    const [a, b] = M.ranges[q.tag], u = (i - a) / Math.max(1, b - a);
    let h;
    if (q.tag === 'tail') h = u < (def.u0 || 0) ? 0 : def.h * sstep(def.u0 || 0, 1, u) * 0.9 + def.h * 0.1;
    else if (q.tag === 'body') h = def.h * (0.75 + 0.25 * Math.sin(Math.PI * clamp(0.2 + u * 0.9, 0, 1)));
    else h = def.h * (1 - u * 0.7);
    if (h > 3) out.push({ q, h, row: idx++ % 2 });
  }
  return out;
}
function platePath(p, q, h, back = 0.22) {
  const w = h * 0.62, base = topPt(q, 0.7);
  const dx = q.dx, dy = q.dy, nx = q.nx, ny = q.ny;
  const L = [base[0] - dx * w / 2, base[1] - dy * w / 2], R = [base[0] + dx * w / 2, base[1] + dy * w / 2];
  const tip = [base[0] + nx * h - dx * h * back, base[1] + ny * h - dy * h * back];
  p.moveTo(L[0], L[1]);
  p.quadraticCurveTo(L[0] + nx * h * 0.75 - dx * w * 0.2, L[1] + ny * h * 0.75 - dy * w * 0.2, tip[0], tip[1]);
  p.quadraticCurveTo(R[0] + nx * h * 0.55 + dx * w * 0.15, R[1] + ny * h * 0.55 + dy * w * 0.15, R[0], R[1]);
  p.closePath();
}
function spikePath(p, base, ang, len, w) {
  const c = Math.cos(ang), s = Math.sin(ang), px = -s, py = c;
  p.moveTo(base[0] + px * w / 2, base[1] + py * w / 2);
  p.quadraticCurveTo(base[0] + c * len * 0.5 + px * w * 0.25, base[1] + s * len * 0.5 + py * w * 0.25, base[0] + c * len, base[1] + s * len);
  p.quadraticCurveTo(base[0] + c * len * 0.5 - px * w * 0.35, base[1] + s * len * 0.5 - py * w * 0.35, base[0] - px * w / 2, base[1] - py * w / 2);
  p.closePath();
}

function feet(x, L, paint, mode, P, ink, lw) {
  if (L.kind === 'arm') {
    const e = L.ctrl[L.ctrl.length - 1], p = new Path2D();
    spikePath(p, [e.x + 1, e.y], 0.9, e.t * 2.4, e.t * 0.9); spikePath(p, [e.x, e.y + 0.5], 1.5, e.t * 2, e.t * 0.8);
    paint(p, mode === 'paint' ? '#2a2016' : null); return;
  }
  const e = L.ctrl[L.ctrl.length - 1], k = L.ctrl[L.ctrl.length - 2], p = new Path2D();
  if (L.ctrl.length >= 5) { // digitigrade theropod/hadrosaur foot: claws at the toe tip
    spikePath(p, [e.x + e.t * 0.6, e.y + e.t * 0.2], 0.25, e.t * 2.6, e.t * 1.4);
    spikePath(p, [e.x - e.t * 1.2, e.y + e.t * 0.6], 0.12, e.t * 2.4, e.t * 1.2);
    paint(p, mode === 'paint' ? shade(P.back, -0.3) : null);
  } else { // graviportal foot: broad pad with nails
    const r = e.t; p.ellipse(e.x + r * 0.15, e.y + r * 0.55, r * 1.2, r * 0.48, 0, 0, TAU);
    paint(p, mode === 'paint' ? shade(P.side, -0.12) : null);
    const n = new Path2D();
    for (let i = 0; i < 3; i++) { const nx = e.x + r * (0.35 + i * 0.32), ny = e.y + r * 0.82; n.moveTo(nx + r * 0.16, ny); n.ellipse(nx, ny, r * 0.17, r * 0.13, 0, 0, TAU); }
    paint(n, mode === 'paint' ? '#d8cdb4' : null);
  }
}

function dinoBounds(M, legs) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9;
  for (const q of M.S) { x0 = Math.min(x0, q.x - 40); x1 = Math.max(x1, q.x + 40); y0 = Math.min(y0, q.y - q.t - 70); }
  if (M.Hd.crest) x0 = Math.min(x0, M.hb.x - 60);
  return { x0, x1, y0, y1: 20 };
}

/* Render to an offscreen canvas. modes: paint | flat | line */
function renderDino(M, o = {}) {
  const s = o.scale || 1, mode = o.mode || 'paint', flip = !!o.flip, pad = 30;
  const legs = legsOf(M, o.pose || {});
  const bb = dinoBounds(M, legs);
  const w = (bb.x1 - bb.x0) * s + pad * 2, h = (bb.y1 - bb.y0) * s + pad * 2;
  const [c, x] = mk(w, h);
  const ax = flip ? pad + bb.x1 * s : pad - bb.x0 * s, ay = pad - bb.y0 * s;
  x.setTransform(flip ? -s : s, 0, 0, s, ax, ay);
  x.lineJoin = 'round'; x.lineCap = 'round';
  const P = { ...M.pal, ...(o.pal || {}) };
  const ink = o.ink || '#1b1712', lw = (o.lw || 1.6) / s;
  const flat = o.color || '#000000';
  const paint = (path, fill, dark = 0) => {
    if (mode === 'line') { x.fillStyle = '#ffffff'; x.fill(path); x.strokeStyle = ink; x.lineWidth = lw; x.stroke(path); }
    else if (mode === 'flat') { x.fillStyle = dark ? shade(flat, -dark * 0.5) : flat; x.fill(path); }
    else { x.fillStyle = fill; x.fill(path); }
  };
  const S = M.S, body = o.noHead ? tubePath(S, 0, M.ranges.head[0] + 1) : tubePath(S);
  let x0 = 1e9, x1 = -1e9, yTop = 1e9;
  for (const q of S) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); yTop = Math.min(yTop, q.y - q.t); }
  // side color: blend part palettes along the body (hybrids keep their donors' colors)
  let sideFill = P.side;
  if (o.hybridColors && mode === 'paint') {
    const g = x.createLinearGradient(x0, 0, x1, 0), at = i => (S[i].x - x0) / (x1 - x0);
    const R = M.ranges;
    g.addColorStop(0, M.partPal.tail.side);
    g.addColorStop(clamp(at(R.tail[1]) - 0.03, 0, 1), M.partPal.tail.side);
    g.addColorStop(clamp(at(R.tail[1]) + 0.03, 0, 1), M.partPal.body.side);
    g.addColorStop(clamp(at(R.body[1]) - 0.02, 0, 1), M.partPal.body.side);
    g.addColorStop(clamp(at(R.body[1]) + 0.03, 0, 1), M.partPal.neck.side);
    g.addColorStop(clamp(at(R.neck[1]), 0, 1), M.partPal.neck.side);
    g.addColorStop(clamp(at(R.neck[1]) + 0.04, 0, 1), M.partPal.head.side);
    g.addColorStop(1, M.partPal.head.side);
    sideFill = g;
  }
  const legFill = (leg, k) => {
    if (mode !== 'paint') return P.side;
    const top = leg.ctrl[0].y, bot = leg.ctrl[leg.ctrl.length - 1].y + 10;
    return lin(x, 0, top, 0, bot, [[0, shade(P.side, k)], [0.55, shade(P.side, k - 0.12)], [1, shade(P.back, k * 0.5)]]);
  };
  // far legs
  for (const L of legs.filter(l => !l.near)) { paint(L.path, legFill(L, -0.38), 0.6); feet(x, L, (pth, f) => paint(pth, f, 0.6), mode, { ...P, side: shade(P.side, -0.38) }, ink, lw); }
  // plates (both rows sit behind the body outline)
  const stations = plateStations(M);
  if (stations.length) {
    for (const row of [0, 1]) {
      const p = new Path2D();
      for (const st of stations.filter(s_ => s_.row === row)) platePath(p, st.q, st.h * (row ? 0.92 : 1), row ? 0.3 : 0.2);
      const pg = mode === 'paint' ? lin(x, 0, yTop - 50, 0, yTop + 30, [[0, shade(P.plate2 || P.side, row ? -0.3 : 0)], [1, shade(P.plate || P.back, row ? -0.35 : 0)]]) : null;
      paint(p, pg, row ? 0.5 : 0);
      if (mode === 'paint') { x.save(); x.clip(p); x.strokeStyle = rgba('#000000', 0.18); x.lineWidth = 1.2;
        for (const st of stations.filter(s_ => s_.row === row)) { const b = topPt(st.q, 0.7); x.beginPath(); x.moveTo(b[0], b[1]); x.lineTo(b[0] + st.q.nx * st.h * 0.8 - st.q.dx * st.h * 0.2, b[1] + st.q.ny * st.h * 0.8 - st.q.dy * st.h * 0.2); x.stroke(); }
        x.restore(); }
    }
  }
  // sail (Spinosaurus): a fin of spines rising from the back
  if (M.B.sail) {
    const [a, b] = M.ranges.body, top = [], tip = [];
    for (let i = a; i <= b; i++) { const q = S[i], u = (i - a) / Math.max(1, b - a), hh = M.B.sail.h * Math.pow(Math.sin(Math.PI * clamp(u * 1.05, 0, 1)), 0.75); top.push(topPt(q, 0.6)); tip.push([q.x + q.nx * (q.t * 0.6 + hh) - q.dx * hh * 0.08, q.y + q.ny * (q.t * 0.6 + hh)]); }
    const p = new Path2D(); p.moveTo(top[0][0], top[0][1]); tip.forEach(t_ => p.lineTo(t_[0], t_[1])); for (let i = top.length - 1; i >= 0; i--) p.lineTo(top[i][0], top[i][1]); p.closePath();
    paint(p, mode === 'paint' ? lin(x, 0, yTop - M.B.sail.h, 0, yTop + 20, [[0, P.sail2 || P.belly], [1, P.sail || P.side]]) : null);
    if (mode !== 'flat') { x.strokeStyle = mode === 'line' ? rgba(ink, 0.6) : rgba('#000000', 0.22); x.lineWidth = mode === 'line' ? lw * 0.6 : 1.2;
      x.beginPath(); for (let i = 0; i < top.length; i += 4) { x.moveTo(top[i][0], top[i][1]); x.lineTo(tip[i][0], tip[i][1]); } x.stroke(); }
  }
  // tail spikes, far pair
  const spikes = M.T.spikes ? (() => {
    const [a, b] = M.ranges.tail, out = [];
    for (let k = 0; k < M.T.spikes.n; k++) {
      const i = Math.round(a + (b - a) * (0.06 + k * 0.045)), q = S[i];
      const ang = Math.atan2(q.ny, q.nx) - (k % 2 ? 0.95 : 0.6) * 1;
      out.push({ base: topPt(q, 0.6), ang, len: M.T.spikes.len * (k < 2 ? 1 : 0.85), far: k % 2 === 1 });
    }
    return out;
  })() : [];
  if (spikes.length) { const p = new Path2D(); spikes.filter(k => k.far).forEach(k => spikePath(p, k.base, k.ang, k.len, 6)); paint(p, shade(P.belly, -0.35), 0.5); }
  // body
  paint(body, sideFill);
  if (mode === 'paint') {
    x.save(); x.clip(body);
    // countershading: dark dorsal bands, pale belly bands
    const band = (k, fromTop, color, a) => {
      const p = new Path2D();
      S.forEach((q, i) => { const pt = fromTop ? topPt(q, 1.3) : botPt(q, 1.3); i ? p.lineTo(pt[0], pt[1]) : p.moveTo(pt[0], pt[1]); });
      for (let i = S.length - 1; i >= 0; i--) {
        const q = S[i], d = k * (q.t + q.b);
        const pt = fromTop ? [q.x + q.nx * (q.t - d), q.y + q.ny * (q.t - d)] : [q.x - q.nx * (q.b - d), q.y - q.ny * (q.b - d)];
        p.lineTo(pt[0], pt[1]);
      }
      p.closePath(); x.fillStyle = rgba(color, a); x.fill(p);
    };
    for (const k of [0.16, 0.3, 0.46]) band(k, true, P.back, 0.26);
    for (const k of [0.12, 0.22, 0.34]) band(k, false, P.belly, 0.3);
    // dorsal stripes
    if (o.pattern !== 'none') {
      let acc = 0; const sp = new Path2D();
      for (let i = 2; i < S.length - 3; i++) {
        acc += Math.hypot(S[i].x - S[i - 1].x, S[i].y - S[i - 1].y);
        if (acc < 11 || S[i].tag === 'head') continue; acc = 0;
        const q = S[i], q2 = S[Math.min(S.length - 1, i + 3)], d = 0.5 * (q.t + q.b);
        const A = topPt(q, 1.2), B_ = topPt(q2, 1.2);
        sp.moveTo(A[0], A[1]); sp.lineTo(B_[0], B_[1]);
        sp.lineTo(q2.x + q2.nx * (q2.t - d * 0.8) - q2.dx * 2, q2.y + q2.ny * (q2.t - d * 0.8) - q2.dy * 2);
        sp.lineTo(q.x + q.nx * (q.t - d) - q.dx * 3, q.y + q.ny * (q.t - d) - q.dy * 3);
        sp.closePath();
      }
      x.fillStyle = rgba(P.stripe, 0.42); x.fill(sp);
    }
    // skin speckle
    const r = rng(o.seed || 3), n = Math.round((x1 - x0) * 4);
    for (let i = 0; i < n; i++) {
      const q = S[Math.floor(r() * S.length)], k = r() * 2 - 1;
      const px = q.x + q.nx * (k > 0 ? q.t * k : q.b * k) + (r() - 0.5) * 3, py = q.y + q.ny * (k > 0 ? q.t * k : q.b * k);
      x.fillStyle = r() < 0.6 ? 'rgba(0,0,0,.10)' : 'rgba(255,240,210,.08)';
      x.beginPath(); x.arc(px, py, (0.5 + r() * 1.2), 0, TAU); x.fill();
    }
    x.restore();
  } else if (mode === 'line') {
    // belly line for colouring regions
    x.beginPath(); S.forEach((q, i) => { if (q.tag === 'head') return; const pt = [q.x - q.nx * q.b * 0.45, q.y - q.ny * q.b * 0.45]; i ? x.lineTo(pt[0], pt[1]) : x.moveTo(pt[0], pt[1]); });
    x.strokeStyle = rgba(ink, 0.55); x.lineWidth = lw * 0.7; x.stroke();
  }
  // head furniture
  const hb = M.hb, Hd = M.Hd, HP = M.partPal.head;
  const HR = M.headRot || 0, hc = Math.cos(HR), hsn = Math.sin(HR);
  const HL = (dx, dy) => [hb.x + dx * hc - dy * hsn, hb.y + dx * hsn + dy * hc];
  if (Hd.frill && !o.noHead) {
    const f = { ...Hd.frill, rot: Hd.frill.rot + HR }, p = new Path2D(), [cx, cy] = HL(Hd.frill.cx, Hd.frill.cy), N_ = 40;
    for (let i = 0; i <= N_; i++) {
      const a = (i / N_) * TAU, bump = 1 + 0.07 * Math.max(0, Math.cos(a * 9));
      const ex = Math.cos(a) * f.rx * bump, ey = Math.sin(a) * f.ry * bump;
      const X = cx + ex * Math.cos(f.rot) - ey * Math.sin(f.rot), Y = cy + ex * Math.sin(f.rot) + ey * Math.cos(f.rot);
      i ? p.lineTo(X, Y) : p.moveTo(X, Y);
    }
    p.closePath();
    paint(p, mode === 'paint' ? rad(x, cx + 6, cy + 8, 4, f.ry * 1.1, [[0, shade(HP.frill || HP.side, -0.25)], [0.6, HP.frill || HP.side], [0.86, HP.frill2 || HP.belly], [1, shade(HP.frill || HP.side, -0.2)]]) : null);
    if (mode === 'line') { x.beginPath(); x.ellipse(cx + 2, cy + 4, f.rx * 0.6, f.ry * 0.62, f.rot, 0, TAU); x.strokeStyle = rgba(ink, 0.5); x.lineWidth = lw * 0.7; x.stroke(); }
    // face drawn again over the frill
    const [a, b] = M.ranges.head, head = tubePath(S, Math.max(0, a - 4), b, [false, true]);
    paint(head, sideFill);
    if (mode === 'paint') { x.save(); x.clip(head); x.fillStyle = lin(x, 0, hb.y - 20, 0, hb.y + 25, [[0, rgba(P.back, 0.4)], [0.5, rgba(P.back, 0)], [1, rgba(P.belly, 0.4)]]); x.fillRect(hb.x - 30, hb.y - 40, 100, 80); x.restore(); }
  }
  if (Hd.crest && !o.noHead) {
    const [[ax_, ay_], [bx, by], r_] = Hd.crest;
    const ctrl = [{ x: hb.x + ax_, y: hb.y + ay_, t: r_ * 1.15, b: r_ * 1.15 }, { x: hb.x + (ax_ + bx) / 2, y: hb.y + (ay_ + by) / 2 - 3, t: r_, b: r_ }, { x: hb.x + bx, y: hb.y + by, t: r_ * 0.9, b: r_ * 0.9 }];
    const CS = crSpline(ctrl.reverse(), 1.5); normals(CS, 2);
    paint(tubePath(CS), mode === 'paint' ? lin(x, hb.x + bx, 0, hb.x + ax_, 0, [[0, HP.crest || HP.side], [1, shade(HP.crest || HP.side, -0.3)]]) : null);
  }
  if (Hd.horns && !o.noHead) {
    const p = new Path2D();
    for (const [hx, hy, ang, len, wd] of Hd.horns) spikePath(p, HL(hx, hy), ang + HR, len, wd);
    paint(p, mode === 'paint' ? lin(x, hb.x, hb.y - 40, hb.x + 40, hb.y, [[0, '#f3e6c8'], [1, '#9b8460']]) : null);
  }
  if (Hd.dome && !o.noHead) {
    const [dx, dy, rx, ry] = Hd.dome, [cx, cy] = HL(dx, dy), p = new Path2D();
    p.ellipse(cx, cy, rx, ry, HR - 0.15, 0, TAU);
    paint(p, mode === 'paint' ? rad(x, cx - rx * 0.3, cy - ry * 0.5, 1, rx * 1.3, [[0, shade(HP.dome || HP.side, 0.25)], [1, HP.dome || HP.side]]) : null);
    const k = new Path2D(); for (let i = 0; i < 7; i++) { const a = Math.PI * (0.55 + i * 0.13), kx = cx + Math.cos(a) * rx * 1.02, ky = cy + Math.sin(a) * ry * 1.02; k.moveTo(kx + 1.6, ky); k.arc(kx, ky, 1.6, 0, TAU); }
    paint(k, mode === 'paint' ? shade(HP.side, -0.15) : null);
  }
  if (Hd.hornlet && !o.noHead) { const p = new Path2D(); spikePath(p, HL(Hd.hornlet[0], Hd.hornlet[1] + 3), -1.9 + HR, 7, 6); paint(p, shade(P.side, -0.2)); }
  // tail club & spikes (near)
  if (M.T.club) {
    const q = S[M.ranges.tail[0] + 2], p = new Path2D();
    p.ellipse(q.x + 4, q.y, M.T.club.rx, M.T.club.ry, 0, 0, TAU);
    paint(p, mode === 'paint' ? rad(x, q.x + 2, q.y - 4, 2, M.T.club.rx * 1.2, [[0, shade(P.belly, -0.1)], [1, shade(P.back, 0.1)]]) : null);
  }
  if (spikes.length) { const p = new Path2D(); spikes.filter(k => !k.far).forEach(k => spikePath(p, k.base, k.ang, k.len, 6.5)); paint(p, mode === 'paint' ? lin(x, x0, yTop - 40, x0 + 40, yTop, [[0, '#f1e3c4'], [1, '#8c7a58']]) : null); }
  if (M.B.armor) {
    const p = new Path2D(), [a, b] = M.ranges.body;
    for (let i = M.ranges.tail[0] + 30; i < b; i += 5) {
      const q = S[i]; if (q.tag === 'tail' && i < M.ranges.tail[0] + 30) continue;
      const tp = topPt(q, 0.82); p.moveTo(tp[0] + 3.2, tp[1]); p.ellipse(tp[0], tp[1], 3.2, 2.4, 0, 0, TAU);
      if (q.tag === 'body' && (i % 10 === 0)) spikePath(p, botPt(q, 0.25), Math.atan2(-q.ny, -q.nx) * 0 + Math.PI * 0.62, 11, 5);
    }
    paint(p, mode === 'paint' ? shade(P.belly, -0.18) : null);
  }
  // near legs, arms
  for (const L of legs.filter(l => l.near)) {
    if (mode !== 'paint') { paint(L.path, null); feet(x, L, paint, mode, P, ink, lw); continue; }
    const [lc, lx] = mk(w, h); lx.setTransform(flip ? -s : s, 0, 0, s, ax, ay); lx.lineJoin = 'round';
    lx.fillStyle = legFill(L, 0.02); lx.fill(L.path);
    lx.save(); lx.clip(L.path);
    lx.strokeStyle = rgba(P.back, 0.4); lx.lineWidth = Math.max(3, L.ctrl[0].t * 0.35); lx.stroke(L.path);
    const c0 = L.ctrl[0]; lx.fillStyle = rad(lx, c0.x + 3, c0.y + c0.t * 0.3, 2, c0.t * 1.5, [[0, rgba('#fff3dc', 0.16)], [1, rgba('#fff3dc', 0)]]); lx.fillRect(c0.x - 80, c0.y - 80, 160, 160);
    lx.restore();
    feet(lx, L, (pth, f) => { lx.fillStyle = f; lx.fill(pth); }, mode, P, ink, lw);
    if (L.kind !== 'arm') {
      // fade the thigh into the body: invisible above the belly line, solid below it
      let nq = S[0]; for (const q of S) if (Math.abs(q.x - c0.x) < Math.abs(nq.x - c0.x)) nq = q;
      const belly = nq.y + nq.b;
      lx.globalCompositeOperation = 'destination-in';
      lx.fillStyle = lin(lx, 0, belly - nq.b * 0.55, 0, belly + 2, [[0, 'rgba(0,0,0,0)'], [0.6, 'rgba(0,0,0,0.22)'], [1, 'rgba(0,0,0,1)']]);
      lx.fillRect(-2000, -2000, 4000, 4000);
    }
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(lc, 0, 0); x.restore();
  }
  // eye, mouth, nostril
  const [ex, ey] = HL(Hd.eye[0], Hd.eye[1]), hs = (Hd.pts[1][2] + Hd.pts[1][3]) / 30;
  const [ha, hb_] = M.ranges.head, snout = S[hb_];
  if (o.jaw && mode === 'paint' && !o.noHead) {
    // open mouth: dark wedge between the upper jaw line and a lower jaw rotated about the hinge
    const i0 = Math.round(lerp(ha, hb_, 0.12)), hinge = [S[i0].x - S[i0].nx * S[i0].b * 0.1, S[i0].y - S[i0].ny * S[i0].b * 0.1];
    const ml = [], bl = [];
    for (let i = i0; i <= hb_; i++) { const q = S[i]; ml.push([q.x - q.nx * q.b * 0.1, q.y - q.ny * q.b * 0.1]); bl.push(botPt(q)); }
    const tip = [snout.x + snout.dx * snout.b * 0.6, snout.y + snout.dy * snout.b * 0.6 + snout.b * 0.3];
    const ja = o.jaw, jc = Math.cos(ja), js = Math.sin(ja);
    const R = pt => [hinge[0] + (pt[0] - hinge[0]) * jc - (pt[1] - hinge[1]) * js, hinge[1] + (pt[0] - hinge[0]) * js + (pt[1] - hinge[1]) * jc];
    const lml = ml.map(R), lbl = bl.map(R), ltip = R(tip);
    const wedge = new Path2D(); wedge.moveTo(ml[0][0], ml[0][1]); ml.forEach(q => wedge.lineTo(q[0], q[1])); wedge.lineTo(tip[0], tip[1]); wedge.lineTo(ltip[0], ltip[1]);
    for (let i = lml.length - 1; i >= 0; i--) wedge.lineTo(lml[i][0], lml[i][1]); wedge.closePath();
    x.fillStyle = lin(x, hinge[0], hinge[1], tip[0], tip[1], [[0, '#2a0808'], [1, '#6a1a1a']]); x.fill(wedge);
    const jaw = new Path2D(); jaw.moveTo(lml[0][0], lml[0][1]); lml.forEach(q => jaw.lineTo(q[0], q[1])); jaw.lineTo(ltip[0], ltip[1]);
    for (let i = lbl.length - 1; i >= 0; i--) jaw.lineTo(lbl[i][0], lbl[i][1]); jaw.closePath();
    x.fillStyle = lin(x, 0, lml[0][1], 0, lbl[lbl.length - 1][1] + 10, [[0, shade(HP.side, -0.1)], [1, shade(HP.belly, -0.1)]]); x.fill(jaw);
    x.fillStyle = '#f4ecd8';
    const teeth = (line, dir) => { for (let k = 2; k < line.length - 1; k += 3) { const [tx, ty] = line[k], L_ = (2.2 + (k % 2)) * hs; x.beginPath(); x.moveTo(tx - 1.2 * hs, ty); x.lineTo(tx + 1.2 * hs, ty); x.lineTo(tx + 0.3 * hs, ty + dir * L_); x.fill(); } };
    teeth(ml, 1); teeth(lml, -1);
  }
  if (!o.noHead && (mode !== 'flat' || o.eye)) {
    x.strokeStyle = mode === 'line' ? ink : rgba('#120c07', 0.75); x.lineWidth = mode === 'line' ? lw : 1.3 * hs;
    // mouth line
    const m0 = S[Math.round(lerp(ha, hb_, Hd.mouth === 'teeth' ? 0.22 : 0.55))];
    if (!(o.jaw && mode === 'paint')) {
    x.beginPath(); x.moveTo(m0.x - m0.nx * m0.b * 0.1, m0.y - m0.ny * m0.b * 0.1);
    const mt = [snout.x - snout.nx * snout.b * 0.3 + snout.dx * 1.5, snout.y - snout.ny * snout.b * 0.3];
    x.quadraticCurveTo((m0.x + mt[0]) / 2, (m0.y + mt[1]) / 2 + (Hd.mouth === 'smile' ? -1.5 : 2.2) * hs, mt[0], mt[1]);
    x.stroke();
    if (Hd.mouth === 'teeth' && mode === 'paint' && s > 0.9) {
      x.fillStyle = '#f2ead8';
      for (let k = 0; k < 7; k++) { const u = 0.2 + k * 0.11, tx = lerp(m0.x, mt[0], u), ty = lerp(m0.y, mt[1], u) + 1.5 * hs * Math.sin(u * Math.PI);
        x.beginPath(); x.moveTo(tx - 1.1 * hs, ty); x.lineTo(tx + 1.1 * hs, ty); x.lineTo(tx + 0.2, ty + 2.6 * hs); x.fill(); }
    }
    }
    // eye
    const er = 2.3 * hs;
    if (o.eyeGlow) { x.save(); x.shadowColor = o.eyeGlow; x.shadowBlur = 16 * er; x.fillStyle = o.eyeGlow; x.beginPath(); x.arc(ex, ey, er * 1.2, 0, TAU); x.fill(); x.restore(); }
    if (mode === 'paint' && Hd.brow) { x.fillStyle = rgba(P.back, 0.7); x.beginPath(); x.ellipse(ex + 1, ey - er * 1.2, er * 2.4, er * 0.9, -0.15, 0, TAU); x.fill(); }
    x.fillStyle = mode === 'line' ? ink : (P.eye || '#1a120a'); x.beginPath(); x.arc(ex, ey, er, 0, TAU); x.fill();
    if (mode === 'paint') { x.fillStyle = '#0b0805'; x.beginPath(); x.ellipse(ex, ey, er * 0.35, er * 0.85, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(ex + er * 0.35, ey - er * 0.4, er * 0.28, 0, TAU); x.fill(); }
    // nostril
    x.fillStyle = mode === 'line' ? ink : 'rgba(0,0,0,.5)';
    x.beginPath(); x.ellipse(snout.x - snout.dx * 4 * hs + snout.nx * snout.t * 0.35, snout.y - snout.dy * 4 * hs + snout.ny * snout.t * 0.35, 1.3 * hs, 0.8 * hs, 0, 0, TAU); x.fill();
  }
  x.setTransform(1, 0, 0, 1, 0, 0);
  // lighting: shadow side + rim light
  if (mode === 'paint' || (mode === 'flat' && o.rim)) {
    const L = o.light || [0.6, -0.8], lx = L[0], ly = L[1];
    if (mode === 'paint') {
      x.save(); x.globalCompositeOperation = 'source-atop';
      const cxm = w / 2, cym = h / 2, R = Math.max(w, h) / 2;
      x.fillStyle = lin(x, cxm + lx * R, cym + ly * R, cxm - lx * R, cym - ly * R, [[0, rgba(o.lightColor || '#fff4dc', o.lightA ?? 0.1)], [0.5, 'rgba(0,0,0,0)'], [1, rgba(o.shadowColor || '#0a0604', o.shadowA ?? 0.45)]]);
      x.fillRect(0, 0, w, h);
      x.restore();
    }
    if (o.rim) {
      const d = (o.rimW || 3) * Math.max(1, s * 0.8);
      const [m, mx] = mk(w, h);
      mx.drawImage(c, 0, 0); mx.globalCompositeOperation = 'source-in'; mx.fillStyle = o.rim; mx.fillRect(0, 0, w, h);
      mx.globalCompositeOperation = 'destination-out'; mx.drawImage(c, -lx * d, -ly * d);
      const soft = blurred(m, 2);
      const [m2, m2x] = mk(w, h); m2x.drawImage(soft, 0, 0); m2x.drawImage(m, 0, 0); m2x.globalCompositeOperation = 'destination-in'; m2x.drawImage(c, 0, 0);
      x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = o.rimA ?? 0.9; x.drawImage(m2, 0, 0); x.restore();
    }
  }
  return { canvas: c, ax, ay, legs };
}

function groundShadow(ctx, X, Y, len, s, a = 0.45, color = '#000000') {
  ctx.save(); ctx.translate(X, Y); ctx.scale(1, 0.12);
  ctx.fillStyle = rad(ctx, 0, 0, 0, len * s * 0.5, [[0, rgba(color, a)], [0.6, rgba(color, a * 0.5)], [1, rgba(color, 0)]]);
  ctx.beginPath(); ctx.arc(0, 0, len * s * 0.5, 0, TAU); ctx.fill(); ctx.restore();
}
function drawDino(ctx, M, X, Y, o = {}) {
  const r = renderDino(M, o), s = o.scale || 1;
  if (o.shadow !== false && o.mode !== 'line') {
    const len = (M.S[M.S.length - 1].x - M.S[0].x) * 0.75, mid = (M.S[M.S.length - 1].x + M.S[0].x) / 2 + 20;
    groundShadow(ctx, X + (o.flip ? -mid : mid) * s, Y + 2, len, s, o.shadowA ?? 0.5, o.shadowColor);
  }
  ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.drawImage(r.canvas, X - r.ax, Y - r.ay); ctx.restore();
  return r;
}

/* Skeleton: bones drawn twice (outline pass, then fill pass) into an offscreen canvas */
function renderBones(M, o = {}) {
  const s = o.scale || 1, flip = !!o.flip, pad = 30;
  const legs = legsOf(M, o.pose || { stride: 0.12 });
  const bb = dinoBounds(M, legs);
  const w = (bb.x1 - bb.x0) * s + pad * 2, h = (bb.y1 - bb.y0) * s + pad * 2;
  const [c, x] = mk(w, h);
  const ax = flip ? pad + bb.x1 * s : pad - bb.x0 * s, ay = pad - bb.y0 * s;
  const S = M.S, B = M.B, Hd = M.Hd, hb = M.hb;
  const pass = (col, ext) => {
    x.setTransform(flip ? -s : s, 0, 0, s, ax, ay);
    x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = col; x.fillStyle = col;
    const L = (ax_, ay_, bx, by, wd) => { x.lineWidth = wd + ext; x.beginPath(); x.moveTo(ax_, ay_); x.lineTo(bx, by); x.stroke(); };
    const dot = (px, py, r_) => { x.beginPath(); x.arc(px, py, r_ + ext / 2, 0, TAU); x.fill(); };
    // limbs (far side first, slightly offset)
    for (const leg of legs) {
      const C = leg.ctrl;
      for (let i = 0; i < C.length - 1; i++) {
        const wd = Math.max(1.2, C[i + 1].t * (leg.kind === 'arm' ? 0.55 : 0.62));
        L(C[i].x, C[i].y, C[i + 1].x, C[i + 1].y, wd);
        dot(C[i].x, C[i].y, C[i].t * 0.42); dot(C[i + 1].x, C[i + 1].y, C[i + 1].t * 0.36);
      }
      const e = C[C.length - 1];
      if (leg.kind !== 'arm') for (let k = -1; k <= 1; k++) L(e.x, e.y + e.t * 0.5, e.x + 9 + k * 2, e.y + e.t * 0.9 + k * 1.5, 2);
      else { L(e.x, e.y, e.x + 5, e.y + 4, 1.4); }
    }
    // vertebrae, neural spines, chevrons
    let acc = 0;
    for (let i = 1; i < S.length; i++) {
      acc += Math.hypot(S[i].x - S[i - 1].x, S[i].y - S[i - 1].y);
      const q = S[i], sp = q.tag === 'tail' ? 6.5 : q.tag === 'neck' ? 7.5 : 8.5;
      if (q.tag === 'head' || acc < sp) continue; acc = 0;
      const th = Math.min(q.t, q.b), cl = sp * 0.74, ch = clamp(th * 0.34, 1.5, 7);
      x.save(); x.translate(q.x, q.y); x.rotate(Math.atan2(q.dy, q.dx));
      rr(x, -cl / 2 - ext / 2, -ch / 2 - ext / 2, cl + ext, ch + ext, ch * 0.45); x.fill();
      const ns = q.tag === 'tail' ? q.t * 0.55 : q.tag === 'neck' ? q.t * 0.35 : q.t * 0.62;
      x.lineWidth = clamp(cl * 0.32, 1, 3.6) + ext; x.beginPath(); x.moveTo(0, -ch / 2); x.lineTo(-cl * 0.3, -ch / 2 - ns); x.stroke();
      if (q.tag === 'tail' && q.b > 3) { x.lineWidth = clamp(cl * 0.22, 0.8, 2.6) + ext; x.beginPath(); x.moveTo(0, ch / 2); x.lineTo(-cl * 0.4, ch / 2 + q.b * 0.55); x.stroke(); }
      x.restore();
    }
    // ribs
    const [ba, bz] = M.ranges.body;
    for (let i = ba + 3; i < bz - 1; i += 3) {
      const q = S[i], d = q.b * 0.9;
      x.lineWidth = 1.8 + ext; x.beginPath(); x.moveTo(q.x, q.y + 2);
      x.quadraticCurveTo(q.x + 3, q.y + d * 0.55, q.x - 7, q.y + d); x.stroke();
    }
    // pelvis + shoulder girdle
    const ps = (B.pts[0][2] + B.pts[0][3]) / 56, hy = M.hipY;
    x.beginPath(); x.ellipse(2, hy + 3, 25 * ps + ext / 2, 8.5 * ps + ext / 2, 0.04, 0, TAU); x.fill();
    L(4, hy + 6, 4 + 13 * ps, hy + 44 * ps, 5.5 * ps); L(-4, hy + 6, -20 * ps, hy + 36 * ps, 4 * ps);
    if (B.arm || B.front) {
      const j = B.front ? B.frontAt : B.armAt;
      L(j[0], hy + j[1], j[0] - 24 * ps, hy + j[1] - 24 * ps, 6 * ps);
    }
    // skull: a solid shape with openings cut out on the fill pass
    const [ha, hz] = M.ranges.head;
    x.save(); x.lineWidth = ext; const skull = tubePath(S, Math.max(0, ha - 3), hz, [false, true]); x.fill(skull); if (ext) x.stroke(skull); x.restore();
    // plates, spikes, horns, frill, club as bone
    const pp = new Path2D();
    for (const st of plateStations(M)) platePath(pp, st.q, st.h * 0.92);
    if (M.T.spikes) { const [a, b] = M.ranges.tail; for (let k = 0; k < M.T.spikes.n; k++) { const q = S[Math.round(a + (b - a) * (0.06 + k * 0.045))]; spikePath(pp, topPt(q, 0.4), Math.atan2(q.ny, q.nx) - (k % 2 ? 0.95 : 0.6), M.T.spikes.len, 5); } }
    if (Hd.horns) for (const [hx, hy2, ang, len, wd] of Hd.horns) spikePath(pp, [hb.x + hx, hb.y + hy2], ang, len, wd);
    if (Hd.frill) { const f = Hd.frill; pp.ellipse(hb.x + f.cx, hb.y + f.cy, f.rx, f.ry, f.rot, 0, TAU); }
    if (Hd.crest) { const [[a1, a2], [b1, b2]] = Hd.crest; x.lineWidth = Hd.crest[2] * 1.6 + ext; x.beginPath(); x.moveTo(hb.x + a1, hb.y + a2); x.lineTo(hb.x + b1, hb.y + b2); x.stroke(); }
    if (M.T.club) { const q = S[M.ranges.tail[0] + 2]; pp.moveTo(q.x + 4 + M.T.club.rx, q.y); pp.ellipse(q.x + 4, q.y, M.T.club.rx, M.T.club.ry, 0, 0, TAU); }
    x.save(); x.globalAlpha = ext ? 1 : 0.85; x.fill(pp); if (ext) { x.lineWidth = ext; x.stroke(pp); } x.restore();
  };
  pass(o.outline || '#4a3c2c', 2.2 / s * (o.outlineK ?? 1));
  pass(o.bone || '#efe5cf', 0);
  // cut skull openings
  x.setTransform(flip ? -s : s, 0, 0, s, ax, ay);
  x.globalCompositeOperation = 'destination-out';
  const [ha, hz] = M.ranges.head, hl = hz - ha, eye = [hb.x + Hd.eye[0], hb.y + Hd.eye[1]], hs = (Hd.pts[1][2] + Hd.pts[1][3]) / 30;
  const big = Hd.mouth === 'teeth';
  x.beginPath(); x.ellipse(eye[0], eye[1] + 1.5, (big ? 4.6 : 3.6) * hs, (big ? 5.6 : 3.6) * hs, 0, 0, TAU); x.fill();
  if (big) {
    const q = S[ha + Math.round(hl * 0.5)]; x.beginPath(); x.ellipse(q.x, q.y - 1, 9 * hs, 5.2 * hs, -0.08, 0, TAU); x.fill();
    const q2 = S[ha + Math.round(hl * 0.08)]; x.beginPath(); x.ellipse(q2.x - 1, q2.y + 3, 3.4 * hs, 5.6 * hs, 0.35, 0, TAU); x.fill();
    const q3 = S[ha + Math.round(hl * 0.8)]; x.beginPath(); x.ellipse(q3.x, q3.y - q3.t * 0.35, 3 * hs, 1.8 * hs, 0, 0, TAU); x.fill();
  }
  // jaw gap and teeth
  const m0 = S[ha + Math.round(hl * 0.12)], sn = S[hz];
  const ja = [m0.x - m0.nx * m0.b * 0.25, m0.y - m0.ny * m0.b * 0.25 + 2 * hs], jb = [sn.x - sn.nx * sn.b * 0.1, sn.y - sn.ny * sn.b * 0.1 + 1];
  x.lineWidth = (big ? 2.6 : 1.6) * hs; x.beginPath(); x.moveTo(ja[0], ja[1]); x.lineTo(jb[0], jb[1]); x.stroke();
  if (big) {
    x.globalCompositeOperation = 'source-over'; x.fillStyle = o.bone || '#efe5cf';
    for (let k = 1; k < 9; k++) { const u = 0.15 + k * 0.095, tx = lerp(ja[0], jb[0], u), ty = lerp(ja[1], jb[1], u); x.beginPath(); x.moveTo(tx - 1.1 * hs, ty - 1.2 * hs); x.lineTo(tx + 1.1 * hs, ty - 1.2 * hs); x.lineTo(tx, ty + 1.6 * hs); x.fill(); }
  }
  x.globalCompositeOperation = 'source-over';
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (o.tint) { x.globalCompositeOperation = 'source-in'; x.fillStyle = o.tint; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over'; }
  else {
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = lin(x, 0, 0, 0, h, [[0, 'rgba(255,250,235,.0)'], [1, 'rgba(60,40,20,.35)']]); x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over';
  }
  return { canvas: c, ax, ay };
}
function drawBones(ctx, M, X, Y, o = {}) {
  const r = renderBones(M, o);
  ctx.save(); if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowB || 12; }
  if (o.op) ctx.globalCompositeOperation = o.op;
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.drawImage(r.canvas, X - r.ax, Y - r.ay); ctx.restore();
  return r;
}
