"use client";

import React, { useState } from "react";
import type { VCardTheme, BgMode, BgPattern, ButtonStyle, ButtonVariant, FontFamily, LayoutVariant, SocialIconStyle } from "@/types/vcard";
import { DEFAULT_VCARD_THEME } from "@/types/vcard";
import { THEME_PRESETS } from "@/lib/vcard-theme-presets";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  theme: VCardTheme;
  onChange: (theme: VCardTheme) => void;
}

/* ------------------------------------------------------------------ */
/*  Tiny helper components                                             */
/* ------------------------------------------------------------------ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: 11, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 10, marginTop: 24,
    }}>
      {children}
    </h3>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="theme-color-field">
      <span className="theme-color-label">{label}</span>
      <div className="theme-color-input-wrap">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="theme-color-native"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#hex"
          className="theme-color-text"
          maxLength={9}
        />
      </div>
    </label>
  );
}

function OptionGrid<T extends string>({
  value,
  options,
  onChange,
  renderLabel,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  renderLabel?: (v: T) => React.ReactNode;
}) {
  return (
    <div className="theme-option-grid">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`theme-option-btn ${value === opt ? "theme-option-btn--active" : ""}`}
          onClick={() => onChange(opt)}
        >
          {renderLabel ? renderLabel(opt) : opt}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Labels                                                             */
/* ------------------------------------------------------------------ */

const BG_MODE_LABELS: Record<BgMode, string> = { gradient: "Gradient", solid: "Jednokolorowe", pattern: "Wzor" };
const BG_PATTERN_LABELS: Record<BgPattern, string> = { none: "Brak", dots: "Kropki", grid: "Siatka", waves: "Fale" };
const BUTTON_STYLE_LABELS: Record<ButtonStyle, string> = { rounded: "Zaokraglone", square: "Kwadratowe", pill: "Pigulka" };
const BUTTON_VARIANT_LABELS: Record<ButtonVariant, string> = { filled: "Wypelnione", outline: "Obrys", ghost: "Przezroczyste" };
const FONT_LABELS: Record<FontFamily, string> = { geist: "Geist Sans", inter: "Inter", serif: "Serif", poppins: "Poppins", montserrat: "Montserrat", playfair: "Playfair", raleway: "Raleway", "dm-sans": "DM Sans" };
const LAYOUT_LABELS: Record<LayoutVariant, string> = { classic: "Klasyczny", modern: "Nowoczesny", minimal: "Minimalny" };
const SOCIAL_ICON_LABELS: Record<SocialIconStyle, string> = { rounded: "Zaokraglone", circle: "Kolo", square: "Kwadrat", pill: "Pigulka" };

/* ------------------------------------------------------------------ */
/*  ThemeEditor                                                        */
/* ------------------------------------------------------------------ */

