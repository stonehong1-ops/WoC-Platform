const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixJoinedGroups() {
  const groupId = "rglqeyjDHzzhbUwuim5O";
  console.log(`Starting to update joinedGroups for members of group: ${groupId}`);
  
  const membersSnapshot = await db.collection(`groups/${groupId}/members`).get();
  
  console.log(`Found ${membersSnapshot.size} members.`);
  
  let count = 0;
  for (const doc of membersSnapshot.docs) {
    const userId = doc.id;
    const userRef = db.collection("users").doc(userId);
    
    try {
      await userRef.update({
        joinedGroups: admin.firestore.FieldValue.arrayUnion(groupId)
      });
      count++;
      console.log(`Updated joinedGroups for user ${userId}`);
    } catch (error) {
      console.error(`Failed to update user ${userId}:`, error.message);
    }
  }
  
  console.log(`Successfully updated ${count} users.`);
}

fixJoinedGroups().then(() => process.exit(0)).catch(console.error);
