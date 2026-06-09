<script>

     // Get all FAQ questions
        const faqQuestions = document.querySelectorAll('.faq-question');

        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;

                // Toggle active class on question
                question.classList.toggle('active');

                // Toggle active class on answer
                answer.classList.toggle('active');

                // Close other open FAQs (optional - remove if you want multiple open at once)
                faqQuestions.forEach(otherQuestion => {
                    if (otherQuestion !== question) {
                        otherQuestion.classList.remove('active');
                        otherQuestion.nextElementSibling.classList.remove('active');
                    }
                });
            });
        });
                // Showcase carousel
  // Build products array from Liquid
const showcaseProducts = [
  {% assign koraya_collection = collections['koraya-picks'] %}
  {% for product in koraya_collection.products limit: 1000 %}
    {
      category: {{ product.vendor | upcase | json }},
      name: {{ product.title | json }},
      price: {{ product.price | money | json }},
      url: {{ product.url | json }},
      id: {{ product.id }},
      variantId: {{ product.selected_or_first_available_variant.id }}
    }{% unless forloop.last %},{% endunless %}
  {% endfor %}
];

let currentShowcaseIndex = Math.min(2, showcaseProducts.length - 1);
const showcaseSlides = document.querySelectorAll('.showcase-product');
const productInfo = document.getElementById('productInfo');

function updateShowcaseCarousel() {
  const totalSlides = showcaseSlides.length;
  if (totalSlides === 0) return;

  showcaseSlides.forEach((slide, index) => {
    slide.className = 'showcase-product';

    let diff = index - currentShowcaseIndex;
    const total = totalSlides;

    // Normalize diff for wrapping
    if (diff > total / 2) {
      diff -= total;
    } else if (diff < -total / 2) {
      diff += total;
    }

    if (index === currentShowcaseIndex) {
      slide.classList.add('active');
    } else {
      slide.classList.add('side');
      if (diff === -2 || diff === total - 2) slide.classList.add('prev-2');
      else if (diff === -1 || diff === total - 1) slide.classList.add('prev-1');
      else if (diff === 1 || diff === 1 - total) slide.classList.add('next-1');
      else if (diff === 2 || diff === 2 - total) slide.classList.add('next-2');
    }
  });

  const currentProduct = showcaseProducts[currentShowcaseIndex];
  productInfo.innerHTML = `
    <div class="product-meta-info">
      <div class="product-category">${currentProduct.category}</div>
      <div class="product-title">${currentProduct.name}</div>
      <div class="product-price">${currentProduct.price}</div>
    </div>
    <button class="buy-now-btn" onclick="addToCart(${currentProduct.variantId})">Buy Now</button>
  `;
}

// Buttons
document.getElementById('prevBtn').addEventListener('click', () => {
  currentShowcaseIndex = (currentShowcaseIndex - 1 + showcaseSlides.length) % showcaseSlides.length;
  updateShowcaseCarousel();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentShowcaseIndex = (currentShowcaseIndex + 1) % showcaseSlides.length;
  updateShowcaseCarousel();
});

// Click slides
showcaseSlides.forEach((slide, index) => {
  slide.addEventListener('click', () => {
    currentShowcaseIndex = index;
    updateShowcaseCarousel();
  });
});

// ---------- Touch swipe support (iOS + Android) ----------
const showcaseContainer = document.querySelector('.showcase-products'); 
// Ensure your HTML wrapper has class="showcase-container"

let showcaseTouchStartX = 0;
let showcaseTouchStartY = 0;
let showcaseTouchEndX = 0;
let showcaseTouchEndY = 0;
let showcaseIsSwiping = false;
const showcaseSwipeThreshold = 40; // px

if (showcaseContainer) {
  showcaseContainer.addEventListener('touchstart', function (e) {
    const touch = e.touches[0];
    showcaseTouchStartX = touch.clientX;
    showcaseTouchStartY = touch.clientY;
    showcaseIsSwiping = false;
  }, { passive: true });

  showcaseContainer.addEventListener('touchmove', function (e) {
    const touch = e.touches[0];
    showcaseTouchEndX = touch.clientX;
    showcaseTouchEndY = touch.clientY;

    const diffX = showcaseTouchEndX - showcaseTouchStartX;
    const diffY = showcaseTouchEndY - showcaseTouchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      showcaseIsSwiping = true;
      e.preventDefault(); // stop vertical scroll during horizontal swipe
    }
  }, { passive: false });

  showcaseContainer.addEventListener('touchend', function () {
    if (!showcaseIsSwiping) return;

    const diffX = showcaseTouchEndX - showcaseTouchStartX;

    if (Math.abs(diffX) > showcaseSwipeThreshold) {
      // swipe left → next
      if (diffX < 0) {
        currentShowcaseIndex = (currentShowcaseIndex + 1) % showcaseSlides.length;
        updateShowcaseCarousel();
      }
      // swipe right → prev
      else if (diffX > 0) {
        currentShowcaseIndex = (currentShowcaseIndex - 1 + showcaseSlides.length) % showcaseSlides.length;
        updateShowcaseCarousel();
      }
    }

    showcaseTouchStartX = showcaseTouchStartY = showcaseTouchEndX = showcaseTouchEndY = 0;
    showcaseIsSwiping = false;
  });
}

