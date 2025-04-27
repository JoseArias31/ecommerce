import { supabase } from '../../lib/supabaseClient';

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log("Error signing out user:", error.message);
    return { success: false, error };
  }

  return { success: true, error: null }; // Indicate that the sign-out was successful
};
