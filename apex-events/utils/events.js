export const EVENT_TYPES = [
  'Conference',
  'Seminar',
  'Music',
  'Sports',
  'Fashion',
  'Technology',
  'Social',
  'Other',
]

const BANNER_TYPES = new Set(['music', 'sports', 'fashion', 'technology', 'social', 'conference'])

export const bannerClass = (type) => {
  const t = (type || '').toLowerCase()
  return BANNER_TYPES.has(t) ? t : 'default'
}

export const formatMoney = (value) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value || 0)