// ---------- Auto-scroll every 10 seconds ----------
setInterval(() => {
  if (showcaseSlides.length === 0) return;
  currentShowcaseIndex = (currentShowcaseIndex + 1) % showcaseSlides.length;
  updateShowcaseCarousel();
}, 10000); // 10000 ms = 10 seconds

// Initialize showcase carousel
updateShowcaseCarousel();


        // Shop by Kits Carousel
const kitsTrack = document.getElementById('kitsTrack');
const kitsPrevBtn = document.getElementById('kitsPrevBtn');
const kitsNextBtn = document.getElementById('kitsNextBtn');
const kitCards = document.querySelectorAll('.kit-card');

let kitsCurrentIndex = 0;
let kitsPerView = 5; // default (desktop)
let maxKitsIndex = 0;

// Decide how many cards per view based on screen width
function calcKitsPerView() {
  if (window.innerWidth <= 767) {
    // Mobile
    kitsPerView = 2; // or 2 if your cards are wider
  } else if (window.innerWidth <= 1024) {
    // Tablet
    kitsPerView = 4;
  } else {
    // Desktop
    kitsPerView = 5;
  }

  maxKitsIndex = Math.max(0, kitCards.length - kitsPerView);

  if (kitsCurrentIndex > maxKitsIndex) {
    kitsCurrentIndex = maxKitsIndex;
  }
}

function updateKitsCarousel() {
  if (!kitCards.length) return;

  // Ensure per-view and max index are up to date
  calcKitsPerView();

  const cardWidth = kitCards[0].offsetWidth + 20; // card width + gap
  const translateX = -kitsCurrentIndex * cardWidth;
  kitsTrack.style.transform = `translateX(${translateX}px)`;

  // Update button states
  kitsPrevBtn.classList.toggle('disabled', kitsCurrentIndex === 0);
  kitsNextBtn.classList.toggle('disabled', kitsCurrentIndex >= maxKitsIndex);
}

kitsPrevBtn.addEventListener('click', () => {
  if (kitsCurrentIndex > 0) {
    kitsCurrentIndex--;
    updateKitsCarousel();
  }
});

kitsNextBtn.addEventListener('click', () => {
  if (kitsCurrentIndex < maxKitsIndex) {
    kitsCurrentIndex++;
    updateKitsCarousel();
  }
});

// Touch swipe support (iOS + Android)
let kitsTouchStartX = 0;
let kitsTouchStartY = 0;
let kitsTouchEndX = 0;
let kitsTouchEndY = 0;
let kitsIsSwiping = false;
const kitsSwipeThreshold = 40; // px

if (kitsTrack) {
  kitsTrack.addEventListener('touchstart', function (e) {
    const touch = e.touches[0];
    kitsTouchStartX = touch.clientX;
    kitsTouchStartY = touch.clientY;
    kitsIsSwiping = false;
  }, { passive: true });

  kitsTrack.addEventListener('touchmove', function (e) {
    const touch = e.touches[0];
    kitsTouchEndX = touch.clientX;
    kitsTouchEndY = touch.clientY;

    const diffX = kitsTouchEndX - kitsTouchStartX;
    const diffY = kitsTouchEndY - kitsTouchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      kitsIsSwiping = true;
      e.preventDefault();
    }
  }, { passive: false });

  kitsTrack.addEventListener('touchend', function () {
    if (!kitsIsSwiping) return;

    const diffX = kitsTouchEndX - kitsTouchStartX;

    if (Math.abs(diffX) > kitsSwipeThreshold) {
      if (diffX < 0 && kitsCurrentIndex < maxKitsIndex) {
        // swipe left → next
        kitsCurrentIndex++;
        updateKitsCarousel();
      } else if (diffX > 0 && kitsCurrentIndex > 0) {
        // swipe right → prev
        kitsCurrentIndex--;
        updateKitsCarousel();
      }
    }

    kitsTouchStartX = kitsTouchStartY = kitsTouchEndX = kitsTouchEndY = 0;
    kitsIsSwiping = false;
  });
}

// Recalculate on resize to keep desktop/mobile in sync
window.addEventListener('resize', () => {
  updateKitsCarousel();
});

