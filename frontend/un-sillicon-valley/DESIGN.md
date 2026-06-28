# Sistema de diseño — UN Silicon Valley (Ink)

Guía para implementar la interfaz con **tokens semánticos** definidos en CSS.

## Principios

1. **Nunca hardcodear colores ni fuentes en componentes.** Usar tokens (`--foreground`, `.ds-btn-primary`, `text-muted`, etc.).
2. **Titulares en PT Serif; UI en Lato.** No referenciar fuentes por nombre en JSX.
3. **Superficies en capas:** `background` → tarjetas con borde `border` sobre `surface`.
4. **Iconografía lineal** con `currentColor` o `--foreground`.
5. **Alto contraste editorial:** negro puro para acciones; `#111827` para texto de lectura.

---

## Paleta

| Token | HEX | Uso |
|-------|-----|-----|
| `--background` | `#FFFFFF` | Fondo de página |
| `--foreground` | `#111827` | Texto principal |
| `--primary` | `#000000` | Botones primarios, énfasis |
| `--accent` | `#000000` | Links, highlights |
| `--surface` | `#FFFFFF` | Tarjetas, paneles |
| `--border` | `#DBDEE5` | Bordes y divisores |

### Tokens derivados (en `globals.css`, no modificar en componentes)

| Token | Uso |
|-------|-----|
| `--text-muted` | Texto secundario (~68% opacidad) |
| `--text-subtle` | Placeholders (~48% opacidad) |
| `--primary-soft` | Fondos suaves de énfasis |
| `--accent-soft` | Alertas / iconos destacados |
| `--input-bg` | Fondo de inputs |
| `--on-primary` / `--on-accent` | Texto sobre botones (`#FFFFFF`) |
| `--error`, `--error-soft` | Estados de error |

---

## Tipografía

| Rol | Fuente | Variable | Uso |
|-----|--------|----------|-----|
| Headline | PT Serif | `--font-pt-serif` | `h1`–`h3`, `.ds-headline` |
| Body / UI | Lato | `--font-lato` | Párrafos, labels, botones, nav |

Reglas:
- Titulares: `.ds-headline` o etiquetas `h1`–`h3`.
- UI: nunca serif en botones ni labels.
- Badges mono: `.ds-badge` para snippets (`@unal.edu.co`).

---

## Archivos de referencia

| Archivo | Contenido |
|---------|-----------|
| `app/themes/ink.css` | Tokens primitivos (`:root`) |
| `app/globals.css` | Tokens derivados, `@theme`, clases `.ds-*` |
| `app/layout.tsx` | Carga de PT Serif + Lato |
| `components/layout/Logo.tsx` | Logo con `.logo-mark` / `.logo-bar` |

---

## Tailwind v4

```tsx
<div className="bg-background text-foreground" />
<div className="bg-surface border-border" />
<button className="bg-primary text-[var(--on-primary)]" />
<p className="text-muted" />
```

**Prohibido** en componentes: `zinc-*`, `blue-*`, hex sueltos, paletas de otros temas.

---

## Componentes (clases CSS)

| Clase | Uso |
|-------|-----|
| `.ds-card` | Tarjetas y paneles |
| `.ds-btn .ds-btn-primary` | Acción principal (negro) |
| `.ds-btn .ds-btn-accent` | CTA secundario |
| `.ds-btn .ds-btn-ghost` | Borde + fondo transparente |
| `.ds-btn-pill` | Botones redondeados (header) |
| `.ds-link` | Enlaces de acción |
| `.ds-label` | Labels de formulario |
| `.auth-input` | Inputs (`.auth-input-compact` más pequeño) |
| `.ds-alert-*` | error / success / warning |
| `.logo-mark`, `.logo-bar` | SVG del logo |

---

## Checklist para nuevas pantallas

1. ¿Solo tokens semánticos?
2. ¿Titulares con `.ds-headline`?
3. ¿Tarjetas con `.ds-card`?
4. ¿Botones con `.ds-btn-*`?
5. ¿Inputs con `.auth-input`?

---

## Ejemplo

```tsx
export function ExamplePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="ds-headline text-4xl">Título</h1>
        <p className="mt-3 text-muted">Descripción.</p>
        <div className="ds-card mt-8 p-8">
          <label className="ds-label" htmlFor="title">Título</label>
          <input id="title" className="auth-input auth-input-compact" />
          <button type="button" className="ds-btn ds-btn-primary mt-6">
            Guardar
          </button>
        </div>
      </main>
    </div>
  );
}
```
