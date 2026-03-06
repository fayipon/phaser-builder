import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Demo0001 from './pages/demos/Demo0001'
import GreatWave from './pages/demos/GreatWave'
import StarryNight from './pages/demos/StarryNight'
import Seigaiha from './pages/demos/Seigaiha'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/demo-0001" element={<Demo0001 />} />
        <Route path="/demo-0001/great-wave" element={<GreatWave />} />
        <Route path="/demo-0001/starry-night" element={<StarryNight />} />
        <Route path="/demo-0001/seigaiha" element={<Seigaiha />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
