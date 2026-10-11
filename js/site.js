// Keep links to sections of the former landing useful after the page split.
(() => {
  const routes = {
    studio: 'studio.html#studio', recorder: 'studio.html#recorder', data: 'studio.html#data',
    features: 'features.html#features', how: 'features.html#how', faq: 'features.html#faq',
    playground: 'demos.html#playground', videos: 'demos.html#recording'
  };
  const route = routes[location.hash.slice(1)];
  if (route) location.replace(route);
})();
