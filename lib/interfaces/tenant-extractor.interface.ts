import { Request } from 'express';

export type TenantExtractor = (request: Request) => string | undefined;
