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

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    const sections = document.querySelectorAll('.content-section');
    const closeButtons = document.querySelectorAll('.close-button');

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
        if (!card.classList.contains('section-header')) {
            card.addEventListener('click', () => {
                const sectionId = card.getAttribute('data-section');
                const section = document.getElementById(sectionId);
                if (section) {
                    history.pushState(null, '', `#${sectionId}`);
                    animateOpen(card, section);
                }
            });
        }
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
});