export default function ThemeEditor({ theme, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const t = { ...DEFAULT_VCARD_THEME, ...theme };

  const update = (patch: Partial<VCardTheme>) => {
    onChange({ ...theme, ...patch });
  };

  return (
    <div className="theme-editor">
      {/* Presets */}
      <SectionTitle>Presety</SectionTitle>
      <div className="theme-presets-grid">
        {THEME_PRESETS.map((preset) => {
          const pt = { ...DEFAULT_VCARD_THEME, ...preset.theme };
          const bg = pt.bgMode === "solid"
            ? pt.bgSolidColor
            : `linear-gradient(135deg, ${pt.bgGradientFrom}, ${pt.bgGradientTo})`;
          return (
            <button
              key={preset.id}
              type="button"
              className="theme-preset-card"
              onClick={() => onChange({ ...DEFAULT_VCARD_THEME, ...preset.theme })}
              title={preset.name}
            >
              <div className="theme-preset-preview" style={{ background: bg }}>
                <div
                  className="theme-preset-accent"
                  style={{ background: pt.primaryColor }}
                />
              </div>
              <span className="theme-preset-name">{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Toggle advanced */}
      <button
        type="button"
        className="theme-advanced-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Ukryj zaawansowane" : "Zaawansowane ustawienia"}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="theme-advanced-panel">
          {/* Colors */}
          <SectionTitle>Kolory</SectionTitle>
          <div className="theme-colors-row">
            <ColorInput label="Akcent" value={t.primaryColor} onChange={(v) => update({ primaryColor: v })} />
            {t.bgMode === "gradient" && (
              <>
                <ColorInput label="Tlo od" value={t.bgGradientFrom} onChange={(v) => update({ bgGradientFrom: v })} />
                <ColorInput label="Tlo do" value={t.bgGradientTo} onChange={(v) => update({ bgGradientTo: v })} />
              </>
            )}
            {t.bgMode === "solid" && (
              <ColorInput label="Kolor tla" value={t.bgSolidColor} onChange={(v) => update({ bgSolidColor: v })} />
            )}
            {t.bgMode === "pattern" && (
              <>
                <ColorInput label="Kolor tla" value={t.bgSolidColor} onChange={(v) => update({ bgSolidColor: v, bgGradientFrom: v })} />
              </>
            )}
          </div>

          {/* Background mode */}
          <SectionTitle>Tryb tla</SectionTitle>
          <OptionGrid
            value={t.bgMode}
            options={["gradient", "solid", "pattern"] as BgMode[]}
            onChange={(v) => update({ bgMode: v })}
            renderLabel={(v) => BG_MODE_LABELS[v]}
          />

          {t.bgMode === "pattern" && (
            <>
              <SectionTitle>Wzor</SectionTitle>
              <OptionGrid
                value={t.bgPattern}
                options={["none", "dots", "grid", "waves"] as BgPattern[]}
                onChange={(v) => update({ bgPattern: v })}
                renderLabel={(v) => BG_PATTERN_LABELS[v]}
              />
            </>
          )}

          {/* Button style */}
          <SectionTitle>Styl przyciskow</SectionTitle>
          <OptionGrid
            value={t.buttonStyle}
            options={["rounded", "square", "pill"] as ButtonStyle[]}
            onChange={(v) => update({ buttonStyle: v })}
            renderLabel={(v) => BUTTON_STYLE_LABELS[v]}
          />

          <SectionTitle>Wariant przyciskow</SectionTitle>
          <OptionGrid
            value={t.buttonVariant}
            options={["filled", "outline", "ghost"] as ButtonVariant[]}
            onChange={(v) => update({ buttonVariant: v })}
            renderLabel={(v) => BUTTON_VARIANT_LABELS[v]}
          />

          {/* Typography */}
          <SectionTitle>Czcionka</SectionTitle>
          <OptionGrid
            value={t.fontFamily}
            options={["geist", "inter", "serif", "poppins", "montserrat", "playfair", "raleway", "dm-sans"] as FontFamily[]}
            onChange={(v) => update({ fontFamily: v })}
            renderLabel={(v) => FONT_LABELS[v]}
          />

          {/* Layout */}
          <SectionTitle>Uklad</SectionTitle>
          <OptionGrid
            value={t.layoutVariant}
            options={["classic", "modern", "minimal"] as LayoutVariant[]}
            onChange={(v) => update({ layoutVariant: v })}
            renderLabel={(v) => LAYOUT_LABELS[v]}
          />

          {/* Avatar border */}
          <SectionTitle>Avatar</SectionTitle>
          <label className="theme-color-field">
            <span className="theme-color-label">Grubosc ramki ({t.avatarBorderWidth}px)</span>
            <input
              type="range"
              min={0}
              max={6}
              step={1}
              value={t.avatarBorderWidth}
              onChange={(e) => update({ avatarBorderWidth: Number(e.target.value) })}
              className="theme-range-input"
            />
          </label>
          <ColorInput label="Kolor ramki" value={t.avatarBorderColor} onChange={(v) => update({ avatarBorderColor: v })} />

          {/* Social icons */}
          <SectionTitle>Styl ikon social</SectionTitle>
          <OptionGrid
            value={t.socialIconStyle}
            options={["rounded", "circle", "square", "pill"] as SocialIconStyle[]}
            onChange={(v) => update({ socialIconStyle: v })}
            renderLabel={(v) => SOCIAL_ICON_LABELS[v]}
          />

          {/* Contact rows customization */}
          <SectionTitle>Belki kontaktowe</SectionTitle>
          <label className="theme-color-field">
            <span className="theme-color-label">Wysokosc belek - padding ({t.rowPadding}px)</span>
            <input
              type="range"
              min={6}
              max={20}
              step={1}
              value={t.rowPadding}
              onChange={(e) => update({ rowPadding: Number(e.target.value) })}
              className="theme-range-input"
            />
          </label>
          <label className="theme-color-field">
            <span className="theme-color-label">Rozmiar ikon ({t.rowIconSize}px)</span>
            <input
              type="range"
              min={32}
              max={56}
              step={2}
              value={t.rowIconSize}
              onChange={(e) => update({ rowIconSize: Number(e.target.value) })}
              className="theme-range-input"
            />
          </label>
          <label className="theme-color-field">
            <span className="theme-color-label">Wielkosc tekstu ({t.rowFontSize}px)</span>
            <input
              type="range"
              min={12}
              max={18}
              step={1}
              value={t.rowFontSize}
              onChange={(e) => update({ rowFontSize: Number(e.target.value) })}
              className="theme-range-input"
            />
          </label>
          <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
            Czcionka belek (mozna inna niz glowna)
          </div>
          <OptionGrid
            value={t.rowFontFamily || t.fontFamily}
            options={["geist", "inter", "serif", "poppins", "montserrat", "playfair", "raleway", "dm-sans"] as FontFamily[]}
            onChange={(v) => update({ rowFontFamily: v })}
            renderLabel={(v) => FONT_LABELS[v]}
          />

          {/* Odstepy pionowe — pozwalają zmieścić wszystkie belki na jednym ekranie */}
          <SectionTitle>Odstepy pionowe</SectionTitle>
          <label className="theme-color-field">
            <span className="theme-color-label">Pozycja loga w pionie ({t.avatarTopGap}px od gory; default 32)</span>
            <input
              type="range"
              min={0}
              max={64}
              step={1}
              value={t.avatarTopGap}
              onChange={(e) => update({ avatarTopGap: Number(e.target.value) })}
              className="theme-range-input"
            />
          </label>
          <label className="theme-color-field">
            <span className="theme-color-label">Odstep: logo → imie/firma ({t.avatarNameGap}px)</span>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={t.avatarNameGap}
              onChange={(e) => update({ avatarNameGap: Number(e.target.value) })}
              className="theme-range-input"
            />
          </label>
          <label className="theme-color-field">
            <span className="theme-color-label">Odstep: imie/firma → &quot;Zapisz kontakt&quot; ({t.headerBottomGap}px)</span>
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={t.headerBottomGap}
              onChange={(e) => update({ headerBottomGap: Number(e.target.value) })}
              className="theme-range-input"
            />
          </label>
          <label className="theme-color-field">
            <span className="theme-color-label">Odstep: &quot;Zapisz kontakt&quot; → pierwsza belka ({t.buttonRowGap}px)</span>
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={t.buttonRowGap}
              onChange={(e) => update({ buttonRowGap: Number(e.target.value) })}
              className="theme-range-input"
            />
          </label>
          <label className="theme-color-field">
            <span className="theme-color-label">Odstep miedzy belkami ({t.rowGap}px)</span>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={t.rowGap}
              onChange={(e) => update({ rowGap: Number(e.target.value) })}
              className="theme-range-input"
            />
          </label>
        </div>
      )}
    </div>
  );
}
