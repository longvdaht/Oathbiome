function updateBarWidths() {
  const wrappers = document.querySelectorAll('.chart-wrapper');
  if (wrappers.length === 0) return;

  wrappers.forEach(wrapper => {
    const chartLine = wrapper.querySelector('.chart-y-line');
    const bars = wrapper.querySelectorAll('.bar-fill');

    if (chartLine && bars.length > 0) {
      const width = chartLine.offsetWidth + 'px';
      bars.forEach(bar => {
        bar.style.setProperty('--chart-line-width', width);
      });
    }
  });
}

function handleToggleClick(event) {
  event.currentTarget.classList.toggle('show-hover');
}

// Hover cho desktop
function handleMouseEnter(event) {
  event.currentTarget.classList.add('show-hover');
}

function handleMouseLeave(event) {
  event.currentTarget.classList.remove('show-hover');
}

function setupToggleOnMobile() {
  const items = document.querySelectorAll('.chart-stat__item:has(.chart-stat__hover)');
  if (items.length === 0) return;

  if (window.innerWidth < 990) {
    items.forEach(item => {
      if (!item.classList.contains('js-click-enabled')) {
        item.addEventListener('click', handleToggleClick);
        item.classList.add('js-click-enabled');
      }
    });
  } else {
    items.forEach(item => {
      item.removeEventListener('click', handleToggleClick);
      item.classList.remove('show-hover');
      item.classList.remove('js-click-enabled');
    });
  }
}

function setupToggleOnDesktop() {
  const items = document.querySelectorAll('.chart-stat__item:has(.chart-stat__hover)');
  if (items.length === 0) return;

  if (window.innerWidth >= 990) {
    items.forEach(item => {
      if (!item.classList.contains('js-hover-enabled')) {
        item.addEventListener('mouseenter', handleMouseEnter);
        item.addEventListener('mouseleave', handleMouseLeave);
        item.classList.add('js-hover-enabled');
      }
    });
  } else {
    items.forEach(item => {
      item.removeEventListener('mouseenter', handleMouseEnter);
      item.removeEventListener('mouseleave', handleMouseLeave);
      item.classList.remove('show-hover');
      item.classList.remove('js-hover-enabled');
    });
  }
}

function adjustBarValuePadding() {
  const items = document.querySelectorAll('.chart-stat__item');
  if (items.length === 0) return;
  items.forEach(item => {
    const barFills = item.querySelectorAll('.bar-fill');
    if (barFills.length === 0) return;
    barFills.forEach(barFill => {
      window.observeAnimation(barFill, 'animate', 0.6);
      const barValue = barFill.querySelector('.bar-value');
      if (!barValue) return;

      const fillHeight = barFill.offsetHeight;
      const valueHeight = barValue.offsetHeight;

      if (valueHeight * 2 < fillHeight) {
        const padding = window.innerWidth > 990 ? '15px' : '10px';
        barValue.style.paddingTop = padding;
      } else {
        barValue.style.paddingTop = '';
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateBarWidths();
  setupToggleOnMobile();
  setupToggleOnDesktop();
  adjustBarValuePadding();
});

window.addEventListener('resize', window.debounce(() => {
  updateBarWidths();
  setupToggleOnMobile();
  setupToggleOnDesktop();
  adjustBarValuePadding();
}, 150));
