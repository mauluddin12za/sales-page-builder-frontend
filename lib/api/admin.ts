import { api } from "./api";

export interface AdminStats {
  total_users: number;
  total_sales_pages: number;
  total_credits_consumed: number;
  total_credits_granted: number;
  recent_transactions: Array<{
    id: number;
    user_id: number;
    amount: number;
    type: string;
    description: string;
    created_at: string;
    user: {
      id: number;
      name: string;
      email: string;
      avatar: string | null;
    };
  }>;
  recent_users: Array<{
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    credits: number;
    is_admin: boolean;
    created_at: string;
  }>;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  credits: number;
  is_admin: boolean;
  credit_transactions_count: number;
  created_at: string;
}

export interface AdminSalesPage {
  id: number;
  user_id: number;
  product_name: string;
  target_audience: string;
  description: string;
  template: string;
  created_at: string;
}

export interface AdminTransaction {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await api.get("/admin/stats");
  return data.data;
};

export const getAdminUsers = async (params?: { page?: number; search?: string }) => {
  const { data } = await api.get("/admin/users", { params });
  return data.data;
};

export const adjustUserCredits = async (
  userId: number,
  payload: { amount: number; description?: string }
) => {
  const { data } = await api.post(`/admin/users/${userId}/credits`, payload);
  return data;
};

export const toggleUserAdmin = async (userId: number) => {
  const { data } = await api.patch(`/admin/users/${userId}/role`);
  return data;
};

export const getAdminSalesPages = async (params?: { page?: number; search?: string }) => {
  const { data } = await api.get("/admin/sales-pages", { params });
  return data.data;
};

export const deleteAdminSalesPage = async (pageId: number) => {
  const { data } = await api.delete(`/admin/sales-pages/${pageId}`);
  return data;
};

export const getAdminTransactions = async (params?: { page?: number; search?: string }) => {
  const { data } = await api.get("/admin/transactions", { params });
  return data.data;
};
