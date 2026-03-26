'use client'

import { deleteService } from '@/lib/hospital/actions'

export default function DeleteServiceButton({ serviceId }: { serviceId: string }) {
  return (
    <form action={deleteService} style={{ display: 'inline' }}>
      <input type="hidden" name="service_id" value={serviceId} />
      <button
        type="submit"
        className="icon-btn icon-btn--danger"
        onClick={e => {
          if (!confirm('Remove this service?')) e.preventDefault()
        }}
      >
        Remove
      </button>
    </form>
  )
}