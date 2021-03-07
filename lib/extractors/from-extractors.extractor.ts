import { Request } from 'express';
import { TenantExtractor } from '../interfaces';

export function fromExtractors(extractors: TenantExtractor[]): TenantExtractor {
  return (request: Request): string | undefined => {
    for (const extractor of extractors) {
      const tenantId = extractor(request);

      if (tenantId) {
        return tenantId;
      }
    }
  };
}
