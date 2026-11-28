window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        if (!dropdown || !button) return;
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

// Stall guard: if the playback clock keeps advancing but no new frames are
// presented (decoder starved after a network hiccup), pause, rewind to the last
// frame actually shown, wait until enough data is buffered, then resume.
function setupVideoStallGuard() {
    const videos = document.querySelectorAll('video');
    if (!videos.length || !('requestVideoFrameCallback' in HTMLVideoElement.prototype)) return;

    const FROZEN_MS = 1500;      // no new frame for this long while time advances
    const RESUME_AHEAD_S = 3;    // seconds buffered ahead before resuming

    const visible = new WeakSet();
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
    });

    function bufferedAhead(v) {
        for (let i = 0; i < v.buffered.length; i++) {
            if (v.buffered.start(i) <= v.currentTime + 0.1 && v.buffered.end(i) >= v.currentTime) {
                return v.buffered.end(i) - v.currentTime;
            }
        }
        return 0;
    }

    videos.forEach(v => {
        io.observe(v);
        const s = { lastWall: performance.now(), lastMedia: 0, ctAtFrame: 0, recovering: false };

        const onFrame = (now, meta) => {
            s.lastWall = performance.now();
            s.lastMedia = meta.mediaTime;
            s.ctAtFrame = v.currentTime;
            v.requestVideoFrameCallback(onFrame);
        };
        v.requestVideoFrameCallback(onFrame);
        v.addEventListener('play', () => { s.lastWall = performance.now(); s.ctAtFrame = v.currentTime; });

        function recover() {
            s.recovering = true;
            v.pause();
            v.currentTime = s.lastMedia;
            const tryResume = () => {
                if (!s.recovering) return cleanup();
                const end = v.duration || Infinity;
                if (v.readyState >= 4 || bufferedAhead(v) >= Math.min(RESUME_AHEAD_S, end - v.currentTime - 0.1)) {
                    cleanup();
                    s.lastWall = performance.now();
                    v.play().catch(() => {});
                }
            };
            const cleanup = () => {
                s.recovering = false;
                v.removeEventListener('progress', tryResume);
                v.removeEventListener('canplaythrough', tryResume);
                v.removeEventListener('seeked', tryResume);
                clearInterval(poll);
            };
            v.addEventListener('progress', tryResume);
            v.addEventListener('canplaythrough', tryResume);
            v.addEventListener('seeked', tryResume);
            const poll = setInterval(tryResume, 500);
        }

        setInterval(() => {
            if (s.recovering || v.paused || v.ended || v.seeking) return;
            if (document.visibilityState !== 'visible' || !visible.has(v)) {
                s.lastWall = performance.now();
                return;
            }
            const timeMoved = Math.abs(v.currentTime - s.ctAtFrame) > 0.5;
            if (timeMoved && performance.now() - s.lastWall > FROZEN_MS) recover();
        }, 500);
    });
}

$(document).ready(function() {
    // Check for click events on the navbar burger icon

    var options = {
		slidesToScroll: 1,
		slidesToShow: 1,
		loop: true,
		infinite: true,
		autoplay: false,
		autoplaySpeed: 5000,
    }

	// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);
	
    bulmaSlider.attach();
    
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();

    // Must run after the carousel is attached so cloned slides are covered too
    setupVideoStallGuard();

})