// Initialize kits carousel
calcKitsPerView();
updateKitsCarousel();


        // Advanced banner slider with 3 visible slides
        let currentSlide = 1;
        const allSlides = document.querySelectorAll('.banner-slide');
        const dots = document.querySelectorAll('.slider-dot');

        function updateSlides(index) {
         // Remove all classes and hide all slides
            allSlides.forEach(slide => {
                slide.classList.remove('active', 'side', 'left', 'right');
                slide.style.display = 'none';
            });
            dots.forEach(dot => dot.classList.remove('active'));

            // Calculate indices
            const prevIndex = (index - 1 + 3) % 3;
            const nextIndex = (index + 1) % 3;

             // Update slide positions and show only the 3 slides
            allSlides[prevIndex].className = 'banner-slide side left';
            allSlides[prevIndex].style.display = '';
            allSlides[index].className = 'banner-slide active';
            allSlides[index].style.display = '';
            allSlides[nextIndex].className = 'banner-slide side right';
            allSlides[nextIndex].style.display = '';

            // Reorder slides in DOM
            const container = document.querySelector('.banner-slides');
            container.innerHTML = '';
            container.appendChild(allSlides[prevIndex]);
            container.appendChild(allSlides[index]);
            container.appendChild(allSlides[nextIndex]);

            // Update dots
            dots[index].classList.add('active');

            currentSlide = index;
        }
        
        // Click handlers for slides
        allSlides.forEach((slide, index) => {
            slide.addEventListener('click', () => {
                const slideIndex = parseInt(slide.dataset.slide);
                updateSlides(slideIndex);
            });
        });
        
        // Click handlers for dots
        dots.forEach((dot) => {
            dot.addEventListener('click', () => {
                const slideIndex = parseInt(dot.dataset.slide);
                updateSlides(slideIndex);
            });
        });
        
        // Auto-slide
        setInterval(() => {
            const nextIndex = (currentSlide + 1) % 3;
            updateSlides(nextIndex);
        }, 10000000);

        // --- Touch swipe support (iOS + Android) ---

const sliderContainer = document.querySelector('.banner-slides');

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isSwiping = false;

// Adjust to control swipe sensitivity (in pixels)
const swipeThreshold = 50;

if (sliderContainer) {
  sliderContainer.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isSwiping = false;
  }, { passive: true });

  sliderContainer.addEventListener('touchmove', function(e) {
    const touch = e.touches[0];
    touchEndX = touch.clientX;
    touchEndY = touch.clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // If horizontal movement is greater than vertical, treat as swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      isSwiping = true;
      // Prevent vertical scroll when swiping horizontally
      e.preventDefault();
    }
  }, { passive: false });

  sliderContainer.addEventListener('touchend', function() {
    if (!isSwiping) return;

    const diffX = touchEndX - touchStartX;

    if (Math.abs(diffX) > swipeThreshold) {
      // Swipe left → next slide
      if (diffX < 0) {
        const nextIndex = (currentSlide + 1) % 3; // if you keep 6 slides
        updateSlides(nextIndex);
      }
      // Swipe right → previous slide
      else {
        const prevIndex = (currentSlide - 1 + 3) % 3;
        updateSlides(prevIndex);
      }
    }

    // reset
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
    isSwiping = false;
  });
}

        // Add to Cart function for Buy Now button
        function addToCart(variantId) {
    fetch('/cart/add.js', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            items: [{
                id: variantId,
                quantity: 1
            }]
        })
    })
    .then(response => response.json())
    .then(data => {
        // Open ShipRocket cart drawer
        var cartBtn = document.querySelector('.header__icon--cart');
        if (cartBtn) cartBtn.click();
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Error adding product to cart. Please try again.');
    });
}

        // Alternative function to redirect to product page instead of add to cart
        function goToProduct(productUrl) {
            window.location.href = productUrl;
        }

                 // Category Carousel (Mobile Only)
        function initCategoryCarousel() {
            const categoryCarousel = document.querySelector('.category-carousel');
            const categoryCards = categoryCarousel.querySelectorAll('.category-card');
            const dotsContainer = document.querySelector('.category-carousel-dots');

            if (!categoryCarousel || !dotsContainer || categoryCards.length === 0) return;

            // Create dots
            dotsContainer.innerHTML = '';
            categoryCards.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.classList.add('dot');
                if (index === 0) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    categoryCards[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                });
                dotsContainer.appendChild(dot);
            });

            const dots = dotsContainer.querySelectorAll('.dot');

            // Update dots on scroll
            categoryCarousel.addEventListener('scroll', () => {
                const scrollLeft = categoryCarousel.scrollLeft;
                const cardWidth = categoryCards[0].offsetWidth + 15; // card width + gap
                const activeIndex = Math.round(scrollLeft / cardWidth);

                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === activeIndex);
                });
            });
        }

        // Initialize on mobile only
        if (window.innerWidth <= 480) {
            initCategoryCarousel();
        }

        // Reinitialize on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 480) {
                initCategoryCarousel();
            }
        });
        updateSlides(1);
        </script>
