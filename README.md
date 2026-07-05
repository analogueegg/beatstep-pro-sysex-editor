# BeatStep Pro SysEx Controller & Session Tool

A high-performance, responsive web-based controller designed for the **Arturia BeatStep Pro** hardware sequencer. It utilizes the native browser **Web MIDI API** to directly transmit and monitor custom System Exclusive (SysEx) configurations in real-time.

---

## Key Features

- **Direct Hardware Mapping**: Directly edit sync source clock modes, metronome states, CV outputs, and global MIDI parameters.
- **Durable Input Validation**: Sliders have been replaced with precise, validated text input controls that prevent erroneous or out-of-bounds MIDI transmissions, falling back gracefully to the last valid value on blur.
- **Dynamic Drum Map Configurator**: Configure custom drum pad MIDI notes and channels, including a **Volca Sample Custom Preset** (mapping pads 1–10 to MIDI channels 1–10 sequentially).
- **User Scale Designer**: Visually design custom musical scales and commit them immediately to your hardware.
- **MIDI SysEx Console & Monitor**: Real-time Hex output stream of all sent and received SysEx messages. Export active sessions directly to `.syx` files, filter logs, or inject raw Hex sequences directly.
- **Intelligent Theme Management**: Sleek, high-contrast user interface featuring Light, Dark, and System Auto modes, persisted securely in local browser storage.

---

## Architecture

This application is built with a highly responsive, modern client-side frontend stack:

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) for solid type-safety.
- **Build Tool**: [Vite](https://vite.dev/) for high-speed module bundling and local dev reloading.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for fluid responsive styling, incorporating CSS Custom Properties (`var(--...)`) to support dynamic light and dark mode switching instantly.
- **Icons**: [Lucide React](https://lucide.dev/) for precise, minimalist iconography.
- **Hardware Communication**: Native browser **Web MIDI API** for zero-latency, raw MIDI input/output port communication directly from your browser sandbox.

---

## How to Run locally

### Prerequisites
- Node.js (v18 or higher recommended)
- A browser that supports Web MIDI (Google Chrome, Microsoft Edge, Opera, or Brave)

### Installation
1. Clone your exported repository.
2. Run `npm install` to set up all dependencies.
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Open the displayed local URL (typically `http://localhost:3000`) in a supported browser.

---

## 🤖 AI Disclaimer

> [!NOTE]
> **This application was built with the assistance of Artificial Intelligence.**  
> It was created using Google AI Studio's advanced AI Coding Agents. The AI assisted with designing the modern styling, validating hardware parameters, configuring custom Drum MIDI channels, and implementing fully dynamic theme toggles.
