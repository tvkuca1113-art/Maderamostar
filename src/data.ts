import productsJson from '../data/products.json';
import siteConfigJson from '../data/site-config.json';
import pricingJson from '../data/pricing-template.json';
import manifestJson from '../data/asset-manifest.json';
import type { PricingData, Product, SiteConfig } from './types';

export const products = productsJson.products as Product[];
export const siteConfig = siteConfigJson as unknown as SiteConfig;
/** Javni cjenovnik. Dok je approvedByOwner false, kalkulator radi u režimu upita. */
export const pricing = pricingJson as unknown as PricingData;

interface ManifestAsset {
  id: string;
  webPath: string;
  width: number;
  height: number;
  alt: string;
}
export const assets = (manifestJson as { assets: ManifestAsset[] }).assets;

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function assetFor(webPath: string): ManifestAsset | undefined {
  return assets.find((a) => a.webPath === webPath);
}
