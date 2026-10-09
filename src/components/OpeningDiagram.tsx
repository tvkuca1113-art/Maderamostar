/**
 * Pogled odozgo na otvor: zid, štok, baglama, krilo i luk otvaranja.
 * Usklađeno s 3D prikazom: posmatrač stoji ispod zida (strana s koje se vrata guraju),
 * krilo se otvara od posmatrača, a baglama je na strani suprotnoj kvaki.
 */
export function OpeningDiagram({ handle }: { handle: 'lijevo' | 'desno' | null }) {
  const unknown = handle === null;
  const side = handle ?? 'lijevo';
  // Otvor između x = 30 i x = 90; krilo i štok na y = 58, posmatrač ispod zida.
  const hingeX = side === 'lijevo' ? 90 : 30;
  const closedX = side === 'lijevo' ? 30 : 90;
  const dir = side === 'lijevo' ? -1 : 1;
  const r = 60;
  const a = (55 * Math.PI) / 180; // ugao otvorenog krila na dijagramu
  const endX = hingeX + dir * r * Math.cos(a);
  const endY = 58 - r * Math.sin(a);
  const handleX = hingeX + dir * (r - 7) * Math.cos(a);
  const handleY = 58 - (r - 7) * Math.sin(a);
  const sweep = side === 'lijevo' ? 1 : 0;
  return (
    <svg className={`opening-diagram${unknown ? ' is-unknown' : ''}`} viewBox="0 0 120 96" aria-hidden="true" focusable="false">
      {/* zid */}
      <rect x="0" y="58" width="30" height="10" className="od-wall" />
      <rect x="90" y="58" width="30" height="10" className="od-wall" />
      {/* luk otvaranja */}
      <path d={`M ${closedX} 58 A ${r} ${r} 0 0 ${sweep} ${endX.toFixed(1)} ${endY.toFixed(1)}`} className="od-arc" />
      {/* krilo */}
      <line x1={hingeX} y1="58" x2={endX.toFixed(1)} y2={endY.toFixed(1)} className="od-leaf" />
      {/* baglama */}
      <circle cx={hingeX} cy="58" r="3" className="od-hinge" />
      {/* kvaka */}
      <circle cx={handleX.toFixed(1)} cy={handleY.toFixed(1)} r="2.6" className="od-handle" />
      {/* posmatrač */}
      <path d="M 60 80 l -6 9 h 12 z" className="od-you" />
      {unknown && (
        <text x="60" y="40" textAnchor="middle" className="od-q">
          ?
        </text>
      )}
    </svg>
  );
}
