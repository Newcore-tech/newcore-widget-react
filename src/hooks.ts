import BackgroundClient from "./background-client";
import Client from "./client";
import { useEffect, useMemo } from "react";

export function useClient() {
  const client = useMemo(() => new Client(), []);

  useEffect(() => {
    return () => client.clear();
  }, []);

  return client;
}

export function useBackgroundClient() {
  const client = useMemo(() => new BackgroundClient(), []);

  useEffect(() => {
    return () => client.clear();
  }, []);

  return client;
}
