// TimeGuesser Mobile UI Kit — Shared Components
// Load with: <script type="text/babel" src="components.jsx"></script>
// Exposes all components to window for use in index.html

const TG = window.__TG_TOKENS__ || {
  // Fallback only; canonical values are generated into ui_kits/mobile_app/tokens.js.
  bg: '#FFFFFF',
  bgSecondary: '#F5F5F7',
  bgTertiary: '#EBEBED',
  text: '#1A1A1C',
  textSec: '#6B6B70',
  textTer: '#98989D',
  accent: '#1A8A7D',
  accentPress: '#15756A',
  accentSubtle: '#E8F5F3',
  accentMuted: '#B0D9D4',
  scoreEx: '#1A8A7D',
  scoreGood: '#5B9E4D',
  scoreFair: '#C4953A',
  scorePoor: '#B85A3A',
  card: '#F5F5F7',
  border: '#EBEBED',
};

// ── Icons (inline SVG via Lucide paths) ───────────────────────────────────────
function Icon({ name, size = 20, color = TG.textSec, strokeWidth = 2 }) {
  const paths = {
    search:   <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    lightbulb:<><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.4-1.2 4.5-3 5.7V17H8v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 017-7z"/></>,
    x:        <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    mappin:   <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
    chevleft: <><polyline points="15 18 9 12 15 6"/></>,
    share:    <><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></>,
    plus:     <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    minus:    <><line x1="5" y1="12" x2="19" y2="12"/></>,
    check:    <><polyline points="20 6 9 20 4 15"/></>,
    home:     <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    trophy:   <><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// ── Tab Bar ────────────────────────────────────────────────────────────────────
function TabBar({ active, onTab }) {
  const tabs = [
    { id: 'home', icon: 'home', label: 'Play' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];
  return (
    <div style={{
      display: 'flex', borderTop: `1px solid ${TG.border}`, background: TG.bg,
      paddingBottom: 20, paddingTop: 8,
    }}>
      {tabs.map(t => (
        <div key={t.id} onClick={() => onTab(t.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          cursor: 'pointer',
        }}>
          <Icon name={t.icon} size={24} color={active === t.id ? TG.accent : TG.textTer} />
          <span style={{ fontSize: 10, color: active === t.id ? TG.accent : TG.textTer, fontWeight: active === t.id ? 600 : 400 }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Map Placeholder ────────────────────────────────────────────────────────────
function MapPlaceholder({ pinPlaced, showReveal }) {
  return (
    <div style={{ flex: 1, background: '#D4E0C8', position: 'relative', overflow: 'hidden' }}>
      {/* simple map grid lines */}
      <svg width="100%" height="100%" style={{ position:'absolute',top:0,left:0,opacity:0.3 }}>
        {[20,40,60,80].map(p => (
          <React.Fragment key={p}>
            <line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="#6B8F6B" strokeWidth="0.5"/>
            <line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="#6B8F6B" strokeWidth="0.5"/>
          </React.Fragment>
        ))}
        {/* Landmass blobs */}
        <ellipse cx="30%" cy="45%" rx="22%" ry="16%" fill="#B8CCA8" opacity="0.6"/>
        <ellipse cx="65%" cy="40%" rx="18%" ry="12%" fill="#B8CCA8" opacity="0.6"/>
        <ellipse cx="72%" cy="62%" rx="10%" ry="8%" fill="#B8CCA8" opacity="0.5"/>
        <ellipse cx="20%" cy="70%" rx="8%" ry="6%" fill="#B8CCA8" opacity="0.5"/>
      </svg>
      {/* Hint circle */}
      {pinPlaced && !showReveal && (
        <div style={{
          position:'absolute', top:'25%', left:'35%',
          width: 100, height: 100,
          border: `2px dashed ${TG.accentMuted}`,
          borderRadius:'50%', background: `${TG.accentSubtle}55`,
          transform:'translate(-50%,-50%)',
        }}/>
      )}
      {/* Player pin */}
      {pinPlaced && (
        <div style={{ position:'absolute', top:'35%', left:'42%', transform:'translate(-50%,-100%)' }}>
          <svg width="28" height="36" viewBox="0 0 28 36">
            <ellipse cx="14" cy="14" rx="12" ry="12" fill={TG.accent}/>
            <polygon points="14,34 8,22 20,22" fill={TG.accent}/>
            <circle cx="14" cy="14" r="5" fill="white" opacity="0.8"/>
          </svg>
        </div>
      )}
      {/* Answer pin (reveal) */}
      {showReveal && (
        <>
          <div style={{ position:'absolute', top:'28%', left:'55%', transform:'translate(-50%,-100%)' }}>
            <svg width="28" height="36" viewBox="0 0 28 36">
              <ellipse cx="14" cy="14" rx="12" ry="12" fill={TG.scoreFair}/>
              <polygon points="14,34 8,22 20,22" fill={TG.scoreFair}/>
              <circle cx="14" cy="14" r="5" fill="white" opacity="0.8"/>
            </svg>
          </div>
          {/* Distance line */}
          <svg style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none'}}>
            <line x1="42%" y1="35%" x2="55%" y2="28%" stroke={TG.scorePoor} strokeWidth="2" strokeDasharray="4 3" opacity="0.8"/>
          </svg>
        </>
      )}
      {/* No pin placeholder */}
      {!pinPlaced && (
        <div style={{
          position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          background:'rgba(255,255,255,0.7)', borderRadius:8, padding:'8px 14px',
          fontSize:12, color:TG.textSec, textAlign:'center', backdropFilter:'blur(4px)',
        }}>Tap map to place pin</div>
      )}
    </div>
  );
}

// ── Photo Placeholder ──────────────────────────────────────────────────────────
function PhotoPlaceholder({ style }) {
  return (
    <div style={{ background: '#9BA89A', ...style, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <svg width="100%" height="100%" style={{position:'absolute',top:0,left:0}} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="300" fill="#8A9889"/>
        {/* Stylised street scene suggestion */}
        <rect x="0" y="200" width="400" height="100" fill="#7A8878"/>
        <rect x="30" y="100" width="60" height="130" fill="#6E7D6C" rx="2"/>
        <rect x="110" y="80" width="80" height="150" fill="#748572" rx="2"/>
        <rect x="220" y="110" width="55" height="120" fill="#6E7D6C" rx="2"/>
        <rect x="300" y="90" width="70" height="140" fill="#748572" rx="2"/>
        {/* windows */}
        {[40,60,80,120,140,160,180,230,250,310,330,350].map((x, i) => (
          <rect key={i} x={x} y={[120,140,115,100,120,140,100,130,115,110,130,110][i]} width="12" height="10" fill="rgba(255,255,200,0.4)" rx="1"/>
        ))}
        {/* person silhouette */}
        <circle cx="185" cy="198" r="8" fill="#5A6858" opacity="0.6"/>
        <rect x="181" y="206" width="8" height="20" fill="#5A6858" opacity="0.6" rx="2"/>
        {/* sky */}
        <rect x="0" y="0" width="400" height="90" fill="#A8B5A6" opacity="0.5"/>
      </svg>
      <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.3)', borderRadius:4, padding:'2px 6px', fontSize:9, color:'rgba(255,255,255,0.8)' }}>
        Wikimedia Commons
      </div>
    </div>
  );
}

// ── Home Screen ────────────────────────────────────────────────────────────────
function HomeScreen({ onStart }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: TG.bg, overflow: 'hidden' }}>
      {/* Photo collage hero */}
      <div style={{ position: 'relative', height: '52%', overflow: 'hidden' }}>
        <PhotoPlaceholder style={{ width: '100%', height: '100%' }} />
        {/* 4-grid overlay suggestion */}
        <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:2 }}>
          {[
            '#9BA89A','#8A9380','#A0AD9A','#8E9B88'
          ].map((c,i) => (
            <div key={i} style={{ background:c, opacity:0.35 }}/>
          ))}
        </div>
      </div>
      {/* Content sheet — overlaps photo */}
      <div style={{
        flex: 1, background: TG.bg,
        borderTopLeftRadius: 12, borderTopRightRadius: 12,
        marginTop: -12, padding: '24px 20px 0',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: TG.text, lineHeight: '40px' }}>TimeGuesser</div>
        <div style={{ fontSize: 16, color: TG.textSec, marginTop: 4, lineHeight: '21px' }}>Guess where and when</div>
        <div style={{ flex: 1 }} />
        <button onClick={onStart} style={{
          width: '100%', height: 50, borderRadius: 12, border: 'none',
          background: TG.accent, color: '#fff', fontSize: 17, fontWeight: 600,
          cursor: 'pointer', marginBottom: 8,
          boxShadow: '0 4px 12px rgba(26,138,125,0.3)',
          fontFamily: 'inherit',
          transition: 'all 80ms',
        }}
          onMouseDown={e => e.currentTarget.style.background = TG.accentPress}
          onMouseUp={e => e.currentTarget.style.background = TG.accent}
        >Start Game</button>
        <div style={{ fontSize: 12, color: TG.textTer, textAlign: 'center', marginBottom: 4 }}>5 rounds · up to 50,000 pts</div>
      </div>
    </div>
  );
}

// ── Game Screen – Study (Photo Phase) ─────────────────────────────────────────
function StudyScreen({ round, onSwipeUp }) {
  return (
    <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden' }}>
      <PhotoPlaceholder style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
      {/* Pills */}
      <div style={{ position:'absolute', top:16, left:16, display:'flex', gap:8 }}>
        <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:999, padding:'6px 12px', display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.9)' }}>Round {round}/5</span>
        </div>
      </div>
      <div style={{ position:'absolute', top:16, right:16 }}>
        <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:999, padding:'6px 12px' }}>
          <span style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.9)' }}>2:30</span>
        </div>
      </div>
      {/* Bottom swipe hint */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        background:'linear-gradient(transparent, rgba(0,0,0,0.15))',
        padding:'24px 0 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
      }}>
        <div style={{ width:50, height:4, background:'rgba(255,255,255,0.3)', borderRadius:2 }}/>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:400 }}>Swipe up to guess</span>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>1,250 pts</span>
      </div>
      {/* Tap to go to map */}
      <div onClick={onSwipeUp} style={{
        position:'absolute', inset:0, cursor:'pointer',
      }}/>
    </div>
  );
}

