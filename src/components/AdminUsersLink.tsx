import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function AdminUsersLink() {
  const { isAdmin } = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <Link
      to="/admin/users"
      className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary-foreground/10 transition-colors"
      title="Registered users"
    >
      <Users className="w-4 h-4 text-primary-foreground" />
    </Link>
  );
}
