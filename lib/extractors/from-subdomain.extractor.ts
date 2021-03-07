import { Request } from 'express';
import { TenantExtractor } from '../interfaces';

export function fromSubdomain(): TenantExtractor {
  return (request: Request): string | undefined => {
    if (Array.isArray(request.subdomains) && request.subdomains.length > 0) {
      return request.subdomains[request.subdomains.length - 1];
    }
  };
}
