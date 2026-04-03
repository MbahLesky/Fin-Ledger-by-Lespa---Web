import ReactDOM from "react-dom/client";
import App from "@/app/App";
import "@/app/styles.css";

if ("serviceWorker" in navigator && import.meta.env.VITE_ENABLE_PWA !== "false") {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
