'use client'

import { deleteDoctor } from '@/lib/hospital/actions'

export default function DeleteDoctorButton({ doctorId }: { doctorId: string }) {
  return (
    <form action={deleteDoctor}>
      <input type="hidden" name="doctor_id" value={doctorId} />
      <button
        type="submit"
        className="delete-btn"
        onClick={e => {
          if (!confirm('Remove this doctor?')) e.preventDefault()
        }}
      >
        Remove
      </button>
    </form>
  )
}