document.addEventListener('DOMContentLoaded', function() {
  const loadMoreBtn = document.querySelector('.load-more-btn');
  const container = document.querySelector('.blog-listing');
  const section = container.closest('section');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      const currentOffset = parseInt(container.getAttribute('data-offset'));
      const limit = parseInt(container.getAttribute('data-limit'));
      const total = parseInt(container.getAttribute('data-total'));
      const blogUrl = section.getAttribute('data-blog-url');
      const nextPage = Math.floor(currentOffset / limit) + 2;

      fetch(`${blogUrl}?page=${nextPage}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.text();
        })
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const newArticles = doc.querySelectorAll('.blog-listing .article');
          const existingIds = Array.from(container.querySelectorAll('.article')).map(a => a.getAttribute('data-id'));

          let added = false;
          newArticles.forEach(article => {
            if (!existingIds.includes(article.getAttribute('data-id'))) {
              container.appendChild(article.cloneNode(true));
              added = true;
            }
          });

          if (added) {
            container.setAttribute('data-offset', currentOffset + limit);
          }

          const articlesPerPage = limit;
          const totalPages = Math.ceil(total / articlesPerPage);
          if (nextPage >= totalPages) {
            loadMoreBtn.style.display = 'none';
          }
        })
        .catch(error => console.error('Error loading more articles:', error));
    });
  }
});