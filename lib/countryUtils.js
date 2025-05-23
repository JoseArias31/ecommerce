import { supabase } from './supabaseClient';

/**
 * Fetch products filtered by country
 * @param {string} countryCode - Two-letter country code (e.g., 'CA', 'CO')
 * @param {Object} options - Additional options for filtering
 * @param {string} options.category - Filter by product category
 * @param {number} options.limit - Limit number of products returned
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.sortBy - Field to sort by
 * @param {boolean} options.ascending - Sort order (true for ascending, false for descending)
 * @returns {Promise<{data: Array, error: Object}>} - Supabase response with data and error
 */
export async function fetchProductsByCountry(countryCode, options = {}) {
  const {
    category,
    limit = 100,
    offset = 0,
    sortBy = 'created_at',
    ascending = false
  } = options;

  let query = supabase
    .from('products')
    .select('*')
    .contains('country_availability', [countryCode])
    .order(sortBy, { ascending })
    .range(offset, offset + limit - 1);

  // Add category filter if provided
  if (category) {
    query = query.eq('category', category);
  }

  return await query;
}

/**
 * Format price according to country locale and currency
 * @param {number} price - The product price
 * @param {Object} countryData - Country data containing locale and currency
 * @returns {string} - Formatted price string
 */
export function formatPriceForCountry(price, countryData) {
  return new Intl.NumberFormat(countryData.locale, {
    style: 'currency',
    currency: countryData.currency
  }).format(price);
}

/**
 * Get all available countries from Supabase
 * @returns {Promise<{data: Array, error: Object}>} - Supabase response with data and error
 */
export async function fetchAvailableCountries() {
  return await supabase
    .from('countries')
    .select('*')
    .order('name');
}

/**
 * Add or update a product with country availability
 * @param {Object} product - Product data
 * @param {Array<string>} countryAvailability - Array of country codes
 * @returns {Promise<{data: Object, error: Object}>} - Supabase response
 */
export async function saveProductWithCountryAvailability(product, countryAvailability) {
  const productData = {
    ...product,
    country_availability: countryAvailability
  };

  if (product.id) {
    // Update existing product
    return await supabase
      .from('products')
      .update(productData)
      .eq('id', product.id);
  } else {
    // Insert new product
    return await supabase
      .from('products')
      .insert(productData);
  }
}
