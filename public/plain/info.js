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

    const mainGif = document.querySelector('.actual-img');
    const placeholder = document.querySelector('.placeholder-img');

    // When the GIF finishes loading, fade it in
    mainGif.addEventListener('load', () => {
        mainGif.style.opacity = '1';
        placeholder.style.opacity = '0';
    });

    // In case the GIF is already cached and loads before we attach the listener
    if (mainGif.complete) {
        mainGif.style.opacity = '1';
        placeholder.style.opacity = '0';
    }
});