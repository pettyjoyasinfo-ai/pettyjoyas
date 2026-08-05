import { AccountSidebar } from "@/components/account/account-sidebar";
import { AccountGuard } from "@/components/account/account-guard";

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountGuard>
      <div className="container-px py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[250px_1fr]">
          <AccountSidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </AccountGuard>
  );
}
