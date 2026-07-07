import { APIProvider } from '@vis.gl/react-google-maps'
import type { ReactNode } from 'react'
import { GOOGLE_MAPS_API_KEY } from '../../config/googleMaps'

type Props = {
  children: ReactNode
}

export function GoogleMapsProvider({ children }: Props) {
  if (!GOOGLE_MAPS_API_KEY) {
    return <>{children}</>
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
      {children}
    </APIProvider>
  )
}
