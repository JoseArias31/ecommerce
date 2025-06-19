import { supabase } from './supabaseClient'

/**
 * Updates the stock quantity for a product
 * @param {number} productId - The ID of the product to update
 * @param {number} quantity - The quantity to subtract from stock (positive number)
 * @returns {Promise<{error: Object | null, insufficientStock: boolean}>}
 */
export async function subtractProductStock(productId, quantity) {
  // Atomic update: decrement stock only if enough is available
  const { data, error } = await supabase.rpc('decrement_stock_if_enough', {
    product_id: productId,
    decrement_by: quantity
  });

  if (error) {
    console.error('Error updating product stock atomically:', error);
    return { error, insufficientStock: false };
  }

  // If data is false, not enough stock
  if (data === false) {
    console.warn(`Insufficient stock for product ${productId} (atomic check)`);
    return { error: null, insufficientStock: true };
  }

  return { error: null, insufficientStock: false };
}

// ---
// You must create the following Postgres function in your Supabase database:
//
// CREATE OR REPLACE FUNCTION decrement_stock_if_enough(product_id integer, decrement_by integer)
// RETURNS boolean AS $$
// DECLARE
//   updated integer;
// BEGIN
//   UPDATE products
//   SET stock = stock - decrement_by
//   WHERE id = product_id AND stock >= decrement_by;
//   GET DIAGNOSTICS updated = ROW_COUNT;
//   RETURN updated > 0;
// END;
// $$ LANGUAGE plpgsql VOLATILE;
// ---
// This ensures atomic, race-condition-safe stock subtraction.




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
