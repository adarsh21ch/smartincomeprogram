import { DashboardLayout } from "./DashboardLayout";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};
