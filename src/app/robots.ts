import { siteUrl } from '@/lib/site-url';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/staff',
        '/staff/',
        '/dashboard',
        '/billing',
        '/downloads',
        '/requests',
        '/saved',
        '/profile',
        '/institution',
        '/institution/',
        '/auth/',
        '/unauthorized',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
