const admin = require('firebase-admin');
const serviceAccount = require('../woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const updateData = [
  "VyqVuIEoqv6M06aDLYET",
  "YaKmPBiS0rDCc6nJZ39T",
  "YnLmcdeG2Lsyx5oNkIsL",
  "YtCqTajwGHGCj31BQTyT",
  "ZIdNlYyBIsJ0S0nFzsh2",
  "Zgy8EbuCoTdIcgCdKKJ1",
  "ZlW7KjN2ZtXvY4fX6Z7a",
  "aYc3vPq3EwR2S1d0F9g8",
  "bZ5xM4w3V2n1L0k9J8h7",
  "bb1YNxoL4iXtfEdDtUbJ",
  "brJU2WTgpajn7qZDUkp4",
  "c8TAG9Zg49ju20CxKaPl",
  "cQ8vP7o6R5s4T3u2W1x0",
  "dK2mN3l4J5h6G7f8D9s0",
  "eR1tY2u3I4o5P6a7S8d9",
  "eoH5L0XrTxkOIojB958u",
  "fApjgip6uUZc63E4grqi",
  "fG9h8j7k6l5s4d3f2a1",
  "fWIzPkYwXL3IGwPKd6gw",
  "fushwmIFWeaOATABg5Fi",
  "gCbvVpA7NyogXmUBoZk1",
  "gH0j1k2l3z4x5c6v7b8",
  "hJ9k8l7z6x5c4v3b2n1",
  "hun4sDr2y6wyP4rNKFSb",
  "iF06RrdMugNminjJKb7T",
  "jPQC2p47FiIMU39zlYvk",
  "lp3DufRSyK0S49pkOKnE",
  "lzlGWIJaKxjz9qqYeJkJ",
  "mWo82j5uPi2esEU6qvj6",
  "maMVsnmrc6lplGXCIr8D",
  "mecfAyAzWOmwsnKgCZy6",
  "n4MioMSdxqnA3CVfX53N",
  "nUMZ7l8ilMo3XOx0dHaH",
  "oFqiigaztVEnlojaFpuG",
  "oOQT7PhjvQIetwdT9kKc",
  "oVKEV4hnjSuuQlEsGy1q",
  "oWY9ZG7kJr8eMy8JW87c",
  "pBBVhuuZMx7TnRvYbxYH",
  "psdzuWNIs9punJGmOsJu",
  "qCYzOrmSIoGL4HVCcAAP",
  "qnoLw2DXfoV816UwtCS4",
  "rCjkoEWEMlhU0G2Wystw",
  "sMIEoUSmSRS9UwlxWzvp",
  "tWWN6YAtlyAKXklr4rQA",
  "tfPCHGzZrKmFA4Q6cs2H",
  "uAMzMNSH1swFeebgxkuv",
  "uAMzMNSH1swFeebgxkuv", // Duplicated accidentally in manual check, removing in script
  "uMNgwtuDZZajNQ2lkPgV",
  "vQ4SASAdywi4Nj74SsAm",
  "wHHEhkROsrYOPIBzcbSs",
  "wVE1xcRiv16lHo5LUp5m",
  "xPKHbji68xMB4QegT4Zo",
  "yJvRbB04lsWFc6anaGti",
  "zKTJKLFooBEQcDvllyUS",
  "zkZm9gZvHdnSPzSOR5Gp"
].filter((v, i, a) => a.indexOf(v) === i);

async function updatePrices() {
  const batch = db.batch();
  const standardPrice = "13,000 KRW";
  
  for (const docId of updateData) {
    const docRef = db.collection('socials').doc(docId);
    batch.update(docRef, { price: standardPrice });
  }
  
  try {
    await batch.commit();
    console.log(`Successfully updated ${updateData.length} documents.`);
  } catch (error) {
    console.error('Error updating documents:', error);
  }
}

updatePrices();