// ── Game Screen – Guess (Map Phase) ───────────────────────────────────────────
function GuessScreen({ round, pinPlaced, onPlacePin, showReveal, onGuess, onNext, onPhotoBack }) {
  const scoreColor = TG.scoreEx;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onClick={!showReveal ? onPlacePin : undefined}>
        <MapPlaceholder pinPlaced={pinPlaced} showReveal={showReveal} />
        {/* Pills */}
        <div style={{ position:'absolute', top:16, left:16, display:'flex', gap:8, zIndex:10 }}>
          <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:999, padding:'6px 12px' }}>
            <span style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.9)' }}>Round {round}/5</span>
          </div>
        </div>
        <div style={{ position:'absolute', top:16, right:16, zIndex:10 }}>
          <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:999, padding:'6px 12px' }}>
            <span style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.9)' }}>2:30</span>
          </div>
        </div>
        {/* FABs */}
        {!showReveal && (
          <>
            <div style={{ position:'absolute', top:60, left:16, zIndex:10 }}>
              <div style={{ width:40, height:40, borderRadius:6, background:'rgba(255,255,255,0.95)', boxShadow:'0 4px 12px rgba(0,0,0,0.10)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="search" size={20} color={TG.accent} />
              </div>
            </div>
            <div style={{ position:'absolute', top:60, right:16, zIndex:10 }}>
              <div style={{ width:40, height:40, borderRadius:6, background:'rgba(255,255,255,0.95)', boxShadow:'0 4px 12px rgba(0,0,0,0.10)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="lightbulb" size={20} color={TG.accent} />
              </div>
            </div>
            {/* Zoom buttons */}
            <div style={{ position:'absolute', bottom:80, right:16, display:'flex', flexDirection:'column', gap:8, zIndex:10 }}>
              {['plus','minus'].map(n => (
                <div key={n} style={{ width:40, height:40, borderRadius:6, background:'rgba(255,255,255,0.95)', boxShadow:'0 4px 12px rgba(0,0,0,0.10)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name={n} size={18} color={TG.accent} />
                </div>
              ))}
            </div>
          </>
        )}
        {/* Score reveal overlay */}
        {showReveal && (
          <div style={{
            position:'absolute', bottom:80, left:16, right:16, zIndex:20,
            background: TG.bg, borderRadius:8, padding:'16px 20px',
            boxShadow:'0 16px 48px rgba(0,0,0,0.18)',
          }}>
            <div style={{ fontSize:40, fontWeight:800, color:scoreColor, fontVariantNumeric:'tabular-nums', lineHeight:'48px' }}>
              8,240 <span style={{fontSize:20, fontWeight:600}}>pts</span>
            </div>
            <div style={{ display:'flex', gap:16, marginTop:4, marginBottom:12 }}>
              <span style={{fontSize:14, color:TG.textSec}}>347 km away</span>
              <span style={{fontSize:14, color:TG.textSec}}>7 years off</span>
            </div>
            <div style={{borderTop:`1px solid ${TG.border}`, paddingTop:10, display:'flex', flexDirection:'column', gap:5}}>
              {[['LOCATION', '4,620'],['TIME', '4,620'],['HINT PENALTY','−1,000']].map(([l,v]) => (
                <div key={l} style={{display:'flex', justifyContent:'space-between'}}>
                  <span style={{fontSize:11, fontWeight:500, color:TG.textTer, letterSpacing:'0.5px'}}>{l}</span>
                  <span style={{fontSize:11, fontWeight:600, color: l === 'HINT PENALTY' ? TG.scorePoor : TG.text, fontVariantNumeric:'tabular-nums'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Bottom bar */}
      <div style={{ background: TG.bg, padding:'12px 16px', paddingBottom:4 }}>
        {showReveal ? (
          <button onClick={onNext} style={{
            width:'100%', height:48, borderRadius:12, border:'none',
            background:TG.accent, color:'#fff', fontSize:17, fontWeight:600,
            cursor:'pointer', fontFamily:'inherit',
          }}>Next Round</button>
        ) : (
          <>
            <button onClick={pinPlaced ? onGuess : undefined} style={{
              width:'100%', height:48, borderRadius:12, border:'none',
              background: pinPlaced ? TG.accent : TG.bgTertiary,
              color: pinPlaced ? '#fff' : TG.textTer,
              fontSize:17, fontWeight:600,
              cursor: pinPlaced ? 'pointer' : 'default',
              fontFamily:'inherit',
              boxShadow: pinPlaced ? '0 4px 12px rgba(26,138,125,0.3)' : 'none',
              transition:'all 150ms',
            }}>GUESS</button>
            <div style={{textAlign:'center', fontSize:11, color:TG.textTer, marginTop:4, opacity:0.7}}>↓ photo</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Results Screen ─────────────────────────────────────────────────────────────
function ResultsScreen({ onPlayAgain }) {
  const rounds = [
    { label: 'Round 1', score: 8240, dist: '347 km', years: '7 yrs', color: TG.scoreEx },
    { label: 'Round 2', score: 6100, dist: '890 km', years: '12 yrs', color: TG.scoreGood },
    { label: 'Round 3', score: 9200, dist: '145 km', years: '3 yrs', color: TG.scoreEx },
    { label: 'Round 4', score: 3400, dist: '2,100 km', years: '28 yrs', color: TG.scoreFair },
    { label: 'Round 5', score: 7600, dist: '410 km', years: '9 yrs', color: TG.scoreGood },
  ];
  const total = rounds.reduce((s, r) => s + r.score, 0);
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:TG.bg, overflow:'auto' }}>
      {/* Header */}
      <div style={{ padding:'24px 20px 16px' }}>
        <div style={{fontSize:13, fontWeight:600, color:TG.textTer, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:4}}>Game Over</div>
        <div style={{fontSize:52, fontWeight:800, color:TG.accent, fontVariantNumeric:'tabular-nums', lineHeight:'62px'}}>{total.toLocaleString()}</div>
        <div style={{fontSize:15, color:TG.textSec}}>out of 50,000 pts</div>
      </div>
      {/* Round breakdown */}
      <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:8 }}>
        {rounds.map((r, i) => (
          <div key={i} style={{
            background:TG.bgSecondary, borderRadius:8, padding:'12px 16px',
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{width:4, height:40, borderRadius:2, background:r.color, flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:12, fontWeight:500, color:TG.textTer, letterSpacing:'0.5px'}}>{r.label}</div>
              <div style={{fontSize:13, color:TG.textSec, marginTop:2}}>{r.dist} · {r.years}</div>
            </div>
            <div style={{fontSize:20, fontWeight:700, color:r.color, fontVariantNumeric:'tabular-nums'}}>{r.score.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div style={{flex:1}}/>
      <div style={{padding:'16px 20px 8px'}}>
        <button onClick={onPlayAgain} style={{
          width:'100%', height:50, borderRadius:12, border:'none',
          background:TG.accent, color:'#fff', fontSize:17, fontWeight:600,
          cursor:'pointer', fontFamily:'inherit',
          boxShadow:'0 4px 12px rgba(26,138,125,0.3)',
        }}>Play Again</button>
      </div>
    </div>
  );
}

// ── Settings Screen ────────────────────────────────────────────────────────────
function SettingsScreen() {
  const [timer, setTimer]     = React.useState('off');
  const [theme, setTheme]     = React.useState('system');
  const [hints, setHints]     = React.useState(true);
  const [mapProv, setMapProv] = React.useState('apple');
  const [sourceWiki, setSourceWiki]         = React.useState(true);
  const [sourceLOC, setSourceLOC]           = React.useState(true);
  const [sourceEuropeana, setSourceEuropeana] = React.useState(true);
  const [sourcePersonal, setSourcePersonal] = React.useState(false);

  // Segmented control (2–3 short options)
  const Seg = ({ options, value, onChange }) => (
    <div style={{
      display:'flex', background:TG.bgTertiary, borderRadius:7, padding:2, gap:2,
    }}>
      {options.map(o => (
        <div key={o.value} onClick={() => onChange(o.value)} style={{
          padding:'4px 9px', borderRadius:5, fontSize:12, fontWeight:500,
          cursor:'pointer', whiteSpace:'nowrap',
          background: value === o.value ? '#fff' : 'transparent',
          color: value === o.value ? TG.text : TG.textSec,
          boxShadow: value === o.value ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
          transition:'all 100ms',
        }}>{o.label}</div>
      ))}
    </div>
  );

  // Toggle switch
  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{
      width:44, height:26, borderRadius:13,
      background: value ? TG.accent : TG.bgTertiary,
      position:'relative', cursor:'pointer', transition:'background 150ms', flexShrink:0,
    }}>
      <div style={{
        width:22, height:22, borderRadius:11, background:'#fff',
        position:'absolute', top:2, left: value ? 20 : 2,
        boxShadow:'0 1px 3px rgba(0,0,0,0.25)',
        transition:'left 150ms',
      }}/>
    </div>
  );

  // Icon container — subtle tinted square
  const IconWrap = ({ name, bg, iconColor }) => (
    <div style={{
      width:32, height:32, borderRadius:8, background: bg || TG.bgTertiary,
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
    }}>
      <Icon name={name} size={18} color={iconColor || TG.textSec}/>
    </div>
  );

  // Single row inside a card group
  const Row = ({ icon, iconBg, iconColor, label, right, last }) => (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
      borderBottom: last ? 'none' : `1px solid ${TG.border}`,
    }}>
      <IconWrap name={icon} bg={iconBg} iconColor={iconColor}/>
      <span style={{flex:1, fontSize:16, color:TG.text, lineHeight:'22px'}}>{label}</span>
      <div style={{flexShrink:0}}>{right}</div>
    </div>
  );

  // Card group container
  const Group = ({ children }) => (
    <div style={{
      background:TG.bgSecondary, borderRadius:12, overflow:'hidden',
      boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
    }}>{children}</div>
  );

  return (
    <div style={{flex:1, overflow:'auto', background:TG.bgSecondary}}>
      {/* Title — padded below status bar */}
      <div style={{padding:'54px 16px 16px', background:TG.bg, borderBottom:`1px solid ${TG.border}`}}>
        <div style={{fontSize:28, fontWeight:700, color:TG.text}}>Settings</div>
      </div>

      <div style={{padding:'20px 16px', display:'flex', flexDirection:'column', gap:20}}>

        {/* 1. Theme */}
        <Group>
          <Row
            icon="home" iconBg='#F0EEFF' iconColor='#7B6CF0'
            label="Theme"
            right={<Seg
              value={theme}
              onChange={setTheme}
              options={[{label:'System',value:'system'},{label:'Light',value:'light'},{label:'Dark',value:'dark'}]}
            />}
            last
          />
        </Group>

        {/* 2. Map Provider */}
        <Group>
          <Row
            icon="mappin" iconBg='#E8F5F3' iconColor={TG.accent}
            label="Map Provider"
            right={<Seg
              value={mapProv}
              onChange={setMapProv}
              options={[{label:'Apple',value:'apple'},{label:'Google',value:'google'}]}
            />}
            last
          />
        </Group>

        {/* Photo Sources group */}
        <div>
          <div style={{fontSize:12, fontWeight:600, color:TG.textTer, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:8, paddingLeft:4}}>Photo Sources</div>
          <Group>
            {/* Wikimedia tick row */}
            <div onClick={() => setSourceWiki(v => !v)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
              borderBottom: `1px solid ${TG.border}`, cursor:'pointer',
            }}>
              <div style={{
                width:32, height:32, borderRadius:8, background:'#E8F5F3',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                <Icon name="share" size={18} color={TG.accent}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16, color:TG.text}}>Wikimedia Commons</div>
                <div style={{fontSize:12, color:TG.textTer, marginTop:1}}>Public domain &amp; Creative Commons</div>
              </div>
              <div style={{
                width:22, height:22, borderRadius:6, flexShrink:0,
                border:`1.5px solid ${sourceWiki ? TG.accent : TG.bgTertiary}`,
                background: sourceWiki ? TG.accent : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 100ms',
              }}>
                {sourceWiki && <Icon name="check" size={12} color="#fff" strokeWidth={3}/>}
              </div>
            </div>

            {/* LOC tick row */}
            <div onClick={() => setSourceLOC(v => !v)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
              borderBottom: `1px solid ${TG.border}`, cursor:'pointer',
            }}>
              <div style={{
                width:32, height:32, borderRadius:8, background:'#FFF4E8',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                <Icon name="clock" size={18} color='#C4953A'/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16, color:TG.text}}>Library of Congress</div>
                <div style={{fontSize:12, color:TG.textTer, marginTop:1}}>Historical US photos &amp; records</div>
              </div>
              <div style={{
                width:22, height:22, borderRadius:6, flexShrink:0,
                border:`1.5px solid ${sourceLOC ? TG.accent : TG.bgTertiary}`,
                background: sourceLOC ? TG.accent : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 100ms',
              }}>
                {sourceLOC && <Icon name="check" size={12} color="#fff" strokeWidth={3}/>}
              </div>
            </div>

            {/* Europeana tick row */}
            <div onClick={() => setSourceEuropeana(v => !v)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
              borderBottom: `1px solid ${TG.border}`, cursor:'pointer',
            }}>
              <div style={{
                width:32, height:32, borderRadius:8, background:'#FFEEF0',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                <Icon name="mappin" size={18} color='#B85A3A'/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16, color:TG.text}}>Europeana</div>
                <div style={{fontSize:12, color:TG.textTer, marginTop:1}}>European cultural heritage collections</div>
              </div>
              <div style={{
                width:22, height:22, borderRadius:6, flexShrink:0,
                border:`1.5px solid ${sourceEuropeana ? TG.accent : TG.bgTertiary}`,
                background: sourceEuropeana ? TG.accent : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 100ms',
              }}>
                {sourceEuropeana && <Icon name="check" size={12} color="#fff" strokeWidth={3}/>}
              </div>
            </div>

            {/* My Photos tick row */}
            <div onClick={() => setSourcePersonal(v => !v)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
              cursor:'pointer',
            }}>
              <div style={{
                width:32, height:32, borderRadius:8, background:'#F0EEFF',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                <Icon name="home" size={18} color='#7B6CF0'/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16, color:TG.text}}>My Photos</div>
                <div style={{fontSize:12, color:TG.textTer, marginTop:1}}>From your device library</div>
              </div>
              <div style={{
                width:22, height:22, borderRadius:6, flexShrink:0,
                border:`1.5px solid ${sourcePersonal ? TG.accent : TG.bgTertiary}`,
                background: sourcePersonal ? TG.accent : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 100ms',
              }}>
                {sourcePersonal && <Icon name="check" size={12} color="#fff" strokeWidth={3}/>}
              </div>
            </div>
          </Group>
        </div>

        {/* Cache group — only when any public source is on */}
        {(sourceWiki || sourceLOC || sourceEuropeana) && (
          <div>
            <div style={{fontSize:12, fontWeight:600, color:TG.textTer, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:8, paddingLeft:4}}>Image Cache</div>
            <Group>
              {/* Progress bar row */}
              <div style={{padding:'14px 16px', borderBottom:`1px solid ${TG.border}`}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                  <span style={{fontSize:15, color:TG.text}}>Cached images</span>
                  <span style={{fontSize:15, fontWeight:600, color:TG.text, fontVariantNumeric:'tabular-nums'}}>38 / 50</span>
                </div>
                <div style={{height:4, background:TG.bgTertiary, borderRadius:2, overflow:'hidden'}}>
                  <div style={{height:'100%', width:'76%', background:TG.accent, borderRadius:2}}/>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}>
                  <span style={{fontSize:12, color:TG.textTer}}>Last updated 2 min ago</span>
                  <span style={{fontSize:12, color:TG.textTer}}>4.2 MB</span>
                </div>
              </div>
              {/* Stats rows */}
              {[
                ['Unseen available', '33'],
                ['Seen / played',    '5'],
              ].map(([label, value], i, arr) => (
                <div key={label} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'11px 16px',
                  borderBottom: i < arr.length - 1 ? `1px solid ${TG.border}` : 'none',
                }}>
                  <span style={{fontSize:15, color:TG.text}}>{label}</span>
                  <span style={{fontSize:15, fontWeight:600, color:TG.text, fontVariantNumeric:'tabular-nums'}}>{value}</span>
                </div>
              ))}
              {/* Actions */}
              <div style={{padding:'12px 16px', borderTop:`1px solid ${TG.border}`, display:'flex', gap:10}}>
                <button style={{
                  flex:1, height:38, borderRadius:8,
                  border:`1.5px solid ${TG.accent}`, background:'transparent',
                  color:TG.accent, fontSize:14, fontWeight:600,
                  cursor:'pointer', fontFamily:'inherit',
                }}>Refill Cache</button>
                <button style={{
                  flex:1, height:38, borderRadius:8,
                  border:`1.5px solid ${TG.border}`, background:'transparent',
                  color:TG.scorePoor, fontSize:14, fontWeight:600,
                  cursor:'pointer', fontFamily:'inherit',
                }}>Clear Cache</button>
              </div>
            </Group>
          </div>
        )}

        {/* 4. Hints + 5. Round Timer */}
        <Group>
          <Row
            icon="lightbulb" iconBg='#FFF8E8' iconColor='#C4953A'
            label="Hints"
            right={<Toggle value={hints} onChange={setHints}/>}
          />
          <Row
            icon="clock" iconBg='#E8F5F3' iconColor={TG.accent}
            label="Round Timer"
            right={<Seg
              value={timer}
              onChange={setTimer}
              options={[{label:'Off',value:'off'},{label:'60s',value:'60'},{label:'120s',value:'120'}]}
            />}
            last
          />
        </Group>

        {/* App version footnote */}
        <div style={{textAlign:'center', fontSize:12, color:TG.textTer, paddingBottom:8}}>
          TimeGuesser · v0.1.0
        </div>

      </div>
    </div>
  );
}

// ── Export all components ──────────────────────────────────────────────────────
Object.assign(window, {
  TG, Icon, TabBar, MapPlaceholder, PhotoPlaceholder,
  HomeScreen, StudyScreen, GuessScreen, ResultsScreen, SettingsScreen,
});
