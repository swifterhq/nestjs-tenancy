import { Request } from 'express';
import { TenantExtractor } from '../interfaces';

export function fromQuery(name: string): TenantExtractor {
  return (request: Request): string | undefined => {
    const tenantId = request.query[name];

    // if the query variable is string return it
    if (typeof tenantId === 'string') {
      return tenantId;
    }
  };
}
