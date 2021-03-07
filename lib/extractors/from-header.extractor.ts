import { Request } from 'express';
import { TenantExtractor } from '../interfaces';

export function fromHeader(name: string): TenantExtractor {
  return (request: Request): string | undefined => {
    return request.header(name);
  };
}
