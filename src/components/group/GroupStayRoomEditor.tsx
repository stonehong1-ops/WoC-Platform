"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, StayRoom } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";
import { toast } from "sonner";

interface GroupStayRoomEditorProps {
  group: Group;
  onClose: () => void;
  room?: StayRoom;
}

const STEPS = [
  { id: 1, title: "Space Details", icon: "home" },
  { id: 2, title: "Rent & Fees", icon: "payments" },
  { id: 3, title: "Options", icon: "chair" },
  { id: 4, title: "Rules & Info", icon: "info" },
  { id: 5, title: "Photos & Status", icon: "photo_library" },
];

const GroupStayRoomEditor: React.FC<GroupStayRoomEditorProps> = ({ group, onClose, room }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!room;
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    title: room?.title || "",
    description: room?.description || "",
    roomType: room?.roomType || "",
    buildingType: room?.buildingType || "",
    structure: room?.structure || "",
    floor: room?.floor || "",
    address: room?.address || "",
    detailedAddress: room?.detailedAddress || "",
    capacity: room?.capacity || 1,
    
    price: room?.price || 0,
    discountPrice: room?.discountPrice || "",
    deposit: room?.deposit || 0,
    cleaningFee: room?.cleaningFee || 0,
    managementFee: room?.managementFee || 0,
    includedUtilitiesInput: room?.includedUtilities?.join(", ") || "",
    
    amenitiesInput: room?.amenities?.join(", ") || "",
    parkingPolicy: room?.parkingPolicy || "",
    
    rulesInput: room?.rules?.join(", ") || "",
    minStay: room?.minStay || 1,
    maxStay: room?.maxStay || "",
    
    status: room?.status || "Active",
  });
  
  const [newImages, setNewImages] = useState<File[]>([]);
  const [displayImageUrls, setDisplayImageUrls] = useState<string[]>(room?.images || []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (displayImageUrls.length + selectedFiles.length > 5) {
        toast.error("You can upload up to 5 images.");
        return;
      }
      
      setNewImages(prev => [...prev, ...selectedFiles]);
      const previewUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setDisplayImageUrls(prev => [...prev, ...previewUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const urlToRemove = displayImageUrls[index];
    if (urlToRemove.startsWith('blob:')) {
      const blobIndex = displayImageUrls.slice(0, index).filter(url => url.startsWith('blob:')).length;
      setNewImages(prev => prev.filter((_, i) => i !== blobIndex));
      URL.revokeObjectURL(urlToRemove);
    }
    setDisplayImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.roomType || formData.price < 0) {
      toast.error("Please fill in required fields (Title, Room Type, Base Rent).");
      return;
    }

    setIsSaving(true);
    try {
      const uploadedUrls = await Promise.all(
        newImages.map((file, index) => 
          storageService.uploadFile(file, `groups/${group.id}/stay/${Date.now()}_${index}`)
        )
      );

      const existingUrls = displayImageUrls.filter(url => !url.startsWith('blob:'));
      const finalImageUrls = [...existingUrls, ...uploadedUrls];

      const currentRooms = group.stayRooms || [];
      let updatedStayRooms: StayRoom[];

      const amenitiesArray = formData.amenitiesInput.split(',').map(s => s.trim()).filter(s => s);
      const utilitiesArray = formData.includedUtilitiesInput.split(',').map(s => s.trim()).filter(s => s);
      const rulesArray = formData.rulesInput.split(',').map(s => s.trim()).filter(s => s);

      const roomData: StayRoom = {
        id: room?.id || Math.random().toString(36).substring(2, 9),
        title: formData.title,
        description: formData.description,
        roomType: formData.roomType,
        buildingType: formData.buildingType,
        structure: formData.structure,
        floor: formData.floor,
        address: formData.address,
        detailedAddress: formData.detailedAddress,
        capacity: Number(formData.capacity),
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        deposit: Number(formData.deposit),
        cleaningFee: Number(formData.cleaningFee),
        managementFee: Number(formData.managementFee),
        includedUtilities: utilitiesArray,
        amenities: amenitiesArray,
        parkingPolicy: formData.parkingPolicy,
        rules: rulesArray,
        minStay: Number(formData.minStay),
        maxStay: formData.maxStay ? Number(formData.maxStay) : undefined,
        images: finalImageUrls,
        status: formData.status as 'Active' | 'Stopped',
        createdAt: room?.createdAt || Date.now(),
      };

      if (isEditing && room) {
        updatedStayRooms = currentRooms.map(sr => sr.id === room.id ? roomData : sr);
      } else {
        updatedStayRooms = [...currentRooms, roomData];
      }

      await groupService.updateGroupMetadata(group.id, {
        stayRooms: updatedStayRooms
      } as any);

      toast.success(isEditing ? "Room updated successfully." : "Room added successfully.");
      onClose();
    } catch (error) {
      console.error("Error saving stay room:", error);
      toast.error("An error occurred while saving the room.");
    } finally {
      setIsSaving(false);
    }
  };

  const currencySymbol = group.staySettings?.currency === 'KRW' ? '₩' : group.staySettings?.currency === 'USD' ? '$' : group.staySettings?.currency === 'EUR' ? '€' : '';

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#242c51] mb-4">Space Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="roomType">Room Type</label>
                <select className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="roomType" value={formData.roomType} onChange={handleInputChange}>
                  <option disabled value="">Select Room Type</option>
                  <option value="Private Room">Private Room</option>
                  <option value="Shared Room">Shared Room</option>
                  <option value="Entire Place">Entire Place</option>
                  <option value="Dormitory">Dormitory</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="buildingType">Building Type</label>
                <select className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="buildingType" value={formData.buildingType} onChange={handleInputChange}>
                  <option value="">Select Building Type</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Officetel">Officetel</option>
                  <option value="Villa">Villa</option>
                  <option value="House">House</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="structure">Structure</label>
                <input className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="structure" placeholder="e.g. 1 Room, 2 Room" type="text" value={formData.structure} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="floor">Floor</label>
                <input className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="floor" placeholder="e.g. 3F, B1" type="text" value={formData.floor} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="capacity">Capacity (Guests)</label>
                <input className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="capacity" type="number" min="1" value={formData.capacity} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="address">Address</label>
              <input className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 mb-2" id="address" placeholder="Main Address" type="text" value={formData.address} onChange={handleInputChange} />
              <input className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="detailedAddress" placeholder="Detailed Address (e.g. Room 301)" type="text" value={formData.detailedAddress} onChange={handleInputChange} />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#242c51] mb-4">Rent & Fees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="price">Base Rent</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#242c51] font-semibold">{currencySymbol}</span>
                  <input className="w-full bg-[#F1F5F9] border-0 rounded-lg pl-8 pr-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="price" type="number" min="0" value={formData.price} onChange={handleInputChange} />
                </div>
              </div>
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="discountPrice">Discount Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600 font-semibold">{currencySymbol}</span>
                  <input className="w-full bg-[#F1F5F9] border-0 rounded-lg pl-8 pr-4 py-3 text-red-600 font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="discountPrice" type="number" min="0" value={formData.discountPrice} onChange={handleInputChange} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="deposit">Deposit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#242c51] font-semibold">{currencySymbol}</span>
                  <input className="w-full bg-[#F1F5F9] border-0 rounded-lg pl-8 pr-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="deposit" type="number" min="0" value={formData.deposit} onChange={handleInputChange} />
                </div>
              </div>
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="cleaningFee">Cleaning Fee</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#242c51] font-semibold">{currencySymbol}</span>
                  <input className="w-full bg-[#F1F5F9] border-0 rounded-lg pl-8 pr-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="cleaningFee" type="number" min="0" value={formData.cleaningFee} onChange={handleInputChange} />
                </div>
              </div>
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="managementFee">Management Fee</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#242c51] font-semibold">{currencySymbol}</span>
                  <input className="w-full bg-[#F1F5F9] border-0 rounded-lg pl-8 pr-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="managementFee" type="number" min="0" value={formData.managementFee} onChange={handleInputChange} />
                </div>
              </div>
            </div>
            <div>
              <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="includedUtilitiesInput">Included Utilities (Comma separated)</label>
              <input className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="includedUtilitiesInput" placeholder="e.g. Water, Internet, Electricity" type="text" value={formData.includedUtilitiesInput} onChange={handleInputChange} />
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#242c51] mb-4">Options & Amenities</h2>
            <div>
              <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="amenitiesInput">Amenities (Comma separated)</label>
              <textarea className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 resize-y" id="amenitiesInput" placeholder="e.g. Wi-Fi, Air Conditioning, TV, Washing Machine, Kitchen" rows={4} value={formData.amenitiesInput} onChange={handleInputChange}></textarea>
            </div>
            <div>
              <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="parkingPolicy">Parking Policy</label>
              <select className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="parkingPolicy" value={formData.parkingPolicy} onChange={handleInputChange}>
                <option value="">Select Parking Policy</option>
                <option value="Not Available">Not Available</option>
                <option value="1 Car Free">1 Car Free</option>
                <option value="Paid Parking">Paid Parking</option>
                <option value="Public Parking Nearby">Public Parking Nearby</option>
              </select>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#242c51] mb-4">Rules & Info</h2>
            <div>
              <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="title">Room Name / Title</label>
              <input className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="title" placeholder="e.g. Deluxe Ocean View Suite" type="text" value={formData.title} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="description">Description</label>
              <textarea className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 resize-y" id="description" placeholder="Describe the room, atmosphere, view..." rows={4} value={formData.description} onChange={handleInputChange}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="minStay">Minimum Stay (Days)</label>
                <input className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="minStay" type="number" min="1" value={formData.minStay} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="maxStay">Maximum Stay (Optional)</label>
                <input className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50" id="maxStay" type="number" min="1" value={formData.maxStay} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="rulesInput">House Rules (Comma separated)</label>
              <textarea className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 resize-y" id="rulesInput" placeholder="e.g. No Pets, No Smoking, Quiet hours 10PM-8AM" rows={3} value={formData.rulesInput} onChange={handleInputChange}></textarea>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#242c51]">Photos & Status</h2>
              <div 
                onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'Active' ? 'Stopped' : 'Active' }))}
                className={`w-14 h-7 rounded-full relative cursor-pointer shadow-inner transition-colors duration-300 ${
                  formData.status === 'Active' ? 'bg-[#0057bd]' : 'bg-slate-300'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 flex items-center justify-center ${
                  formData.status === 'Active' ? 'translate-x-[26px]' : 'translate-x-[2px]'
                }`}>
                  {formData.status === 'Active' && <span className="material-symbols-outlined text-[12px] text-[#0057bd] font-bold">check</span>}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="block font-['Inter'] text-[13px] font-medium text-[#515981]">Room Images (Up to 5)</label>
              <span className="font-['Inter'] text-[11px] text-[#a3abd7] uppercase font-bold tracking-wider">{displayImageUrls.length} / 5</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {displayImageUrls.length < 5 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-[#e4e7ff] border-2 border-dashed border-[#a3abd7]/40 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-[#d6dbff] transition-colors group cursor-pointer active:scale-95 duration-200"
                >
                  <span className="material-symbols-outlined text-[#a3abd7] group-hover:text-[#0057bd] transition-colors text-3xl" data-icon="add_photo_alternate">add_photo_alternate</span>
                  <span className="font-['Inter'] text-[11px] font-bold uppercase tracking-wider text-[#a3abd7] group-hover:text-[#0057bd] transition-colors">Upload</span>
                </button>
              )}
              {displayImageUrls.map((url, index) => (
                <div key={index} className="aspect-square relative group rounded-lg overflow-hidden border border-[#a3abd7]/20">
                  <img src={url} alt={`preview ${index}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-[#F1F5F9] text-[#242c51] flex flex-col antialiased font-['Inter']"
    >
      <header className="bg-white/90 backdrop-blur-3xl shadow-sm flex flex-col w-full z-40">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-[#242c51] hover:bg-slate-50 transition-all duration-200 active:scale-[0.99] p-2 -ml-2 rounded-full">
              <span className="material-symbols-outlined" data-icon="close">close</span>
            </button>
            <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-[1.2rem] tracking-tight text-slate-900">
              {isEditing ? "Edit Room" : "Add Room"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="text-[#0057bd] font-['Plus_Jakarta_Sans'] font-bold tracking-tight hover:bg-[#e4e7ff] px-4 py-2 rounded-lg transition-all"
              >
                Back
              </button>
            )}
            {currentStep < 5 ? (
              <button 
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="bg-[#0057bd] text-white font-['Plus_Jakarta_Sans'] font-bold tracking-tight hover:bg-[#0057bd]/90 px-5 py-2 rounded-lg shadow-sm"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#0057bd] text-white font-['Plus_Jakarta_Sans'] font-bold tracking-tight hover:bg-[#0057bd]/90 px-5 py-2 rounded-lg shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
          </div>
        </div>
        
        {/* Stepper */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 overflow-x-auto no-scrollbar">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`flex flex-col items-center gap-1 cursor-pointer group ${currentStep === step.id ? 'opacity-100' : currentStep > step.id ? 'opacity-70 hover:opacity-100' : 'opacity-40'}`}
                onClick={() => currentStep > step.id && setCurrentStep(step.id)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep === step.id ? 'bg-[#0057bd] text-white shadow-md' : currentStep > step.id ? 'bg-[#e4e7ff] text-[#0057bd]' : 'bg-slate-200 text-slate-500'}`}>
                  <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${currentStep === step.id ? 'text-[#0057bd]' : 'text-slate-500'}`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-2 rounded-full ${currentStep > step.id ? 'bg-[#e4e7ff]' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
};

export default GroupStayRoomEditor;
