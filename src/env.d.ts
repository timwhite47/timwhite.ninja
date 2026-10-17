import type { Source } from './schemas/source';

declare global {
  namespace App {
    interface Locals {
      sources: Source[];
    }
  }
}

export {};
