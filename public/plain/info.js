// === Overlay lookup: card section -> overlay HTML file ===
const overlayMap = {
    "project-aiAsteroids": "abOverlay.html",
    "project-concurrentCLI": "cpOverlay.html",
    "education": "edOverlay.html",
    "experience-apple": "expAppleOverlay.html",
    "experience-teck": "expTeckOverlay.html",
    "experience-rgrg": "expUAlbertaOverlay.html",
    "project-formfitness": "ffOverlay.html",
    "project-aiImageCaptioner": "icOverlay.html",
    "project-inventoryManager": "imOverlay.html",
    "extracurricular-olympicWeightlifting": "owOverlay.html",
};


function handleCardEffects() {
    const cards = document.querySelectorAll('.card:not(.section-header)');
    let currentCardIndex = -1;  // Start at -1 so first scroll hits index 0

    function removeAllHighlights() {
        cards.forEach(card => {
            card.style.boxShadow = 'none';
        });
    }

    function highlightCard(index) {
        removeAllHighlights();
        if (index >= 0 && index < cards.length) {
            cards[index].style.boxShadow = '0 0 10px 5px #e8cfbc';
        }
    }

    function getScrollTriggerDistance() {
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        if (windowWidth < 1024) {
            console.log("aa")
            return windowHeight * 0.16;
        }
        return windowHeight * 0.12;
    }

    function updateHighlight() {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        let highlightStart = windowHeight * 0.75;
        if (windowWidth >= 1024) {
            highlightStart = windowHeight * 0.7;
        }

        if (scrollPosition < highlightStart) {
            removeAllHighlights();
            currentCardIndex = -1;  // Reset to -1 so next scroll starts at 0
            return;
        }

        const scrollTriggerDistance = getScrollTriggerDistance();
        const adjustedScroll = scrollPosition - highlightStart;
        const newIndex = Math.floor(adjustedScroll / scrollTriggerDistance);

        // Always highlight first card when just passing highlight threshold
        if (scrollPosition >= highlightStart && currentCardIndex === -1) {
            currentCardIndex = 0;
            highlightCard(0);
            return;
        }

        if (newIndex !== currentCardIndex) {
            currentCardIndex = newIndex;
            if (currentCardIndex < cards.length) {
                highlightCard(currentCardIndex);
            } else {
                removeAllHighlights();
            }
        }
    }

    let ticking = false;
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateHighlight();
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll);
    updateHighlight();
}

function handleScrollHintPersistent() {
    const scrollHint = document.getElementById('scroll-hint');

    function updateHintVisibility() {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        let highlightStart = windowHeight * 0.75;
        if (windowWidth >= 1024) {
            highlightStart = windowHeight * 0.7;
        }

        if (scrollPosition >= highlightStart) {
            scrollHint.classList.add('visible');
        } else {
            scrollHint.classList.remove('visible');
        }
    }

    // Use throttled scroll event for performance
    let ticking = false;
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateHintVisibility();
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll);
    updateHintVisibility(); // run on load
}

