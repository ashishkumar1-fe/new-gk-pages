import { toResult as generic } from '@/api/_shared/errors';
import type { CommandResult } from '@/domain/shared/result';
export type { CommandResult };

/** item wire field → domain field, so field errors land on the right form input. */
const fieldMap: Record<string, string> = {
  body_html: 'descriptionHtml',
  product_type: 'productType',
  seo_title: 'seoTitle',
  seo_description: 'seoDescription',
  hs_code: 'hsnCode',
  charge_tax: 'taxable',
};

/** Map an item-service failure to a result. gk-pages used to swallow most of these. */
export const toResult = <T>(e: unknown): CommandResult<T> => generic<T>(e, fieldMap);
