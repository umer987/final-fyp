/** Prefetch lazy route chunks on Navbar hover/focus for faster navigation. */

const prefetched = new Set<string>();

const loaders: Record<string, () => Promise<unknown>> = {
  '/ask': () => import('../pages/AskQuestionPage'),
  '/find-lawyers': () => import('../pages/FindLawyersPage'),
  '/legal-topics': () => import('../pages/LegalTopicsPage'),
  '/search': () => import('../pages/SearchPage'),
  '/about': () => import('../pages/AboutPage'),
  '/how-it-works': () => import('../pages/HowItWorksPage'),
  '/contact': () => import('../pages/ContactPage'),
};

export function prefetchRoute(path: string): void {
  const loader = loaders[path];
  if (!loader || prefetched.has(path)) return;
  prefetched.add(path);
  void loader().catch(() => {
    prefetched.delete(path);
  });
}
