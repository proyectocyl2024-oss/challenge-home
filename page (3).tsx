import AdminGate from "@/components/AdminGate";
import SalesPanel from "@/components/SalesPanel";

export default function VentasPage() {
  return (
    <AdminGate>
      <SalesPanel />
    </AdminGate>
  );
}
