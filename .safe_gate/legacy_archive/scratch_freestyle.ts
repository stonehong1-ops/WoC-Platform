import { db } from './src/lib/firebase/clientApp';
import { doc, updateDoc } from 'firebase/firestore';

async function run() {
  const vRef = doc(db, 'venues', '2mvxZZVNWzJ4MwDIAWq3');
  const gRef = doc(db, 'groups', 'rglqeyjDHzzhbUwuim5O');

  console.log('Updating Venue (2mvxZZVNWzJ4MwDIAWq3)...');
  await updateDoc(vRef, {
    name: 'Freestyle Tango',
    nameKo: '프리스타일 탱고',
  });

  console.log('Updating Group (rglqeyjDHzzhbUwuim5O)...');
  await updateDoc(gRef, {
    name: 'Freestyle Tango',
    venueId: '2mvxZZVNWzJ4MwDIAWq3'
  });

  console.log('Successfully updated and linked Freestyle Tango.');
  process.exit(0);
}

run().catch(console.error);
