/**
 * Service locator. To go live, replace `createService` with a real
 * implementation of AcademicService (HTTP API, browser-extension bridge, ...).
 */
import type { AcademicService } from "./academic-service";
import { MockAcademicService, memoryStorage } from "./mock/mock-academic-service";

let instance: AcademicService | null = null;

export const DEMO_MODE = true;

export function getAcademicService(): AcademicService {
  if (!instance) {
    const storage = typeof window !== "undefined" ? window.localStorage : memoryStorage();
    instance = new MockAcademicService({ storage });
  }
  return instance;
}

export type { AcademicService } from "./academic-service";
