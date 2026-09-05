import { useState } from "react";
import { CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

/**
 * Shown instead of the app when this browser still holds another account's
 * workspace and that workspace has changes the cloud never received.
 *
 * Nothing of the previous account is displayed or uploaded while this is on
 * screen: the choice is to hand the browser back so those changes can be synced,
 * or to discard them and carry on.
 */
export function AccountSwitchPage() {
  const accountSwitch = useAuthStore((state) => state.accountSwitch);
  const discardPreviousWorkspace = useAuthStore((state) => state.discardPreviousWorkspace);
  const signOut = useAuthStore((state) => state.signOut);
  const email = useAuthStore((state) => state.user?.email);
  const [busy, setBusy] = useState<"discard" | "signOut" | null>(null);

  if (!accountSwitch) {
    return null;
  }

  const changeLabel =
    accountSwitch.unsyncedCount === 1 ? "1 change" : `${accountSwitch.unsyncedCount} changes`;

  async function handleDiscard() {
    setBusy("discard");
    try {
      await discardPreviousWorkspace();
    } finally {
      setBusy(null);
    }
  }

  async function handleSignOut() {
    setBusy("signOut");
    try {
      await signOut();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-surface flex w-full max-w-lg flex-col gap-5 p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CloudOff className="size-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Another account&apos;s data is still on this browser</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Someone signed in here before {email ? <span className="font-semibold">{email}</span> : "you"}{" "}
            and left {changeLabel} that never reached the cloud. Monilog will not show or upload their
            records under your account.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            If those changes matter, log out and let them sign back in to sync — their data is safe
            until then. Otherwise, clearing this browser starts your workspace fresh from your own
            synced records.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="sm:flex-1"
            variant="outline"
            isLoading={busy === "signOut"}
            disabled={busy !== null}
            onClick={() => void handleSignOut()}
          >
            Log out so they can sync
          </Button>
          <Button
            className="sm:flex-1"
            isLoading={busy === "discard"}
            disabled={busy !== null}
            onClick={() => void handleDiscard()}
          >
            Clear this browser and continue
          </Button>
        </div>
      </div>
    </div>
  );
}
