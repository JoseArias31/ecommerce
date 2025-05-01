import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import {supabase} from "../../../lib/supabaseClient" // Adjust the import path as necessary

// Initialize Supabase client

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Fetch user details
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Fetch user's orders
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (ordersError) {
      return NextResponse.json({ error: "Failed to fetch orders data" }, { status: 500 })
    }

    // Fetch user's payments
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (paymentsError) {
      return NextResponse.json({ error: "Failed to fetch payments data" }, { status: 500 })
    }

    // If there are orders, fetch related data
    let orderItemsData = []
    let shippingAddressesData = []

    if (ordersData && ordersData.length > 0) {
      const orderIds = ordersData.map((order) => order.id)

      // Fetch order items
      const { data: items, error: itemsError } = await supabase.from("order_items").select("*").in("order_id", orderIds)

      if (!itemsError) {
        orderItemsData = items
      }

      // Fetch shipping addresses
      const { data: addresses, error: addressesError } = await supabase
        .from("shipping_addresses")
        .select("*")
        .in("order_id", orderIds)

      if (!addressesError) {
        shippingAddressesData = addresses
      }
    }

    return NextResponse.json({
      user: userData,
      orders: ordersData || [],
      payments: paymentsData || [],
      orderItems: orderItemsData,
      shippingAddresses: shippingAddressesData,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
