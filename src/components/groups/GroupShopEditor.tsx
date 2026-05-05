"use client";
import React, { useState, useEffect } from "react";
import { Group } from "@/types/group";
import { Product, ShopOrder, OrderStatus } from "@/types/shop";
import { shopService } from "@/lib/firebase/shopService";
import { groupService } from "@/lib/firebase/groupService";
import { chatService } from "@/lib/firebase/chatService";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import GroupShopItemEditor from "./GroupShopItemEditor";
import { toast } from "sonner";

interface GroupShopEditorProps {
  group: Group;
}

type AdminTab = "products" | "orders" | "info";
type ProductFilter = "All" | "Active" | "Stopped" | "SoldOut";

const CURRENCY_SYMBOL: Record<string, string> = { KRW: "₩", USD: "$", EUR: "€" };
const getCurrencySymbol = (c: string) => CURRENCY_SYMBOL[c] || c + " ";

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
  PAYMENT_REPORTED: { label: "Reported", color: "text-orange-700", bg: "bg-orange-100" },
  CONFIRMED: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-100" },
  IN_PRODUCTION: { label: "In Production", color: "text-purple-700", bg: "bg-purple-100" },
  READY_PICKUP: { label: "Ready", color: "text-teal-700", bg: "bg-teal-100" },
  SHIPPING: { label: "Shipping", color: "text-indigo-700", bg: "bg-indigo-100" },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-100" },
  EXPIRED: { label: "Expired", color: "text-gray-700", bg: "bg-gray-100" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-100" },
};

