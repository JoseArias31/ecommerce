import { supabase } from './supabaseClient'

/**
 * Updates the stock quantity for a product
 * @param {number} productId - The ID of the product to update
 * @param {number} quantity - The quantity to subtract from stock (positive number)
 * @returns {Promise<{error: Object | null, insufficientStock: boolean}>}
 */
export async function subtractProductStock(productId, quantity) {
  // Get current stock
  const { data: product, error: getError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single()
  
  if (getError) {
    console.error('Error getting product stock:', getError)
    return { error: getError, insufficientStock: false }
  }

  // Check if we have enough stock
  if (product.stock < quantity) {
    return { error: null, insufficientStock: true }
  }

  // Update stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: product.stock - quantity })
    .eq('id', productId)

  if (updateError) {
    console.error('Error updating product stock:', updateError)
    return { error: updateError, insufficientStock: false }
  }

  return { error: null, insufficientStock: false }
}

/**
 * Validates if there is sufficient stock for all items in an order
 * @param {Array<{product_id: number, quantity: number}>} items - Array of items with their quantities
 * @returns {Promise<{error: Object | null, insufficientStock: boolean, items: Array<{product_id: number, available: number}> | null}>}
 */
export async function validateOrderStock(items) {
  // Get product IDs
  const productIds = items.map(item => item.product_id)

  // Get current stock levels
  const { data: products, error } = await supabase
    .from('products')
    .select('id, stock')
    .in('id', productIds)

  if (error) {
    console.error('Error getting products stock:', error)
    return { error, insufficientStock: false, items: null }
  }

  // Check each item
  const insufficientStockItems = []
  for (const item of items) {
    const product = products.find(p => p.id === item.product_id)
    if (!product || product.stock < item.quantity) {
      insufficientStockItems.push({
        product_id: item.product_id,
        available: product?.stock || 0
      })
    }
  }

  if (insufficientStockItems.length > 0) {
    return { error: null, insufficientStock: true, items: insufficientStockItems }
  }

  return { error: null, insufficientStock: false, items: null }
}
