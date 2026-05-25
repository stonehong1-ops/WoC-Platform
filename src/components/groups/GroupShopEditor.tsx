// 그룹 관리자가 등록된 상품과 주문 내역을 처리하고 상점 설정을 변경하는 어드민 대시보드 컴포넌트
"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group } from "@/types/group";
import { Product, ShopOrder, OrderStatus } from "@/types/shop";
import { shopService } from "@/lib/firebase/shopService";
import { groupService } from "@/lib/firebase/groupService";
import { chatService } from "@/lib/firebase/chatService";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import GroupShopItemEditor from "./GroupShopItemEditor";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroupShopEditorProps {
  group: Group;
  onClose?: () => void;
  isInline?: boolean;
}

type AdminTab = "products" | "orders" | "info";
type ProductFilter = "All" | "Active" | "Stopped" | "SoldOut";

const CURRENCY_SYMBOL: Record<string, string> = { KRW: "₩", USD: "$", EUR: "€" };
const getCurrencySymbol = (c: string) => CURRENCY_SYMBOL[c] || c + " ";


const GroupShopEditor: React.FC<GroupShopEditorProps> = ({ group, onClose, isInline }) => {
  const { t } = useLanguage();
  const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: t("group.shop.order.status.pending") || "Pending", color: "text-amber-700", bg: "bg-amber-100/50" },
    PAYMENT_REPORTED: { label: t("group.shop.order.status.reported") || "Reported", color: "text-orange-700", bg: "bg-orange-100/50" },
    CONFIRMED: { label: t("group.shop.order.status.confirmed") || "Confirmed", color: "text-blue-700", bg: "bg-blue-100/50" },
    IN_PRODUCTION: { label: t("group.shop.order.status.production") || "In Production", color: "text-purple-700", bg: "bg-purple-100/50" },
    READY_PICKUP: { label: t("group.shop.order.status.ready") || "Ready", color: "text-teal-700", bg: "bg-teal-100/50" },
    SHIPPING: { label: t("group.shop.order.status.shipping") || "Shipping", color: "text-indigo-700", bg: "bg-indigo-100/50" },
    COMPLETED: { label: t("group.shop.order.status.completed") || "Completed", color: "text-emerald-700", bg: "bg-emerald-100/50" },
    EXPIRED: { label: t("group.shop.order.status.expired") || "Expired", color: "text-gray-700", bg: "bg-gray-100/50" },
    CANCELLED: { label: t("group.shop.order.status.cancelled") || "Cancelled", color: "text-red-700", bg: "bg-red-100/50" },
  };
  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined' && group?.id) {
      const cached = sessionStorage.getItem(`woc_group_products_${group.id}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error('Failed to parse cached group products:', e);
        }
      }
    }
    return [];
  });
  const [orders, setOrders] = useState<ShopOrder[]>(() => {
    if (typeof window !== 'undefined' && group?.id) {
      const cached = sessionStorage.getItem(`woc_group_orders_${group.id}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error('Failed to parse cached group orders:', e);
        }
      }
    }
    return [];
  });
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

    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`woc_group_products_${group.id}`);
      if (cached) {
        try {
          setProducts(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to parse cached products:', e);
        }
      }
    }

    const unsub = shopService.subscribeGroupProducts(group.id, (data) => {
      setProducts(data);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`woc_group_products_${group.id}`, JSON.stringify(data));
      }
    });
    return () => unsub();
  }, [group.id]);

  // Subscribe to orders
  useEffect(() => {
    if (!group.id) return;

    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`woc_group_orders_${group.id}`);
      if (cached) {
        try {
          setOrders(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to parse cached orders:', e);
        }
      }
    }

    const unsub = shopService.subscribeGroupOrders(group.id, (data) => {
      setOrders(data);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`woc_group_orders_${group.id}`, JSON.stringify(data));
      }
    });
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
              chatMsg = t('shop.order.confirmed_msg', `✅ [Payment Confirmed]\nOrder: ${targetOrder.orderNumber}\nYour payment has been confirmed. Production/shipping will begin shortly. Thank you!`);
              break;
            case "IN_PRODUCTION":
              chatMsg = t('shop.order.in_production_msg', `🛠 [Production Started]\nOrder: ${targetOrder.orderNumber}\nWe have started producing your item. We will notify you when it is complete.`);
              break;
            case "READY_PICKUP":
              chatMsg = t('shop.order.ready_pickup_msg', `🏪 [Ready for Pickup]\nOrder: ${targetOrder.orderNumber}\nYour order is ready! Please visit our store to pick it up.`);
              break;
            case "SHIPPING":
              chatMsg = t('shop.order.shipping_msg', `🚚 [Shipping Started]\nOrder: ${targetOrder.orderNumber}\nYour order is on the way.\nTracking Number: ${extras?.trackingNumber || t('shop.order.no_tracking_info', 'No Info')}`);
              break;
            case "COMPLETED":
              chatMsg = t('shop.order.completed_msg', `🏁 [Order Completed]\nOrder: ${targetOrder.orderNumber}\nYour transaction is complete. Thank you for your purchase!`);
              break;
            case "CANCELLED":
              chatMsg = t('shop.order.cancelled_msg', `❌ [Order Cancelled]\nOrder: ${targetOrder.orderNumber}\nYour order has been cancelled.`);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={isInline
        ? "w-full light font-body-md text-on-surface antialiased bg-background flex flex-col no-scrollbar"
        : "fixed inset-0 z-[100] light font-body-md text-on-surface antialiased bg-background flex flex-col overflow-y-auto no-scrollbar pb-20"
      }
    >
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Top Bar */}
      {!isInline && (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outline/5">
          <div className="max-w-[896px] mx-auto px-4 py-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              {onClose && (
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/5 transition-all"
                >
                  <span className="material-symbols-outlined text-primary">arrow_back</span>
                </button>
              )}
              <h1 className="text-base font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t('group.shop.management') || "Shop Management"}
              </h1>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">
        <div className={`max-w-[896px] mx-auto space-y-6 ${isInline ? 'pb-24' : 'pb-48 md:pb-32'}`}>
          {/* Section Header */}
          <div className={`px-4 pb-6 ${isInline ? 'pt-1' : 'pt-4'}`}>
            <div className="mb-2">
              <h2 className="text-[24px] leading-[1.3] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t("group.shop.management") || "Shop Management"}
              </h2>
              <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium text-on-surface-variant mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t("group.shop.subtitle") || "Configure products, order fulfillment, and shop settings."}
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <section className="px-4 mb-6">
            <div className="flex bg-surface-container-low border border-outline/5 p-1 rounded-xl shadow-inner gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[14px] font-bold rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  {t(`group.shop.tab.${tab.id}`) || tab.label}
                  {tab.badge ? (
                    <span className="bg-error text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{tab.badge}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        {/* ===== PRODUCTS TAB ===== */}
        {activeTab === "products" && (
          <>
            {/* Filter */}
            <section className="px-4 mb-6">
              <div className="bg-surface-container-low border border-outline/5 p-1 rounded-xl flex items-center shadow-inner">
                {(["All", "Active", "Stopped", "SoldOut"] as ProductFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setProductFilter(f)}
                    className={`flex-1 py-2.5 px-2 rounded-lg font-bold text-xs transition-all text-center ${
                      productFilter === f ? "bg-white text-primary shadow-sm" : "text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high"
                    }`}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {f === "All" && (t("group.shop.filter.all") || "All")}
                    {f === "Active" && (t("group.shop.filter.active") || "Active")}
                    {f === "Stopped" && (t("group.shop.filter.stopped") || "Stopped")}
                    {f === "SoldOut" && (t("group.shop.filter.soldout") || "Sold Out")}
                  </button>
                ))}
              </div>
            </section>

            {/* Add Button */}
            <section className="px-4 mb-6">
              <button
                onClick={() => { setEditingItem(undefined); setShowItemEditor(true); }}
                className="w-full bg-primary text-on-primary font-bold py-3.5 px-6 rounded-xl shadow-sm hover:opacity-90 transition-colors active:scale-[0.99] flex items-center justify-center gap-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <span className="material-symbols-outlined text-sm">add</span>
                {t("group.shop.btn.add") || "Add Item"}
              </button>
            </section>

            {/* Product List */}
            <section className="px-4 mb-6 space-y-4">
              {filteredProducts.map(product => (
                <article
                  key={product.id}
                  onClick={() => { setEditingItem(product); setShowItemEditor(true); }}
                  className={`bg-white rounded-2xl p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 flex gap-4 active:scale-[0.99] transition-all cursor-pointer ${
                    product.status === 'Stopped' ? 'opacity-75' : ''
                  }`}
                >
                  <div className={`w-24 h-24 rounded-lg bg-surface-container-low overflow-hidden flex-shrink-0 ${product.status === 'Stopped' ? 'grayscale' : ''}`}>
                    {(product.images?.[0] || product.imageUrl) ? (
                      <ImageWithFallback alt={product.title} className="w-full h-full object-cover" src={product.images?.[0] || product.imageUrl || ''} fallbackType="gallery" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                        <span className="material-symbols-outlined text-4xl">shopping_bag</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                        product.status === 'Active' ? 'text-primary bg-primary/10' : 'text-on-surface-variant/60 bg-surface-container-high'
                      }`}>{product.category || "Uncategorized"}</span>
                      <h3 className={`font-extrabold text-base leading-tight ${product.status === 'Active' ? 'text-on-surface' : 'text-on-surface-variant/60'}`} style={{ fontFamily: "'Inter', sans-serif" }}>{product.title}</h3>
                      <p className={`text-xs font-medium mt-0.5 line-clamp-1 ${product.status === 'Active' ? 'text-on-surface-variant' : 'text-on-surface-variant/40'}`} style={{ fontFamily: "'Inter', sans-serif" }}>{product.description}</p>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {product.discountPrice ? (
                          <>
                            <span className={`font-bold text-lg ${product.status === 'Active' ? 'text-error' : 'text-on-surface-variant/40'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                              {getCurrencySymbol(product.currency)}{product.discountPrice.toLocaleString()}
                            </span>
                            <span className="font-medium text-xs text-on-surface-variant/40 line-through" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {getCurrencySymbol(product.currency)}{product.price?.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className={`font-bold text-lg ${product.status === 'Active' ? 'text-primary' : 'text-on-surface-variant/40'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                            {getCurrencySymbol(product.currency)}{product.price?.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {product.stock !== undefined && (
                          <span className="text-[10px] font-semibold text-on-surface-variant/50" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.label.stock") || "Stock"}: {product.stock}</span>
                        )}
                        <div
                          onClick={(e) => handleToggleStatus(product, e)}
                          className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors ${product.status === 'Active' ? 'bg-primary' : 'bg-surface-container-highest'}`}
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
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">inventory_2</span>
                  <p className="text-on-surface-variant/60 font-medium text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.msg.no_items") || "No items found."}</p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ===== ORDERS TAB ===== */}
        {activeTab === "orders" && (
          <>
            {/* Order Filter */}
            <section className="px-4 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                {[
                  { key: "ALL", label: t("group.shop.filter.all") || "All" },
                  { key: "PENDING", label: t("group.shop.order.status.pending") || "Pending" },
                  { key: "CONFIRMED", label: t("group.shop.order.status.confirmed") || "Confirmed" },
                  { key: "IN_PRODUCTION", label: t("group.shop.order.status.production") || "Production" },
                  { key: "SHIPPING", label: t("group.shop.order.status.shipping") || "Shipping" },
                  { key: "COMPLETED", label: t("group.shop.order.status.completed") || "Completed" },
                  { key: "CANCELLED", label: t("group.shop.order.status.cancelled") || "Cancelled" },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setOrderFilter(f.key)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      orderFilter === f.key 
                        ? "bg-primary text-on-primary shadow-sm" 
                        : "bg-surface-container-low text-on-surface-variant/60 border border-outline/5 hover:text-on-surface hover:bg-surface-container-high"
                    }`}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {f.label}
                    {f.key === "PENDING" && pendingOrderCount > 0 && (
                      <span className="ml-1 bg-error text-white text-[9px] rounded-full px-1.5">{pendingOrderCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Order List */}
            <section className="px-4 mb-6 space-y-4">
              {filteredOrders.map(order => {
                const statusCfg = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.PENDING;
                return (
                  <article key={order.id} className="bg-surface-container-low border border-outline/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{order.orderNumber}</p>
                          <p className="text-xs font-semibold text-on-surface-variant mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{order.buyerName} • {order.buyerPhone}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusCfg.color} ${statusCfg.bg}`} style={{ fontFamily: "'Inter', sans-serif" }}>{statusCfg.label}</span>
                      </div>
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-4 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <ImageWithFallback alt={item.title} src={item.image} className="w-full h-full object-cover" fallbackType="gallery" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                                <span className="material-symbols-outlined text-xl">shopping_bag</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{item.title}</p>
                            <p className="text-xs text-on-surface-variant/70 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{item.option} × {item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{getCurrencySymbol(order.currency)}{item.price.toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 border-t border-outline/5 mt-2">
                        <span className="text-xs font-semibold text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.order.total") || "Total"}</span>
                        <span className="font-bold text-lg text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>{getCurrencySymbol(order.currency)}{order.totalAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Action buttons */}
                    {order.status === "PENDING" && (
                      <div className="bg-warning-container/10 px-6 py-4 border-t border-outline/5 flex justify-between items-center">
                        <button onClick={() => {
                          if (confirm(t("group.shop.order.cancel_confirm") || "Cancel this order?")) handleOrderAction(order.id, "CANCELLED");
                        }} className="text-xs font-bold text-on-surface-variant/50 hover:text-error transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {t("group.shop.order.cancel") || "Cancel Order"}
                        </button>
                        <button onClick={() => handleOrderAction(order.id, "CONFIRMED")} className="bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-700 active:scale-95 transition-all shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {t("group.shop.order.confirm_payment") || "Confirm Payment"}
                        </button>
                      </div>
                    )}
                    {order.status === "PAYMENT_REPORTED" && (
                      <div className="bg-primary/5 px-6 py-4 border-t border-outline/5 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-orange-500/70 uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.order.payment_reported") || "Payment Reported"}</span>
                          <span className="text-xs font-bold text-orange-700" style={{ fontFamily: "'Inter', sans-serif" }}>{order.depositorName || "Unknown"} • {order.depositDate || "No date"}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => {
                            if (confirm(t("group.shop.order.cancel_confirm") || "Cancel this order?")) handleOrderAction(order.id, "CANCELLED");
                          }} className="text-xs font-bold text-on-surface-variant/50 hover:text-error transition-colors px-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {t("group.shop.order.cancel") || "Cancel"}
                          </button>
                          <button onClick={() => handleOrderAction(order.id, "CONFIRMED")} className="bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {t("group.shop.order.verify_confirm") || "Verify & Confirm"}
                          </button>
                        </div>
                      </div>
                    )}
                    {order.status === "CONFIRMED" && (
                      <div className="bg-primary/5 px-6 py-4 border-t border-outline/5 flex justify-end gap-2">
                        <button onClick={() => handleOrderAction(order.id, "IN_PRODUCTION")} className="bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {t("group.shop.order.start_production") || "Start Production"}
                        </button>
                      </div>
                    )}
                    {order.status === "IN_PRODUCTION" && (
                      <div className="bg-primary/5 px-6 py-4 border-t border-outline/5 flex flex-col gap-3">
                        <div className="flex justify-end gap-2">
                          {order.fulfillmentType === 'pickup' ? (
                            <button onClick={() => handleOrderAction(order.id, "READY_PICKUP")} className="bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {t("group.shop.order.ready_pickup") || "Ready for Pickup"}
                            </button>
                          ) : (
                            <button onClick={() => setShippingOrderId(order.id)} className="bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {t("group.shop.order.ship_order") || "Ship Order"}
                            </button>
                          )}
                        </div>
                        
                        {shippingOrderId === order.id && (
                          <div className="bg-surface-container-high rounded-xl p-4 border border-outline/5 shadow-sm flex flex-col gap-2.5">
                            <label className="text-[10px] font-bold text-primary uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.order.enter_tracking") || "Enter Tracking Number"}</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={trackingNumberInput}
                                onChange={(e) => setTrackingNumberInput(e.target.value)}
                                className="flex-1 bg-surface-container-lowest border border-outline/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-on-surface font-medium"
                                placeholder={t("group.shop.order.tracking_placeholder") || "Tracking #"}
                                autoFocus
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              />
                              <button 
                                onClick={() => {
                                  if (!trackingNumberInput.trim()) return toast.error(t("group.shop.order.enter_tracking_error") || "Enter tracking number");
                                  handleOrderAction(order.id, "SHIPPING", { trackingNumber: trackingNumberInput });
                                }}
                                className="bg-primary text-on-primary text-xs font-bold px-4 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              >
                                {t("group.shop.order.ship_btn") || "Ship"}
                              </button>
                              <button onClick={() => setShippingOrderId(null)} className="text-on-surface-variant/40 hover:text-on-surface p-1">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {order.status === "READY_PICKUP" && (
                      <div className="bg-success-container/10 px-6 py-4 border-t border-outline/5 flex justify-end">
                        <button onClick={() => handleOrderAction(order.id, "COMPLETED")} className="bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {t("group.shop.order.pickup_complete") || "Picked Up · Complete"}
                        </button>
                      </div>
                    )}
                    {order.status === "SHIPPING" && (
                      <div className="bg-primary/5 px-6 py-4 border-t border-outline/5 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-primary uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.order.status.shipping") || "Shipping"}</span>
                          <span className="text-xs text-on-surface font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>{order.trackingNumber}</span>
                        </div>
                        <button onClick={() => handleOrderAction(order.id, "COMPLETED")} className="bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {t("group.shop.order.delivered") || "Delivered"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
              {filteredOrders.length === 0 && (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">receipt_long</span>
                  <p className="text-on-surface-variant/60 font-medium text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.order.no_orders") || "No orders found."}</p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ===== SHOP INFO TAB ===== */}
        {activeTab === "info" && (
          <div className="space-y-6">
            {/* Payment Info */}
            <section className="px-4 mb-6">
              <div className="bg-surface-container-low border border-outline/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                    </div>
                    <div>
                      <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.payment_account")}</h3>
                      <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.payment_account_desc")}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-surface-container-high rounded-xl p-4 border border-outline/5 space-y-3">
                    <div className="flex justify-between items-center text-[14px]">
                      <span className="text-on-surface-variant font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.bank")}</span>
                      <span className="text-on-surface font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>{group.bankDetails?.bankName || t("group.shop.msg.not_set") || "Not set"}</span>
                    </div>
                    <div className="flex justify-between items-center text-[14px]">
                      <span className="text-on-surface-variant font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.account_number")}</span>
                      <span className="text-on-surface font-mono font-medium">{group.bankDetails?.accountNumber || t("group.shop.msg.not_set") || "Not set"}</span>
                    </div>
                    <div className="flex justify-between items-center text-[14px]">
                      <span className="text-on-surface-variant font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.account_holder")}</span>
                      <span className="text-on-surface font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>{group.bankDetails?.accountHolder || t("group.shop.msg.not_set") || "Not set"}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant/60 font-medium mt-3" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.payment_account_hint")}</p>
                </div>
              </div>
            </section>

            {/* Delivery Settings */}
            <section className="px-4 mb-6">
              <div className="bg-surface-container-low border border-outline/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
                    </div>
                    <div>
                      <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.delivery_settings")}</h3>
                      <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.delivery_settings_desc")}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.currency")}</label>
                    <select 
                      value={shopSettings.currency || 'KRW'}
                      onChange={e => setShopSettings({...shopSettings, currency: e.target.value})}
                      className="w-full bg-surface-container-high border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium appearance-none outline-none transition-all"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <option value="KRW">KRW (₩)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="ARS">ARS ($)</option>
                      <option value="CLP">CLP ($)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.delivery_type")}</label>
                    <div className="flex bg-surface-container-high p-1 rounded-xl shadow-inner gap-1">
                      {(["shipping", "pickup", "both"] as const).map(dt => (
                        <button 
                          key={dt} 
                          type="button"
                          onClick={() => setShopSettings({...shopSettings, deliveryType: dt})}
                          className={`flex-1 py-2.5 text-[12px] font-bold rounded-lg transition-colors ${
                            shopSettings.deliveryType === dt 
                              ? "bg-primary text-on-primary shadow-sm" 
                              : "text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-low"
                          }`}
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {dt === "shipping" 
                            ? (t("group.shop.order.status.shipping") || "Shipping") 
                            : dt === "pickup" 
                              ? (t("group.shop.order.ready_pickup") || "Pickup") 
                              : (t("group.shop.filter.all") || "Both")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.default_shipping_fee")}</label>
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      value={formatNumber(shopSettings.defaultShippingFee)}
                      onChange={e => setShopSettings({...shopSettings, defaultShippingFee: parseFormattedNumber(e.target.value)})}
                      className="w-full bg-surface-container-high border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30 transition-all"
                      placeholder="0"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.free_shipping_threshold")}</label>
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      value={formatNumber(shopSettings.freeShippingThreshold)}
                      onChange={e => setShopSettings({...shopSettings, freeShippingThreshold: parseFormattedNumber(e.target.value)})}
                      className="w-full bg-surface-container-high border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30 transition-all"
                      placeholder="0"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    />
                    <p className="text-[11px] text-on-surface-variant/60 font-medium ml-1" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.free_shipping_threshold_hint")}</p>
                  </div>
                  {(shopSettings.deliveryType === "pickup" || shopSettings.deliveryType === "both") && (
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.pickup_guide")}</label>
                      <textarea 
                        value={shopSettings.pickupGuide || ""}
                        onChange={e => setShopSettings({...shopSettings, pickupGuide: e.target.value})}
                        className="w-full bg-surface-container-high border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[14px] leading-relaxed font-normal resize-none placeholder:text-on-surface-variant/30 min-h-[100px] transition-all"
                        rows={3} 
                        placeholder={t("group.shop.pickup_guide_hint")}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Return Policy */}
            <section className="px-4 mb-6">
              <div className="bg-surface-container-low border border-outline/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]">policy</span>
                    </div>
                    <div>
                      <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.return_policy")}</h3>
                      <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.shop.return_policy_desc")}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <textarea 
                    value={shopSettings.returnPolicy || ""}
                    onChange={e => setShopSettings({...shopSettings, returnPolicy: e.target.value})}
                    className="w-full bg-surface-container-high border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-4 text-on-surface text-[16px] leading-relaxed font-normal resize-none placeholder:text-on-surface-variant/30 min-h-[160px] transition-all"
                    rows={5} 
                    placeholder={t("group.shop.return_policy_hint")}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
              </div>
            </section>

            {/* Save Button */}
            <section className="px-4 mb-6">
              <button 
                onClick={handleSaveShopInfo} 
                disabled={isSavingInfo}
                className={`w-full py-4 rounded-2xl text-[16px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm ${
                  showSaved 
                    ? 'bg-emerald-600 text-white shadow-emerald-600/10' 
                    : 'bg-primary text-on-primary hover:opacity-95 shadow-md active:scale-[0.99] transition-all'
                }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {isSavingInfo ? t("group.shop.saving") : showSaved ? `✓ ${t("group.shop.saved")}` : t("group.shop.save_info")}
              </button>
            </section>
          </div>
        )}
      </div>
      </main>

      {/* Item Editor Overlay */}
      {showItemEditor && (
        <GroupShopItemEditor
          group={group}
          onClose={() => setShowItemEditor(false)}
          item={editingItem}
        />
      )}
    </motion.div>
  );
};

export default GroupShopEditor;
