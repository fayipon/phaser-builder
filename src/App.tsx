import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Demo0001 from './pages/demos/Demo0001'
import GreatWave from './pages/demos/GreatWave'
import StarryNight from './pages/demos/StarryNight'
import Seigaiha from './pages/demos/Seigaiha'
import Demo0002 from './pages/demos/Demo0002'
import Demo0003 from './pages/demos/Demo0003'
import Demo0004 from './pages/demos/Demo0004'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/demo-0001" element={<Demo0001 />} />
        <Route path="/demo-0001/great-wave" element={<GreatWave />} />
        <Route path="/demo-0001/starry-night" element={<StarryNight />} />
        <Route path="/demo-0001/seigaiha" element={<Seigaiha />} />
        <Route path="/demo-0002" element={<Demo0002 />} />
        <Route path="/demo-0003" element={<Demo0003 />} />
        <Route path="/demo-0004" element={<Demo0004 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
