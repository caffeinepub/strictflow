import type { backendInterface } from "../backend";

// This module stores a reference to the actor that's set when the app initializes
let _actor: backendInterface | null = null;

export function setActor(actor: backendInterface | null) {
  _actor = actor;
}

export function getActor(): backendInterface {
  if (!_actor) {
    throw new Error("Actor not initialized");
  }
  return _actor;
}

// Proxy-based backend service that always uses the latest actor
export const backendService: backendInterface = new Proxy(
  {} as backendInterface,
  {
    get(_target, prop) {
      const actor = _actor;
      if (!actor) {
        return (..._args: unknown[]) => {
          return Promise.reject(new Error("Backend not ready yet"));
        };
      }
      const method = (actor as unknown as Record<string, unknown>)[
        prop as string
      ];
      if (typeof method === "function") {
        return method.bind(actor);
      }
      return method;
    },
  },
);
