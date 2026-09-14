export const BRAND = {
  name: 'KITO',
  product: 'KITO Mastermind',
  tagline: 'Real People. Exceptional Results.',
  promise: 'Members keep promises, match work, and close deals — without exposing another agent’s clients.',
  colors: {
    teal: '#204559',
    tealDeep: '#163441',
    tealSoft: '#2D5F75',
    olive: '#9BA63E',
    oliveBright: '#B0BB4C',
    olivePale: '#EEF1D6',
    paper: '#F4F6F4',
  },
  photos: {
    hero: '/images/hero-circle.jpg',
    auth: '/images/auth-desk.jpg',
    portal: '/images/portal-whisper.jpg',
    handshake: '/images/ribbon-handshake.jpg',
    phone: '/images/ribbon-phone.jpg',
    notebook: '/images/ribbon-notebook.jpg',
  },
  lockups: {
    oliveOnTeal: '/brand/lockup-olive-on-teal.png',
    tealOnOlive: '/brand/lockup-teal-on-olive.png',
    wordmarkOlive: '/brand/wordmark-olive.png',
    wordmarkTeal: '/brand/wordmark-teal.png',
  },
} as const;

export const AUTH_SHADE =
  'linear-gradient(105deg, rgba(16,36,46,0.94) 0%, rgba(32,69,89,0.84) 42%, rgba(32,69,89,0.4) 68%, rgba(32,69,89,0.62) 100%)';
