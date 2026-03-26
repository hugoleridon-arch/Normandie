import React, { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import { ref, onValue, set, remove } from "firebase/database";

/* ─── Données famille ─── */
const MEMBERS = [
  "Joëlle","Amélie","Charles","Hugo","Davinia",
  "Giulia","Nicolas","Jeanne","Marine","Jérémy",
  "Amis"
];
const COLORS = [
  "#FF6B6B","#FF9F43","#FECA57","#48CAE4","#A29BFE",
  "#6BCB77","#F08A5D","#DDA0DD","#4D80E4","#F78FB3",
  "#FF00A8"
];
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS   = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

/* ─── Helpers ─── */
const getDays  = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirst = (y, m) => new Date(y, m, 1).getDay();
const dk       = (y, m, d) => `${y}_${m + 1}_${String(d).padStart(2,"0")}`;

export default function App() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [me,    setMe]    = useState(null);       // null = non sélectionné
  const [data,  setData]  = useState({});          // { "2025_7_03": [0,2,5], ... }
  const [view,  setView]  = useState("cal");       // "cal" | "list"
  const [hovered, setHovered] = useState(null);
  const [synced,  setSynced]  = useState(false);

  /* ── Écoute temps réel Firebase ── */
  useEffect(() => {
    const dbRef = ref(db, "presences");
    const unsub = onValue(dbRef, (snapshot) => {
      setData(snapshot.val() || {});
      setSynced(true);
    });
    return () => unsub();
  }, []);

  /* ── Toggle présence ── */
  const toggle = useCallback(async (day) => {
    if (me === null) return;
    const key = dk(year, month, day);
    const current = data[key] ? [...data[key]] : [];
    const idx = current.indexOf(me);
    let next;
    if (idx >= 0) { current.splice(idx, 1); next = current; }
    else           { next = [...current, me]; }

    const dbRef = ref(db, `presences/${key}`);
    if (next.length === 0) await remove(dbRef);
    else                   await set(dbRef, next);
  }, [me, data, year, month]);

  /* ── Navigation mois ── */
  const prevM = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextM = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };

  const days  = getDays(year, month);
  const first = getFirst(year, month);

  /* ── Liste annuelle ── */
  const allDays = [];
  for (let m2 = 0; m2 < 12; m2++) {
    for (let d = 1; d <= getDays(year, m2); d++) {
      const k = dk(year, m2, d);
      if (data[k]?.length > 0) allDays.push({ k, m: m2, d, members: data[k] });
    }
  }

  /* ─────────────── RENDER ─────────────── */
  return (
    <div style={S.root}>

      {/* ── HEADER ── */}
      <header style={S.header}>
        <div>
          <div style={S.eyebrow}>🏡 Notre Maison de Vacances</div>
          <h1 style={S.title}>Calendrier des Présences</h1>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ ...S.badge, background: synced ? "#6BCB7733" : "#FF6B6B33", borderColor: synced ? "#6BCB77" : "#FF6B6B", color: synced ? "#6BCB77" : "#FF6B6B" }}>
            {synced ? "● En ligne" : "○ Connexion..."}
          </div>
          <button style={S.viewBtn} onClick={() => setView(v => v === "cal" ? "list" : "cal")}>
            {view === "cal" ? "📋 Vue liste" : "📅 Calendrier"}
          </button>
        </div>
      </header>

      <main style={S.main}>

        {/* ── SÉLECTEUR MEMBRE ── */}
        <section style={S.section}>
          <div style={S.label}>Je suis :</div>
          <div style={S.pills}>
            {MEMBERS.map((name, i) => (
              <button key={i} onClick={() => setMe(i)} style={{
                ...S.pill,
                border:      `2px solid ${me === i ? COLORS[i] : "rgba(255,255,255,0.12)"}`,
                background:  me === i ? COLORS[i] : "rgba(255,255,255,0.05)",
                color:       me === i ? "#fff" : "rgba(255,255,255,0.65)",
                fontWeight:  me === i ? "700" : "400",
                boxShadow:   me === i ? `0 3px 14px ${COLORS[i]}55` : "none",
              }}>{name}</button>
            ))}
          </div>
          {me === null && (
            <div style={S.hint}>👆 Sélectionnez votre prénom pour marquer vos présences</div>
          )}
        </section>

        {view === "cal" ? (
          <>
            {/* ── NAVIGATION ── */}
            <div style={S.nav}>
              <button style={S.navBtn} onClick={prevM}>‹</button>
              <div style={{ textAlign:"center" }}>
                <div style={S.monthName}>{MONTHS[month]}</div>
                <div style={S.yearLabel}>{year}</div>
              </div>
              <button style={S.navBtn} onClick={nextM}>›</button>
            </div>

            {/* ── EN-TÊTES JOURS ── */}
            <div style={S.grid7}>
              {DAYS.map(d => (
                <div key={d} style={{ ...S.dayHeader, color: d==="Dim"||d==="Sam" ? "#FECA57" : "rgba(255,255,255,0.35)" }}>{d}</div>
              ))}
            </div>

            {/* ── GRILLE CALENDRIER ── */}
            <div style={S.grid7}>
              {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} style={{ minHeight:"82px" }} />)}
              {Array.from({ length: days }, (_, i) => i + 1).map(day => {
                const key     = dk(year, month, day);
                const members = data[key] || [];
                const mine    = me !== null && members.includes(me);
                const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===day;
                const dow     = new Date(year, month, day).getDay();
                const weekend = dow === 0 || dow === 6;

                return (
                  <div key={day}
                    onClick={() => toggle(day)}
                    onMouseEnter={() => members.length > 0 && setHovered({ day, members })}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      ...S.cell,
                      cursor:     me === null ? "not-allowed" : "pointer",
                      background: mine
                        ? `${COLORS[me]}CC`
                        : members.length > 0
                          ? "rgba(255,255,255,0.09)"
                          : weekend ? "rgba(254,202,87,0.05)" : "rgba(255,255,255,0.03)",
                      border: isToday
                        ? "2px solid #FECA57"
                        : mine
                          ? `2px solid ${COLORS[me]}`
                          : "2px solid rgba(255,255,255,0.07)",
                      boxShadow: mine ? `0 4px 14px ${COLORS[me]}44` : "none",
                      opacity: me === null ? 0.7 : 1,
                    }}>
                    <div style={{ fontSize:"13px", fontWeight: isToday?"700":"400", color: isToday?"#FECA57": weekend?"rgba(254,202,87,0.8)":"rgba(255,255,255,0.85)", marginBottom:"5px" }}>{day}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"2px" }}>
                      {members.map(mi => (
                        <div key={mi} style={{ width:"9px", height:"9px", borderRadius:"50%", background:COLORS[mi], border:"1.5px solid rgba(0,0,0,0.35)", flexShrink:0 }} />
                      ))}
                    </div>
                    {members.length > 1 && <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.4)", marginTop:"3px" }}>{members.length} pers.</div>}
                  </div>
                );
              })}
            </div>

            {/* ── TOOLTIP ── */}
            {hovered && (
              <div style={S.tooltip}>
                <div style={S.tooltipDate}>{hovered.day} {MONTHS[month]}</div>
                {hovered.members.map(mi => (
                  <div key={mi} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                    <div style={{ width:"9px", height:"9px", borderRadius:"50%", background:COLORS[mi], flexShrink:0 }} />
                    <span style={{ fontSize:"13px" }}>{MEMBERS[mi]}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── LÉGENDE ── */}
            <div style={S.legend}>
              <div style={S.label}>Légende</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"10px", marginTop:"8px" }}>
                {MEMBERS.map((name, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                    <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:COLORS[i], flexShrink:0 }} />
                    <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)" }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ── VUE LISTE ── */
          <div>
            <div style={S.label}>Toutes les présences — {year}</div>
            {allDays.length === 0
              ? <div style={S.empty}>Aucune présence enregistrée pour {year}</div>
              : <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginTop:"14px" }}>
                  {allDays.map(({ k, m: m2, d, members }) => (
                    <div key={k} style={S.listRow}>
                      <div style={S.listDate}>{d} {MONTHS[m2]}</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                        {members.map(mi => (
                          <span key={mi} style={{ ...S.tag, background:COLORS[mi] }}>{MEMBERS[mi]}</span>
                        ))}
                      </div>
                      <div style={S.listCount}>{members.length} pers.</div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Styles ─── */
const S = {
  root:      { minHeight:"100vh", background:"linear-gradient(160deg,#0d1b2a 0%,#1b2838 55%,#0d2137 100%)", fontFamily:"'Palatino Linotype','Georgia',serif", color:"#eee" },
  header:    { padding:"20px 28px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"10px" },
  eyebrow:   { fontSize:"10px", letterSpacing:"4px", color:"#FECA57", textTransform:"uppercase", marginBottom:"3px" },
  title:     { margin:0, fontSize:"22px", fontWeight:"normal", letterSpacing:"1px" },
  badge:     { fontSize:"11px", padding:"4px 10px", borderRadius:"20px", border:"1px solid", letterSpacing:"1px" },
  viewBtn:   { background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.18)", color:"#ddd", padding:"8px 16px", borderRadius:"20px", cursor:"pointer", fontSize:"13px" },
  main:      { maxWidth:"1000px", margin:"0 auto", padding:"20px 24px" },
  section:   { marginBottom:"24px" },
  label:     { fontSize:"10px", letterSpacing:"3px", color:"rgba(255,255,255,0.38)", textTransform:"uppercase", marginBottom:"10px" },
  pills:     { display:"flex", flexWrap:"wrap", gap:"8px" },
  pill:      { padding:"7px 15px", borderRadius:"20px", cursor:"pointer", fontSize:"13px", transition:"all 0.15s", fontFamily:"inherit" },
  hint:      { marginTop:"10px", fontSize:"12px", color:"rgba(255,255,255,0.3)", fontStyle:"italic" },
  nav:       { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" },
  navBtn:    { background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.14)", color:"#fff", width:"38px", height:"38px", borderRadius:"50%", cursor:"pointer", fontSize:"20px" },
  monthName: { fontSize:"20px", letterSpacing:"2px" },
  yearLabel: { fontSize:"12px", color:"rgba(255,255,255,0.35)", letterSpacing:"3px" },
  grid7:     { display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px", marginBottom:"3px" },
  dayHeader: { textAlign:"center", padding:"6px 0", fontSize:"10px", letterSpacing:"2px", textTransform:"uppercase" },
  cell:      { minHeight:"82px", borderRadius:"9px", padding:"7px 5px 5px", transition:"all 0.12s" },
  tooltip:   { position:"fixed", bottom:"20px", right:"20px", background:"#0d1b2a", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"12px", padding:"12px 16px", zIndex:9999, boxShadow:"0 8px 32px rgba(0,0,0,0.6)", minWidth:"150px" },
  tooltipDate: { fontSize:"10px", color:"rgba(255,255,255,0.4)", letterSpacing:"2px", marginBottom:"8px" },
  legend:    { marginTop:"20px", padding:"14px 16px", background:"rgba(255,255,255,0.04)", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.07)" },
  listRow:   { display:"flex", alignItems:"center", gap:"14px", padding:"11px 15px", background:"rgba(255,255,255,0.05)", borderRadius:"9px", border:"1px solid rgba(255,255,255,0.07)" },
  listDate:  { minWidth:"110px", fontSize:"13px", color:"rgba(255,255,255,0.6)" },
  listCount: { marginLeft:"auto", fontSize:"10px", color:"rgba(255,255,255,0.25)" },
  tag:       { padding:"2px 10px", borderRadius:"12px", color:"#fff", fontSize:"11px", fontWeight:"700" },
  empty:     { textAlign:"center", padding:"60px", color:"rgba(255,255,255,0.25)", fontSize:"14px" },
};
