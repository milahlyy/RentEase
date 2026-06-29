import { WalletCards } from "lucide-react";
import { DashboardPlaceholderPage } from "../../../../components/dashboard-placeholder-page";

export default function LenderEarningsPage() {
  return (
    <DashboardPlaceholderPage
      description="Pantau pendapatan dari transaksi rental yang sudah selesai."
      emptyDescription="Pendapatan, komisi platform, dan status pencairan akan ditampilkan setelah simulasi pembayaran dibuat."
      emptyTitle="Belum ada pendapatan"
      icon={WalletCards}
      title="Pendapatan Pemilik"
    />
  );
}
