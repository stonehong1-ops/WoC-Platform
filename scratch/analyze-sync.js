const fs = require('fs');
const path = require('path');

const venuesFile = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\c9d28cf9-51b4-4cd2-8403-ce78a0695da6\\.system_generated\\steps\\1288\\output.txt';
const communitiesFile = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\c9d28cf9-51b4-4cd2-8403-ce78a0695da6\\.system_generated\\steps\\1291\\output.txt';

const venuesData = JSON.parse(fs.readFileSync(venuesFile, 'utf8')).documents;
const communitiesData = JSON.parse(fs.readFileSync(communitiesFile, 'utf8')).documents;

const USER_ID = 'ecOxXTUKdBPXc3Xyl4Ok7blq1zA2';
const SYSTEM_ID = 'system1';

const venues = venuesData.map(doc => {
  const fields = doc.fields;
  const id = doc.name.split('/').pop();
  return {
    id,
    name: fields.name?.stringValue || '',
    nameKo: fields.nameKo?.stringValue || '',
    address: fields.address?.stringValue || '',
    category: fields.category?.stringValue || '',
    detailAddress: fields.detailAddress?.stringValue || ''
  };
});

const communities = communitiesData.map(doc => {
  const fields = doc.fields;
  const id = doc.name.split('/').pop();
  return {
    id,
    name: fields.name?.stringValue || '',
    venueId: fields.venueId?.stringValue || '',
    ownerId: fields.ownerId?.stringValue || ''
  };
});

const operations = [];

for (const venue of venues) {
  // Special fuzzy mapping for Freestyle
  let community = null;
  if (venue.name.toLowerCase().includes('freestyle')) {
    community = communities.find(c => c.id === 'freestyle-tango' || c.name.toLowerCase().includes('freestyle'));
  } else {
    community = communities.find(c => c.venueId === venue.id);
    if (!community) {
      const venueSlug = venue.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
      community = communities.find(c => c.id === venueSlug || (c.name && c.name.toLowerCase() === venue.name.toLowerCase()));
    }
  }

  const isFreestyle = venue.name.toLowerCase().includes('freestyle') || venue.nameKo === '프리스타일';
  const ownerId = isFreestyle ? USER_ID : SYSTEM_ID;

  if (community) {
    // If found, update if needed
    if (community.venueId !== venue.id || community.ownerId !== ownerId) {
      operations.push({
        type: 'update',
        collection: 'communities',
        docId: community.id,
        data: {
          venueId: venue.id,
          ownerId: ownerId
        }
      });
      // Update local state to avoid redundant work
      community.venueId = venue.id;
      community.ownerId = ownerId;
    }
  } else {
    // Create new
    let docId = venue.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    if (!docId) docId = venue.id;
    
    if (communities.find(c => c.id === docId)) {
      docId = `${docId}-${venue.id.substring(0, 4)}`;
    }

    const typeKo = venue.category === 'Studio' ? '스튜디오' : venue.category === 'Club' ? '클럽' : venue.category === 'Shop' ? '숍' : venue.category === 'Stay' ? '스테이' : '공간';

    operations.push({
      type: 'create',
      collection: 'communities',
      docId: docId,
      data: {
        name: venue.name,
        description: `${venue.address} ${venue.detailAddress || ''}에 위치한 탱고 ${typeKo}입니다.`,
        coverImage: 'https://images.unsplash.com/photo-1545041041-893f3c306263?q=80&w=2000&auto=format&fit=crop',
        memberCount: 0,
        venueId: venue.id,
        ownerId: ownerId
      }
    });
    // Add to local communities to avoid duplicate creation
    communities.push({ id: docId, name: venue.name, venueId: venue.id, ownerId: ownerId });
  }
}

// Ensure freestyle-tango is explicitly updated if missed
const freestyleTango = communities.find(c => c.id === 'freestyle-tango');
if (freestyleTango && freestyleTango.ownerId !== USER_ID) {
  operations.push({
    type: 'update',
    collection: 'communities',
    docId: 'freestyle-tango',
    data: {
      ownerId: USER_ID
    }
  });
}

fs.writeFileSync('scratch/ops.json', JSON.stringify(operations, null, 2), 'utf8');
console.log(`Generated ${operations.length} operations.`);
