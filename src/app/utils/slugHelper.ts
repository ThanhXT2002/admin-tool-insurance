import slugify from 'slugify'


slugify.extend({
  '₫': 'vnd',
  '%': 'phan-tram',
  '&': 'va',
  '@': 'at',
  '©': 'copyright',
  '®': 'registered',
  '™': 'trademark'
})


// Default options for Vietnamese slugs
const defaultOptions: Parameters<typeof slugify>[1] = {
  lower: true,
  locale: 'vi',
  strict: true,
  trim: true
}


/**
 * Create SEO-friendly slug from Vietnamese text
 */
export function createSlug(text: string, options?: Parameters<typeof slugify>[1]): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return slugify(text, Object.assign({}, defaultOptions, options))
}
