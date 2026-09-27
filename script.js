/* ============================================
   SlitherZone — Custom Arrow Cursor
   ============================================ */

(() => {
    'use strict';

    // Create cursor container
    const cursorEl = document.createElement('div');
    cursorEl.id = 'custom-cursor';
    document.body.appendChild(cursorEl);

    // Big neon arrow SVG (default)
    const arrowSVG = `
        <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="arrow-grad" x1="0" y1="0" x2="20" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#a855f7"/>
                    <stop offset="50%" stop-color="#6c5ce7"/>
                    <stop offset="100%" stop-color="#00f5d4"/>
                </linearGradient>
                <filter id="arrow-glow">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#6c5ce7" flood-opacity="0.7"/>
                    <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#a855f7" flood-opacity="0.3"/>
                </filter>
            </defs>
            <path d="M4 2 L4 38 L12 30 L20 44 L26 41 L18 27 L30 27 Z"
                  fill="rgba(0,0,0,0.35)" transform="translate(1.5, 1.5)"/>
            <path d="M4 2 L4 38 L12 30 L20 44 L26 41 L18 27 L30 27 Z"
                  fill="url(#arrow-grad)" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"
                  stroke-linejoin="round" filter="url(#arrow-glow)"/>
            <path d="M8 10 L8 30 L12 26 L14 30 L16 29 L14 25 L22 25 Z"
                  fill="rgba(255,255,255,0.15)"/>
        </svg>`;

    // Hand pointer SVG (for clickable elements)
    const handSVG = `
        <svg width="38" height="44" viewBox="0 0 38 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="hand-grad" x1="6" y1="0" x2="32" y2="44" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#00f5d4"/>
                    <stop offset="50%" stop-color="#4cc9f0"/>
                    <stop offset="100%" stop-color="#6c5ce7"/>
                </linearGradient>
                <filter id="hand-glow">
                    <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#00f5d4" flood-opacity="0.65"/>
                    <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#4cc9f0" flood-opacity="0.3"/>
                </filter>
            </defs>
            <!-- Shadow -->
            <path d="M17.5 3 Q17.5 0.5 19.5 0.5 Q21.5 0.5 21.5 3 L21.5 15 Q23 13.5 25 13.5 Q27 13.5 27 15.5 L27 17 Q28.5 15.5 30.5 15.5 Q32.5 15.5 32.5 17.5 L32.5 20 Q34 18.5 36 18.5 Q38 18.5 37.5 21 L36.5 32 Q35.5 40 28 42.5 L22 42.5 Q14 42.5 10.5 36 L6.5 28 Q5 25 7 23.5 Q9 22 11 24 L13 27 L13 6 Q13 3.5 15.5 3.5 Q17.5 3.5 17.5 6 Z"
                  fill="rgba(0,0,0,0.3)" transform="translate(1, 1)"/>
            <!-- Main hand -->
            <path d="M17.5 3 Q17.5 0.5 19.5 0.5 Q21.5 0.5 21.5 3 L21.5 15 Q23 13.5 25 13.5 Q27 13.5 27 15.5 L27 17 Q28.5 15.5 30.5 15.5 Q32.5 15.5 32.5 17.5 L32.5 20 Q34 18.5 36 18.5 Q38 18.5 37.5 21 L36.5 32 Q35.5 40 28 42.5 L22 42.5 Q14 42.5 10.5 36 L6.5 28 Q5 25 7 23.5 Q9 22 11 24 L13 27 L13 6 Q13 3.5 15.5 3.5 Q17.5 3.5 17.5 6 Z"
                  fill="url(#hand-grad)" stroke="rgba(255,255,255,0.55)" stroke-width="1.2"
                  stroke-linejoin="round" filter="url(#hand-glow)"/>
            <!-- Finger lines -->
            <line x1="17.5" y1="18" x2="17.5" y2="26" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>
            <line x1="21.5" y1="18" x2="21.5" y2="26" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>
            <line x1="27" y1="20" x2="27" y2="26" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>
            <line x1="32.5" y1="22" x2="32.5" y2="27" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>
            <!-- Highlight -->
            <path d="M18.5 4 Q18.5 2 19.5 2 L19.5 10" stroke="rgba(255,255,255,0.25)" stroke-width="1" fill="none" stroke-linecap="round"/>
        </svg>`;

    // Set default arrow
    cursorEl.innerHTML = arrowSVG;
    let currentMode = 'arrow';

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        *, *::before, *::after {
            cursor: none !important;
        }

        #custom-cursor {
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 100000;
            will-change: left, top;
        }

        #custom-cursor svg {
            display: block;
            transition: transform 0.1s ease;
        }

        #custom-cursor.mode-hand {
            /* Offset so fingertip aligns to mouse */
            margin-left: -7px;
            margin-top: 0px;
        }

        #custom-cursor.clicking svg {
            transform: scale(0.88);
        }

        #custom-cursor.hidden {
            opacity: 0 !important;
        }

        @media (pointer: coarse) {
            #custom-cursor {
                display: none !important;
            }
            *, *::before, *::after {
                cursor: auto !important;
            }
        }
    `;
    document.head.appendChild(style);

    // Clickable selectors — everything you can click
    const CLICKABLE = 'a, button, [role="button"], .skin-option, .play-button, .menu-button, .respawn-button, label, summary, select';

    function isClickable(el) {
        if (!el) return false;
        return el.closest(CLICKABLE) !== null;
    }

    function setMode(newMode) {
        if (currentMode === newMode) return;
        currentMode = newMode;
        cursorEl.classList.remove('mode-arrow', 'mode-hand');

        if (newMode === 'hand') {
            cursorEl.innerHTML = handSVG;
            cursorEl.classList.add('mode-hand');
        } else {
            cursorEl.innerHTML = arrowSVG;
            cursorEl.classList.add('mode-arrow');
        }
    }

    let visible = true;

    // Track mouse position and detect hover target
    document.addEventListener('mousemove', (e) => {
        cursorEl.style.left = e.clientX + 'px';
        cursorEl.style.top = e.clientY + 'px';

        // Switch to hand for clickable elements, arrow for everything else (including inputs)
        setMode(isClickable(e.target) ? 'hand' : 'arrow');

        if (!visible) {
            visible = true;
            cursorEl.classList.remove('hidden');
        }
    });

    document.addEventListener('mousedown', () => cursorEl.classList.add('clicking'));
    document.addEventListener('mouseup', () => cursorEl.classList.remove('clicking'));

    document.addEventListener('mouseleave', () => {
        visible = false;
        cursorEl.classList.add('hidden');
    });
    document.addEventListener('mouseenter', () => {
        visible = true;
        cursorEl.classList.remove('hidden');
    });

    // Initial position
    cursorEl.style.left = (window.innerWidth / 2) + 'px';
    cursorEl.style.top = (window.innerHeight / 2) + 'px';
})();
