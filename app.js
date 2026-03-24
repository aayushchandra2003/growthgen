document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Hide nav on scroll down, show on scroll up
    const nav = document.querySelector('nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        if (currentScroll <= 0) {
            nav.classList.remove('nav-hidden');
            return;
        }

        if (currentScroll > lastScroll && !nav.classList.contains('nav-hidden')) {
            // Scroll down
            nav.classList.add('nav-hidden');
        } else if (currentScroll < lastScroll && nav.classList.contains('nav-hidden')) {
            // Scroll up
            nav.classList.remove('nav-hidden');
        }
        lastScroll = currentScroll;
    });

    // Select all elements with the 'scroll-anim' class inside 'stagger-group'
    const staggerGroups = document.querySelectorAll('.stagger-group');

    // Create an Intersection Observer
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // Once the group enters the viewport, add the 'in-view' class
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                // Optional: Stop observing after the animation triggers
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null, // Viewport is the root
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before it hits the true bottom
    });

    // Observe all stagger groups
    staggerGroups.forEach(group => {
        observer.observe(group);
    });

    // Dynamic Headline Typewriter Swap
    const words = ["Growth", "Marketing", "Content", "Brand", "Revenue"];
    let wordIndex = 0;
    let charIndex = words[wordIndex].length;
    let isDeleting = false;
    const dynamicWordEl = document.getElementById('dynamic-word');
    
    if (dynamicWordEl) {
        // Initial setup to prevent first word pop-in
        dynamicWordEl.innerText = words[wordIndex];

        function typeEffect() {
            const currentWord = words[wordIndex];
            
            if (isDeleting) {
                // Remove char
                dynamicWordEl.innerText = currentWord.substring(0, charIndex - 1);
                charIndex--;
            } else {
                // Add char
                dynamicWordEl.innerText = currentWord.substring(0, charIndex + 1);
                charIndex++;
            }

            // Variable speed for realistic typing
            let typeSpeed = isDeleting ? 50 : 100;

            if (!isDeleting && charIndex === currentWord.length) {
                // Pauses at end of word (1 second as requested)
                typeSpeed = 1000; 
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                // Switch to next word
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 300; // Pause briefly before typing new word
            }

            setTimeout(typeEffect, typeSpeed);
        }

        // Start typing loop after initial 1 sec pause
        setTimeout(() => {
            isDeleting = true;
            typeEffect();
        }, 1000);
    }
});
