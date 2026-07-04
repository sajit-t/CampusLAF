import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ItemDetailsPage } from './pages/ItemDetailsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import './App.css';

function AppContent() {
  const { currentPage, currentUser, isLoading } = useApp();

  const renderPage = () => {
    // Auth Guard - Redirect to Landing if not authenticated
    if (!currentUser) {
      return <LandingPage />;
    }

    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'item-details':
        return <ItemDetailsPage />;
      case 'admin':
        if (['admin', 'super_admin'].includes(currentUser.role)) {
          return <AdminDashboardPage />;
        }
        return <DashboardPage />;
      default:
        return <LandingPage />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-textMuted font-semibold">Loading university records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">{renderPage()}</div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
