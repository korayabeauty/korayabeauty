class FacetFiltersForm extends HTMLElement {
    constructor() {
        super();
        this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

        this.debouncedOnSubmit = debounce((event) => {
            this.onSubmitHandler(event);
        }, 800);

        const facetForm = this.querySelector('form');
        facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));

        const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
        if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
    }

    static setListeners() {
        const onHistoryChange = (event) => {
            const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
            if (searchParams === FacetFiltersForm.searchParamsPrev) return;
            FacetFiltersForm.renderPage(searchParams, null, false);
        };
        window.addEventListener('popstate', onHistoryChange);
    }

    static toggleActiveFacets(disable = true) {
        document.querySelectorAll('.js-facet-remove').forEach((element) => {
            element.classList.toggle('disabled', disable);
        });
    }

    static renderPage(searchParams, event, updateURLHash = true) {
        FacetFiltersForm.searchParamsPrev = searchParams;
        const sections = FacetFiltersForm.getSections();
        const countContainer = document.getElementById('ProductCount');
        const countContainerDesktop = document.getElementById('ProductCountDesktop');
        const loadingSpinners = document.querySelectorAll(
            '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
        );
        loadingSpinners.forEach((spinner) => spinner.classList.remove('hidden'));
        document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
        if (countContainer) {
            countContainer.classList.add('loading');
        }
        if (countContainerDesktop) {
            countContainerDesktop.classList.add('loading');
        }

        sections.forEach((section) => {
            const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
            const filterDataUrl = (element) => element.url === url;

            FacetFiltersForm.filterData.some(filterDataUrl)
                ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
                : FacetFiltersForm.renderSectionFromFetch(url, event);
        });

        if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
    }

    static renderSectionFromFetch(url, event) {
        fetch(url)
            .then((response) => response.text())
            .then((responseText) => {
                const html = responseText;
                FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
                FacetFiltersForm.renderFilters(html, event);
                FacetFiltersForm.renderProductGridContainer(html);
                FacetFiltersForm.renderProductCount(html);
                if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
            });
    }

    static renderSectionFromCache(filterDataUrl, event) {
        const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
    }

    static renderProductGridContainer(html) {
        const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
        const newContainer = parsedHTML.getElementById('ProductGridContainer');
        const oldContainer = document.getElementById('ProductGridContainer');
        if (newContainer && oldContainer) {
            oldContainer.innerHTML = newContainer.innerHTML;
        }
    }

    // 🔥 WISHLIST FIX (REAL ONE)
    // setTimeout(() => {
    //   console.log("Rebinding iWish after filter");

    //   document.querySelectorAll('.iWishAddColl').forEach(el => {

    //     // remove old state
    //     el.classList.remove('iwishAdded');

    //     // force re-trigger
    //     el.classList.remove('iwishcheck');
    //     void el.offsetWidth; // reflow trick
    //     el.classList.add('iwishcheck');

    //     // ensure visible
    //     el.style.display = 'block';

    //   });

    // }, 300);

    static renderProductCount(html) {
        const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
        const countEl = parsedHTML.getElementById('ProductCount');
        const container = document.getElementById('ProductCount');
        const containerDesktop = document.getElementById('ProductCountDesktop');
        if (countEl && container) {
            container.innerHTML = countEl.innerHTML;
            container.classList.remove('loading');
        }
        if (countEl && containerDesktop) {
            containerDesktop.innerHTML = countEl.innerHTML;
            containerDesktop.classList.remove('loading');
        } else if (containerDesktop) {
            // Fallback: try ProductCountDesktop from parsed HTML
            const countDesktopEl = parsedHTML.getElementById('ProductCountDesktop');
            if (countDesktopEl) {
                containerDesktop.innerHTML = countDesktopEl.innerHTML;
                containerDesktop.classList.remove('loading');
            }
        }
        const loadingSpinners = document.querySelectorAll(
            '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
        );
        loadingSpinners.forEach((spinner) => spinner.classList.add('hidden'));
    }

    static renderFilters(html, event) {
        const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
        const facetDetailsElementsFromFetch = parsedHTML.querySelectorAll(
            '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
        );
        const facetDetailsElementsFromDom = document.querySelectorAll(
            '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
        );

        // Remove facets that are no longer returned from the server
        Array.from(facetDetailsElementsFromDom).forEach((currentElement) => {
            if (!Array.from(facetDetailsElementsFromFetch).some(({ id }) => currentElement.id === id)) {
                currentElement.remove();
            }
        });

        const matchesId = (element) => {
            const jsFilter = event ? event.target.closest('.js-filter') : undefined;
            return jsFilter ? element.id === jsFilter.id : false;
        };

        const facetsToRender = Array.from(facetDetailsElementsFromFetch).filter((element) => !matchesId(element));
        const countsToRender = Array.from(facetDetailsElementsFromFetch).find(matchesId);

        facetsToRender.forEach((elementToRender, index) => {
            const currentElement = document.getElementById(elementToRender.id);
            // Element already rendered in the DOM so just update the innerHTML
            if (currentElement) {
                document.getElementById(elementToRender.id).innerHTML = elementToRender.innerHTML;
            } else {
                if (index > 0) {
                    const { className: previousElementClassName, id: previousElementId } = facetsToRender[index - 1];
                    // Same facet type (eg horizontal/vertical or drawer/mobile)
                    if (elementToRender.className === previousElementClassName) {
                        document.getElementById(previousElementId).after(elementToRender);
                        return;
                    }
                }

                if (elementToRender.parentElement) {
                    document.querySelector(`#${elementToRender.parentElement.id} .js-filter`).before(elementToRender);
                }
            }
        });

        FacetFiltersForm.renderActiveFacets(parsedHTML);
        FacetFiltersForm.renderAdditionalElements(parsedHTML);

        if (countsToRender) {
            const closestJSFilterID = event.target.closest('.js-filter').id;

            if (closestJSFilterID) {
                FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
                FacetFiltersForm.renderMobileCounts(countsToRender, document.getElementById(closestJSFilterID));

                const newFacetDetailsElement = document.getElementById(closestJSFilterID);
                const newElementSelector = newFacetDetailsElement.classList.contains('mobile-facets__details')
                    ? `.mobile-facets__close-button`
                    : `.facets__summary`;
                const newElementToActivate = newFacetDetailsElement.querySelector(newElementSelector);

                const isTextInput = event.target.getAttribute('type') === 'text';

                if (newElementToActivate && !isTextInput) newElementToActivate.focus();
            }
        }
    }

    static renderActiveFacets(html) {
        const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

        activeFacetElementSelectors.forEach((selector) => {
            const activeFacetsElement = html.querySelector(selector);
            if (!activeFacetsElement) return;
            document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
        });

        FacetFiltersForm.toggleActiveFacets(false);
    }

    static renderAdditionalElements(html) {
        const parsedHTML = typeof html === 'string' ? new DOMParser().parseFromString(html, 'text/html') : html;
        const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

        mobileElementSelectors.forEach((selector) => {
            const sourceEl = parsedHTML.querySelector(selector);
            const targetEl = document.querySelector(selector);
            if (!sourceEl || !targetEl) return;
            targetEl.innerHTML = sourceEl.innerHTML;
        });

        const mobileForm = document.getElementById('FacetFiltersFormMobile');
        if (mobileForm) {
            const menuDrawer = mobileForm.closest('menu-drawer');
            if (menuDrawer && typeof menuDrawer.bindEvents === 'function') {
                menuDrawer.bindEvents();
            }
        }
    }

    static renderCounts(source, target) {
        const targetSummary = target.querySelector('.facets__summary');
        const sourceSummary = source.querySelector('.facets__summary');

        if (sourceSummary && targetSummary) {
            targetSummary.outerHTML = sourceSummary.outerHTML;
        }

        const targetHeaderElement = target.querySelector('.facets__header');
        const sourceHeaderElement = source.querySelector('.facets__header');

        if (sourceHeaderElement && targetHeaderElement) {
            targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
        }

        const targetWrapElement = target.querySelector('.facets-wrap');
        const sourceWrapElement = source.querySelector('.facets-wrap');

        if (sourceWrapElement && targetWrapElement) {
            const isShowingMore = Boolean(target.querySelector('show-more-button .label-show-more.hidden'));
            if (isShowingMore) {
                sourceWrapElement
                    .querySelectorAll('.facets__item.hidden')
                    .forEach((hiddenItem) => hiddenItem.classList.replace('hidden', 'show-more-item'));
            }

            targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
        }
    }

    static renderMobileCounts(source, target) {
        const targetFacetsList = target.querySelector('.mobile-facets__list');
        const sourceFacetsList = source.querySelector('.mobile-facets__list');

        if (sourceFacetsList && targetFacetsList) {
            targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
        }
    }

    static updateURLHash(searchParams) {
        history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
    }

    static getSections() {
        return [
            {
                section: document.getElementById('product-grid').dataset.id,
            },
        ];
    }

    createSearchParams(form) {
        const formData = new FormData(form);
        return new URLSearchParams(formData).toString();
    }

    onSubmitForm(searchParams, event) {
        FacetFiltersForm.renderPage(searchParams, event);
    }

    onSubmitHandler(event) {
        event.preventDefault();
        const sortFilterForms = document.querySelectorAll('facet-filters-form form');
        if (event.srcElement.className == 'mobile-facets__checkbox') {
            const searchParams = this.createSearchParams(event.target.closest('form'));
            this.onSubmitForm(searchParams, event);
        } else {
            const forms = [];
            const isMobile = event.target.closest('form').id === 'FacetFiltersFormMobile';

            sortFilterForms.forEach((form) => {
                if (!isMobile) {
                    if (form.id === 'FacetSortForm' || form.id === 'FacetFiltersForm' || form.id === 'FacetSortDrawerForm') {
                        forms.push(this.createSearchParams(form));
                    }
                } else if (form.id === 'FacetFiltersFormMobile') {
                    forms.push(this.createSearchParams(form));
                }
            });
            this.onSubmitForm(forms.join('&'), event);
        }
    }

    onActiveFilterClick(event) {
        event.preventDefault();
        FacetFiltersForm.toggleActiveFacets();
        const url =
            event.currentTarget.href.indexOf('?') == -1
                ? ''
                : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
        FacetFiltersForm.renderPage(url);
    }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
    constructor() {
        super();
        this.querySelectorAll('input').forEach((element) => {
            element.addEventListener('change', this.onRangeChange.bind(this));
            element.addEventListener('keydown', this.onKeyDown.bind(this));
        });
        this.setMinAndMaxValues();
    }

    onRangeChange(event) {
        this.adjustToValidValues(event.currentTarget);
        this.setMinAndMaxValues();
    }

    onKeyDown(event) {
        if (event.metaKey) return;

        const pattern = /[0-9]|\.|,|'| |Tab|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Escape/;
        if (!event.key.match(pattern)) event.preventDefault();
    }

    setMinAndMaxValues() {
        const inputs = this.querySelectorAll('input');
        const minInput = inputs[0];
        const maxInput = inputs[1];
        if (maxInput.value) minInput.setAttribute('data-max', maxInput.value);
        if (minInput.value) maxInput.setAttribute('data-min', minInput.value);
        if (minInput.value === '') maxInput.setAttribute('data-min', 0);
        if (maxInput.value === '') minInput.setAttribute('data-max', maxInput.getAttribute('data-max'));
    }

    adjustToValidValues(input) {
        const value = Number(input.value);
        const min = Number(input.getAttribute('data-min'));
        const max = Number(input.getAttribute('data-max'));

        if (value < min) input.value = min;
        if (value > max) input.value = max;
    }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
    constructor() {
        super();
        const facetLink = this.querySelector('a');
        facetLink.setAttribute('role', 'button');
        facetLink.addEventListener('click', this.closeFilter.bind(this));
        facetLink.addEventListener('keyup', (event) => {
            event.preventDefault();
            if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
        });
    }

    closeFilter(event) {
        event.preventDefault();
        const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
        form.onActiveFilterClick(event);
    }
}

