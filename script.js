const roles = [
    'M.Tech Computational Linguistics Scholar',
    'Software Engineer',
    'Designer',
    'Mentor'
];

const animatedText = document.querySelector('.animated-text');
let currentIndex = 0;
let isNavigating = false;
let wheelLocked = false;
const enableCrossPageScrollNavigation = false;

const pageOrder = [
    'index.html',
    'about.html',
    'education.html',
    'skills.html',
    'experience.html',
    'projects.html',
    'contact.html'
];

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeText(text) {
    if (!animatedText) {
        return;
    }

    animatedText.textContent = '';
    for (let i = 0; i < text.length; i++) {
        animatedText.textContent += text[i];
        await sleep(80);
    }
}

async function deleteText() {
    if (!animatedText) {
        return;
    }

    const text = animatedText.textContent;
    for (let i = text.length; i > 0; i--) {
        animatedText.textContent = text.substring(0, i - 1);
        await sleep(40);
    }
}

async function rotateText() {
    if (!animatedText) {
        return;
    }

    await typeText(roles[currentIndex]);
    await sleep(2000);
    await deleteText();
    await sleep(300);
    currentIndex = (currentIndex + 1) % roles.length;
    rotateText();
}

function getCurrentPage() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop();
    return fileName || 'index.html';
}

function navigateWithTransition(targetPage) {
    if (isNavigating || !targetPage) {
        return;
    }

    isNavigating = true;
    document.body.classList.add('page-transition-out');
    setTimeout(() => {
        window.location.href = targetPage;
    }, 220);
}

function navigateByOffset(offset) {
    const currentPage = getCurrentPage();
    const currentIndex = pageOrder.indexOf(currentPage);

    if (currentIndex === -1) {
        return;
    }

    const nextIndex = Math.min(
        pageOrder.length - 1,
        Math.max(0, currentIndex + offset)
    );

    if (nextIndex !== currentIndex) {
        navigateWithTransition(pageOrder[nextIndex]);
    }
}

function getScrollableContainer() {
    // Content pages use .about-page as the scroll area; fallback to document scrolling.
    return document.querySelector('.about-page') || document.scrollingElement || document.documentElement;
}

function canScrollInDirection(container, deltaY) {
    const threshold = 2;
    const atTop = container.scrollTop <= threshold;
    const atBottom =
        container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;

    if (deltaY > 0) {
        return !atBottom;
    }

    if (deltaY < 0) {
        return !atTop;
    }

    return false;
}

function enableScrollNavigation() {
    window.addEventListener(
        'wheel',
        (event) => {
            if (wheelLocked || isNavigating || Math.abs(event.deltaY) < 30) {
                return;
            }

            const scrollContainer = getScrollableContainer();

            // If this page can still scroll in the wheel direction, keep scrolling this page.
            if (canScrollInDirection(scrollContainer, event.deltaY)) {
                return;
            }

            wheelLocked = true;
            event.preventDefault();
            navigateByOffset(event.deltaY > 0 ? 1 : -1);

            setTimeout(() => {
                wheelLocked = false;
            }, 650);
        },
        { passive: false }
    );

    let touchStartY = 0;

    window.addEventListener('touchstart', (event) => {
        touchStartY = event.changedTouches[0].clientY;
    });

    window.addEventListener('touchend', (event) => {
        if (isNavigating) {
            return;
        }

        const touchEndY = event.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;

        if (Math.abs(deltaY) < 40) {
            return;
        }

        const scrollContainer = getScrollableContainer();

        // If there's room to continue scrolling this page, do not trigger page navigation.
        if (canScrollInDirection(scrollContainer, deltaY)) {
            return;
        }

        navigateByOffset(deltaY > 0 ? 1 : -1);
    });
}

rotateText();

if (enableCrossPageScrollNavigation) {
    enableScrollNavigation();
}

// ════════════════════════════════════════════
// SINGLE-PAGE SNAP NAVIGATION  (index.html)
// ════════════════════════════════════════════

const snapSectionIds = ['home', 'about', 'education', 'skills', 'experience', 'projects', 'contact'];

const snapNavMap = {
    home:       'nav-home',
    about:      'nav-about',
    education:  'nav-education',
    skills:     'nav-skills',
    experience: 'nav-experience',
    projects:   'nav-projects',
    contact:    'nav-contact'
};

/**
 * Smoothly scroll the snap container to the section with the given id.
 * Works both on the snap-layout (index.html) and any page that uses anchor ids.
 */
function scrollToSection(sectionId) {
    const container = document.getElementById('snap-container');
    const section   = document.getElementById(sectionId);
    if (!section) return;

    if (container) {
        container.scrollTo({ top: section.offsetTop, behavior: 'smooth' });
    } else {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Set the sidebar item with `id` as active and clear all others in the map.
 */
function setActiveNav(sectionId) {
    Object.values(snapNavMap).forEach(function (navId) {
        const el = document.getElementById(navId);
        if (el) el.classList.remove('active');
    });
    const target = document.getElementById(snapNavMap[sectionId]);
    if (target) target.classList.add('active');
}

/**
 * Use IntersectionObserver to keep the sidebar in sync as sections snap in.
 */
function initSectionObserver() {
    const container = document.getElementById('snap-container');
    if (!container) return;

    const sections = snapSectionIds
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);

    var observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    setActiveNav(entry.target.id);
                }
            });
        },
        { root: container, threshold: 0.5 }
    );

    sections.forEach(function (section) { observer.observe(section); });
}

/**
 * Navigate the snap container one section in the given direction (+1 / -1).
 */
function navigateSnapBy(direction) {
    var container = document.getElementById('snap-container');
    if (!container) return;

    var sectionHeight = container.clientHeight;
    var currentIndex  = Math.round(container.scrollTop / sectionHeight);
    var nextIndex     = Math.max(0, Math.min(snapSectionIds.length - 1, currentIndex + direction));

    if (nextIndex !== currentIndex) {
        scrollToSection(snapSectionIds[nextIndex]);
    }
}

/**
 * Keyboard navigation: Arrow Up/Down and Page Up/Down move between sections.
 */
function initKeyboardNavigation() {
    var container = document.getElementById('snap-container');
    if (!container) return;

    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            e.preventDefault();
            navigateSnapBy(1);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            navigateSnapBy(-1);
        }
    });
}

// Boot snap navigation only when the snap-layout page is loaded
if (document.getElementById('snap-container')) {
    initSectionObserver();
    initKeyboardNavigation();
}

function initGmailContactForms() {
    var forms = document.querySelectorAll('.contact-form');
    if (!forms.length) return;

    forms.forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var nameInput = form.querySelector('input[name="name"]');
            var emailInput = form.querySelector('input[name="email"]');
            var messageInput = form.querySelector('textarea[name="message"]');

            var name = nameInput ? nameInput.value.trim() : '';
            var email = emailInput ? emailInput.value.trim() : '';
            var message = messageInput ? messageInput.value.trim() : '';

            if (!name || !email || !message) {
                alert('Please fill in all fields before sending.');
                return;
            }

            var recipient = 'deemaafsal@gmail.com';
            var subject = 'Portfolio Contact from ' + name;
            var body =
                'Name: ' + name + '\n' +
                'Email: ' + email + '\n\n' +
                'Message:\n' + message;

            var gmailUrl =
                'https://mail.google.com/mail/?view=cm&fs=1' +
                '&to=' + encodeURIComponent(recipient) +
                '&su=' + encodeURIComponent(subject) +
                '&body=' + encodeURIComponent(body);

            window.open(gmailUrl, '_blank', 'noopener');
        });
    });
}

initGmailContactForms();
