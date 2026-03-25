'use client';

import { useDashboardData } from '../../hooks/useDashboardData';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { FinancialSummaryCards } from '../../components/dashboard/FinancialSummaryCards';
import { FinancialProgressSection } from '../../components/dashboard/FinancialProgressSection';
import { QuickAddSection } from '../../components/dashboard/QuickAddSection';
import { SubscriptionsSection } from '../../components/dashboard/SubscriptionsSection';
import { AIInsightSection } from '../../components/dashboard/AIInsightSection';
import { DistributionChartsSection } from '../../components/dashboard/DistributionChartsSection';
import { DashboardSidebar } from '../../components/dashboard/DashboardSidebar';
import { ChatFloatingButton } from '../../components/ChatFloatingButton';

export default function AnalysisPage() {
  const dashboardData = useDashboardData();

  if (!dashboardData.token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <DashboardHeader 
        userName={dashboardData.user?.name} 
        onLogout={dashboardData.handleLogout} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FinancialSummaryCards
          totalAmount={dashboardData.totalAmount}
          transactionCount={dashboardData.transactions.length}
          avgAmount={dashboardData.avgAmount}
        />

        <FinancialProgressSection
          comparison={dashboardData.comparison}
          progress={dashboardData.progress}
          selectedPeriod={dashboardData.selectedPeriod}
          microExpensesOnly={dashboardData.microExpensesOnly}
          onPeriodChange={dashboardData.setSelectedPeriod}
          onMicroExpensesToggle={dashboardData.setMicroExpensesOnly}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <QuickAddSection
              token={dashboardData.token}
              onSuccess={dashboardData.reloadAllData}
            />

            <SubscriptionsSection
              subscriptions={dashboardData.subscriptions}
              isLoading={dashboardData.isLoadingSubscriptions}
              onRefresh={() => dashboardData.loadSubscriptions(dashboardData.token)}
            />

            <AIInsightSection
              narrative={dashboardData.narrative}
              isLoading={dashboardData.isLoading}
              error={dashboardData.error}
              hasTransactions={dashboardData.transactions.length > 0}
              onGenerate={dashboardData.handleGenerateNarrative}
            />

            <DistributionChartsSection
              categoryData={dashboardData.categoryData}
              timelineData={dashboardData.timelineData}
              weekdayChartData={dashboardData.weekdayChartData}
              hasTransactions={dashboardData.transactions.length > 0}
            />
          </div>

          <DashboardSidebar
            token={dashboardData.token}
            transactions={dashboardData.transactions}
            isLoadingTransactions={dashboardData.isLoadingTransactions}
            getCategoryColor={dashboardData.getCategoryColor}
            onDataChange={dashboardData.reloadAllData}
          />
        </div>
      </div>

      {/* Botón flotante de chat */}
      <ChatFloatingButton />
    </div>
  );
}
