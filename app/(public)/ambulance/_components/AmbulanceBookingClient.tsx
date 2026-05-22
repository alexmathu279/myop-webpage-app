'use client'

/**
 * app/(public)/ambulance/_components/AmbulanceBookingClient.tsx
 *
 * Import fixes:
 *   - bookAmbulance from @/lib/ambulance/actions (not queries — actions are write-only)
 *   - AMBULANCE_TYPE_LABELS, AMBULANCE_TYPE_DESCRIPTIONS, Ambulance from @/lib/ambulance/queries (read-only types/constants)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Navigation, Loader2, AlertCircle, Phone } from 'lucide-react'
import { bookAmbulance } from '@/lib/ambulance/actions'
import {
  AMBULANCE_TYPE_LABELS,
  AMBULANCE_TYPE_DESCRIPTIONS,
  type Ambulance,
} from '@/lib/ambulance/queries'

interface Props { ambulances: Ambulance[] }

const DESTINATION_HOSPITALS = [
  'Lakeshore Hospital, Kochi',
  'Aster Medcity, Kochi',
  'Amrita Institute of Medical Sciences, Kochi',
  'Medical Trust Hospital, Kochi',
  'KIMS Hospital, Thiruvananthapuram',
  'Other (specify below)',
]

export default function AmbulanceBookingClient({ ambulances }: Props) {
  const router = useRouter()

  const [pickupAddress, setPickupAddress] = useState('')
  const [destination,   setDestination]   = useState('')
  const [customDest,    setCustomDest]     = useState('')
  const [patientName,   setPatientName]    = useState('')
  const [patientPhone,  setPatientPhone]   = useState('')
  const [notes,         setNotes]          = useState('')
  const [detecting,     setDetecting]      = useState(false)
  const [submitting,    setSubmitting]     = useState(false)
  const [error,         setError]          = useState('')
  const [pickupLat,     setPickupLat]      = useState<number | undefined>()
  const [pickupLng,     setPickupLng]      = useState<number | undefined>()

  function detectLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setPickupLat(pos.coords.latitude)
        setPickupLng(pos.coords.longitude)
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          )
          const data = await res.json()
          setPickupAddress(data.display_name ?? `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        } catch {
          setPickupAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        }
        setDetecting(false)
      },
      () => {
        setError('Could not detect location. Please type your address.')
        setDetecting(false)
      },
      { timeout: 10000 },
    )
  }

  async function handleSubmit() {
    const destFinal = destination === 'Other (specify below)' ? customDest.trim() : destination
    if (!pickupAddress.trim()) { setError('Please enter a pickup address.'); return }
    if (!destFinal)            { setError('Please select or enter a destination.'); return }
    if (!patientName.trim())   { setError('Please enter the patient name.'); return }
    if (!patientPhone.trim())  { setError('Please enter a phone number.'); return }

    setSubmitting(true)
    setError('')

    const result = await bookAmbulance({
      pickupAddress:    pickupAddress.trim(),
      pickupLat,
      pickupLng,
      destinationName:    destFinal,
      destinationAddress: destFinal,
      patientName:        patientName.trim(),
      patientPhone:       patientPhone.trim(),
      notes:              notes.trim() || undefined,
    })

    if (!result.success) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    router.push(`/ambulance/status/${result.data.bookingId}`)
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />{error}
        </div>
      )}

      {/* Emergency notice */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-2xl shrink-0">🚨</span>
        <div>
          <p className="font-semibold text-red-800 text-sm">For life-threatening emergencies</p>
          <p className="text-red-700 text-sm mt-0.5">
            Call <strong>108</strong> (National Ambulance Service) immediately.
          </p>
        </div>
      </div>

      {/* Available ambulances */}
      {ambulances.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Available ambulances near you</p>
          </div>
          <div className="divide-y divide-gray-100">
            {ambulances.map((amb) => (
              <div key={amb.id} className="flex items-start gap-4 px-5 py-3">
                <span className="text-2xl shrink-0 mt-0.5">🚑</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{AMBULANCE_TYPE_LABELS[amb.type]}</p>
                  <p className="text-xs text-gray-500">{AMBULANCE_TYPE_DESCRIPTIONS[amb.type]}</p>
                  {amb.current_area && (
                    <p className="text-xs text-teal-600 mt-0.5">📍 {amb.current_area}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{amb.vehicle_number}</p>
                  <p className="text-xs text-green-600 font-medium">Available</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ambulances.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          No ambulances are currently available in your area. Please call <strong>108</strong> for immediate assistance.
        </div>
      )}

      {/* Booking form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Booking Details</h2>

        {/* Pickup location */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            <MapPin size={12} className="inline mr-1" />
            Pickup Location <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <textarea
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Enter your pickup address…"
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            <button
              type="button"
              onClick={detectLocation}
              disabled={detecting}
              title="Detect my location"
              className="shrink-0 w-10 h-10 bg-teal-50 border border-teal-200 text-teal-600 rounded-lg flex items-center justify-center hover:bg-teal-100 transition-colors disabled:opacity-50 self-start mt-0.5"
            >
              {detecting ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            </button>
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Destination Hospital <span className="text-red-500">*</span>
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Select destination…</option>
            {DESTINATION_HOSPITALS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          {destination === 'Other (specify below)' && (
            <input
              type="text"
              value={customDest}
              onChange={(e) => setCustomDest(e.target.value)}
              placeholder="Hospital name and address"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          )}
        </div>

        {/* Patient details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Patient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Full name"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              <Phone size={12} className="inline mr-1" />
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="9876543210"
              maxLength={10}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Additional notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Patient condition, floor number, special requirements…"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 bg-red-600 text-white rounded-xl font-bold text-base hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {submitting
            ? <><Loader2 size={18} className="animate-spin" />Booking…</>
            : '🚑 Book Ambulance Now'
          }
        </button>
      </div>
    </div>
  )
}