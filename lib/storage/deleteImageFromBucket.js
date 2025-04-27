import { supabase } from "@/lib/supabaseClient";

/**
 * Delete an image from a Supabase Storage bucket.
 * @param {string} imageUrl - The public URL or path of the image in the bucket (e.g. 'images/product-123.jpg')
 * @param {string} [bucket="images"] - The bucket name (default: 'images')
 * @returns {Promise<{ error: any }>} error will be null if successful
 */
export async function deleteImageFromBucket(imageUrl, bucket = "images") {
  // imageUrl could be a full public URL or a path. Extract the path relative to the bucket.
  let path = imageUrl;
  // If full URL, extract path after bucket name
  const bucketUrlIndex = imageUrl.indexOf(`/${bucket}/`);
  if (bucketUrlIndex !== -1) {
    path = imageUrl.substring(bucketUrlIndex + bucket.length + 2); // +2 for the two slashes
  }
  // Remove any leading slashes
  path = path.replace(/^\/+/, "");
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error };
}
