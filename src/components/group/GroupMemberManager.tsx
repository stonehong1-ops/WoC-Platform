"use client";

import React, { useState } from 'react';

const GroupMemberManager = () => {
  const [activeSubTab, setActiveSubTab] = useState('Stats');

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'Stats':
        return (
          <div className="group-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Members', value: '1,284', grow: '+12%', icon: 'group', color: 'blue' },
                { label: 'Active Now', value: '156', grow: '+5%', icon: 'bolt', color: 'amber' },
                { label: 'New This Month', value: '84', grow: '+18%', icon: 'person_add', color: 'emerald' },
                { label: 'Pending Approval', value: '12', grow: '-2%', icon: 'hourglass_empty', color: 'rose' }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50 group hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined">{stat.icon}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.grow.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {stat.grow}
                    </span>
                  </div>
                  <h4 className="text-slate-500 text-sm font-medium mb-1">{stat.label}</h4>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Owner':
        return (
          <div className="group-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Owner List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Owner Card 1 */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="relative flex-shrink-0">
                  <img alt="Alexander Wright" className="w-14 h-14 rounded-full object-cover border-2 border-[#6e9fff]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4epRAucAyV46XUjwL9l9lCxwCRDTMNl4cmsK5MNMnVjpun6h8SrDIL8Y5ukX5UolqpJ8jeYrPZ72guOJMN78Vx4XIudze_tiOJ3EweHX5ePNo-9WeCUEaTAiFqZd2PRDptqz1Xyj1CbMhmQPDD9jVfd_-1R0w3vOVNZe_cHAgF4T5_qjDQzOwXhX9OjqY5wgKn6RlcvQL5A6B_WRwqMWLvfkXpl_XHxsC4iR4zS9Zdl7-VP8fdq89DVRTw3XYJ1tHh6th0t3H1Aw"/>
                  <div className="absolute -bottom-1 -right-1 bg-[#0057bd] text-white p-1 rounded-full border-2 border-white">
                    <span className="material-symbols-outlined text-[12px] block" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-headline font-bold text-[#242c51] truncate">Alexander Wright</h3>
                    <span className="px-2 py-0.5 bg-[#6e9fff]/20 text-[#0057bd] text-[10px] font-extrabold uppercase tracking-wider rounded-full flex-shrink-0">
                      Primary Owner
                    </span>
                  </div>
                  <p className="text-sm text-[#515981] truncate">alex.wright@venture-systems.com</p>
                </div>
                <button className="p-2 text-[#515981] hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>

              {/* Owner Card 2 */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="relative flex-shrink-0">
                  <img alt="Elena Rodriguez" className="w-14 h-14 rounded-full object-cover border-2 border-slate-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC37XjhuYUKfcgnXgXVfULPsxIMG_KgfqMedEwQCU6y-Y1JICvG0QTar1zMFozdAoGvVDPb9HjqogMb2U_vsmGWbcJkzcZEZ3f1TBSyAHqnoRv2QaiOTGvyQUWKxcqYAIyJSrlBiIpxr_cMgI_OOhV0pUX37ZkfsPWlh-WCTCgPCG0nAHnvuDgPcVG4o3lk_XjUQZJhx2ICDUqQYk1k1M_AxVvzev9G_JvXkXJXYugNKPFAr8opA8rREYqL0vrJuaQZrI5shwHP7RU"/>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-headline font-bold text-[#242c51] truncate">Elena Rodriguez</h3>
                  </div>
                  <p className="text-sm text-[#515981] truncate">e.rodriguez@globalcorp.io</p>
                </div>
                <button className="p-2 text-[#515981] hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            </div>

            {/* Functional Tip */}
            <div className="pt-4 border-t border-slate-200/50">
              <div className="flex items-center gap-3 p-4 bg-[#6e9fff]/10 rounded-2xl text-[#002150]/80 text-sm">
                <span className="material-symbols-outlined text-[20px]">info</span>
                <p>Owners have full administrative access including billing and user role assignments. Maximum 3 owners per workspace.</p>
              </div>
            </div>
          </div>
        );
      case 'Staff':
        return (
          <div className="group-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Staff List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Sarah Jenkins', email: 's.jenkins@system.com', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRozEQMrmM5eIibmqjie2T-4Sy_fSmJo8xFHxDSkbQ0Ntf8T6CRUzffaTHpAzBdBt2xJlIujvL_ihXnFM2DkRbYOS8YWZUMYK5lEHMVAfnvczw8jdhYqGCrNKXy7zAbv331FxJmhMMNhWMrOUkxaMF8IfZec-ctKlMYdRtoCebPTS4m1RQRymy1aHH1fknOUsxfckf1W4g07us1dKBXzAM4ulErq3dlx8z64xrCshcuGTh8uysvGI8GB_hM1-_A2-FTaTwMgerFDs', permissions: [true, true, false] },
                { name: 'Marcus Chen', email: 'm.chen@system.com', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQhOMg4knSuVsBnji17t-jCVTEzjRiGHWbFD6CGVnPfQFiCg5IELHWJSwTe7XIvc4Yg78wvFwQ8Tj_acM_kknoGMs6y2FO2SYn4pZbVUZr-Y7YoFx0C6XISrQ9svF-eJ9frUYcsW3JlDuErXzKssS2lHMJqHnX15Dqfu99_xODP-Z7BP8Ni99JsV3FL5L34PTrsDNP8-e24E-luTq1BTLlfmZrmDeSClWqhJ1O_mbzqyTAljQu7WU9kA4x4bYSOLtw2fgPBiKCHWE', permissions: [false, true, true] },
                { name: 'David Miller', email: 'd.miller@system.com', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGo86tCQu7pcoAsTFgiqGHKI69KbgMxyGLxvwbxCAORF99BxL2VK9xMdB1vbikyxgL2bYhQ9dHnw1lV24X-VSlpCJTtF2rw9HrGWxckPKQ_h2z9gtG5FnPFwQZBbqsTlN4Ebv72Avc_NSRNVQf853UccPIfBnqKpo5n4uKC2kDeuZGAtFvRKQFGSt49X9FJF-VkmeoTCVuzWYplpL1yy8vwIkGAdXA5sWU6KJdmjEz-UvNo3aNFon64l9tqwmYPvr-QkIwSB3VEVU', permissions: [true, false, true] },
                { name: 'Elena Rodriguez', email: 'e.rodriguez@system.com', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ94ka61keSDBaeWt0THvoCmoEt1b8vB0rgVuiPk4eAvZAcHR4IXdEtJkF7l1GYRfWl_Wg6EzfW3_FZQed28HQF_P-hZRsEVk61LKAixmVRPOhewedawNghdTb8DU3lY1LkZQOMZiXXQMo-Ee3K-Cm9nVqk_JFZNytj-bkdIlcEffO9s-GLuO3rf0uKJFpKbQIK26v252RfZAz6FmCIxKzxoOE8zJRlem1EmFbOTNx8yA_TWYiL1JvzrchUOLs9u5X0SwiZbQWvPs', permissions: [true, true, true] },
                { name: 'James Wilson', email: 'j.wilson@system.com', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrn3Z0xn6_UlSmc0h2a8NxzKU0euHOSyQORk0RD6LKSlBB7iyv6-E83c5_Z_DTa4Rfr5GLpJygEeCLp7ceScMAa1ZvRW5p6VmI1h1F7ZZ1bt-R34zDlkxibX3JV4dlAuDho8JLvxZJM6YnrvTbVPQRJzBaCoqRIrp54D50VQEoEWCZl39mVrORItHAcncM60YpQZxtK9bEPQ6sibaGKweb3qwZmZcxNlt1cVemJzQgDcMc1Ycam1YXeVS8gbvtt0gfQZGjj3TG-EM', permissions: [false, false, false] }
              ].map((staff, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50 flex flex-col gap-6 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <img alt={staff.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-50 group-hover:border-[#6e9fff] transition-colors" src={staff.img} />
                    <div className="min-w-0">
                      <h3 className="font-headline font-bold text-[#242c51] truncate">{staff.name}</h3>
                      <p className="text-sm text-[#515981] truncate">{staff.email}</p>
                    </div>
                  </div>
                  <div className="group-y-4 pt-4 border-t border-slate-50">
                    {[
                      { label: 'Board Access', active: staff.permissions[0] },
                      { label: 'Schedule Management', active: staff.permissions[1] },
                      { label: 'Approval Authority', active: staff.permissions[2] }
                    ].map((perm, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#515981]">{perm.label}</span>
                        <button 
                          className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${perm.active ? "bg-[#0057bd]" : "bg-slate-200"}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${perm.active ? "right-0.5" : "left-0.5"}`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Add New Staff Placeholder */}
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-[#0057bd] hover:text-[#0057bd] hover:bg-blue-50/50 transition-all cursor-pointer group">
                <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">person_add</span>
                <span className="font-headline font-bold text-sm">Add New Staff Member</span>
              </div>
            </div>
          </div>
        );
      case 'Member':
        return (
          <div className="group-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search and Filters Area */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200/50 group-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-[#242c51] font-headline">Member Directory</h2>
                  <p className="text-sm text-[#515981] mt-1">Manage and monitor active group members.</p>
                </div>
                <div className="relative flex-grow max-w-md">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input 
                    type="text" 
                    placeholder="Search members by name, email or ID..." 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#0057bd]/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sort By</span>
                  {[
                    { icon: 'calendar_today', label: 'Recent Joined' },
                    { icon: 'history', label: 'Recent Visit' },
                    { icon: 'analytics', label: 'Engagement' }
                  ].map((filter, i) => (
                    <button key={i} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#515981] hover:border-[#0057bd] hover:text-[#0057bd] transition-all shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">{filter.icon}</span>
                      {filter.label}
                    </button>
                  ))}
                </div>
                <button className="flex items-center gap-2 px-5 py-2 bg-slate-50 text-[#515981] font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  Advanced Filters
                </button>
              </div>
            </div>

            {/* Member Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Elena Rodriguez', tag: 'High Engagement', tagColor: 'purple', join: 'Oct 12, 2023', last: '2 hours ago', total: '142', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm1xtRGlIfM5n46_mjrDP0TN1zmTFGP6uzuWdpSweGjrZ-lyIsS8HWjYd3a1n_o1HGP65isAG-S8i_AZKMCcp32psi9qFD1creUUjjtC2eWALHzxFPyb4L4lAblzhig6o8SxN8ipz6si8wEPlwzVmZI5ICBF_y-ij-uksQOb1lluOMbgCtRoILax5zl1aknntgoJcMurUwYyuKOZubHft9dFQ_76opNyyRkewBKWyqZkbgKzKgEe1XwukEjhj1HQrTbQBEu1vbatE' },
                { name: 'Marcus Sterling', tag: 'Regular', tagColor: 'slate', join: 'Jan 05, 2024', last: 'Yesterday', total: '28', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDV2BX-sikLexMoBlHtcNWXqdO-uTvtazoIRXTHg27MNGq_b0j0H0plceLPN3ruKgB415FW-Rvpu7DtEJkRD7jDkOTQDjvpUTLWiQZB6Qh5mWx_UxdEZ8bKr0MZjU8D9ZDdd4v4FxlsQD8HHbyYJv7RwsgYtbR29AQG7jqoOkKrmwpetajtFHG-DA7XLSXRYR2Hw6VdctdKyzqlfqZ9wUWptqBxrQL_W15zDWF_LX-_9mxbjli1XtQpYxuL9QYBE8v9scT3X91-9A' },
                { name: 'Julian Chen', tag: 'Inactive', tagColor: 'rose', join: 'Nov 20, 2023', last: '3 weeks ago', total: '12', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxri2pL577ENZ91Q2jjcngiHpSdPI16O2oAOtZKj2rM6P7FZPdkwBoc2SqgWzisiimrlFyRM0XBgkmCgco4RUYHauiGKK0stR2q65CdlDdKZET_qp1d-Ntuw5H1cFAzqCimgFDQmwO0LIyYZN94tuYVTzsHGpILOiUMp3qBsuUnrSw4AB7jUHQuMivwDAUMZMAIcpeLTV8cKk-ixRUHnY8CuvgUa1m3wHqqrqut3a50Mb7RbNzqVajs10oIDape8i0mrJIKVDsbRY' },
                { name: 'Sarah Jenkins', tag: 'New Member', tagColor: 'blue', join: 'Mar 15, 2024', last: 'Today', total: '3', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFgZ3gL9qUGVsXxXmZI9L5jTZTO4apLrq5QYFATMYRx48bjOO4qbosFcSKqNrmWZWKKNu0Tz0uG7zOJvfC3_La1qegqcjhOfcAK_wjm671YpatEiNgqJBXJ1ltFWFZVt6qNg7tWMhaYX0kSmSQ2i0tdBAbDDuvzptk-C7YDUgvozDdRMu1hLoyXzhiWM-g5E-YHz7RarZP4WSAlbRm1y1MljtyhHhJHzIFqa0ztLUib8ZqHHOTiUnpvOUt51TYZRX5GR9j7fWLRZA' },
                { name: 'Miriam Valeska', tag: 'High Engagement', tagColor: 'purple', join: 'Feb 11, 2023', last: '4 hours ago', total: '204', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDJAwQZK-8qIk-xK_Gt062kVhYLfDEej03Bf5Gdo0ryoNP9vl_O0atuhwkePAGp_V0kMiFfiGFBhrZxEm8Q_siZLxqMtHAB_pqc3nV4AUhiuD7Ng22LQAbZ8cp0mSSd96bG8s3sqOvmsJzYb8FJl5WDNaS6hnYnjZ8ZBvtlcuIP7W5ti3m0hBmMt1l8xnGTQtdQjFoUi7m-k0r_cYsDp45ZGynWlphcia_8m-6X9V1opO2dzOpUNGHIm_535rMoxmrM4_abSkUuSw' },
                { name: 'David Miller', tag: 'Regular', tagColor: 'slate', join: 'Aug 30, 2023', last: '3 days ago', total: '67', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpD4FvAVj1ssEB6Jz72KcYQ0PyiQsud4D4b6XhK9LDdsnpMCcgvxpB_vteh33inv95_hyuV6nbJUF6VpCIpHIgHUXsYldDMaddWsWfOo5zLxtTPTJI5w6U66jWwI33la_CrKLBt6zSad2zfq15OV6INaQJ7TxSyxurcWJ0Q6o4MLXuzA65WKQFnvzAjVGDZDeiPMBv17XHbwAic7SKY8txvdQu1Z1LHnPERavPv_pug2U_dTWqH4yg15EBxwkR2-clebMB35veQtA' }
              ].map((member, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img className="w-14 h-14 rounded-full object-cover border-2 border-slate-50 group-hover:border-[#6e9fff] transition-colors" src={member.img} alt={member.name} />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${member.tag === 'Inactive' ? 'bg-slate-300' : 'bg-emerald-500'}`}></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-[#242c51] leading-tight font-headline">{member.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider mt-1.5 ${
                          member.tagColor === 'purple' ? 'bg-purple-50 text-purple-600' :
                          member.tagColor === 'rose' ? 'bg-rose-50 text-rose-600' :
                          member.tagColor === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {member.tag}
                        </span>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-[#0057bd] transition-colors">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Join Date</p>
                      <p className="text-sm font-bold text-[#242c51]">{member.join}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Last Visit</p>
                      <p className="text-sm font-bold text-[#242c51]">{member.last}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total Visits</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#0057bd]">{member.total}</span>
                        <span className="text-xs font-bold text-slate-400">visits this year</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination / Load More */}
            <div className="flex justify-center pt-4">
              <button className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-[#0057bd] font-bold rounded-2xl shadow-sm hover:shadow-md hover:border-[#0057bd] transition-all active:scale-95 group">
                Load More Members
                <span className="material-symbols-outlined group-hover:translate-y-0.5 transition-transform">expand_more</span>
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 group-y-8 animate-in fade-in duration-500">
      {/* Header Section with Sub-navigation and Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="group-y-4">
          <h1 className="text-2xl font-bold font-headline tracking-tight text-[#242c51]">Member Management</h1>
          {/* Sub-navigation Tab Bar */}
          <nav className="flex items-center group-x-1 bg-slate-200/30 p-1 rounded-2xl w-fit">
            {['Stats', 'Owner', 'Staff', 'Member'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-5 py-2 text-sm transition-all rounded-xl ${
                  activeSubTab === tab
                    ? "bg-white shadow-sm text-[#0057bd] font-bold ring-1 ring-black/5"
                    : "text-[#515981] font-medium hover:text-[#242c51]"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        {activeSubTab !== 'Stats' && (
          <button 
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0057bd] text-white rounded-2xl font-semibold shadow-lg shadow-blue-900/10 hover:shadow-xl transition-all active:scale-95 group"
          >
            <span className="material-symbols-outlined text-[20px]">
              {activeSubTab === 'Owner' ? 'person_add' : 'person_add'}
            </span>
            <span className="font-headline">
              {activeSubTab === 'Owner' ? 'Invite Owner' : 
               activeSubTab === 'Staff' ? 'Add Staff' : 
               activeSubTab === 'Member' ? 'Add Member' : 'Add Member'}
            </span>
          </button>
        )}
      </div>

      {renderSubContent()}
    </div>
  );
};

export default GroupMemberManager;
