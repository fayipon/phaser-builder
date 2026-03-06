import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Demo0001 from './pages/demos/Demo0001'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/demo-0001" element={<Demo0001 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
