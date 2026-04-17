import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "woc-platform-seoul-1234",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const daejeonSocials = [
  // Azucar
  { venueName: "Azucar", dayOfWeek: 3, title: "TangoEnMi Milonga", startTime: "20:30", endTime: "23:30", organizerName: "Azucar", location: "Daejeon", type: "regular", description: "Weekly Wednesday Milonga" },
  { venueName: "Azucar", dayOfWeek: 6, title: "Bahyang Milonga", startTime: "20:00", endTime: "01:00", organizerName: "Azucar", location: "Daejeon", type: "regular", description: "2nd Saturday" },
  { venueName: "Azucar", dayOfWeek: 0, title: "Sunday Milonga", startTime: "19:00", endTime: "22:30", organizerName: "Azucar", location: "Daejeon", type: "regular", description: "Weekly Sunday Milonga" },
  // Caminito
  { venueName: "Caminito", dayOfWeek: 5, title: "Amigo Milonga", startTime: "20:00", endTime: "23:30", organizerName: "Caminito", location: "Daejeon", type: "regular", description: "3rd Friday" },
  { venueName: "Caminito", dayOfWeek: 6, title: "First Milonga", startTime: "20:00", endTime: "23:30", organizerName: "Caminito", location: "Daejeon", type: "regular", description: "1st Saturday" },
  // LaBoom
  { venueName: "LaBoom", dayOfWeek: 2, title: "Daejeon Tango Milonga", startTime: "20:00", endTime: "23:30", organizerName: "LaBoom", location: "Daejeon", type: "regular", description: "Weekly Tuesday" },
  { venueName: "LaBoom", dayOfWeek: 4, title: "PracMilonga", startTime: "19:30", endTime: "23:30", organizerName: "LaBoom", location: "Daejeon", type: "regular", description: "Weekly Thursday" },
  { venueName: "LaBoom", dayOfWeek: 5, title: "GeumBoom", startTime: "20:00", endTime: "00:00", organizerName: "LaBoom", location: "Daejeon", type: "regular", description: "2nd Friday" },
  { venueName: "LaBoom", dayOfWeek: 6, title: "Tora Milonga", startTime: "15:00", endTime: "19:00", organizerName: "LaBoom", location: "Daejeon", type: "regular", description: "4th Saturday" },
  // LaVista
  { venueName: "LaVista", dayOfWeek: 0, title: "Tarde Milonga", startTime: "15:00", endTime: "19:00", organizerName: "LaVista", location: "Daejeon", type: "regular", description: "Weekly Sunday" },
  // Onada
  { venueName: "Onada", dayOfWeek: 5, title: "IF Milonga", startTime: "21:00", endTime: "02:00", organizerName: "Onada", location: "Daejeon", type: "regular", description: "1st Friday (Brand-new)" },
  { venueName: "Onada", dayOfWeek: 5, title: "Centre Milonga", startTime: "21:00", endTime: "01:00", organizerName: "Onada", location: "Daejeon", type: "regular", description: "Weekly Friday" },
  { venueName: "Onada", dayOfWeek: 6, title: "WooDong Milonga", startTime: "21:00", endTime: "03:00", organizerName: "Onada", location: "Daejeon", type: "regular", description: "1st Saturday" },
  { venueName: "Onada", dayOfWeek: 6, title: "GoGo Milonga", startTime: "16:00", endTime: "20:00", organizerName: "Onada", location: "Daejeon", type: "regular", description: "3rd Saturday (Even months only)" },
  { venueName: "Onada", dayOfWeek: 6, title: "JJin Milonga", startTime: "21:00", endTime: "02:00", organizerName: "Onada", location: "Daejeon", type: "regular", description: "3rd Saturday" },
  { venueName: "Onada", dayOfWeek: 6, title: "Milsa Milonga", startTime: "20:00", endTime: "03:00", organizerName: "Onada", location: "Daejeon", type: "regular", description: "5th Saturday" },
];

async function upload() {
  const socialsRef = collection(db, "socials");
  for (const social of daejeonSocials) {
    try {
      await addDoc(socialsRef, social);
      console.log(`Added: ${social.title}`);
    } catch (e) {
      console.error(`Error adding ${social.title}: `, e);
    }
  }
}

upload().then(() => console.log("Done."));
