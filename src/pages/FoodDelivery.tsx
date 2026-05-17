import { useState, useEffect } from "react";
import Header from "@/components/Header";
import FoodOrderTracker from "@/components/FoodOrderTracker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Utensils, ShoppingCart, Star, Leaf, Search, X, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Restaurant {
  id: string;
  name: string;
  station_code: string;
  cuisine_type: string;
  rating: number;
  image_url: string | null;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_vegetarian: boolean;
  is_available: boolean;
  image_url: string | null;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function FoodDelivery() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [pnr, setPnr] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    const { data } = await supabase.from("restaurants").select("*").eq("is_active", true);
    setRestaurants((data as Restaurant[]) || []);
    setLoading(false);
  };

  const fetchMenu = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    const { data } = await supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).eq("is_available", true);
    setMenuItems((data as MenuItem[]) || []);
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)).filter((c) => c.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const finalTotal = Math.max(0, cartTotal - voucherDiscount);

  const applyVoucher = async () => {
    if (!voucherCode || !user) return;
    const { data } = await supabase
      .from("delay_compensations")
      .select("*")
      .eq("user_id", user.id)
      .eq("voucher_code", voucherCode)
      .eq("status", "issued")
      .eq("compensation_type", "food_voucher")
      .maybeSingle();
    if (data) {
      setVoucherDiscount(data.amount as number);
      toast.success(`Voucher applied! ₹${data.amount} discount`);
    } else {
      toast.error("Invalid or already used voucher");
    }
  };

  const placeOrder = async () => {
    if (!user || !pnr || cart.length === 0) {
      toast.error("Please enter PNR and add items to cart");
      return;
    }

    const { error } = await supabase.from("food_orders").insert({
      user_id: user.id,
      pnr,
      items: cart.map((c) => ({ name: c.name, qty: c.quantity, price: c.price })),
      total_price: finalTotal,
      delivery_station: selectedRestaurant?.station_code || "",
      status: "placed",
    });

    if (error) {
      toast.error("Failed to place order");
      return;
    }

    // Mark voucher as redeemed if used
    if (voucherCode && voucherDiscount > 0) {
      await supabase
        .from("delay_compensations")
        .update({ status: "redeemed", redeemed_at: new Date().toISOString() } as any)
        .eq("voucher_code", voucherCode)
        .eq("user_id", user.id);
    }

    toast.success("Order placed successfully! 🎉");
    setCart([]);
    setShowCart(false);
    setVoucherCode("");
    setVoucherDiscount(0);
  };

  const filteredRestaurants = stationFilter
    ? restaurants.filter((r) => r.station_code.toLowerCase().includes(stationFilter.toLowerCase()) || r.name.toLowerCase().includes(stationFilter.toLowerCase()))
    : restaurants;

  const categories = [...new Set(menuItems.map((m) => m.category))];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" /> Food Delivery
          </h1>
          <button onClick={() => setShowCart(!showCart)} className="relative">
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        <FoodOrderTracker />

        {/* Cart Overlay */}
        <AnimatePresence>
          {showCart && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-card rounded-xl p-5 border border-border mb-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Your Cart</h3>
                <button onClick={() => setShowCart(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold text-muted-foreground">PNR Number</label>
                <input value={pnr} onChange={(e) => setPnr(e.target.value)} placeholder="Enter your PNR" className="w-full mt-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm" />
              </div>

              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Cart is empty</p>
              ) : (
                <>
                  {cart.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">₹{c.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(c.id, -1)} className="w-6 h-6 rounded bg-secondary text-foreground text-sm font-bold">-</button>
                        <span className="text-sm font-bold w-5 text-center">{c.quantity}</span>
                        <button onClick={() => updateQuantity(c.id, 1)} className="w-6 h-6 rounded bg-primary text-primary-foreground text-sm font-bold">+</button>
                      </div>
                    </div>
                  ))}

                  {/* Voucher */}
                  <div className="mt-3 flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="Voucher code" className="w-full bg-secondary/50 border border-border rounded-lg pl-8 pr-3 py-2 text-sm" />
                    </div>
                    <Button onClick={applyVoucher} variant="outline" size="sm">Apply</Button>
                  </div>

                  <div className="mt-3 border-t border-border pt-3 space-y-1">
                    <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{cartTotal}</span></div>
                    {voucherDiscount > 0 && <div className="flex justify-between text-sm text-success"><span>Voucher Discount</span><span>-₹{voucherDiscount}</span></div>}
                    <div className="flex justify-between text-base font-bold"><span>Total</span><span>₹{finalTotal}</span></div>
                  </div>

                  <Button onClick={placeOrder} className="w-full mt-3 bg-accent text-accent-foreground">Place Order • ₹{finalTotal}</Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restaurant or Menu View */}
        {!selectedRestaurant ? (
          <>
            <div className="mb-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={stationFilter} onChange={(e) => setStationFilter(e.target.value)} placeholder="Search by station code or restaurant name..." className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm" />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No restaurants found. Check back later!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRestaurants.map((r) => (
                  <motion.button key={r.id} onClick={() => fetchMenu(r)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-card rounded-xl p-4 border border-border text-left hover:border-primary/30 transition-all" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{r.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.cuisine_type} • Station: {r.station_code}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded">
                        <Star className="w-3 h-3 text-success fill-success" />
                        <span className="text-xs font-bold text-success">{r.rating}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={() => { setSelectedRestaurant(null); setMenuItems([]); }} className="text-sm text-primary font-medium mb-4 block">← Back to Restaurants</button>
            <div className="bg-primary rounded-xl p-4 mb-5 text-primary-foreground">
              <h2 className="text-lg font-bold">{selectedRestaurant.name}</h2>
              <p className="text-xs opacity-70">{selectedRestaurant.cuisine_type} • Station: {selectedRestaurant.station_code}</p>
            </div>

            {categories.map((cat) => (
              <div key={cat} className="mb-5">
                <h3 className="text-sm font-bold text-foreground mb-2">{cat}</h3>
                <div className="space-y-2">
                  {menuItems.filter((m) => m.category === cat).map((item) => (
                    <div key={item.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between" style={{ boxShadow: "var(--shadow-card)" }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {item.is_vegetarian && <Leaf className="w-3.5 h-3.5 text-success" />}
                          <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        </div>
                        {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                        <p className="text-sm font-bold text-foreground mt-1">₹{item.price}</p>
                      </div>
                      <Button onClick={() => addToCart(item)} size="sm" className="bg-accent text-accent-foreground text-xs">ADD</Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {menuItems.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No menu items available</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
