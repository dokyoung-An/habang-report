import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import BasicInfoPage from './pages/BasicInfoPage'
import SelectReportTypePage from './pages/SelectReportTypePage'
import EquipmentCheckPage from './pages/EquipmentCheckPage'
import VisualCheckPage from './pages/VisualCheckPage'
import FinalReportPage from './pages/FinalReportPage'
import ManageReportsPage from './pages/ManageReportsPage'
import CustomerReportPage from './pages/CustomerReportPage'
import AdminUsersPage from './pages/AdminUsersPage'
import { startAutoCleanup } from './utils/cleanupOldData'

function App() {
  useEffect(() => {
    // 앱 시작 시 자동 정리 작업 시작
    startAutoCleanup()
  }, [])
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/admin-users" element={<AdminUsersPage />} />
          <Route path="/basic-info" element={<BasicInfoPage />} />
          <Route path="/select-report-type" element={<SelectReportTypePage />} />
          <Route path="/equipment-check" element={<EquipmentCheckPage />} />
          <Route path="/visual-check" element={<VisualCheckPage />} />
          <Route path="/final-report" element={<FinalReportPage />} />
          <Route path="/manage-reports" element={<ManageReportsPage />} />
          <Route path="/customer-report/:reportId" element={<CustomerReportPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App



