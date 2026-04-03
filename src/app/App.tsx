import { AppRouter } from "@/routes";
import { AppProviders } from "@/providers/app-providers";

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

