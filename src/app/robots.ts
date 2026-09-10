import { siteOrigin } from '@/lib/seo';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    host: siteOrigin(),
  };
}
