'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { Venue } from '@/types/venue';
import { Group } from '@/types/group';
import Image from 'next/image';

export default function MigrateGroupsPage() {
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const venuesSnapshot = await getDocs(collection(db, 'venues'));
        const venuesData = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue));
        setVenues(venuesData);

        const groupsSnapshot = await getDocs(collection(db, 'groups'));
        const groupsData = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
        setGroups(groupsData);
        
        setLogs(prev => [...prev, `Loaded ${venuesData.length} venues and ${groupsData.length} groups.`]);
      } catch (error: any) {
        setLogs(prev => [...prev, `Error loading data: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleMigrate = async () => {
    setLoading(true);
    setLogs(prev => [...prev, 'Starting migration...']);
    
    try {
      const batch = writeBatch(db);
      let updateCount = 0;

      for (const group of groups) {
        if (!group.venueId) continue;

        const venue = venues.find(v => v.id === group.venueId);
        if (venue) {
          const groupRef = doc(db, 'groups', group.id);
          const updates: Partial<Group> = {};
          let needsUpdate = false;

          if (venue.imageUrl && group.coverImage !== venue.imageUrl) {
            updates.coverImage = venue.imageUrl;
            needsUpdate = true;
          }
          if (venue.nameKo && group.nativeName !== venue.nameKo) {
            updates.nativeName = venue.nameKo;
            needsUpdate = true;
          }

          if (needsUpdate) {
            batch.update(groupRef, updates);
            updateCount++;
            setLogs(prev => [...prev, `Queueing update for group ${group.name} (venue: ${venue.nameKo || venue.name})`]);
          }
        }
      }

      if (updateCount > 0) {
        await batch.commit();
        setLogs(prev => [...prev, `Successfully updated ${updateCount} groups.`]);
      } else {
        setLogs(prev => [...prev, 'No groups needed updating.']);
      }
    } catch (error: any) {
      setLogs(prev => [...prev, `Migration error: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Migrate Venue Data to Groups</h1>
      <p className="mb-4 text-gray-600">
        This page copies the `imageUrl` and `nameKo` from Venues to the `coverImage` and `nativeName` fields of their respective Groups.
      </p>
      
      <button 
        onClick={handleMigrate} 
        disabled={loading || venues.length === 0 || groups.length === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 mb-8"
      >
        {loading ? 'Processing...' : 'Run Migration'}
      </button>

      <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto mb-8 font-mono text-sm">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4">Preview ({groups.length} Groups)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => {
          const venue = venues.find(v => v.id === group.venueId);
          return (
            <div key={group.id} className="border p-4 rounded">
              <div className="font-bold">{group.name}</div>
              <div className="text-sm text-gray-500 mb-2">Venue ID: {group.venueId}</div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-semibold text-xs text-gray-400">Current Group</div>
                  <div>Name: {group.nativeName || 'N/A'}</div>
                  {group.coverImage && (
                    <img src={group.coverImage} alt="" className="w-full h-20 object-cover mt-1" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-xs text-blue-400">Target (Venue)</div>
                  <div>Name: {venue?.nameKo || 'N/A'}</div>
                  {venue?.imageUrl && (
                    <img src={venue.imageUrl} alt="" className="w-full h-20 object-cover mt-1" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
