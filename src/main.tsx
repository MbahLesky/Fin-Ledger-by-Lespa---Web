import ReactDOM from "react-dom/client";
import App from "@/app/App";
import "@/app/styles.css";

if ("serviceWorker" in navigator) {
  const shouldRegisterPwa =
    import.meta.env.PROD && import.meta.env.VITE_ENABLE_PWA !== "false";

  window.addEventListener("load", () => {
    if (shouldRegisterPwa) {
      void navigator.serviceWorker.register("/sw.js");
      return;
    }

    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())));
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