function showWelcomeFireworks() {
    const canvas = document.getElementById('fireworks-canvas');
    const popup = document.getElementById('welcome-popup');
    canvas.style.display = 'block';
    popup.classList.add('show');

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FFD700', '#FF6347', '#87CEEB', '#ADFF2F'];

    for (let i = 0; i < 80; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: Math.random() * 3 + 2,
            angle: Math.random() * 2 * Math.PI,
            speed: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.alpha -= 0.005;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.alpha})`;
            ctx.fill();
        });

        if (particles.some(p => p.alpha > 0)) {
            requestAnimationFrame(animate);
        } else {
            canvas.style.display = 'none';
            popup.classList.remove('show');

        }
    }

    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `${r},${g},${b}`;
    }

    animate();
}

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    const sections = document.querySelectorAll('.content-section');
    const closeButtons = document.querySelectorAll('.close-button');

    // <<< NEW ── overlay modal nodes
    const modal = document.getElementById('external-overlay-modal');
    const iframe = document.getElementById('external-overlay-iframe');
    const btnClose = document.getElementById('close-external-overlay');

    function openExternalOverlay(fileName) {
        if (!fileName) { console.warn('overlayMap miss →', fileName); return; }

        /**
         * Sets up the iframe onload event to ensure the overlay wrapper fills the entire iframe.
         * Once the iframe content is loaded, it retrieves the overlay wrapper element and adjusts
         * its dimensions and spacing to occupy the full width and height of the iframe, removing 
         * any margin or padding.
         */
        iframe.onload = () => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!doc) return;

                /* --- inject Font Awesome once --- */
                if (!doc.getElementById('fa')) {
                    const fa = doc.createElement('link');
                    fa.id = 'fa';
                    fa.rel = 'stylesheet';
                    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
                    doc.head.appendChild(fa);
                }

                /* hook inner close button */
                const innerClose = doc.querySelector('.close-button');
                if (innerClose) {
                    innerClose.addEventListener('click', e => {
                        e.preventDefault();
                        window.closeExternalOverlay();
                    }, { once: true });
                }

                /* stretch wrapper */
                const wrap = doc.getElementById('overlay-wrapper');
                if (wrap) {
                    wrap.style.width = '100%';
                    wrap.style.height = '100%';
                    wrap.style.margin = '0';
                    wrap.style.padding = '0';
                    wrap.style.overflow = 'hidden';
                    wrap.style.position = 'fixed';
                    wrap.style.top = '0';
                    wrap.style.left = '0';
                    wrap.style.pointerEvents = 'none';
                }
            } catch (err) {
                console.error('overlay patch failed:', err);
            }
        };

        iframe.src = '/' + fileName;

        // reset & show
        const panel = modal.querySelector('.external-overlay-content');
        if (panel) panel.classList.remove('show');
        modal.classList.remove('external-overlay-hidden');

        // allow reflow then add .show to trigger the transition
        if (panel) requestAnimationFrame(() => panel.classList.add('show'));
    }
    function closeExternalOverlay() {
        const panel = modal.querySelector('.external-overlay-content');
      
        // Start closing animation
        panel.classList.remove('show');
      
        // Wait for animation to finish before hiding
        setTimeout(() => {
          iframe.src = '';
          modal.classList.add('external-overlay-hidden');
        }, 300); 
      }

    window.closeExternalOverlay = closeExternalOverlay;

    // close via X, backdrop‑click, Esc
    btnClose.addEventListener('click', closeExternalOverlay);
    modal.addEventListener('click', e => { if (e.target === modal) closeExternalOverlay(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !modal.classList.contains('external-overlay-hidden')) closeExternalOverlay();
    });

    // Show fireworks message for fishing update
    setTimeout(() => {
        showWelcomeFireworks();
    }, 1000);

    function animateOpen(card, section) {
        const cardRect = card.getBoundingClientRect();
        const startX = cardRect.left;
        const startY = cardRect.top;
        const startWidth = cardRect.width;
        const startHeight = cardRect.height;
        const contentInner = section.querySelector('.content-inner');
        contentInner.style.transformOrigin = `${startX}px ${startY}px`;

        // Force a reflow before adding active class
        section.offsetHeight;
        section.classList.add('active');
    }

    function closeSection(section) {
        // Add closing class for animation
        section.classList.add('closing');

        // Wait for animation to complete before hiding
        setTimeout(() => {
            section.classList.remove('active', 'closing');
            history.pushState(null, '', window.location.pathname);
        }, 300);
    }

    // Handle URL hash on page load
    function handleHash() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            const section = document.getElementById(hash);
            if (section) {
                section.classList.add('active');
            }
        }
    }

    // Initialize
    handleHash();

    // Card click handlers
    cards.forEach(card => {
        if (card.classList.contains('section-header')) return;  // skip headers

        card.addEventListener('click', () => {
            const sectionId = card.getAttribute('data-section');
            const overlayFile = overlayMap[sectionId];

            if (overlayFile) {
                openExternalOverlay(overlayFile);           // modal path
            } else {
                // fallback: original in‑page animated section
                const section = document.getElementById(sectionId);
                if (section) {
                    history.pushState(null, '', `#${sectionId}`);
                    animateOpen(card, section);
                }
            }
        });
    });

    // Close handlers
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const section = button.closest('.content-section');
            closeSection(section);
        });
    });

    // Close on background click
    sections.forEach(section => {
        section.addEventListener('click', (e) => {
            if (e.target === section) {
                closeSection(section);
            }
        });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', handleHash);

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection) {
                closeSection(activeSection);
            }
        }
    });

    handleCardEffects()
    handleScrollHintPersistent()
});