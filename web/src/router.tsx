import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NewPost from './pages/NewPost'
import NewDrawing from './pages/NewDrawing'
import PostDetail from './pages/PostDetail'
import Tarot from './pages/Tarot'
import Profile from './pages/Profile'
import MyFavorites from './pages/MyFavorites'
import Wordle from './pages/Wordle'
import Stories from './pages/Stories'
import StoryDetail from './pages/StoryDetail'
import MoodHeatmap from './pages/MoodHeatmap'
import Garden from './pages/Garden'
import TimeCapsules from './pages/TimeCapsules'
import EchoRoom from './pages/EchoRoom'

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/new" element={<NewPost />} />
      <Route path="/new-drawing" element={<NewDrawing />} />
      <Route path="/post/:id" element={<PostDetail />} />
      <Route path="/tarot" element={<Tarot />} />
      <Route path="/wordle" element={<Wordle />} />
      <Route path="/stories" element={<Stories />} />
      <Route path="/stories/:id" element={<StoryDetail />} />
      <Route path="/moods" element={<MoodHeatmap />} />
      <Route path="/garden" element={<Garden />} />
      <Route path="/garden/:userId" element={<Garden />} />
      <Route path="/capsules" element={<TimeCapsules />} />
      <Route path="/echo" element={<EchoRoom />} />
      <Route path="/echo/:date" element={<EchoRoom />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/me/favorites" element={<MyFavorites />} />
    </Routes>
  )
}
