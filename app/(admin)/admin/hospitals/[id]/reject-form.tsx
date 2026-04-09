'use client'

import { useState } from 'react'
import type { ActionResult } from '@/types/dto'

export default function RejectForm({
  hospitalId,
  action,
}: {
  hospitalId: string
  action: (formData: FormData) => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: 12,
          height: 36, padding: '0 16px',
          background: '#ef4444', color: '#fff',
          border: 'none', borderRadius: 6,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        ✗ Reject
      </button>
    )
  }

  return (
    <form action={action as any} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
      <input type="hidden" name="hospital_id" value={hospitalId} />
      <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
        Reason for rejection <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <textarea
        name="rejection_reason"
        rows={3}
        required
        placeholder="Explain why this application is being rejected (min 10 characters)…"
        style={{ padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ height: 36, padding: '0 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Confirm rejection
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ height: 36, padding: '0 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  )
}