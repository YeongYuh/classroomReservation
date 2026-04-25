export interface ReservationForCancel {
  id: string
  status: string
  payment: { id: string; txnId: string | null; status: string } | null
  user: { email: string; name: string | null }
}

export interface BatchCancelClassification {
  needsRefund: ReservationForCancel[]
  noRefund: ReservationForCancel[]
  skip: ReservationForCancel[]
}

export function classifyForBatchCancellation(
  reservations: ReservationForCancel[]
): BatchCancelClassification {
  const needsRefund: ReservationForCancel[] = []
  const noRefund: ReservationForCancel[] = []
  const skip: ReservationForCancel[] = []

  for (const res of reservations) {
    if (res.status === 'CANCELLED' || res.status === 'ATTENDED') {
      skip.push(res)
      continue
    }

    const hasCompletedPayment =
      res.payment?.status === 'COMPLETED' && res.payment.txnId !== null

    if (res.status === 'PAID' && hasCompletedPayment) {
      needsRefund.push(res)
    } else {
      noRefund.push(res)
    }
  }

  return { needsRefund, noRefund, skip }
}