const GroupShopEditor: React.FC<GroupShopEditorProps> = ({ group }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [productFilter, setProductFilter] = useState<ProductFilter>("All");
  const [orderFilter, setOrderFilter] = useState<string>("ALL");
  const [editingItem, setEditingItem] = useState<Product | undefined>(undefined);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState("");

  // Shop Info state
  const [shopSettings, setShopSettings] = useState(group.shopSettings || {
    deliveryType: 'both' as const,
    defaultShippingFee: 0,
    currency: 'KRW',
    returnPolicy: 'Exchange/return is available within 7 days of receipt. Items with signs of use are not eligible.',
  });
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Format number with comma separators
  const formatNumber = (n: number | undefined) => n ? n.toLocaleString() : '';
  const parseFormattedNumber = (s: string) => Number(s.replace(/,/g, '')) || 0;

  // Subscribe to products
  useEffect(() => {
    if (!group.id) return;
    const unsub = shopService.subscribeGroupProducts(group.id, setProducts);
    return () => unsub();
  }, [group.id]);

  // Subscribe to orders
  useEffect(() => {
    if (!group.id) return;
    const unsub = shopService.subscribeGroupOrders(group.id, setOrders);
    return () => unsub();
  }, [group.id]);

  // Product filtering
  const filteredProducts = products.filter(p => {
    if (productFilter === "All") return true;
    return p.status === productFilter;
  });

  // Order filtering
  const filteredOrders = orders.filter(o => {
    if (orderFilter === "ALL") return true;
    return o.status === orderFilter;
  });

  const pendingOrderCount = orders.filter(o => o.status === 'PENDING' || o.status === 'PAYMENT_REPORTED').length;

  // Product toggle
  const handleToggleStatus = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    const newStatus = product.status === "Active" ? "Stopped" : "Active";
    try {
      await shopService.toggleProductStatus(product.id, newStatus);
      toast.success(newStatus === "Active" ? "Item is now on sale." : "Item sale stopped.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Order actions
  const handleOrderAction = async (orderId: string, newStatus: OrderStatus, extras?: Record<string, any>) => {
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      await shopService.updateOrderStatus(orderId, newStatus, extras);
      
      const labels: Record<string, string> = {
        CONFIRMED: "Payment confirmed.",
        IN_PRODUCTION: "Production started.",
        READY_PICKUP: "Ready for pickup.",
        SHIPPING: "Shipment started.",
        COMPLETED: "Order completed.",
        CANCELLED: "Order cancelled.",
      };
      toast.success(labels[newStatus] || "Status updated.");

      // Automated Chat Notification to Buyer
      if (targetOrder && targetOrder.buyerId) {
        try {
          const sellerId = targetOrder.sellerId || group.id;
          const roomId = await chatService.getOrCreatePrivateRoom([targetOrder.buyerId, sellerId], sellerId, 'business');
          
          let chatMsg = "";
          switch (newStatus) {
            case "CONFIRMED":
              chatMsg = `✅ [입금 확인 완료]\n주문번호: ${targetOrder.orderNumber}\n입금이 확인되었습니다. 곧 제작/배송을 시작합니다. 감사합니다!`;
              break;
            case "IN_PRODUCTION":
              chatMsg = `🛠 [제작 시작]\n주문번호: ${targetOrder.orderNumber}\n상품 제작을 시작했습니다. 완료되면 다시 알려드릴게요.`;
              break;
            case "READY_PICKUP":
              chatMsg = `🏪 [픽업 준비 완료]\n주문번호: ${targetOrder.orderNumber}\n상품이 준비되었습니다! 매장에 방문하여 수령해 주세요.`;
              break;
            case "SHIPPING":
              chatMsg = `🚚 [배송 시작]\n주문번호: ${targetOrder.orderNumber}\n상품 배송이 시작되었습니다.\n운송장번호: ${extras?.trackingNumber || '정보 없음'}`;
              break;
            case "COMPLETED":
              chatMsg = `🏁 [거래 완료]\n주문번호: ${targetOrder.orderNumber}\n모든 거래가 완료되었습니다. 이용해 주셔서 감사합니다!`;
              break;
            case "CANCELLED":
              chatMsg = `❌ [주문 취소]\n주문번호: ${targetOrder.orderNumber}\n주문이 취소되었습니다.`;
              break;
          }

          if (chatMsg) {
            await chatService.sendMessage({
              roomId,
              senderId: sellerId,
              senderName: group.name,
              text: chatMsg,
              type: 'text'
            });
          }
        } catch (chatErr) {
          console.error("Failed to send seller action chat notification:", chatErr);
        }
      }

      if (newStatus === "SHIPPING") {
        setShippingOrderId(null);
        setTrackingNumberInput("");
      }
    } catch {
      toast.error("Failed to update order.");
    }
  };

  // Save shop info
  const handleSaveShopInfo = async () => {
    setIsSavingInfo(true);
    try {
      await groupService.updateGroupMetadata(group.id, { shopSettings } as any);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch {
      toast.error("Failed to save.");
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Tab bar
  const tabs: { id: AdminTab; label: string; icon: string; badge?: number }[] = [
    { id: "products", label: "Products", icon: "inventory_2" },
    { id: "orders", label: "Orders", icon: "receipt_long", badge: pendingOrderCount },
    { id: "info", label: "Shop Info", icon: "settings" },
  ];

  return (
    <div className="bg-[#F1F5F9] text-[#242c51] antialiased pb-20 min-h-[max(884px,100dvh)] font-['Inter']">
      {/* Tab Bar */}
      <div className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-3xl mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? "text-[#0057bd] border-[#0057bd]"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
              {tab.badge ? (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* ===== PRODUCTS TAB ===== */}
        {activeTab === "products" && (
          <>
            {/* Filter */}
            <div className="bg-slate-200/50 p-1 rounded-xl flex items-center shadow-inner">
              {(["All", "Active", "Stopped", "SoldOut"] as ProductFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setProductFilter(f)}
                  className={`flex-1 py-2 px-2 rounded-lg font-['Plus_Jakarta_Sans'] font-bold text-xs transition-all text-center ${
                    productFilter === f ? "bg-white text-[#0057bd] shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f === "SoldOut" ? "Sold Out" : f}
                </button>
              ))}
            </div>

            {/* Add Button */}
            <button
              onClick={() => { setEditingItem(undefined); setShowItemEditor(true); }}
              className="w-full bg-[#0057bd] text-white font-['Plus_Jakarta_Sans'] font-bold py-3.5 px-6 rounded-xl shadow-md shadow-[#0057bd]/20 flex items-center justify-center gap-2 hover:bg-[#004ca6] transition-colors active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Item
            </button>

            {/* Product List */}
            <section className="space-y-4">
              {filteredProducts.map(product => (
                <article
                  key={product.id}
                  onClick={() => { setEditingItem(product); setShowItemEditor(true); }}
                  className={`bg-[#ffffff] rounded-xl p-4 shadow-sm border border-[#a3abd7]/10 flex gap-4 active:scale-[0.99] transition-transform cursor-pointer ${
                    product.status === 'Stopped' ? 'opacity-75' : ''
                  }`}
                >
                  <div className={`w-24 h-24 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 ${product.status === 'Stopped' ? 'grayscale' : ''}`}>
                    {(product.images?.[0] || product.imageUrl) ? (
                      <ImageWithFallback alt={product.title} className="w-full h-full object-cover" src={product.images?.[0] || product.imageUrl || ''} fallbackType="gallery" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-4xl">shopping_bag</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                        product.status === 'Active' ? 'text-[#0057bd] bg-[#6e9fff]/20' : 'text-slate-500 bg-slate-200'
                      }`}>{product.category || "Uncategorized"}</span>
                      <h3 className={`font-['Plus_Jakarta_Sans'] font-extrabold text-base leading-tight ${product.status === 'Active' ? 'text-[#242c51]' : 'text-slate-500'}`}>{product.title}</h3>
                      <p className={`text-xs font-medium mt-0.5 line-clamp-1 ${product.status === 'Active' ? 'text-[#515981]' : 'text-slate-400'}`}>{product.description}</p>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {product.discountPrice ? (
                          <>
                            <span className={`font-['Plus_Jakarta_Sans'] font-bold text-lg ${product.status === 'Active' ? 'text-red-600' : 'text-slate-400'}`}>
                              {getCurrencySymbol(product.currency)}{product.discountPrice.toLocaleString()}
                            </span>
                            <span className="font-['Plus_Jakarta_Sans'] font-medium text-xs text-slate-400 line-through">
                              {getCurrencySymbol(product.currency)}{product.price?.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className={`font-['Plus_Jakarta_Sans'] font-bold text-lg ${product.status === 'Active' ? 'text-[#0057bd]' : 'text-slate-400'}`}>
                            {getCurrencySymbol(product.currency)}{product.price?.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {product.stock !== undefined && (
                          <span className="text-[10px] font-semibold text-slate-400">Stock: {product.stock}</span>
                        )}
                        <div
                          onClick={(e) => handleToggleStatus(product, e)}
                          className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors ${product.status === 'Active' ? 'bg-[#0057bd]' : 'bg-slate-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${product.status === 'Active' ? 'right-0.5' : 'left-0.5'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {filteredProducts.length === 0 && (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory_2</span>
                  <p className="text-slate-500 font-medium text-sm">No items found.</p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ===== ORDERS TAB ===== */}
        {activeTab === "orders" && (
          <>
            {/* Order Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
              {[
                { key: "ALL", label: "All" },
                { key: "PENDING", label: "Pending" },
                { key: "CONFIRMED", label: "Confirmed" },
                { key: "IN_PRODUCTION", label: "Production" },
                { key: "SHIPPING", label: "Shipping" },
                { key: "COMPLETED", label: "Completed" },
                { key: "CANCELLED", label: "Cancelled" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setOrderFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    orderFilter === f.key ? "bg-[#0057bd] text-white" : "bg-white text-slate-500 border border-slate-200"
                  }`}
                >
                  {f.label}
                  {f.key === "PENDING" && pendingOrderCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[9px] rounded-full px-1.5">{pendingOrderCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Order List */}
            <section className="space-y-4">
              {filteredOrders.map(order => {
                const statusCfg = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.PENDING;
                return (
                  <article key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{order.orderNumber}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{order.buyerName} • {order.buyerPhone}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusCfg.color} ${statusCfg.bg}`}>{statusCfg.label}</span>
                      </div>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-3 mb-2">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <ImageWithFallback alt={item.title} src={item.image} className="w-full h-full object-cover" fallbackType="gallery" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <span className="material-symbols-outlined text-xl">shopping_bag</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.option} × {item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{getCurrencySymbol(order.currency)}{item.price.toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                        <span className="text-xs font-semibold text-slate-500">Total</span>
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#0057bd]">{getCurrencySymbol(order.currency)}{order.totalAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Action buttons */}
                    {order.status === "PENDING" && (
                      <div className="bg-amber-50 px-4 py-3 border-t border-amber-100 flex justify-between items-center">
                        <button onClick={() => {
                          if (confirm("Cancel this order?")) handleOrderAction(order.id, "CANCELLED");
                        }} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                          Cancel Order
                        </button>
                        <button onClick={() => handleOrderAction(order.id, "CONFIRMED")} className="bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-amber-700 active:scale-95 transition-all">
                          Confirm Payment
                        </button>
                      </div>
                    )}
                    {order.status === "PAYMENT_REPORTED" && (
                      <div className="bg-orange-50 px-4 py-3 border-t border-orange-100 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-orange-400 uppercase">Payment Reported</span>
                          <span className="text-xs font-bold text-orange-700">{order.depositorName || "Unknown"} • {order.depositDate || "No date"}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            if (confirm("Cancel this order?")) handleOrderAction(order.id, "CANCELLED");
                          }} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-2">
                            Cancel
                          </button>
                          <button onClick={() => handleOrderAction(order.id, "CONFIRMED")} className="bg-[#0057bd] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#004ca6] active:scale-95 transition-all shadow-sm">
                            Verify & Confirm
                          </button>
                        </div>
                      </div>
                    )}
                    {order.status === "CONFIRMED" && (
                      <div className="bg-blue-50 px-4 py-3 border-t border-blue-100 flex justify-end gap-2">
                        <button onClick={() => handleOrderAction(order.id, "IN_PRODUCTION")} className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-purple-700 active:scale-95 transition-all">
                          Start Production
                        </button>
                      </div>
                    )}
                    {order.status === "IN_PRODUCTION" && (
                      <div className="bg-purple-50 px-4 py-3 border-t border-purple-100 flex flex-col gap-3">
                        <div className="flex justify-end gap-2">
                          {order.fulfillmentType === 'pickup' ? (
                            <button onClick={() => handleOrderAction(order.id, "READY_PICKUP")} className="bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-teal-700 active:scale-95 transition-all">
                              Ready for Pickup
                            </button>
                          ) : (
                            <button onClick={() => setShippingOrderId(order.id)} className="bg-[#0057bd] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#004ca6] active:scale-95 transition-all shadow-sm">
                              Ship Order
                            </button>
                          )}
                        </div>
                        
                        {shippingOrderId === order.id && (
                          <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-inner flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-[#0057bd] uppercase">Enter Tracking Number</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={trackingNumberInput}
                                onChange={(e) => setTrackingNumberInput(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0057bd]"
                                placeholder="Tracking #"
                                autoFocus
                              />
                              <button 
                                onClick={() => {
                                  if (!trackingNumberInput.trim()) return toast.error("Enter tracking number");
                                  handleOrderAction(order.id, "SHIPPING", { trackingNumber: trackingNumberInput });
                                }}
                                className="bg-[#0057bd] text-white text-xs font-bold px-4 rounded-lg"
                              >
                                Ship
                              </button>
                              <button onClick={() => setShippingOrderId(null)} className="text-slate-400">
                                <span className="material-symbols-outlined">close</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {order.status === "READY_PICKUP" && (
                      <div className="bg-teal-50 px-4 py-3 border-t border-teal-100 flex justify-end">
                        <button onClick={() => handleOrderAction(order.id, "COMPLETED")} className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all">
                          Picked Up · Complete
                        </button>
                      </div>
                    )}
                    {order.status === "SHIPPING" && (
                      <div className="bg-indigo-50 px-4 py-3 border-t border-indigo-100 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase">Shipping</span>
                          <span className="text-xs text-indigo-700 font-bold">{order.trackingNumber}</span>
                        </div>
                        <button onClick={() => handleOrderAction(order.id, "COMPLETED")} className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all">
                          Delivered
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
              {filteredOrders.length === 0 && (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">receipt_long</span>
                  <p className="text-slate-500 font-medium text-sm">No orders found.</p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ===== SHOP INFO TAB ===== */}
        {activeTab === "info" && (
          <section className="space-y-6">
            {/* Payment Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0057bd]">account_balance</span>
                Payment Account
              </h3>
              <div className="bg-[#f0f5ff] rounded-lg p-4 border border-[#dbeafe] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Bank</span>
                  <span className="text-slate-900 font-semibold">{group.bankDetails?.bankName || "Not set"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Account</span>
                  <span className="text-slate-900 font-mono">{group.bankDetails?.accountNumber || "Not set"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Holder</span>
                  <span className="text-slate-900 font-semibold">{group.bankDetails?.accountHolder || "Not set"}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">* To change account info, go to Account Settings.</p>
            </div>

            {/* Delivery Settings */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0057bd]">local_shipping</span>
                Delivery Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Currency</label>
                  <select value={shopSettings.currency || 'KRW'}
                    onChange={e => setShopSettings({...shopSettings, currency: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#0057bd] focus:ring-1 focus:ring-[#0057bd] outline-none bg-white"
                  >
                    <option value="KRW">KRW (₩)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="ARS">ARS ($)</option>
                    <option value="CLP">CLP ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Delivery Type</label>
                  <div className="flex gap-2">
                    {(["shipping", "pickup", "both"] as const).map(dt => (
                      <button key={dt} onClick={() => setShopSettings({...shopSettings, deliveryType: dt})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          shopSettings.deliveryType === dt ? "bg-[#0057bd] text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {dt === "shipping" ? "Shipping" : dt === "pickup" ? "Pickup" : "Both"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Default Shipping Fee</label>
                  <input type="text" inputMode="numeric" value={formatNumber(shopSettings.defaultShippingFee)}
                    onChange={e => setShopSettings({...shopSettings, defaultShippingFee: parseFormattedNumber(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#0057bd] focus:ring-1 focus:ring-[#0057bd] outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Free Shipping Threshold</label>
                  <input type="text" inputMode="numeric" value={formatNumber(shopSettings.freeShippingThreshold)}
                    onChange={e => setShopSettings({...shopSettings, freeShippingThreshold: parseFormattedNumber(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#0057bd] focus:ring-1 focus:ring-[#0057bd] outline-none"
                    placeholder="0 = No free shipping"
                  />
                </div>
                {(shopSettings.deliveryType === "pickup" || shopSettings.deliveryType === "both") && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Pickup Guide</label>
                    <textarea value={shopSettings.pickupGuide || ""}
                      onChange={e => setShopSettings({...shopSettings, pickupGuide: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#0057bd] focus:ring-1 focus:ring-[#0057bd] outline-none resize-none"
                      rows={3} placeholder="Provide pickup instructions for customers."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Return Policy */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0057bd]">policy</span>
                Return Policy
              </h3>
              <textarea value={shopSettings.returnPolicy || ""}
                onChange={e => setShopSettings({...shopSettings, returnPolicy: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#0057bd] focus:ring-1 focus:ring-[#0057bd] outline-none resize-none"
                rows={5} placeholder="Enter your exchange/return policy."
              />
            </div>

            {/* Save Button */}
            <button onClick={handleSaveShopInfo} disabled={isSavingInfo}
              className={`w-full font-['Plus_Jakarta_Sans'] font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 ${
                showSaved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-[#0057bd] text-white shadow-[#0057bd]/20 hover:bg-[#004ca6]'
              }`}
            >
              {isSavingInfo ? "Saving..." : showSaved ? "✓ Saved!" : "Save Shop Info"}
            </button>
          </section>
        )}
      </main>

      {/* Item Editor Overlay */}
      {showItemEditor && (
        <GroupShopItemEditor
          group={group}
          onClose={() => setShowItemEditor(false)}
          item={editingItem}
        />
      )}
    </div>
  );
};

export default GroupShopEditor;
