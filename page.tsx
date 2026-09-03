import AdminGate from "@/components/AdminGate";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminPanel />
    </AdminGate>
  );
}
