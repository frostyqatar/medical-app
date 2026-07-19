import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { ChatProvider } from './context/ChatContext.tsx'
import ChatWidget from './components/ChatWidget.tsx'
import { useIsMobile } from './hooks/useIsMobile.ts'
import Login from './pages/Login.tsx'
import Emergency from './pages/Emergency.tsx'

import Medications from './pages/Medications.tsx'
import MedicationsMobile from './pages/MedicationsMobile.tsx'
import Vitals from './pages/Vitals.tsx'
import VitalsMobile from './pages/VitalsMobile.tsx'
import Glucose from './pages/Glucose.tsx'
import GlucoseMobile from './pages/GlucoseMobile.tsx'
import Labs from './pages/Labs.tsx'
import LabsMobile from './pages/LabsMobile.tsx'
import Symptoms from './pages/Symptoms.tsx'
import SymptomsMobile from './pages/SymptomsMobile.tsx'
import Appointments from './pages/Appointments.tsx'
import AppointmentsMobile from './pages/AppointmentsMobile.tsx'
import ActionItems from './pages/ActionItems.tsx'
import ActionItemsMobile from './pages/ActionItemsMobile.tsx'
import WeeklySummary from './pages/WeeklySummary.tsx'
import WeeklySummaryMobile from './pages/WeeklySummaryMobile.tsx'
import Notes from './pages/GoodTracking.tsx'
import NotesMobile from './pages/NotesMobile.tsx'
import Plans from './pages/Plans.tsx'
import PlansMobile from './pages/PlansMobile.tsx'
import FamilyGuide from './pages/family-guide/FamilyGuide.tsx'

function RequireAuth() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function MobileRoute({ desktop: Desktop, mobile: Mobile }: { desktop: React.ComponentType; mobile: React.ComponentType }) {
  const isMobile = useIsMobile()
  const C = isMobile ? Mobile : Desktop
  return <C />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<App />}>
                <Route index element={<Navigate to="/family-guide" replace />} />
                <Route path="family-guide" element={<FamilyGuide />} />
                <Route path="medications" element={<MobileRoute desktop={Medications} mobile={MedicationsMobile} />} />
                <Route path="vitals" element={<MobileRoute desktop={Vitals} mobile={VitalsMobile} />} />
                <Route path="glucose" element={<MobileRoute desktop={Glucose} mobile={GlucoseMobile} />} />
                <Route path="labs" element={<MobileRoute desktop={Labs} mobile={LabsMobile} />} />
                <Route path="symptoms" element={<MobileRoute desktop={Symptoms} mobile={SymptomsMobile} />} />
                <Route path="appointments" element={<MobileRoute desktop={Appointments} mobile={AppointmentsMobile} />} />
                <Route path="action-items" element={<MobileRoute desktop={ActionItems} mobile={ActionItemsMobile} />} />
                <Route path="weekly-summary" element={<MobileRoute desktop={WeeklySummary} mobile={WeeklySummaryMobile} />} />
                <Route path="notes" element={<MobileRoute desktop={Notes} mobile={NotesMobile} />} />
                <Route path="plans" element={<MobileRoute desktop={Plans} mobile={PlansMobile} />} />
                <Route path="emergency" element={<Emergency />} />
              </Route>
            </Route>
          </Routes>
          <ChatWidget />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
