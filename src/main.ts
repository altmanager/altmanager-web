import "./style.css";
import { AppRoot } from "./components/AppRoot";
import { WsClient } from "./api/WsClient";

interface Env {
  ALTMANAGER_SERVER: string;
}

async function fetchEnv() {
  const defaultEnv: Env = {
    ALTMANAGER_SERVER: "http://localhost:14454",
  }
  try {
    const res = await fetch("/env.json");
    if (!res.ok) {
      return defaultEnv;
    }
    const env = await res.json();
    return {
      ALTMANAGER_SERVER: env?.ALTMANAGER_SERVER ?? defaultEnv.ALTMANAGER_SERVER,
    }
  } catch (e) {
    console.error("Failed to fetch env.json", e);
    return defaultEnv;
  }
}

const config = await fetchEnv();

const api = await WsClient.connect(config.ALTMANAGER_SERVER);
const root = new AppRoot(api);

document.body.append(root);
