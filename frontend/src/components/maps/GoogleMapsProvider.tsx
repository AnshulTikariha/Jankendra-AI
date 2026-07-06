import { APIProvider } from '@vis.gl/react-google-maps'
import type { ReactNode } from 'react'
import { GOOGLE_MAPS_API_KEY } from '../../config/googleMaps'

type Props = {
  children: ReactNode
}

export function GoogleMapsProvider({ children }: Props) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Google Maps API key is missing. Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in{' '}
        <code>frontend/.env</code>.
      </div>
    )
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
      {children}
    </APIProvider>
  )
}
