import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { AddTransactionPage } from "@/pages/add-transaction-page";
import { AnalyticsPage } from "@/pages/analytics-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { ExportPage } from "@/pages/export-page";
import { ImportPage } from "@/pages/import-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { OnboardingBalancesPage } from "@/pages/onboarding-balances-page";
import { OnboardingCurrencyPage } from "@/pages/onboarding-currency-page";
import { OnboardingImportPage } from "@/pages/onboarding-import-page";
import { OnboardingReminderPage } from "@/pages/onboarding-reminder-page";
import { PhoneAuthPage } from "@/pages/phone-auth-page";
import { ProfileCompletionPage } from "@/pages/profile-completion-page";
import { RegisterPage } from "@/pages/register-page";
import { SettingsPage } from "@/pages/settings-page";
import { TransferPage } from "@/pages/transfer-page";
import { TransactionsPage } from "@/pages/transactions-page";
import { AuthRoute } from "@/routes/auth-route";
import { OnboardingRoute } from "@/routes/onboarding-route";
import { ProfileRoute } from "@/routes/profile-route";
import { ProtectedRoute } from "@/routes/protected-route";
import { RootRedirect } from "@/routes/root-redirect";
import { ROUTES } from "@/routes/route-constants";

const router = createBrowserRouter([
  {
    path: ROUTES.root,
    element: <RootRedirect />
  },
  {
    element: <AuthRoute />,
    children: [
      {
        path: ROUTES.login,
        element: <LoginPage />
      },
      {
        path: ROUTES.register,
        element: <RegisterPage />
      },
      {
        path: ROUTES.phoneAuth,
        element: <PhoneAuthPage />
      }
    ]
  },
  {
    element: <ProfileRoute />,
    children: [
      {
        path: ROUTES.profileCompletion,
        element: <ProfileCompletionPage />
      }
    ]
  },
  {
    element: <OnboardingRoute />,
    children: [
      {
        path: ROUTES.onboardingCurrency,
        element: <OnboardingCurrencyPage />
      },
      {
        path: ROUTES.onboardingImport,
        element: <OnboardingImportPage />
      },
      {
        path: ROUTES.onboardingBalances,
        element: <OnboardingBalancesPage />
      },
      {
        path: ROUTES.onboardingReminder,
        element: <OnboardingReminderPage />
      }
    ]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: ROUTES.dashboard,
            element: <DashboardPage />
          },
          {
            path: ROUTES.transactions,
            element: <TransactionsPage />
          },
          {
            path: ROUTES.addTransaction,
            element: <AddTransactionPage />
          },
          {
            path: ROUTES.transfer,
            element: <TransferPage />
          },
          {
            path: ROUTES.analytics,
            element: <AnalyticsPage />
          },
          {
            path: ROUTES.settings,
            element: <SettingsPage />
          },
          {
            path: ROUTES.importData,
            element: <ImportPage />
          },
          {
            path: ROUTES.exportData,
            element: <ExportPage />
          }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
