# Seguros Iberis — Sitio web

Landing rediseñada de **Agencia de Seguros Iberis**, con dos vistas conmutables desde el header:

- **Personas** — accidentes personales, asistencia médica/hogar/jurídica, mascotas, auto y odontología, con tabla comparativa de planes **PLUS vs PLUS Ampliado**.
- **Empresas** — líneas financieras: Vida Deudor, Infidelidad, Cyber, D&O, Responsabilidad Civil y Daños Materiales Pymes.

## Stack

Sitio estático: **HTML + CSS + JavaScript vanilla**, sin dependencias ni build.

```
index.html      → estructura (dos vistas + secciones compartidas)
styles.css      → estilos mobile-first, paleta teal del logo (#0D4F5C)
main.js         → toggle de vista (routing por hash), tabs, contadores, reveal on scroll
assets/         → logo e imágenes de coberturas
backup-v1/      → versión inicial de una sola página (referencia)
```

## Desarrollo local

```bash
python -m http.server 5500
# abrir http://127.0.0.1:5500
```

## Características

- 100% responsive (mobile-first, breakpoints 400/560/720/980 px)
- Toggle Personas/Empresas con `#personas` / `#empresas` en la URL
- Tablas de coberturas reales extraídas del sitio oficial
- Accesibilidad: skip link, focus visible, `prefers-reduced-motion`

---

Información de contacto: servicioalcliente@segurosiberis.co · Cra. 14 # 93A-30 piso 5, Bogotá.
