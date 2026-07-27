// Premium Chess.com Neo-style SVG piece templates.
// Uses layered vectors with precise curves, clean outer strokes, and interior detail lines.

const PIECES = {
  // Pawn
  p: `
    <svg viewBox="0 0 100 100" class="piece-svg pawn">
      <g class="piece-group">
        <!-- Base & Body -->
        <path d="M 32,82 L 68,82 C 68,82 70,80 70,76 C 70,72 63,68 62,60 C 60,45 64,36 50,36 C 36,36 40,45 38,60 C 37,68 30,72 30,76 C 30,80 32,82 32,82 Z" class="piece-body" />
        <!-- Head -->
        <circle cx="50" cy="27" r="13" class="piece-head" />
        <!-- Collar/Rings details -->
        <path d="M 36,68 L 64,68" class="piece-detail" />
        <path d="M 38,60 L 62,60" class="piece-detail" />
        <path d="M 43,44 C 47,46 53,46 57,44" class="piece-detail" />
      </g>
    </svg>
  `,

  // Rook
  r: `
    <svg viewBox="0 0 100 100" class="piece-svg rook">
      <g class="piece-group">
        <!-- Base and Tower -->
        <path d="M 30,82 L 70,82 C 70,82 72,80 72,76 L 72,70 C 72,70 69,68 67,68 L 67,40 C 67,38 69,36 69,36 L 69,28 L 31,28 C 31,28 33,38 33,40 L 33,68 C 31,68 28,70 28,70 L 28,76 C 28,80 30,82 30,82 Z" class="piece-body" />
        <!-- Turrets/Crenellations -->
        <path d="M 31,28 L 31,20 L 39,20 L 39,24 L 47,24 L 47,20 L 53,20 L 53,24 L 61,24 L 61,20 L 69,20 L 69,28 Z" class="piece-body" />
        <!-- Details -->
        <path d="M 33,40 L 67,40" class="piece-detail" />
        <path d="M 30,70 L 70,70" class="piece-detail" />
        <path d="M 31,28 L 69,28" class="piece-detail" />
      </g>
    </svg>
  `,

  // Knight - Detailed Horse head facing Left, mirroring Chess.com's famous Neo Knight
  n: `
    <svg viewBox="0 0 100 100" class="piece-svg knight">
      <g class="piece-group">
        <!-- Main body outline -->
        <path d="M 33,82 L 67,82 C 67,82 70,80 70,76 C 70,68 64,66 64,58 C 64,50 67,44 67,36 C 67,26 62,20 54,18 C 44,15 36,22 36,32 C 36,35 34,36 30,36 C 26,36 21,38 18,43 C 15,48 16,52 20,53 C 24,54 28,52 28,52 C 28,52 24,56 24,62 C 24,68 28,74 30,76 C 31,77 33,82 33,82 Z" class="piece-body" />
        <!-- Mane and Back detail -->
        <path d="M 50,19 C 58,22 62,28 62,38 C 62,48 59,58 59,68 C 59,74 65,77 65,77" class="piece-detail" />
        <!-- Muzzle / Jaw detail -->
        <path d="M 30,36 C 34,42 36,46 36,52 C 36,58 32,60 30,61" class="piece-detail" />
        <path d="M 23,49 C 26,50 28,49 28,49" class="piece-detail" />
        <!-- Eye -->
        <circle cx="42" cy="31" r="3.5" class="piece-eye" />
        <!-- Ear -->
        <path d="M 46,24 C 44,20 45,14 47,13 C 49,12 50,15 49,20" class="piece-body" />
        <path d="M 49,20 C 48,18 48,15 49,14" class="piece-detail" />
        <!-- Bottom base plate -->
        <path d="M 28,76 L 72,76" class="piece-detail" />
      </g>
    </svg>
  `,

  // Bishop - Classic miter shape with the characteristic diagonal cut
  b: `
    <svg viewBox="0 0 100 100" class="piece-svg bishop">
      <g class="piece-group">
        <!-- Base and Body -->
        <path d="M 33,82 L 67,82 C 67,82 69,80 69,76 C 69,72 63,68 62,62 C 60,52 65,42 63,34 C 61,24 53,20 50,20 C 47,20 39,24 37,34 C 35,42 40,52 38,62 C 37,68 31,72 31,76 C 31,80 33,82 33,82 Z" class="piece-body" />
        <!-- Top Small Ball / Cross -->
        <circle cx="50" cy="15" r="3.5" class="piece-body" />
        <!-- Diagonal Cut (Bishop's Slit) -->
        <path d="M 47,28 L 59,38" class="piece-slit" />
        <!-- Inner Details -->
        <path d="M 35,68 L 65,68" class="piece-detail" />
        <path d="M 38,62 L 62,62" class="piece-detail" />
        <path d="M 42,40 C 45,43 55,43 58,40" class="piece-detail" />
      </g>
    </svg>
  `,

  // Queen - Crown with 5 distinct peaks and circles on top
  q: `
    <svg viewBox="0 0 100 100" class="piece-svg queen">
      <g class="piece-group">
        <!-- Base & Lower Body -->
        <path d="M 30,82 L 70,82 C 70,82 72,80 72,76 L 72,70 C 72,70 65,66 64,58 C 62,48 66,42 66,42 L 25,42 L 34,42 C 34,42 38,48 36,58 C 35,66 28,70 28,70 L 28,76 C 28,80 30,82 30,82 Z" class="piece-body" />
        <!-- Main Crown Points -->
        <path d="M 25,42 L 18,24 L 34,36 L 50,18 L 66,36 L 82,24 L 75,42 Z" class="piece-body" />
        <!-- Small balls on points -->
        <circle cx="18" cy="23" r="3" class="piece-body" />
        <circle cx="34" cy="35" r="3" class="piece-body" />
        <circle cx="50" cy="17" r="3" class="piece-body" />
        <circle cx="66" cy="35" r="3" class="piece-body" />
        <circle cx="82" cy="23" r="3" class="piece-body" />
        <!-- Details -->
        <path d="M 28,70 L 72,70" class="piece-detail" />
        <path d="M 33,62 L 67,62" class="piece-detail" />
        <path d="M 30,42 C 40,46 60,46 70,42" class="piece-detail" />
      </g>
    </svg>
  `,

  // King - Tall crown with a prominent cross on top
  k: `
    <svg viewBox="0 0 100 100" class="piece-svg king">
      <g class="piece-group">
        <!-- Cross -->
        <path d="M 50,9 L 50,21 M 44,15 L 56,15" class="piece-cross-line" />
        <!-- Crown & Body -->
        <path d="M 30,82 L 70,82 C 70,82 72,80 72,76 C 72,72 65,68 64,60 C 62,48 67,36 67,36 L 33,36 C 33,36 38,48 36,60 C 35,68 28,72 28,76 C 28,80 30,82 30,82 Z" class="piece-body" />
        <path d="M 33,36 L 27,24 L 39,30 L 50,21 L 61,30 L 73,24 L 67,36 Z" class="piece-body" />
        <!-- Details -->
        <path d="M 28,70 L 72,70" class="piece-detail" />
        <path d="M 33,62 L 67,62" class="piece-detail" />
        <path d="M 35,46 C 42,49 58,49 65,46" class="piece-detail" />
        <circle cx="50" cy="21" r="2" class="piece-body" />
      </g>
    </svg>
  `
};

export function getPieceSVG(type, color) {
  const lowercaseType = type.toLowerCase();
  const svgTemplate = PIECES[lowercaseType];
  
  if (!svgTemplate) return '';
  
  // Return the SVG with proper color class
  const colorClass = color === 'w' ? 'white-piece' : 'black-piece';
  return svgTemplate.replace('class="piece-svg', `class="piece-svg ${colorClass}`);
}
