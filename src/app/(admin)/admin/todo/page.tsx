"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { StayBooking, StayBookingStatus } from '@/types/stay';
import { stayBookingService } from '@/lib/firebase/stayBookingService';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { groupService } from '@/lib/firebase/groupService';
import { Group } from '@/types/group';
import { sendSmsViaSolapi } from '@/app/actions/smsActions';
import { chatService } from '@/lib/firebase/chatService';

// Define the main group ID used in this project
const MAIN_GROUP_ID = 'freestyle-tango';

export default function AdminTodoPage() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<StayBooking[]>([]);
  const [groupData, setGroupData] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | StayBookingStatus>('ALL');

  useEffect(() => {
    // Fetch group data for bank details
    const fetchGroupData = async () => {
      try {
        const data = await groupService.getGroup(MAIN_GROUP_ID);
        setGroupData(data);
      } catch (err) {
        console.error("Failed to fetch group data:", err);
      }
    };
    fetchGroupData();

    // Subscribe to pending bookings for the main group
    const unsubscribe = stayBookingService.subscribeToPendingBookings(MAIN_GROUP_ID, (data) => {
      // Sort by latest applied time first
      const sorted = data.sort((a, b) => {
        const timeA = a.appliedAt?.toMillis ? a.appliedAt.toMillis() : 0;
        const timeB = b.appliedAt?.toMillis ? b.appliedAt.toMillis() : 0;
        return timeB - timeA;
      });
      setBookings(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (
    booking: StayBooking, 
    newStatus: StayBookingStatus, 
    actionName: string, 
    phone: string, 
    messageBody: string
  ) => {
    if (!profile?.uid) return;
    
    if (!window.confirm(`Are you sure you want to [${actionName}] this reservation?`)) return;

    try {
      await stayBookingService.updateBookingStatus(booking.id!, newStatus, profile.uid, actionName);
      
      // Log SMS sending action
      await stayBookingService.addSmsLog(booking.id!, {
        type: newStatus === 'PAYMENT_REQUESTED' ? 'payment_request' : 'confirmed',
        sentAt: new Date().toISOString(),
        sentBy: profile.uid,
        to: phone,
        message: messageBody
      });

      // Send Chat Message
      try {
        const guestId = booking.userId;
        const hostId = 'adminstone'; // Standard admin/host account ID
        if (guestId) {
          const roomId = await chatService.getOrCreatePrivateRoom(
            [guestId, hostId],
            profile.uid,
            'business'
          );
          
          await chatService.sendMessage({
            roomId,
            senderId: profile.uid,
            senderName: profile.nickname || 'Admin',
            text: messageBody,
            type: 'text'
          });
        }
      } catch (chatErr) {
        console.error('Failed to send chat message:', chatErr);
      }

      // Try sending via Solapi
      const solapiRes = await sendSmsViaSolapi(phone, messageBody);
      
      if (solapiRes.success) {
        toast.success(`${actionName} completed. (Sent via Solapi)`);
      } else {
        // Fallback to local device sms intent
        toast.success(`${actionName} completed. Solapi error; opening device messaging app.`);
        const smsLink = `sms:${phone}?body=${encodeURIComponent(messageBody)}`;
        window.location.href = smsLink;
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error('An error occurred while updating the status.');
    }
  };

  const getStatusBadge = (status: StayBookingStatus) => {
    switch (status) {
      case 'APPLIED':
        return <span className="bg-tertiary-container/20 text-on-tertiary-fixed-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Applied (Awaiting Payment)</span>;
      case 'PAYMENT_REQUESTED':
        return <span className="bg-primary-container/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Payment Requested</span>;
      case 'PAID':
        return <span className="bg-secondary-container/20 text-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Payment Confirmed</span>;
      case 'CONFIRMED':
        return <span className="bg-success/10 text-success px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Confirmed</span>;
      default:
        return <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '-';
    if (timestamp.toDate) return format(timestamp.toDate(), 'yyyy.MM.dd HH:mm');
    return format(new Date(timestamp), 'yyyy.MM.dd HH:mm');
  };

  return (
    <main className="max-w-[896px] mx-auto px-6 pt-20 pb-24 space-y-6">
      <style jsx global>{`
        body { background-color: #F3F4F6; }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .custom-card {
          background-color: #FFFFFF;
          border-radius: 12px;
          border: 1px solid rgba(194, 198, 213, 0.3);
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="font-headline-lg text-on-surface">Todo & Booking Management</h1>
        <p className="text-body-md text-on-surface-variant">
          Manage booking requests and send notification messages.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2">
        {['ALL', 'APPLIED', 'PAYMENT_REQUESTED', 'PAID', 'CONFIRMED'].map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status as any)}
            className={`px-4 py-2 rounded-full text-[11px] font-bold tracking-wider whitespace-nowrap transition-all ${
              activeTab === status
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface text-on-surface-variant hover:bg-surface-variant border border-outline-variant'
            }`}
          >
            {status === 'ALL' ? 'All Pending' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Booking List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-outline text-body-md animate-pulse">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center text-outline flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-40">task</span>
            <p>No bookings to process.</p>
          </div>
        ) : (
          bookings.filter(b => activeTab === 'ALL' || b.status === activeTab).length === 0 ? (
            <div className="py-20 text-center text-outline flex flex-col items-center">
              <span className="material-symbols-outlined text-5xl mb-4 opacity-40">filter_list_off</span>
              <p>No bookings found for the selected status.</p>
            </div>
          ) : (
          bookings.filter(b => activeTab === 'ALL' || b.status === activeTab).map((booking) => {
            const checkInDate = booking.checkIn ? formatDateTime(booking.checkIn).split(' ')[0] : '-';
            const checkOutDate = booking.checkOut ? formatDateTime(booking.checkOut).split(' ')[0] : '-';
            const durationInfo = `${booking.nights || 0} nights`;
            const guestName = booking.applicantName || 'Unknown';
            const guestPhone = booking.contactNumber || 'Unknown';
            const payerName = booking.payment?.depositorName || guestName;
            const totalPrice = booking.pricing?.grandTotal || booking.pricing?.baseTotal || 0;

            return (
              <div key={booking.id} className="custom-card p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  
                  {/* Info Section */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(booking.status)}
                      <span className="text-label-sm text-outline font-mono">{booking.id?.slice(-6).toUpperCase()}</span>
                    </div>
                    
                    <div>
                      <h3 className="text-title-lg font-bold text-on-surface">{booking.stayTitle}</h3>
                      <p className="text-body-md text-on-surface-variant mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        {checkInDate} ~ {checkOutDate} 
                        <span className="text-outline text-sm">({durationInfo})</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Guest</p>
                        <p className="text-body-md font-medium text-on-surface">{guestName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Contact</p>
                        <p className="text-body-md font-medium text-on-surface">{guestPhone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Payer</p>
                        <p className="text-body-md font-medium text-on-surface">{payerName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Total Price</p>
                        <p className="text-body-md font-medium text-primary">₩ {totalPrice.toLocaleString()}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-2">
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Applied At</p>
                        <p className="text-body-md font-medium text-on-surface">{formatDateTime(booking.appliedAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    {booking.status === 'APPLIED' && (
                      <>
                        <p className="text-label-sm text-on-surface-variant mb-1">Next step: Send payment info</p>
                        <button 
                          onClick={() => {
                            const p = booking.payment;
                            const bankString = (p?.bankName && p?.accountNumber) 
                              ? `${p.bankName} ${p.accountNumber} (Holder: ${p.holderName || 'Unknown'})`
                              : 'Bank account info not registered. Please contact admin.';
                              
                            const msg = `[WoC 신청 안내]\n${guestName}님, '${booking.stayTitle}' 신청이 접수되었습니다.\n\n아래 계좌로 ${totalPrice.toLocaleString()}원을 입금해주시면 등록이 확정됩니다.\n\n■ 입금 계좌\n${bankString}\n■ 기한: 오늘 자정까지\n\n입금이 확인되면 확정 문자를 보내드립니다. 감사합니다.`;
                            handleUpdateStatus(booking, 'PAYMENT_REQUESTED', 'Payment Request', guestPhone, msg);
                          }}
                          className="w-full px-4 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-lg">sms</span>
                          Send Payment Info
                        </button>
                      </>
                    )}
                    
                    {(booking.status === 'PAYMENT_REQUESTED' || booking.status === 'PAID') && (
                      <>
                        <p className="text-label-sm text-on-surface-variant mb-1">Next step: Confirm booking</p>
                        <button 
                          onClick={() => {
                            const msg = `[WoC 등록 확정]\n${guestName}님, 입금이 확인되어 '${booking.stayTitle}' 등록이 최종 확정되었습니다!\n\n■ 일정: ${checkInDate} ~ ${checkOutDate}\n\n행사/수업에서 뵙겠습니다. 감사합니다.`;
                            handleUpdateStatus(booking, 'CONFIRMED', 'Confirmed', guestPhone, msg);
                          }}
                          className="w-full px-4 py-3 bg-success text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-lg">task_alt</span>
                          Confirm Booking
                        </button>
                      </>
                    )}

                    {booking.status === 'CONFIRMED' && (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-success opacity-80 py-4">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                        <p className="text-label-sm font-bold">This booking has been completed</p>
                      </div>
                    )}

                    <div className="mt-auto pt-4 text-right">
                      <p className="text-[10px] text-outline">SMS Log: {booking.smsLog?.length || 0} sent</p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        ))}
      </div>
    </main>
  );
}
