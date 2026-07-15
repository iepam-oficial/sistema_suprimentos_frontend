import { shouldSkipE2E } from './constants';

export const describeE2E = shouldSkipE2E() ? describe.skip : describe;
