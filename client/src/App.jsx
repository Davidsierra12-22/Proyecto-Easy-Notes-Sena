import { Suspense } from 'react'
import Rutas from './router'

export default function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    }>
      <Rutas />
    </Suspense>
  )
}