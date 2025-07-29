import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import PWAInstallPrompt from "@/components/PWAInstallPrompt"
import Tutorial from "@/components/Tutorial"

function App() {
  return (
    <>
      <Pages />
      <Toaster />
      <PWAInstallPrompt />
      <Tutorial />
    </>
  )
}

export default App 