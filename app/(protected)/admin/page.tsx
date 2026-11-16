"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import {
  Users,
  FileText,
  Coins,
  History,
  ShieldCheck,
  Search,
  PlusCircle,
  MinusCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  TrendingDown,
} from "lucide-react";
import {
  getAdminStats,
  getAdminUsers,
  getAdminSalesPages,
  getAdminTransactions,
  adjustUserCredits,
  toggleUserAdmin,
  deleteAdminSalesPage,
  AdminStats,
  AdminUser,
  AdminSalesPage,
  AdminTransaction,
} from "@/lib/api/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

type Tab = "overview" | "users" | "pages" | "transactions";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Users tab state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");

  // Credit adjustment modal
  const [creditModalUser, setCreditModalUser] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(5);
  const [creditAction, setCreditAction] = useState<"add" | "deduct">("add");
  const [creditReason, setCreditReason] = useState("");
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);

  // Sales pages tab state
  const [salesPages, setSalesPages] = useState<AdminSalesPage[]>([]);
  const [pagesPage, setPagesPage] = useState(1);
  const [pagesTotalPages, setPagesTotalPages] = useState(1);
  const [pageSearch, setPageSearch] = useState("");
  const [deleteTargetPage, setDeleteTargetPage] = useState<AdminSalesPage | null>(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);

  // Transactions tab state
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txSearch, setTxSearch] = useState("");

  // Check admin rights
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.is_admin) {
        toast.error("Access denied. Admin rights required.");
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  // Load Overview Stats
  const fetchStats = async () => {
    try {
      setLoadingData(true);
      const data = await getAdminStats();
      setStats(data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || "Failed to load admin stats");
    } finally {
      setLoadingData(false);
    }
  };

  // Load Users
  const fetchUsers = async () => {
    try {
      setLoadingData(true);
      const data = await getAdminUsers({ page: usersPage, search: userSearch });
      setUsers(data.data || []);
      setUsersTotalPages(data.last_page || 1);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || "Failed to load users");
    } finally {
      setLoadingData(false);
    }
  };

  // Load Sales Pages
  const fetchSalesPages = async () => {
    try {
      setLoadingData(true);
      const data = await getAdminSalesPages({ page: pagesPage, search: pageSearch });
      setSalesPages(data.data || []);
      setPagesTotalPages(data.last_page || 1);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || "Failed to load sales pages");
    } finally {
      setLoadingData(false);
    }
  };

  // Load Transactions
  const fetchTransactions = async () => {
    try {
      setLoadingData(true);
      const data = await getAdminTransactions({ page: txPage, search: txSearch });
      setTransactions(data.data || []);
      setTxTotalPages(data.last_page || 1);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      if (activeTab === "overview") fetchStats();
      if (activeTab === "users") fetchUsers();
      if (activeTab === "pages") fetchSalesPages();
      if (activeTab === "transactions") fetchTransactions();
    }
  }, [user, activeTab, usersPage, pagesPage, txPage]);

  // Adjust Credits Handler
  const handleSaveCredits = async () => {
    if (!creditModalUser) return;
    setIsSubmittingCredit(true);
    const toastId = toast.loading("Updating credits...");
    try {
      const finalAmount = creditAction === "add" ? Math.abs(creditAmount) : -Math.abs(creditAmount);
      await adjustUserCredits(creditModalUser.id, {
        amount: finalAmount,
        description: creditReason || undefined,
      });

      toast.success("User credits updated successfully!", { id: toastId });
      setCreditModalUser(null);
      setCreditReason("");
      fetchUsers();
      if (activeTab === "overview") fetchStats();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || "Failed to update credits", { id: toastId });
    } finally {
      setIsSubmittingCredit(false);
    }
  };

  // Toggle Admin Handler
  const handleToggleAdmin = async (targetUser: AdminUser) => {
    if (confirm(`Are you sure you want to ${targetUser.is_admin ? "remove" : "grant"} admin privileges for ${targetUser.name}?`)) {
      try {
        await toggleUserAdmin(targetUser.id);
        toast.success("Admin role updated.");
        fetchUsers();
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        toast.error(errorObj?.response?.data?.message || "Failed to toggle role");
      }
    }
  };

  // Delete Page Handler
  const handleDeletePage = async () => {
    if (!deleteTargetPage) return;
    setIsDeletingPage(true);
    const toastId = toast.loading("Deleting sales page...");
    try {
      await deleteAdminSalesPage(deleteTargetPage.id);
      toast.success("Sales page deleted successfully", { id: toastId });
      setDeleteTargetPage(null);
      fetchSalesPages();
      if (activeTab === "overview") fetchStats();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || "Failed to delete page", { id: toastId });
    } finally {
      setIsDeletingPage(false);
    }
  };

  if (loading || !user?.is_admin) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Checking admin credentials...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor platform usage, manage user accounts, adjust credits, and oversee generated content.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-accent/60 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "users"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("pages")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "pages"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sales Pages
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "transactions"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Transactions
            </button>
          </div>
        </div>

        {/* ======================= TAB: OVERVIEW ======================= */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Users
                  </span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-bold">{stats?.total_users ?? 0}</div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pages Generated
                  </span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-bold">{stats?.total_sales_pages ?? 0}</div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Credits Consumed
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-bold">{stats?.total_credits_consumed ?? 0}</div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Credits Granted
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Coins className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-bold">{stats?.total_credits_granted ?? 0}</div>
              </div>
            </div>

            {/* Recent Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Users */}
              <div className="p-6 rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Latest Users
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("users")}>
                    View all
                  </Button>
                </div>
                <div className="divide-y divide-border/60 mt-2">
                  {stats?.recent_users?.map((u) => (
                    <div key={u.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center font-bold text-xs uppercase text-primary">
                          {u.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1.5">
                            {u.name}
                            {u.is_admin && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500">
                          <Coins className="h-3 w-3" />
                          {u.credits}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="p-6 rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Latest Credit Activity
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("transactions")}>
                    View all
                  </Button>
                </div>
                <div className="divide-y divide-border/60 mt-2">
                  {stats?.recent_transactions?.map((t) => (
                    <div key={t.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{t.description || t.type}</div>
                        <div className="text-xs text-muted-foreground">{t.user?.email || `User #${t.user_id}`}</div>
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          t.amount > 0 ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {t.amount > 0 ? `+${t.amount}` : t.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: USERS ======================= */}
        {activeTab === "users" && (
          <div className="mt-8 space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  placeholder="Search user by name or email..."
                  className="pl-9"
                />
              </div>
              <Button onClick={() => fetchUsers()}>Search</Button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Credits</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                            <ShieldCheck className="h-3 w-3" /> Admin
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                          <Coins className="h-3.5 w-3.5" />
                          {u.credits}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCreditModalUser(u);
                            setCreditAmount(5);
                            setCreditAction("add");
                          }}
                        >
                          <Coins className="h-3.5 w-3.5 mr-1 text-amber-500" />
                          Adjust Credits
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleAdmin(u)}
                        >
                          {u.is_admin ? "Demote" : "Promote to Admin"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Page {usersPage} of {usersTotalPages}</span>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={usersPage <= 1}
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={usersPage >= usersTotalPages}
                  onClick={() => setUsersPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: SALES PAGES ======================= */}
        {activeTab === "pages" && (
          <div className="mt-8 space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSalesPages()}
                  placeholder="Search pages by product name or audience..."
                  className="pl-9"
                />
              </div>
              <Button onClick={() => fetchSalesPages()}>Search</Button>
            </div>

            {/* Pages Table */}
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Audience</th>
                    <th className="px-6 py-4">Template</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {salesPages.map((p) => (
                    <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {p.product_name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {p.target_audience}
                      </td>
                      <td className="px-6 py-4 capitalize text-xs">
                        <span className="px-2 py-1 rounded-md bg-accent">
                          {p.template || "modern"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/preview/live-demo-${p.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTargetPage(p)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Page {pagesPage} of {pagesTotalPages}</span>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagesPage <= 1}
                  onClick={() => setPagesPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagesPage >= pagesTotalPages}
                  onClick={() => setPagesPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: TRANSACTIONS ======================= */}
        {activeTab === "transactions" && (
          <div className="mt-8 space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchTransactions()}
                  placeholder="Search transactions by user or description..."
                  className="pl-9"
                />
              </div>
              <Button onClick={() => fetchTransactions()}>Search</Button>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium">{tx.user?.name || `User #${tx.user_id}`}</div>
                        <div className="text-xs text-muted-foreground">{tx.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-accent uppercase tracking-wider font-semibold">
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {tx.description || "—"}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={tx.amount > 0 ? "text-emerald-500" : "text-rose-500"}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} credits
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Page {txPage} of {txTotalPages}</span>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={txPage <= 1}
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={txPage >= txTotalPages}
                  onClick={() => setTxPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Credit Modal */}
      <Modal isOpen={!!creditModalUser} onClose={() => setCreditModalUser(null)}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-amber-500" />
            <h2 className="text-lg font-bold">Adjust Credits for {creditModalUser?.name}</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Current balance: <strong className="text-foreground">{creditModalUser?.credits} credits</strong>
          </p>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant={creditAction === "add" ? "default" : "outline"}
              className="flex-1 gap-1.5"
              onClick={() => setCreditAction("add")}
            >
              <PlusCircle className="h-4 w-4" /> Grant Credits
            </Button>
            <Button
              type="button"
              variant={creditAction === "deduct" ? "destructive" : "outline"}
              className="flex-1 gap-1.5"
              onClick={() => setCreditAction("deduct")}
            >
              <MinusCircle className="h-4 w-4" /> Deduct Credits
            </Button>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold">Credit Amount</label>
            <Input
              type="number"
              min={1}
              value={creditAmount}
              onChange={(e) => setCreditAmount(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold">Reason / Note (optional)</label>
            <Input
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              placeholder="e.g. Promotional bonus, manual refund..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setCreditModalUser(null)}>
              Cancel
            </Button>
            <Button
              isLoading={isSubmittingCredit}
              loadingText="Updating..."
              onClick={handleSaveCredits}
            >
              Confirm Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Sales Page Modal */}
      <Modal isOpen={!!deleteTargetPage} onClose={() => setDeleteTargetPage(null)}>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold">Delete Sales Page?</h2>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete &quot;{deleteTargetPage?.product_name}&quot;? This cannot be undone.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteTargetPage(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={isDeletingPage}
              loadingText="Deleting..."
              onClick={handleDeletePage}
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