customElements.define('facet-remove', FacetRemove);



// ── Hide facet counts (17), (62) etc ──
function krHideFacetCounts() {
  document.querySelectorAll(
    '#FacetFiltersForm .facets__count, ' +
    '#FacetFiltersFormMobile .facets__count, ' +
    '#main-collection-filters .facets__count'
  ).forEach(el => el.style.display = 'none');
}

// Run on load
document.addEventListener('DOMContentLoaded', krHideFacetCounts);

// Re-run after every filter AJAX re-render
const _origRenderFilters = FacetFiltersForm.renderFilters.bind(FacetFiltersForm);
FacetFiltersForm.renderFilters = function(html, event) {
  _origRenderFilters(html, event);
  setTimeout(krHideFacetCounts, 50);
};

const _origRenderProductGridContainer = FacetFiltersForm.renderProductGridContainer.bind(FacetFiltersForm);
FacetFiltersForm.renderProductGridContainer = function(html) {
  _origRenderProductGridContainer(html);
  setTimeout(krHideFacetCounts, 50);
};

// ── Hide "The highest price is ₹ X" text ──
function krHidePriceHeader() {
  document.querySelectorAll(
    '#FacetFiltersForm details p, ' +
    '#main-collection-filters details p'
  ).forEach(el => el.style.display = 'none');
}

document.addEventListener('DOMContentLoaded', krHidePriceHeader);

const _origRenderFilters2 = FacetFiltersForm.renderFilters.bind(FacetFiltersForm);
FacetFiltersForm.renderFilters = function(html, event) {
  _origRenderFilters2(html, event);
  setTimeout(krHidePriceHeader, 50);
  setTimeout(krHideFacetCounts, 50);
};

// ── Persistent MutationObserver as final safety net ──
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver(() => {
    krHideFacetCounts();
    krHidePriceHeader();
  });
  const targets = [
    document.getElementById('main-collection-filters'),
    document.getElementById('FacetFiltersForm'),
  ].filter(Boolean);
  targets.forEach(el => observer.observe(el, { childList: true, subtree: true }));
  krHideFacetCounts();
  krHidePriceHeader();
});
