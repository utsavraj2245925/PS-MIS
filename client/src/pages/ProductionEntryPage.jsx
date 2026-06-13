import { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MODELS = ['18"', '20"', '20" Polar', '22"', '26"'];

const MODEL_PARTS = {
  '18"': [
    "front",
    "topCover",
    "rh",
    "lh",
    "base",
    "valvePlate",
  ],

  '20"': [
    "front",
    "topCover",
    "rh",
    "rhSmall",
    "lh",
    "base",
    "valvePlate",
  ],

  '20" Polar': [
    "topCover",
    "rh",
    "base",
  ],

  '22"': [
    "front",
    "topCover",
    "rh",
    "lh",
    "base5376437WithLeg",
    "valvePlate",
  ],

  '26"': [
    "front",
    "topCover",
    "rh",
    "lh",
    "basePlusLeg",
    "valvePlate",
  ],
};

const PARTS = [
  { key: "front",              label: "Front" },
  { key: "topCover",           label: "Top Cover" },
  { key: "rh",                 label: "RH" },
  { key: "rhSmall",            label: "RH Small" },
  { key: "lh",                 label: "LH" },
  { key: "base",               label: "Base" },
  { key: "basePlusLeg",        label: "Base + Leg" },
  { key: "base5376437WithLeg", label: "Base 53/76/43.7 With Leg" },
  { key: "valvePlate",         label: "Valve Plate" },
];

const PLANNED_REASONS = [
  "Lunch & Tea Break",
  "Training & Meeting",
  "5S Activity",
  "No Plan",
];

const UNPLANNED_REASONS = [
  "Gun Cleaning",
  "Powder Change",
  "Conveyor Breakdown",
  "Booth Breakdown",
  "Electrical Issue",
  "Mechanical Issue",
  "Utility Failure",
  "Material Shortage",
  "Quality Issue",
  "Maintenance",
  "Other",
];

const emptyParts = () => PARTS.reduce((acc, p) => ({ ...acc, [p.key]: "" }), {});
const emptyPlannedRow    = () => ({ reason: PLANNED_REASONS[0],    minutes: "" });
const emptyUnplannedRow  = () => ({ issue:  UNPLANNED_REASONS[0],  description: "", minutes: "" });
const sumMinutes = (rows, key) =>
  rows.reduce((acc, r) => acc + (parseInt(r[key]) || 0), 0);

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  // Core palette
  navy:       "#0B1F3A",
  navyLight:  "#13294B",
  blue:       "#1A56DB",
  blueLight:  "#EBF2FF",
  teal:       "#0B7B5F",
  tealLight:  "#E6F7F2",
  amber:      "#92400E",
  amberLight: "#FEF3C7",
  red:        "#9B1C1C",
  redLight:   "#FEE2E2",
  violet:     "#4C1D95",
  violetLight:"#EDE9FE",
  // Neutrals
  bg:         "#F1F5F9",
  surface:    "#FFFFFF",
  border:     "#E2E8F0",
  borderFocus:"#1A56DB",
  text:       "#0F172A",
  textMuted:  "#64748B",
  textFaint:  "#94A3B8",
  // Status
  success:    "#166534",
  successBg:  "#DCFCE7",
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  input: {
    border: `1.5px solid ${T.border}`,
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 14,
    color: T.text,
    outline: "none",
    background: T.surface,
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color .15s, box-shadow .15s",
  },
  inputDisabled: {
    border: `1.5px solid ${T.border}`,
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 14,
    background: "#F8FAFC",
    color: T.textMuted,
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    fontWeight: 700,
    minHeight: 40,
  },
  btn: {
    border: "none",
    borderRadius: 8,
    padding: "9px 20px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: ".1px",
    fontFamily: "inherit",
    transition: "opacity .15s, transform .1s",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  th: {
    border: `1px solid ${T.border}`,
    padding: "9px 14px",
    textAlign: "left",
    fontWeight: 700,
    fontSize: 11,
    color: T.textMuted,
    textTransform: "uppercase",
    letterSpacing: ".5px",
    background: "#F8FAFC",
    whiteSpace: "nowrap",
  },
  td: {
    border: `1px solid ${T.border}`,
    padding: "9px 14px",
    fontSize: 13,
    color: T.text,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: T.textFaint,
    textTransform: "uppercase",
    letterSpacing: ".5px",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Sticky top navigation bar */
function Navbar() {
  return (
    <header style={{
      background: T.surface,
      borderBottom: `1.5px solid ${T.border}`,
      padding: "0 36px",
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 200,
      boxShadow: "0 1px 0 rgba(0,0,0,.04)",
    }}>
      {/* Left: logo + brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img
          src="https://cms-complaint-avidence.s3.eu-north-1.amazonaws.com/pg-logo-Photoroom+(1).png"
          alt="PG Group"
          style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }}
          onError={e => { e.target.style.display = "none"; }}
        />
        <div style={{ width: 1.5, height: 28, background: T.border }} />
        <span style={{ fontWeight: 800, fontSize: 15, color: T.navy, letterSpacing: ".2px" }}>
          PG Group
        </span>
      </div>

      {/* Center: app title + live pill */}
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: T.navy, letterSpacing: ".2px" }}>
          PS-MIS Production
        </span>
        <span style={{
          background: "#EBF9F0",
          color: "#166534",
          borderRadius: 20,
          padding: "3px 11px",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 5,
          letterSpacing: ".3px",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: "#22C55E", display: "inline-block",
            animation: "navPulse 1.4s ease-in-out infinite",
          }} />
          LIVE
        </span>
      </div>

      {/* Right: role label */}
      <div style={{
        background: T.blueLight,
        color: T.blue,
        borderRadius: 7,
        padding: "5px 13px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: ".3px",
      }}>
        SUPERVISOR PORTAL
      </div>
    </header>
  );
}

/** Section card with coloured accent header */
function SectionCard({ stepNum, title, accentColor, children }) {
  return (
    <section style={{
      background: T.surface,
      borderRadius: 14,
      border: `1px solid ${T.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04)",
      marginBottom: 24,
      overflow: "hidden",
    }}>
      {/* Accent header */}
      <div style={{
        background: accentColor,
        padding: "13px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: 28, height: 28,
          background: "rgba(255,255,255,.18)",
          borderRadius: 7,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: "#fff",
          flexShrink: 0,
        }}>
          {stepNum}
        </div>
        <span style={{ fontWeight: 700, fontSize: 14.5, color: "#fff", letterSpacing: ".2px" }}>
          {title}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 28px" }}>{children}</div>
    </section>
  );
}

/** Label + field wrapper */
function Field({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <label style={{
        fontSize: 11.5, fontWeight: 700, color: T.textMuted,
        textTransform: "uppercase", letterSpacing: ".6px",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Numeric input */
function NumInput({ value, onChange, placeholder, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={onChange}
      placeholder={placeholder || "0"}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...S.input,
        ...(disabled ? { background: "#F8FAFC", color: T.textMuted } : {}),
        ...(focused && !disabled ? { borderColor: T.borderFocus, boxShadow: `0 0 0 3px rgba(26,86,219,.1)` } : {}),
      }}
    />
  );
}

/** Delete row button */
function DelBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Remove row"
      style={{
        ...S.btn,
        background: T.redLight,
        color: T.red,
        padding: "8px 10px",
        fontSize: 17,
        fontWeight: 700,
        borderRadius: 7,
        width: 36,
        height: 36,
        justifyContent: "center",
      }}
    >
      ×
    </button>
  );
}

/** Horizontal divider */
function Divider() {
  return <div style={{ height: 1, background: T.border, margin: "18px 0" }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PGProductionEntry() {
  // ── Shift Info ──
  const [plant,    setPlant]    = useState("");
  const [location, setLocation] = useState("");
  const [date,     setDate]     = useState("");
  const [shift,    setShift]    = useState("");

  // ── Manpower ──
  const [requiredMP,   setRequiredMP]   = useState("");
  const [availableMP,  setAvailableMP]  = useState("");
  const shortMP = (parseInt(requiredMP) || 0) - (parseInt(availableMP) || 0);

  // ── Production ──
  const [selectedModel,   setSelectedModel]   = useState("");
  const [parts,           setParts]           = useState(emptyParts());
  const [productionRows,  setProductionRows]  = useState([]);

  // ── Quality ──
  const [rework,    setRework]    = useState("");
  const [rejection, setRejection] = useState("");
  const [defect,    setDefect]    = useState("");

  // ── Planned Idle ──
  const [plannedRows, setPlannedRows] = useState([emptyPlannedRow()]);

  // ── Unplanned Idle ──
  const [unplannedRows, setUnplannedRows] = useState([emptyUnplannedRow()]);

  // ── Production helpers ──
  const handlePartChange = (key, val) => setParts(p => ({ ...p, [key]: val }));

  const handleAddModel = () => {
    if (!selectedModel) return;
    setProductionRows(r => [...r, { model: selectedModel, ...parts }]);
    setSelectedModel("");
    setParts(emptyParts());
  };

  const handleDeleteProductionRow = useCallback(
    (i) => setProductionRows(r => r.filter((_, idx) => idx !== i)),
    []
  );

  // ── Planned helpers ──
  const updatePlanned = (i, field, val) =>
    setPlannedRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addPlannedRow    = () => setPlannedRows(r => [...r, emptyPlannedRow()]);
  const deletePlannedRow = (i) => setPlannedRows(r => r.filter((_, idx) => idx !== i));
  const totalPlanned = sumMinutes(plannedRows, "minutes");

  // ── Unplanned helpers ──
  const updateUnplanned = (i, field, val) =>
    setUnplannedRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addUnplannedRow    = () => setUnplannedRows(r => [...r, emptyUnplannedRow()]);
  const deleteUnplannedRow = (i) => setUnplannedRows(r => r.filter((_, idx) => idx !== i));
  const totalUnplanned = sumMinutes(unplannedRows, "minutes");

  // ── Submit ──
  const handleSubmit = () => alert("Shift data submitted successfully!");

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: T.text }}>

      {/* Global keyframes */}
      <style>{`
        @keyframes navPulse { 0%,100%{opacity:1} 50%{opacity:.25} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance: textfield; }
        input:focus, select:focus { outline: none; }
        * { box-sizing: border-box; }
        @media(max-width:768px){
          .pg-grid4  { grid-template-columns: 1fr 1fr !important; }
          .pg-grid3  { grid-template-columns: 1fr 1fr !important; }
          .pg-grid2  { grid-template-columns: 1fr !important; }
          .pg-parts  { grid-template-columns: 1fr 1fr !important; }
          .pg-row-planned   { grid-template-columns: 1fr 120px 40px !important; }
          .pg-row-unplanned { grid-template-columns: 1fr 1fr 90px 40px !important; }
        }
        @media(max-width:500px){
          .pg-grid4,.pg-grid3,.pg-grid2,.pg-parts { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Page Content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 72px" }}>

        {/* Page header + action buttons */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 32,
        }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 6 }}>
              Powder Coating Line
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0, letterSpacing: "-.3px" }}>
              Production Entry
            </h1>
            <p style={{ margin: "6px 0 0", color: T.textMuted, fontSize: 14 }}>
              Shift production, manpower, quality &amp; downtime — one form, one submit.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              style={{ ...S.btn, background: "#F1F5F9", color: T.textMuted, border: `1.5px solid ${T.border}` }}
            >
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              style={{ ...S.btn, background: T.blue, color: "#fff", padding: "10px 28px", fontSize: 14 }}
            >
              Submit Shift ↗
            </button>
          </div>
        </div>

        {/* ── ① Shift Information ── */}
        <SectionCard stepNum="1" title="Shift Information" accentColor={T.navy}>
          <div
            className="pg-grid4"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18 }}
          >
            <Field label="Plant">
              <select
                value={plant}
                onChange={e => setPlant(e.target.value)}
                style={S.input}
              >
                <option value="">Select plant</option>
                <option>Plant A</option>
                <option>Plant B</option>
                <option>Plant C</option>
              </select>
            </Field>

            <Field label="Location / Bay">
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Bay 3"
                style={S.input}
              />
            </Field>

            <Field label="Date">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={S.input}
              />
            </Field>

            <Field label="Shift">
              <select
                value={shift}
                onChange={e => setShift(e.target.value)}
                style={S.input}
              >
                <option value="">Select shift</option>
                <option>Day Shift</option>
                <option>Night Shift</option>
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* ── ② Manpower ── */}
        <SectionCard stepNum="2" title="Manpower" accentColor={T.teal}>
          <div
            className="pg-grid3"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}
          >
            <Field label="Required Manpower">
              <NumInput value={requiredMP} onChange={e => setRequiredMP(e.target.value)} />
            </Field>

            <Field label="Available Manpower">
              <NumInput value={availableMP} onChange={e => setAvailableMP(e.target.value)} />
            </Field>

            <Field label="Short Manpower (auto)">
              <div style={{
                ...S.inputDisabled,
                fontWeight: 800,
                fontSize: 15,
                color: shortMP > 0 ? T.red : shortMP < 0 ? T.blue : T.success,
                borderColor: shortMP > 0 ? "#FECACA" : shortMP < 0 ? "#C7D9F8" : "#BBF7D0",
                background: shortMP > 0 ? T.redLight : shortMP < 0 ? T.blueLight : T.successBg,
              }}>
                {shortMP > 0 ? `− ${shortMP} short`
                  : shortMP < 0 ? `+ ${Math.abs(shortMP)} extra`
                  : "Full strength"}
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* ── ③ Production Entry ── */}
        <SectionCard stepNum="3" title="Production Entry" accentColor={T.blue}>

          {/* Model selector row */}
          <div style={{
            background: T.blueLight,
            border: `1.5px solid #C7D9F8`,
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 20,
            display: "flex",
            alignItems: "flex-end",
            gap: 16,
            flexWrap: "wrap",
          }}>
            <Field label="Select Model" style={{ minWidth: 200 }}>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{ ...S.input, borderColor: "#C7D9F8" }}
              >
                <option value="">— choose model —</option>
                {MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <p style={{ fontSize: 13, color: T.blue, margin: "0 0 2px", flex: 1 }}>
              Enter quantities for each part, then click <strong>Add to list</strong>.
            </p>
          </div>

          {/* Part quantity inputs */}
          <div
            className="pg-parts"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}
          >
            {PARTS.filter(
                p => MODEL_PARTS[selectedModel]?.includes(p.key)
              ).map(p => (
                <Field key={p.key} label={p.label}>
                  <NumInput
                    value={parts[p.key]}
                    onChange={e => handlePartChange(p.key, e.target.value)}
                  />
                </Field>
              ))}
          </div>

          {/* Add button */}
          <button
            onClick={handleAddModel}
            disabled={!selectedModel}
            style={{
              ...S.btn,
              background: selectedModel ? T.teal : "#E2E8F0",
              color: selectedModel ? "#fff" : T.textFaint,
              padding: "10px 22px",
              cursor: selectedModel ? "pointer" : "not-allowed",
            }}
          >
            + Add Model to List
          </button>

          {/* Production table */}
          {productionRows.length > 0 && (
            <>
              <Divider />
              <p style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>
                Production log — {productionRows.length} {productionRows.length === 1 ? "entry" : "entries"}
              </p>
              <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${T.border}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={S.th}>#</th>
                      <th style={S.th}>Model</th>
                      {PARTS.map(p => <th key={p.key} style={S.th}>{p.label}</th>)}
                      <th style={{ ...S.th, textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productionRows.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.surface : "#FAFBFD" }}>
                        <td style={{ ...S.td, color: T.textMuted, width: 36 }}>{i + 1}</td>
                        <td style={{ ...S.td, fontWeight: 700 }}>
                          <span style={{
                            background: T.blueLight, color: T.blue,
                            borderRadius: 5, padding: "2px 8px", fontSize: 12, fontWeight: 700,
                          }}>
                            {row.model}
                          </span>
                        </td>
                        {PARTS.map(p => (
                          <td key={p.key} style={{ ...S.td, textAlign: "center" }}>
                            {row[p.key] !== "" ? (
                              <strong>{row[p.key]}</strong>
                            ) : (
                              <span style={{ color: T.textFaint }}>—</span>
                            )}
                          </td>
                        ))}
                        <td style={{ ...S.td, textAlign: "center" }}>
                          <button
                            onClick={() => handleDeleteProductionRow(i)}
                            style={{
                              ...S.btn,
                              background: T.redLight,
                              color: T.red,
                              padding: "5px 14px",
                              fontSize: 12,
                              borderRadius: 6,
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SectionCard>

        {/* ── ④ Quality Data ── */}
        <SectionCard stepNum="4" title="Quality Data" accentColor="#B91C1C">
          <div
            className="pg-grid3"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}
          >
            {[
              { label: "Rework Qty",    value: rework,    set: setRework,    accent: "#EF9F27", bg: "#FEF3C7" },
              { label: "Rejection Qty", value: rejection, set: setRejection, accent: "#E24B4A", bg: "#FEE2E2" },
              { label: "Defect Qty",    value: defect,    set: setDefect,    accent: "#7C3AED", bg: "#EDE9FE" },
            ].map(({ label, value, set, accent, bg }) => (
              <div key={label} style={{
                background: bg, borderRadius: 10,
                border: `1.5px solid ${accent}30`,
                padding: "16px",
              }}>
                <Field label={label}>
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder="0"
                    style={{
                      ...S.input,
                      background: T.surface,
                      borderColor: `${accent}50`,
                      fontWeight: 700,
                      fontSize: 18,
                      textAlign: "center",
                    }}
                  />
                </Field>
                {value !== "" && parseInt(value) > 0 && (
                  <div style={{
                    marginTop: 8, fontSize: 12, fontWeight: 700,
                    color: accent, textAlign: "center",
                  }}>
                    {parseInt(value)} {label.toLowerCase().replace(" qty", "")} recorded
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── ⑤ Planned Idle Time ── */}
        <SectionCard stepNum="5" title="Planned Idle Time" accentColor="#92400E">

          {/* Column headers */}
          <div
            className="pg-row-planned"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 150px 44px",
              gap: 10,
              marginBottom: 8,
              padding: "0 4px",
            }}
          >
            <span style={S.colLabel}>Reason</span>
            <span style={S.colLabel}>Minutes</span>
            <span />
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plannedRows.map((row, i) => (
              <div
                key={i}
                className="pg-row-planned"
                style={{ display: "grid", gridTemplateColumns: "1fr 150px 44px", gap: 10, alignItems: "center" }}
              >
                <select
                  value={row.reason}
                  onChange={e => updatePlanned(i, "reason", e.target.value)}
                  style={S.input}
                >
                  {PLANNED_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>

                <NumInput
                  value={row.minutes}
                  onChange={e => updatePlanned(i, "minutes", e.target.value)}
                  placeholder="mins"
                />

                <DelBtn onClick={() => deletePlannedRow(i)} />
              </div>
            ))}
          </div>

          <Divider />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <button
              onClick={addPlannedRow}
              style={{ ...S.btn, background: T.amberLight, color: T.amber }}
            >
              + Add Row
            </button>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: T.amberLight, borderRadius: 8,
              padding: "8px 16px", border: `1.5px solid #F59E0B40`,
            }}>
              <span style={{ fontSize: 13, color: T.amber, fontWeight: 600 }}>Total Planned Idle</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: T.amber }}>{totalPlanned}</span>
              <span style={{ fontSize: 13, color: T.amber }}>min</span>
            </div>
          </div>
        </SectionCard>

        {/* ── ⑥ Unplanned Idle Time ── */}
        <SectionCard stepNum="6" title="Unplanned Idle Time (Downtime)" accentColor="#4C1D95">

          {/* Column headers */}
          <div
            className="pg-row-unplanned"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 140px 44px",
              gap: 10,
              marginBottom: 8,
              padding: "0 4px",
            }}
          >
            <span style={S.colLabel}>Issue Type</span>
            <span style={S.colLabel}>Description</span>
            <span style={S.colLabel}>Minutes</span>
            <span />
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {unplannedRows.map((row, i) => (
              <div
                key={i}
                className="pg-row-unplanned"
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px 44px", gap: 10, alignItems: "center" }}
              >
                <select
                  value={row.issue}
                  onChange={e => updateUnplanned(i, "issue", e.target.value)}
                  style={S.input}
                >
                  {UNPLANNED_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>

                <input
                  type="text"
                  value={row.description}
                  onChange={e => updateUnplanned(i, "description", e.target.value)}
                  placeholder="Brief description…"
                  style={S.input}
                />

                <NumInput
                  value={row.minutes}
                  onChange={e => updateUnplanned(i, "minutes", e.target.value)}
                  placeholder="mins"
                />

                <DelBtn onClick={() => deleteUnplannedRow(i)} />
              </div>
            ))}
          </div>

          <Divider />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <button
              onClick={addUnplannedRow}
              style={{ ...S.btn, background: T.violetLight, color: T.violet }}
            >
              + Add Downtime
            </button>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: T.violetLight, borderRadius: 8,
              padding: "8px 16px", border: `1.5px solid #7C3AED40`,
            }}>
              <span style={{ fontSize: 13, color: T.violet, fontWeight: 600 }}>Total Unplanned Idle</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: T.violet }}>{totalUnplanned}</span>
              <span style={{ fontSize: 13, color: T.violet }}>min</span>
            </div>
          </div>
        </SectionCard>

        {/* ── Summary bar ── */}
        <div style={{
          background: T.navy,
          borderRadius: 14,
          padding: "22px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "0 4px 20px rgba(11,31,58,.25)",
        }}>
          {/* Mini summary chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            {[
              { label: "Models logged",   value: productionRows.length, color: "#93C5FD" },
              { label: "Planned idle",    value: `${totalPlanned} min`, color: "#FCD34D" },
              { label: "Unplanned idle",  value: `${totalUnplanned} min`, color: "#C4B5FD" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color }}>{value || 0}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            style={{
              ...S.btn,
              background: "#16A34A",
              color: "#fff",
              padding: "13px 40px",
              fontSize: 15,
              borderRadius: 10,
              letterSpacing: ".2px",
            }}
          >
            Submit Shift Data ↗
          </button>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", fontSize: 12, color: T.textFaint, marginTop: 24 }}>
          PG Group · PS-MIS Production Portal · Data saved locally until submission.
        </p>

      </div>
    </div>
  );
}