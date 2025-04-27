import { supabase } from '../../lib/supabaseClient';

export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.log("Error fetching user:", error.message);
    return null;
  }

  if (user) {
    // User is logged in, return the user data
    return user;
  } else {
    // User is not logged in, handle accordingly
    console.log("User is not logged in");
    return null;
  }
};


