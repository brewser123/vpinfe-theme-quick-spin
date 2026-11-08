/**
 * DOM Builder
 * Constructs the main table view DOM structure
 */

function ensureTableView(container) {
    if (tableView && tableView.container === container) return tableView;

    container.innerHTML = '';

    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No tables found';
    emptyState.style.display = 'none';

    const shell = document.createElement('div');
    shell.className = 'table-shell';

    // Full-screen hero media (background)
    const heroMedia = document.createElement('div');
    heroMedia.className = 'hero-media';

    // Bottom overlay with two distinct rows
    const bottomOverlay = document.createElement('div');
    bottomOverlay.className = 'bottom-overlay';

    // Row 1: Full-width carousel (fixed height)
    const carouselRow = document.createElement('div');
    carouselRow.className = 'carousel-row';

    const carousel = document.createElement('div');
    carousel.className = 'wheel-carousel';
    const selectionHalo = document.createElement('div');
    selectionHalo.className = 'wheel-selection-halo';
    const wheelTrack = createWheelTrack();
    carousel.appendChild(selectionHalo);
    carousel.appendChild(wheelTrack);
    carouselRow.appendChild(carousel);

    // Row 2: Info in 3 centered rows
    const infoRow = document.createElement('div');
    infoRow.className = 'info-row';
    infoRow.innerHTML = `
        <div class="info-line info-line-title">
            <span class="table-title"></span>
        </div>
        <div class="info-line info-line-meta">
            <span class="manufacturer"></span>
            <span class="info-separator manufacturer-separator">•</span>
            <span class="year"></span>
        </div>
    `;

    bottomOverlay.appendChild(carouselRow);
    bottomOverlay.appendChild(infoRow);

    const sortButton = document.createElement('button');
    sortButton.id = 'sortModeButton';
    sortButton.type = 'button';
    sortButton.textContent = 'Most played (S)';
    sortButton.addEventListener('click', toggleSortMode);
    infoRow.appendChild(sortButton);

    shell.appendChild(heroMedia);
    shell.appendChild(bottomOverlay);
    container.appendChild(emptyState);
    container.appendChild(shell);

    tableView = {
        container,
        emptyState,
        shell,
        wheelCarousel: carousel,
        wheelTrack,
        heroMedia,
        title: infoRow.querySelector('.table-title'),
        manufacturer: infoRow.querySelector('.manufacturer'),
        manufacturerSeparator: infoRow.querySelector('.manufacturer-separator'),
        year: infoRow.querySelector('.year'),
    };
    return tableView;
}
