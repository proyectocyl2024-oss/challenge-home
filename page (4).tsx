import AdminGate from "@/components/AdminGate";
import ContabilidadPanel from "@/components/ContabilidadPanel";

export default function ContabilidadPage() {
  return (
    <AdminGate>
      <ContabilidadPanel />
    </AdminGate>
  );
}
