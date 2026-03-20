import "./style.css";
import { AppRoot } from "./components/AppRoot";
import { WsClient } from "./api/WsClient";

const api = await WsClient.connect("ws://localhost:14454");
const root = new AppRoot(api);

document.body.append(root);
