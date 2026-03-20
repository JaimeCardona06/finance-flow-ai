'use client';

import { ActivePlansCard } from '../ActivePlansCard';
import { CsvUploader } from '../CsvUploader';
import { TransactionsList } from './TransactionsList';

interface Transaction {
  _id?: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
}

interface DashboardSidebarProps {
  token: string;
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  getCategoryColor: (category?: string) => string;
  onDataChange: () => void;
}

export function DashboardSidebar({
  token,
  transactions,
  isLoadingTransactions,
  getCategoryColor,
  onDataChange
}: DashboardSidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Metas de Ahorro (Slice 5) */}
      <ActivePlansCard 
        token={token}
        reloadTrigger={transactions.length}
        onPlanCreated={onDataChange}
      />

      {/* CSV Uploader */}
      <CsvUploader 
        token={token} 
        onUploadSuccess={onDataChange}
      />

      {/* Lista de Transacciones */}
      <TransactionsList
        transactions={transactions}
        isLoading={isLoadingTransactions}
        getCategoryColor={getCategoryColor}
      />
    </div>
  );
}
