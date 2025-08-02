import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PraxisProvider } from './context/PraxisContext';
import AuthGuard from './components/auth/AuthGuard';
import SubscriptionGuard from './components/auth/SubscriptionGuard';
import Login from './pages/auth/Login';

import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import AuthCallback from './pages/auth/AuthCallback';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Calendar from './pages/Calendar';
import Search from './pages/Search';
import ClientList from './pages/ClientList';
import ClientPage from './pages/clients/ClientPage';
import ClientEditPage from './pages/ClientEditPage';
import CaseList from './pages/CaseList';
import NotFound from './pages/NotFound';
import Layout from './components/layout/Layout';
import ClientForm from './pages/ClientForm';
import JudicialProcessesList from './pages/JudicialProcesses/JudicialProcessesList';
import JudicialProcessDetailPage from './pages/JudicialProcesses/JudicialProcessDetailPage';
import SearchJudicialProcess from './pages/JudicialProcesses/SearchJudicialProcess';
import CaseTimelinePage from './pages/cases/CaseTimelinePage';
import CaseForm from './pages/cases/CaseForm';
import Tasks from './pages/Tasks';
import PetitionList from './pages/petitions/PetitionList';
import NewPetitionPage from './pages/petitions/NewPetitionPage';
import PetitionDetailPage from './pages/petitions/PetitionDetailPage';
import ImportPetitionPage from './pages/petitions/ImportPetitionPage';
import TemplateManagementPage from './pages/petitions/TemplateManagementPage';
import LegislationSearch from './features/legislation/pages/LegislationSearch';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentStatus from './pages/PaymentStatus';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoute from './components/admin/AdminRoute';



const App: React.FC = () => {
  return (
    <React.StrictMode>
      <AuthProvider>
        <PraxisProvider>
          <Router>
            <AppRoutes />
          </Router>
        </PraxisProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/*" element={<Outlet />}>
        <Route path="login" element={<AuthGuard requireAuth={false}><Login /></AuthGuard>} />
        <Route path="signup" element={<AuthGuard requireAuth={false}><Signup /></AuthGuard>} />
        <Route path="forgot-password" element={<AuthGuard requireAuth={false}><ForgotPassword /></AuthGuard>} />
        <Route path="reset-password" element={<AuthGuard requireAuth={false}><ResetPassword /></AuthGuard>} />
        <Route path="verify-email" element={<AuthGuard requireAuth={false}><VerifyEmail /></AuthGuard>} />
        <Route path="callback" element={<AuthCallback />} />
      </Route>
      
      {/* Wrap all routes in Layout and protect with AuthGuard and SubscriptionGuard */}
      <Route path="/" element={<Layout><Outlet /></Layout>}>
        <Route index element={<AuthGuard><SubscriptionGuard><Index /></SubscriptionGuard></AuthGuard>} />
        <Route path="dashboard" element={<AuthGuard><SubscriptionGuard><Dashboard /></SubscriptionGuard></AuthGuard>} />
        <Route path="profile" element={<AuthGuard><Profile /></AuthGuard>} />
        <Route path="change-password" element={<AuthGuard><ChangePassword /></AuthGuard>} />
        <Route path="calendar" element={<AuthGuard><SubscriptionGuard><Calendar /></SubscriptionGuard></AuthGuard>} />
        <Route path="search" element={<AuthGuard><SubscriptionGuard><Search /></SubscriptionGuard></AuthGuard>} />
        <Route path="tasks" element={<AuthGuard><SubscriptionGuard><Tasks /></SubscriptionGuard></AuthGuard>} />
        
        <Route path="clients" element={<AuthGuard><SubscriptionGuard><Outlet /></SubscriptionGuard></AuthGuard>}>
          <Route index element={<ClientList />} />
          <Route path=":clientId" element={<ClientPage />} />
          <Route path=":clientId/edit" element={<ClientEditPage />} />
          <Route path="new" element={<ClientForm />} />
        </Route>
        
        <Route path="cases" element={<AuthGuard><SubscriptionGuard><Outlet /></SubscriptionGuard></AuthGuard>}>
          <Route index element={<CaseList />} />
          <Route path="new" element={<CaseForm />} />
          <Route path=":caseId/timeline" element={<CaseTimelinePage />} />
        </Route>
        
        <Route path="judicial-processes" element={<AuthGuard><SubscriptionGuard><Outlet /></SubscriptionGuard></AuthGuard>}>
          <Route index element={<JudicialProcessesList />} />
          <Route path="search" element={<SearchJudicialProcess />} />
          <Route path=":processId" element={<JudicialProcessDetailPage />} />
        </Route>
        
        {/* Rotas para petições */}
        <Route path="petitions" element={<AuthGuard><SubscriptionGuard><Outlet /></SubscriptionGuard></AuthGuard>}>
          <Route index element={<PetitionList />} />
          <Route path="new" element={<NewPetitionPage />} />
          <Route path="import" element={<ImportPetitionPage />} />
          <Route path="templates" element={<TemplateManagementPage />} />
          <Route path=":petitionId" element={<PetitionDetailPage />} />
          <Route path=":petitionId/edit" element={<PetitionDetailPage />} />
          <Route path=":petitionId/download" element={<PetitionDetailPage />} />
        </Route>

        {/* Rotas para legislação */}
        <Route path="legislation" element={<AuthGuard><SubscriptionGuard><Outlet /></SubscriptionGuard></AuthGuard>}>
          <Route index element={<LegislationSearch />} />
        </Route>

        {/* Rotas para assinatura */}
        <Route path="assinatura" element={<AuthGuard><SubscriptionPage /></AuthGuard>} />
        <Route path="payment-status" element={<AuthGuard><PaymentStatus /></AuthGuard>} />

        {/* Rota administrativa */}
        <Route path="admin" element={<AuthGuard><AdminRoute><AdminDashboard /></AdminRoute></AuthGuard>} />

      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;