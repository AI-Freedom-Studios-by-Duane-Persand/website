import { BrandingConfig } from '../../shared/branding.dto';

export async function getBrandingConfig(): Promise<BrandingConfig> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/branding/config`);
    if (!res.ok) return { logoUrl: '', faviconUrl: '' };
    return await res.json();
  } catch {
    return { logoUrl: '', faviconUrl: '' };
  }
}
