"use client"

import { MapPin, Phone, Clock } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

type PickupLocation = {
  id: string
  name: string
  address: string
  city: string
  phone: string | null
  opening_hours: Record<string, string> | null
  metadata: Record<string, any> | null
}

export default function PickupLocationInfo() {
  const [locations, setLocations] = useState<PickupLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/pickup-locations`)
      .then((res) => res.json())
      .then((data) => {
        setLocations(data.pickup_locations || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch pickup locations:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-ui-bg-subtle animate-pulse">
        <div className="h-4 bg-ui-bg-base rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-ui-bg-base rounded w-1/2"></div>
      </div>
    )
  }

  if (locations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mt-4">
      <Text className="text-sm font-medium text-ui-fg-base">
        Available Pickup Locations:
      </Text>
      {locations.map((location) => (
        <div
          key={location.id}
          className="p-4 border rounded-lg bg-ui-bg-subtle-hover"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="text-green-600" size={20} />
            </div>
            <div className="flex-1">
              <Text className="font-semibold text-ui-fg-base">
                {location.name}
              </Text>
              <div className="mt-2 space-y-1">
                <div className="flex items-start gap-2 text-sm text-ui-fg-subtle">
                  <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                  <span>
                    {location.address}, {location.city}
                  </span>
                </div>
                {location.phone && (
                  <div className="flex items-center gap-2 text-sm text-ui-fg-subtle">
                    <Phone size={16} className="flex-shrink-0" />
                    <span>{location.phone}</span>
                  </div>
                )}
                {location.opening_hours && (
                  <div className="mt-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Clock size={16} className="flex-shrink-0 mt-0.5 text-ui-fg-subtle" />
                      <div className="space-y-0.5">
                        <Text className="text-xs font-medium text-ui-fg-base">
                          Opening Hours:
                        </Text>
                        {Object.entries(location.opening_hours).map(
                          ([day, hours]) => (
                            <div
                              key={day}
                              className="flex gap-2 text-xs text-ui-fg-subtle"
                            >
                              <span className="capitalize w-20">{day}:</span>
                              <span>{hours}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {location.metadata?.landmark && (
                  <div className="mt-2 text-xs text-ui-fg-subtle italic">
                    📍 {location.metadata.landmark}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
