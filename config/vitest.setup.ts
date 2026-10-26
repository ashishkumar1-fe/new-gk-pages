import '@testing-library/jest-dom/vitest';
// jsdom has no scrollTo; the router's scroll restoration calls it on navigation.
window.scrollTo = () => {};
