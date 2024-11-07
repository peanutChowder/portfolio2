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
        
        section.classList.add('active');
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
        card.addEventListener('click', () => {
            const sectionId = card.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            
            if (section) {
                history.pushState(null, '', `#${sectionId}`);
                animateOpen(card, section);
            }
        });
    });

    // Close handlers and other event listeners remain the same
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const section = button.closest('.content-section');
            section.classList.remove('active');
            history.pushState(null, '', window.location.pathname);
        });
    });

    sections.forEach(section => {
        section.addEventListener('click', (e) => {
            if (e.target === section) {
                section.classList.remove('active');
                history.pushState(null, '', window.location.pathname);
            }
        });
    });

    window.addEventListener('popstate', handleHash);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection) {
                activeSection.classList.remove('active');
                history.pushState(null, '', window.location.pathname);
            }
        }
    });
});