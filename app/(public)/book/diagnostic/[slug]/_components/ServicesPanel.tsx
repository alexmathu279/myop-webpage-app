'use client'

/**
 * app/(public)/book/diagnostic/[slug]/_components/ServicesPanel.tsx
 *
 * Client Component — handles:
 *   - Service selection (cart-style multi-select)
 *   - Collection type (walk-in or home)
 *   - Date picker
 *   - Login gate modal for guests
 *   - Proceed to confirm navigation
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FlaskConical, Home, Building2, Calendar,
  ShoppingCart, X, Check, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiagnosticServiceGroup, DiagnosticService } from '@/lib/booking/diagnostic'

interface Props {
  serviceGroups: DiagnosticServiceGroup[]
  centreSlug:    string
  centreId:      string
  isLoggedIn:    boolean
}

type CollectionType = 'walkin' | 'home'

export default function ServicesPanel({
  serviceGroups,
  centreSlug,
  isLoggedIn,
}: Props) {
  const router = useRouter()

  // Cart state
  const [selected, setSelected] = useState<Map<string, DiagnosticService>>(new Map())
  const [collectionType, setCollectionType] = useState<CollectionType>('walkin')
  const [selectedDate, setSelectedDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(serviceGroups.map((g) => g.category))  // all expanded by default
  )

  // Derived values
  const selectedList  = Array.from(selected.values())
  const totalPrice    = selectedList.reduce((sum, s) => sum + s.price, 0)
  const hasSelection  = selected.size > 0
  const homeEligible  = selectedList.every((s) => s.is_home_collection)
  const canSelectHome = selectedList.length > 0 && homeEligible

  // If home is selected but cart now has non-home services, reset to walkin
  const effectiveType = collectionType === 'home' && !canSelectHome ? 'walkin' : collectionType

  function toggleService(service: DiagnosticService) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(service.id)) {
        next.delete(service.id)
      } else {
        next.set(service.id, service)
      }
      return next
    })
  }

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function removeFromCart(id: string) {
    setSelected((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }

  function handleProceed() {
    if (!hasSelection) return
    if (!selectedDate) {
      alert('Please select a date.')
      return
    }
    if (!isLoggedIn) {
      setShowModal(true)
      return
    }
    navigateToConfirm()
  }

  function navigateToConfirm() {
    const serviceIds = Array.from(selected.keys()).join(',')
    const params = new URLSearchParams({
      centre:   centreSlug,
      services: serviceIds,
      type:     effectiveType,
      date:     selectedDate,
    })
    router.push(`/book/confirm/diagnostic?${params.toString()}`)
  }

  // Login/signup redirect — preserve confirm URL as redirectTo
  function getRedirectTo(): string {
    const serviceIds = Array.from(selected.keys()).join(',')
    const params = new URLSearchParams({
      centre:   centreSlug,
      services: serviceIds,
      type:     effectiveType,
      date:     selectedDate,
    })
    return `/book/confirm/diagnostic?${params.toString()}`
  }

  function goToLogin() {
    setShowModal(false)
    router.push(`/auth/login?redirectTo=${encodeURIComponent(getRedirectTo())}`)
  }

  function goToSignup() {
    setShowModal(false)
    router.push(`/auth/signup?redirectTo=${encodeURIComponent(getRedirectTo())}`)
  }

  // Min date = tomorrow (no same-day booking for diagnostics)
  const minDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })()

  // Max date = 30 days from today
  const maxDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })()

  if (serviceGroups.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <FlaskConical size={40} className="mx-auto mb-4 opacity-30" />
        <p className="font-medium">No tests available at this centre yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">

      {/* ── Services list ── */}
      <div className="flex-1 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Available Tests</h2>

        {serviceGroups.map((group) => (
          <div key={group.category} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggleCategory(group.category)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FlaskConical size={16} className="text-cyan-600" />
                <span className="font-semibold text-gray-900">{group.category}</span>
                <span className="text-xs text-gray-400 ml-1">({group.services.length})</span>
              </div>
              {expandedCategories.has(group.category)
                ? <ChevronUp size={16} className="text-gray-400" />
                : <ChevronDown size={16} className="text-gray-400" />
              }
            </button>

            {/* Services in category */}
            {expandedCategories.has(group.category) && (
              <div className="divide-y divide-gray-100">
                {group.services.map((service) => {
                  const isSelected = selected.has(service.id)
                  return (
                    <div
                      key={service.id}
                      className={cn(
                        'flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors',
                        isSelected ? 'bg-cyan-50' : 'hover:bg-gray-50',
                      )}
                      onClick={() => toggleService(service)}
                    >
                      {/* Checkbox */}
                      <div className={cn(
                        'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'bg-cyan-600 border-cyan-600'
                          : 'border-gray-300 bg-white',
                      )}>
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>

                      {/* Service info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{service.name}</p>
                            {service.code && (
                              <p className="text-xs text-gray-400 mt-0.5">{service.code}</p>
                            )}
                          </div>
                          <p className="font-bold text-gray-900 shrink-0">
                            ₹{service.price.toLocaleString('en-IN')}
                          </p>
                        </div>

                        {service.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {service.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                          {service.report_tat_hrs && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              Report in {service.report_tat_hrs}h
                            </span>
                          )}
                          {service.preparation && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                              Preparation required
                            </span>
                          )}
                          {service.is_home_collection && (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Home size={10} />
                              Home collection
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Sticky cart ── */}
      <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Cart header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <ShoppingCart size={18} className="text-cyan-600" />
            <span className="font-semibold text-gray-900">
              Selected Tests ({selected.size})
            </span>
          </div>

          {/* Cart items */}
          {selected.size === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              <FlaskConical size={28} className="mx-auto mb-2 opacity-30" />
              Select tests from the list
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {selectedList.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500">₹{s.price.toLocaleString('en-IN')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(s.id)}
                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {hasSelection && (
            <div className="px-5 py-4 space-y-4 border-t border-gray-100">

              {/* Collection type */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Collection type
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCollectionType('walkin')}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-colors',
                      effectiveType === 'walkin'
                        ? 'bg-cyan-600 border-cyan-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-cyan-300',
                    )}
                  >
                    <Building2 size={16} />
                    Walk-in
                  </button>
                  <button
                    type="button"
                    disabled={!canSelectHome}
                    onClick={() => canSelectHome && setCollectionType('home')}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-colors',
                      effectiveType === 'home'
                        ? 'bg-cyan-600 border-cyan-600 text-white'
                        : canSelectHome
                          ? 'bg-white border-gray-200 text-gray-600 hover:border-cyan-300'
                          : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed',
                    )}
                  >
                    <Home size={16} />
                    Home
                  </button>
                </div>
                {!canSelectHome && selectedList.some((s) => !s.is_home_collection) && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    Some selected tests don&apos;t support home collection.
                  </p>
                )}
              </div>

              {/* Date picker */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <Calendar size={11} className="inline mr-1" />
                  Select date
                </p>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Proceed button */}
              <button
                type="button"
                onClick={handleProceed}
                disabled={!selectedDate}
                className={cn(
                  'w-full h-11 rounded-xl font-semibold text-sm transition-all',
                  selectedDate
                    ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                )}
              >
                {isLoggedIn ? 'Proceed to confirm →' : 'Sign in to book →'}
              </button>

              {!isLoggedIn && (
                <p className="text-xs text-gray-400 text-center">
                  You&apos;ll be asked to sign in to complete your booking.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Login modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="text-4xl mb-3">🧪</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to book</h2>
            <p className="text-sm text-gray-500 mb-4">
              Sign in to confirm your lab test booking. Your selected tests will be saved.
            </p>

            <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-2 text-sm text-cyan-700 mb-5">
              {selected.size} test{selected.size !== 1 ? 's' : ''} · ₹{totalPrice.toLocaleString('en-IN')}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={goToLogin}
                className="h-11 bg-cyan-600 text-white rounded-xl font-semibold text-sm hover:bg-cyan-700 transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={goToSignup}
                className="h-11 bg-gray-50 text-gray-800 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Create free account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}