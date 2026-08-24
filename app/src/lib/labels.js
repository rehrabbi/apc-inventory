// Human-friendly labels for transaction-type enums, so screens never show raw values
// like EVENT_SALE or ADJUST_IN. Used by History and the Dashboard activity feed.
export const TXN_LABELS = {
  RECEIPT: 'Receipt',
  CUSTOMER_RETURN: 'Customer return',
  EVENT_RETURN: 'Event return',
  ADJUST_IN: 'Adjustment (in)',
  SALE: 'Sale',
  EVENT_SALE: 'Event sale',
  SAMPLE: 'Sample',
  DAMAGE: 'Damage',
  EXPIRED: 'Expired',
  CONSUMPTION: 'Internal use',
  SCRAP_RETURN: 'Scrapped return',
  ADJUST_OUT: 'Adjustment (out)',
  EVENT_RELEASE: 'Event release',
}

export const txnLabel = (t) => TXN_LABELS[t] || t
