import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import PWAInstallPrompt from "@/components/PWAInstallPrompt"

function App() {
  return (
    <>
      <Pages />
      <Toaster />
      <PWAInstallPrompt />
    </>
  )
}

export default App 